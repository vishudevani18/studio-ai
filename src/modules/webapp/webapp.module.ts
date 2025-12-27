import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebAppController } from './webapp.controller';
import { WebAppService } from './webapp.service';
import { Industry } from '../../database/entities/industry.entity';
import { Category } from '../../database/entities/category.entity';
import { ProductType } from '../../database/entities/product-type.entity';
import { ProductBackground } from '../../database/entities/product-background.entity';
import { ProductTheme } from '../../database/entities/product-theme.entity';
import { ProductPose } from '../../database/entities/product-pose.entity';
import { AiFace } from '../../database/entities/ai-face.entity';
import { WebAppProfileModule } from './profile/profile.module';
import { LegalModule } from './legal/legal.module';
import { ImageGenerationModule } from './image-generation/image-generation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Industry,
      Category,
      ProductType,
      ProductTheme,
      ProductBackground,
      ProductPose,
      AiFace,
    ]),
    WebAppProfileModule,
    LegalModule,
    ImageGenerationModule,
  ],
  controllers: [WebAppController],
  providers: [WebAppService],
})
export class WebAppModule {}
