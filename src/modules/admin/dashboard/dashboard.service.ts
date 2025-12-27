import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { GeneratedImage, GenerationStatus } from '../../../database/entities/generated-image.entity';
import { Industry } from '../../../database/entities/industry.entity';
import { Category } from '../../../database/entities/category.entity';
import { ProductType } from '../../../database/entities/product-type.entity';
import { ProductPose } from '../../../database/entities/product-pose.entity';
import { ProductTheme } from '../../../database/entities/product-theme.entity';
import { ProductBackground } from '../../../database/entities/product-background.entity';
import { AiFace } from '../../../database/entities/ai-face.entity';
import { User, UserRole, UserStatus } from '../../../database/entities/user.entity';
import {
  DashboardStatsResponseDto,
  GeneratedImagesStatsDto,
  UsersStatsDto,
  EntityCountsDto,
  TopItemDto,
} from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(GeneratedImage)
    private generatedImageRepository: Repository<GeneratedImage>,
    @InjectRepository(Industry)
    private industryRepository: Repository<Industry>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(ProductType)
    private productTypeRepository: Repository<ProductType>,
    @InjectRepository(ProductPose)
    private productPoseRepository: Repository<ProductPose>,
    @InjectRepository(ProductTheme)
    private productThemeRepository: Repository<ProductTheme>,
    @InjectRepository(ProductBackground)
    private productBackgroundRepository: Repository<ProductBackground>,
    @InjectRepository(AiFace)
    private aiFaceRepository: Repository<AiFace>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getDashboardStats(): Promise<DashboardStatsResponseDto> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get generated images statistics
    const [
      total,
      successful,
      failed,
      last24HoursCount,
      last7DaysCount,
      last30DaysCount,
      avgGenerationTime,
    ] = await Promise.all([
      this.generatedImageRepository.count(),
      this.generatedImageRepository.count({
        where: { generationStatus: GenerationStatus.SUCCESS },
      }),
      this.generatedImageRepository.count({
        where: { generationStatus: GenerationStatus.FAILED },
      }),
      this.generatedImageRepository.count({
        where: { createdAt: MoreThan(last24Hours) },
      }),
      this.generatedImageRepository.count({
        where: { createdAt: MoreThan(last7Days) },
      }),
      this.generatedImageRepository.count({
        where: { createdAt: MoreThan(last30Days) },
      }),
      this.getAverageGenerationTime(),
    ]);

    const successRate = total > 0 ? (successful / total) * 100 : 0;

    const generatedImagesStats: GeneratedImagesStatsDto = {
      total,
      successful,
      failed,
      successRate: Math.round(successRate * 100) / 100,
      averageGenerationTime: Math.round(avgGenerationTime),
      last24Hours: last24HoursCount,
      last7Days: last7DaysCount,
      last30Days: last30DaysCount,
    };

    // Get user statistics
    const usersStats = await this.getUsersStats(last24Hours, last7Days, last30Days);

    // Get entity counts
    const entityCounts = await this.getEntityCounts();

    // Get top items for each category
    const [topIndustries, topCategories, topProductTypes, topProductPoses, topProductThemes, topProductBackgrounds, topAiFaces, commonErrors] = await Promise.all([
      this.getTopItems('industryId', this.industryRepository),
      this.getTopItems('categoryId', this.categoryRepository),
      this.getTopItems('productTypeId', this.productTypeRepository),
      this.getTopItems('productPoseId', this.productPoseRepository),
      this.getTopItems('productThemeId', this.productThemeRepository),
      this.getTopItems('productBackgroundId', this.productBackgroundRepository),
      this.getTopItems('aiFaceId', this.aiFaceRepository),
      this.getCommonErrors(),
    ]);

    return {
      generatedImages: generatedImagesStats,
      users: usersStats,
      entityCounts,
      topIndustries,
      topCategories,
      topProductTypes,
      topProductPoses,
      topProductThemes,
      topProductBackgrounds,
      topAiFaces,
      commonErrors,
    };
  }

  private async getAverageGenerationTime(): Promise<number> {
    const result = await this.generatedImageRepository
      .createQueryBuilder('gi')
      .select('AVG(gi.generationTimeMs)', 'avg')
      .where('gi.generationTimeMs IS NOT NULL')
      .getRawOne();

    return result?.avg ? parseFloat(result.avg) : 0;
  }

  private async getTopItems(
    fieldName: string,
    entityRepository: Repository<any>,
  ): Promise<TopItemDto[]> {
    // Count occurrences of each ID
    const counts = await this.generatedImageRepository
      .createQueryBuilder('gi')
      .select(`gi.${fieldName}`, 'id')
      .addSelect('COUNT(*)', 'count')
      .where(`gi.${fieldName} IS NOT NULL`)
      .groupBy(`gi.${fieldName}`)
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    if (counts.length === 0) {
      return [];
    }

    // Fetch entity names (including soft-deleted ones for historical accuracy)
    const ids = counts.map(item => item.id).filter(id => id !== null);
    if (ids.length === 0) {
      return [];
    }

    const entities = await entityRepository.find({
      where: { id: In(ids) },
      withDeleted: true, // Include soft-deleted entities to get their names
    });
    const entityMap = new Map(entities.map(e => [e.id, e]));

    // Get total count for percentage calculation (only from valid entities)
    const validCounts = counts.filter(item => entityMap.has(item.id));
    const totalCount = validCounts.reduce((sum, item) => sum + parseInt(item.count, 10), 0);

    // Build result with names and percentages (filter out entities that don't exist)
    return validCounts
      .map(item => {
        const entity = entityMap.get(item.id);
        if (!entity) {
          return null; // Skip if entity doesn't exist
        }
        const count = parseInt(item.count, 10);
        return {
          id: item.id,
          name: entity.name || 'Unnamed',
          count,
          percentage: totalCount > 0 ? Math.round((count / totalCount) * 100 * 100) / 100 : 0,
        };
      })
      .filter(item => item !== null) as TopItemDto[];
  }

  private async getCommonErrors(): Promise<Array<{ message: string; count: number }>> {
    const errors = await this.generatedImageRepository
      .createQueryBuilder('gi')
      .select('gi.errorMessage', 'message')
      .addSelect('COUNT(*)', 'count')
      .where('gi.errorMessage IS NOT NULL')
      .groupBy('gi.errorMessage')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return errors.map(item => ({
      message: item.message || 'Unknown error',
      count: parseInt(item.count, 10),
    }));
  }

  private async getUsersStats(
    last24Hours: Date,
    last7Days: Date,
    last30Days: Date,
  ): Promise<UsersStatsDto> {
    const [
      total,
      active,
      inactive,
      banned,
      emailVerified,
      last24HoursCount,
      last7DaysCount,
      last30DaysCount,
      adminUsers,
    ] = await Promise.all([
      this.userRepository.count({
        where: { role: UserRole.USER },
      }),
      this.userRepository.count({
        where: { role: UserRole.USER, status: UserStatus.ACTIVE },
      }),
      this.userRepository.count({
        where: { role: UserRole.USER, status: UserStatus.INACTIVE },
      }),
      this.userRepository.count({
        where: { role: UserRole.USER, status: UserStatus.BANNED },
      }),
      this.userRepository.count({
        where: { role: UserRole.USER, emailVerified: true },
      }),
      this.userRepository.count({
        where: {
          role: UserRole.USER,
          createdAt: MoreThan(last24Hours),
        },
      }),
      this.userRepository.count({
        where: {
          role: UserRole.USER,
          createdAt: MoreThan(last7Days),
        },
      }),
      this.userRepository.count({
        where: {
          role: UserRole.USER,
          createdAt: MoreThan(last30Days),
        },
      }),
      this.userRepository.count({
        where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }],
      }),
    ]);

    return {
      total,
      active,
      inactive,
      banned,
      emailVerified,
      last24Hours: last24HoursCount,
      last7Days: last7DaysCount,
      last30Days: last30DaysCount,
      adminUsers,
    };
  }

  private async getEntityCounts(): Promise<EntityCountsDto> {
    const [
      industries,
      categories,
      productTypes,
      productPoses,
      productThemes,
      productBackgrounds,
      aiFaces,
    ] = await Promise.all([
      this.industryRepository.count(),
      this.categoryRepository.count(),
      this.productTypeRepository.count(),
      this.productPoseRepository.count(),
      this.productThemeRepository.count(),
      this.productBackgroundRepository.count(),
      this.aiFaceRepository.count(),
    ]);

    return {
      industries,
      categories,
      productTypes,
      productPoses,
      productThemes,
      productBackgrounds,
      aiFaces,
    };
  }
}

