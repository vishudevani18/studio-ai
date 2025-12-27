import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VertexAI, GenerativeModel, Part } from '@google-cloud/vertexai';
import {
  DEFAULT_PROMPT_TEMPLATE,
  ERROR_MESSAGES,
} from '../../../../common/constants/image-generation.constants';

@Injectable()
export class GeminiImageService {
  private readonly logger = new Logger(GeminiImageService.name);
  private readonly vertexAI: VertexAI;
  private readonly model: GenerativeModel;
  private readonly projectId: string;
  private readonly location: string;

  constructor(private configService: ConfigService) {
    this.projectId =
      this.configService.get<string>('app.google.projectId') || process.env.GCP_PROJECT_ID || '';
    this.location =
      this.configService.get<string>('app.gemini.imageGeneration.location') || 'us-central1';

    if (!this.projectId) {
      this.logger.error('GCP Project ID is missing! Ensure GCP_PROJECT_ID is in your .env');
    }

    // 1. Initialize Vertex AI
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location,
    });

    // 2. Initialize the specific model
    const modelName =
      this.configService.get<string>('app.gemini.imageGeneration.model') ||
      'gemini-2.5-flash-image';
    this.model = this.vertexAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Generate a composite image using Vertex AI (Gemini via Vertex AI)
   * @param referenceImages Array of base64 images in order: [face, pose, background, product]
   * @param prompt Custom prompt (optional, uses default if not provided)
   * @returns Generated image as base64 buffer
   */
  async generateCompositeImage(
    referenceImages: Array<{ data: string; mimeType: string }>,
    prompt?: string,
  ): Promise<Buffer> {
    const startTime = Date.now();
    const finalPrompt = prompt || DEFAULT_PROMPT_TEMPLATE;

    try {
      // Build the multimodal prompt parts
      const promptParts: Part[] = [
        { text: finalPrompt },
        ...referenceImages.map(img => ({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data.replace(/^data:image\/\w+;base64,/, ''), // Ensure only base64 string
          },
        })),
      ];

      this.logger.log(
        `Requesting image from ${this.projectId} in ${this.location} with ${referenceImages.length} reference images...`,
      );

      // 3. Call generateContent
      // Note: gemini-2.5-flash-image automatically returns images, no need for responseModalities config
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: promptParts }],
        generationConfig: {
          candidateCount: 1,
        },
      });

      const response = await result.response;

      // 4. Extract the generated image from the response
      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!imagePart || !imagePart.inlineData?.data) {
        throw new Error('Model did not return an image. Check safety filters or prompt.');
      }

      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      this.logger.log(`Success! Generated in ${Date.now() - startTime}ms`);

      return imageBuffer;
    } catch (error) {
      this.logger.error(`Generation Failed: ${error.message}`, error.stack);

      if (error.message.includes('PERMISSION_DENIED')) {
        throw new BadRequestException(error);
      }

      // Handle rate limit errors
      if (error?.status === 429 || error?.message?.includes('429')) {
        throw new BadRequestException(ERROR_MESSAGES.GEMINI_RATE_LIMIT);
      }

      // Handle other API errors
      if (error?.message) {
        throw new BadRequestException(`${ERROR_MESSAGES.GEMINI_API_ERROR}: ${error.message}`);
      }

      throw new BadRequestException(ERROR_MESSAGES.GEMINI_API_ERROR);
    }
  }
}
