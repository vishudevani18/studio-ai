import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageGenerationController } from './image-generation.controller';
import { ImageGenerationService } from './image-generation.service';
import { GeminiImageService } from './services/gemini-image.service';
import { ImageCleanupService } from './services/image-cleanup.service';
import { Industry } from '../../../database/entities/industry.entity';
import { Category } from '../../../database/entities/category.entity';
import { ProductType } from '../../../database/entities/product-type.entity';
import { ProductPose } from '../../../database/entities/product-pose.entity';
import { ProductTheme } from '../../../database/entities/product-theme.entity';
import { ProductBackground } from '../../../database/entities/product-background.entity';
import { AiFace } from '../../../database/entities/ai-face.entity';
import { GeneratedImage } from '../../../database/entities/generated-image.entity';
import { StorageModule } from '../../../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Industry,
      Category,
      ProductType,
      ProductPose,
      ProductTheme,
      ProductBackground,
      AiFace,
      GeneratedImage,
    ]),
    StorageModule,
  ],
  controllers: [ImageGenerationController],
  providers: [ImageGenerationService, GeminiImageService, ImageCleanupService],
  exports: [ImageGenerationService, ImageCleanupService],
})
export class ImageGenerationModule {}

