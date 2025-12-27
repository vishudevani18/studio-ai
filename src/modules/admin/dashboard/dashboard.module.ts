import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { GeneratedImage } from '../../../database/entities/generated-image.entity';
import { Industry } from '../../../database/entities/industry.entity';
import { Category } from '../../../database/entities/category.entity';
import { ProductType } from '../../../database/entities/product-type.entity';
import { ProductPose } from '../../../database/entities/product-pose.entity';
import { ProductTheme } from '../../../database/entities/product-theme.entity';
import { ProductBackground } from '../../../database/entities/product-background.entity';
import { AiFace } from '../../../database/entities/ai-face.entity';
import { User, UserRole, UserStatus } from '../../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GeneratedImage,
      Industry,
      Category,
      ProductType,
      ProductPose,
      ProductTheme,
      ProductBackground,
      AiFace,
      User,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

