import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Industry } from '../../../database/entities/industry.entity';
import { Category } from '../../../database/entities/category.entity';
import { ProductType } from '../../../database/entities/product-type.entity';
import { ProductPose } from '../../../database/entities/product-pose.entity';
import { ProductTheme } from '../../../database/entities/product-theme.entity';
import { ProductBackground } from '../../../database/entities/product-background.entity';
import { AiFace } from '../../../database/entities/ai-face.entity';
import { GeneratedImage, GenerationStatus } from '../../../database/entities/generated-image.entity';
import { GcsStorageService } from '../../../storage/services/gcs-storage.service';
import { GeminiImageService } from './services/gemini-image.service';
import { ImageCleanupService } from './services/image-cleanup.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { ERROR_MESSAGES } from '../../../common/constants/image-generation.constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageGenerationService {
  private readonly logger = new Logger(ImageGenerationService.name);

  constructor(
    @InjectRepository(Industry)
    private readonly industryRepo: Repository<Industry>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(ProductType)
    private readonly productTypeRepo: Repository<ProductType>,
    @InjectRepository(ProductPose)
    private readonly productPoseRepo: Repository<ProductPose>,
    @InjectRepository(ProductTheme)
    private readonly productThemeRepo: Repository<ProductTheme>,
    @InjectRepository(ProductBackground)
    private readonly productBackgroundRepo: Repository<ProductBackground>,
    @InjectRepository(AiFace)
    private readonly aiFaceRepo: Repository<AiFace>,
    @InjectRepository(GeneratedImage)
    private readonly generatedImageRepo: Repository<GeneratedImage>,
    private readonly gcsStorageService: GcsStorageService,
    private readonly geminiImageService: GeminiImageService,
    private readonly imageCleanupService: ImageCleanupService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Main method to generate an image
   */
  async generateImage(dto: GenerateImageDto): Promise<{ imageUrl: string; expiresAt: Date }> {
    const startTime = Date.now();
    let generatedImageRecord: GeneratedImage | null = null;

    try {
      // Step 1: Validate all IDs exist and are not soft-deleted
      await this.validateRequest(dto);

      // Step 2: Fetch reference images from GCS and validate they exist
      const referenceImages = await this.fetchReferenceImages(dto);

      // Step 3: Convert product image from base64 to buffer
      const productImageBuffer = this.convertBase64ToBuffer(dto.productImage, dto.productImageMimeType);

      // Step 4: Prepare all images for Gemini (background, pose with face, product/cloth)
      const geminiImages = [
        { data: referenceImages.productBackground, mimeType: 'image/jpeg' }, // Reference [1] = Background
        { data: referenceImages.productPose, mimeType: 'image/jpeg' }, // Reference [2] = Pose & Face
        { data: dto.productImage.split(',')[1] || dto.productImage, mimeType: dto.productImageMimeType }, // Reference [3] = Cloth
      ];

      // Step 5: Generate composite image using Gemini
      const generatedImageBuffer = await this.geminiImageService.generateCompositeImage(geminiImages);

      // Step 6: Store generated image in GCS
      const { imageUrl, imagePath } = await this.storeGeneratedImage(generatedImageBuffer);

      // Step 7: Calculate expiresAt
      const retentionHours = this.configService.get<number>('app.gemini.imageGeneration.imageRetentionHours') || 6;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + retentionHours);

      // Step 8: Log generation to database (success)
      const generationTimeMs = Date.now() - startTime;
      generatedImageRecord = await this.logGeneration({
        ...dto,
        imageUrl,
        imagePath,
        generationStatus: GenerationStatus.SUCCESS,
        generationTimeMs,
        expiresAt,
      });

      // Step 9: Schedule GCS deletion (database entry remains)
      await this.imageCleanupService.scheduleDeletion(imagePath, generatedImageRecord.id);

      this.logger.log(`Image generation completed successfully in ${generationTimeMs}ms`);

      return { imageUrl, expiresAt };
    } catch (error) {
      const generationTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Log failed generation to database
      await this.logGeneration({
        ...dto,
        imageUrl: null,
        imagePath: null,
        generationStatus: GenerationStatus.FAILED,
        errorMessage,
        generationTimeMs,
        expiresAt: null,
      });

      this.logger.error(`Image generation failed after ${generationTimeMs}ms: ${errorMessage}`, error);

      // Re-throw the error
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`${ERROR_MESSAGES.GEMINI_API_ERROR}: ${errorMessage}`);
    }
  }

  /**
   * Validate all IDs exist in database and are not soft-deleted
   */
  private async validateRequest(dto: GenerateImageDto): Promise<void> {
    const [industry, category, productType, productPose, productTheme, productBackground, aiFace] = await Promise.all([
      this.industryRepo.findOne({ where: { id: dto.industryId } }),
      this.categoryRepo.findOne({ where: { id: dto.categoryId } }),
      this.productTypeRepo.findOne({ where: { id: dto.productTypeId } }),
      this.productPoseRepo.findOne({ where: { id: dto.productPoseId } }),
      this.productThemeRepo.findOne({ where: { id: dto.productThemeId } }),
      this.productBackgroundRepo.findOne({ where: { id: dto.productBackgroundId } }),
      this.aiFaceRepo.findOne({ where: { id: dto.aiFaceId } }),
    ]);

    if (!industry) throw new NotFoundException(ERROR_MESSAGES.MISSING_INDUSTRY);
    if (!category) throw new NotFoundException(ERROR_MESSAGES.MISSING_CATEGORY);
    if (!productType) throw new NotFoundException(ERROR_MESSAGES.MISSING_PRODUCT_TYPE);
    if (!productPose) throw new NotFoundException(ERROR_MESSAGES.MISSING_PRODUCT_POSE);
    if (!productTheme) throw new NotFoundException(ERROR_MESSAGES.MISSING_PRODUCT_THEME);
    if (!productBackground) throw new NotFoundException(ERROR_MESSAGES.MISSING_PRODUCT_BACKGROUND);
    if (!aiFace) throw new NotFoundException(ERROR_MESSAGES.MISSING_AI_FACE);
  }

  /**
   * Fetch reference images from GCS and validate they exist
   */
  private async fetchReferenceImages(dto: GenerateImageDto): Promise<{
    productPose: string;
    productBackground: string;
  }> {
    // Fetch entities to get image URLs/paths
    const [productPose, productBackground] = await Promise.all([
      this.productPoseRepo.findOne({ where: { id: dto.productPoseId } }),
      this.productBackgroundRepo.findOne({ where: { id: dto.productBackgroundId } }),
    ]);

    if (!productPose?.imageUrl && !productPose?.imagePath) {
      throw new NotFoundException(`${ERROR_MESSAGES.MISSING_REFERENCE_IMAGE}: Product pose image not available`);
    }
    if (!productBackground?.imageUrl && !productBackground?.imagePath) {
      throw new NotFoundException(`${ERROR_MESSAGES.MISSING_REFERENCE_IMAGE}: Product background image not available`);
    }

    // Download images from GCS and convert to base64
    const [poseBuffer, backgroundBuffer] = await Promise.all([
      this.gcsStorageService.downloadFile(productPose.imagePath || productPose.imageUrl),
      this.gcsStorageService.downloadFile(productBackground.imagePath || productBackground.imageUrl),
    ]);

    return {
      productPose: poseBuffer.toString('base64'),
      productBackground: backgroundBuffer.toString('base64'),
    };
  }

  /**
   * Convert base64 string to buffer
   */
  private convertBase64ToBuffer(base64String: string, mimeType: string): Buffer {
    try {
      // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_PRODUCT_IMAGE);
    }
  }

  /**
   * Store generated image in GCS with public access
   */
  private async storeGeneratedImage(buffer: Buffer): Promise<{ imageUrl: string; imagePath: string }> {
    try {
      const timestamp = Date.now();
      const uuid = uuidv4();
      const imagePath = `generated-images/${timestamp}-${uuid}/image.jpg`;

      const imageUrl = await this.gcsStorageService.uploadPublicFile(buffer, imagePath, 'image/jpeg');

      return { imageUrl, imagePath };
    } catch (error) {
      this.logger.error('Failed to store generated image', error);
      throw new BadRequestException(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }

  /**
   * Log generation to database (success or failed)
   * This record is NEVER deleted - preserved for analytics
   */
  private async logGeneration(data: {
    industryId: string;
    categoryId: string;
    productTypeId: string;
    productPoseId: string;
    productThemeId: string;
    productBackgroundId: string;
    aiFaceId: string;
    imageUrl: string | null;
    imagePath: string | null;
    generationStatus: GenerationStatus;
    errorMessage?: string;
    generationTimeMs: number;
    expiresAt: Date | null;
  }): Promise<GeneratedImage> {
    const record = this.generatedImageRepo.create({
      industryId: data.industryId,
      categoryId: data.categoryId,
      productTypeId: data.productTypeId,
      productPoseId: data.productPoseId,
      productThemeId: data.productThemeId,
      productBackgroundId: data.productBackgroundId,
      aiFaceId: data.aiFaceId,
      imageUrl: data.imageUrl,
      imagePath: data.imagePath,
      generationStatus: data.generationStatus,
      errorMessage: data.errorMessage,
      generationTimeMs: data.generationTimeMs,
      expiresAt: data.expiresAt,
    });

    return await this.generatedImageRepo.save(record);
  }
}

