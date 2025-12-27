import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Industry } from '../../database/entities/industry.entity';
import { Category } from '../../database/entities/category.entity';
import { ProductType } from '../../database/entities/product-type.entity';
import { IndustriesService } from './industries/industries.service';
import { CategoriesService } from './categories/categories.service';
import { ProductTypesService } from './product-types/product-types.service';
import { IndustriesController } from './industries/industries.controller';
import { CategoriesController } from './categories/categories.controller';
import { ProductTypesController } from './product-types/product-types.controller';
import { ProductPose } from '../../database/entities/product-pose.entity';
import { ProductPosesController } from './product-poses/product-poses.controller';
import { ProductPosesService } from './product-poses/product-poses.service';
import { ProductTheme } from '../../database/entities/product-theme.entity';
import { ProductThemesController } from './product-themes/product-themes.controller';
import { ProductThemesService } from './product-themes/product-themes.service';
import { ProductBackground } from '../../database/entities/product-background.entity';
import { ProductBackgroundsController } from './product-backgrounds/product-backgrounds.controller';
import { ProductBackgroundsService } from './product-backgrounds/product-backgrounds.service';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { AdminRegularUsersModule } from './users/users.module';
import { LegalDocumentsModule } from './legal-documents/legal-documents.module';
import { StorageModule } from '../../storage/storage.module';
import { AiFacesModule } from './ai-faces/ai-faces.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Industry,
      Category,
      ProductType,
      ProductPose,
      ProductTheme,
      ProductBackground,
    ]),
    AdminUsersModule,
    AdminRegularUsersModule,
    LegalDocumentsModule,
    AiFacesModule,
    DashboardModule,
    StorageModule,
  ],
  controllers: [
    IndustriesController,
    CategoriesController,
    ProductTypesController,
    ProductPosesController,
    ProductThemesController,
    ProductBackgroundsController,
  ],
  providers: [
    IndustriesService,
    CategoriesService,
    ProductTypesService,
    ProductPosesService,
    ProductThemesService,
    ProductBackgroundsService,
  ],
})
export class AdminModule {}
