import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, IsNull } from 'typeorm';
import { GeneratedImage } from '../../../../database/entities/generated-image.entity';
import { GcsStorageService } from '../../../../storage/services/gcs-storage.service';

@Injectable()
export class ImageCleanupService {
  private readonly logger = new Logger(ImageCleanupService.name);

  constructor(
    @InjectRepository(GeneratedImage)
    private readonly generatedImageRepo: Repository<GeneratedImage>,
    private readonly gcsStorageService: GcsStorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Schedule image deletion from GCS after retention period
   * Sets expiresAt timestamp (actual deletion happens via cleanup job)
   * @param imagePath GCS path of the image
   * @param generatedImageId ID of the generated image record
   */
  async scheduleDeletion(imagePath: string, generatedImageId: string): Promise<void> {
    const retentionHours = this.configService.get<number>('app.gemini.imageGeneration.imageRetentionHours') || 6;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + retentionHours);

    await this.generatedImageRepo.update(generatedImageId, {
      expiresAt,
    });

    this.logger.log(`Scheduled deletion for image ${imagePath} at ${expiresAt.toISOString()}`);
  }

  /**
   * Cleanup job to delete expired images from GCS
   * CRITICAL: Only deletes from GCS, NEVER deletes database entries (preserve historical data)
   */
  async deleteExpiredImages(): Promise<void> {
    const now = new Date();
    const expiredImages = await this.generatedImageRepo.find({
      where: {
        expiresAt: LessThan(now),
        imagePath: Not(IsNull()),
      },
    });

    if (expiredImages.length === 0) {
      this.logger.log('No expired images to delete');
      return;
    }

    this.logger.log(`Deleting ${expiredImages.length} expired images from GCS`);

    for (const image of expiredImages) {
      if (!image.imagePath) {
        continue;
      }

      try {
        // Delete from GCS only
        await this.gcsStorageService.deleteFile(image.imagePath);

        // Update database record: clear imageUrl and imagePath, but keep the record for analytics
        await this.generatedImageRepo.update(image.id, {
          imageUrl: null,
          imagePath: null,
        });

        this.logger.log(`Deleted expired image from GCS: ${image.imagePath} (DB record preserved)`);
      } catch (error) {
        // Log error but continue with other images
        this.logger.error(`Failed to delete expired image ${image.imagePath}`, error);
      }
    }

    this.logger.log(`Cleanup completed: ${expiredImages.length} images processed`);
  }
}

