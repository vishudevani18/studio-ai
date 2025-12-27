import { ApiProperty } from '@nestjs/swagger';

export class GeneratedImagesStatsDto {
  @ApiProperty({ description: 'Total number of generated images' })
  total: number;

  @ApiProperty({ description: 'Number of successful generations' })
  successful: number;

  @ApiProperty({ description: 'Number of failed generations' })
  failed: number;

  @ApiProperty({ description: 'Success rate percentage (0-100)' })
  successRate: number;

  @ApiProperty({ description: 'Average generation time in milliseconds' })
  averageGenerationTime: number;

  @ApiProperty({ description: 'Total generations in last 24 hours' })
  last24Hours: number;

  @ApiProperty({ description: 'Total generations in last 7 days' })
  last7Days: number;

  @ApiProperty({ description: 'Total generations in last 30 days' })
  last30Days: number;
}

export class TopItemDto {
  @ApiProperty({ description: 'Item ID' })
  id: string;

  @ApiProperty({ description: 'Item name' })
  name: string;

  @ApiProperty({ description: 'Usage count' })
  count: number;

  @ApiProperty({ description: 'Percentage of total usage' })
  percentage: number;
}

export class UsersStatsDto {
  @ApiProperty({ description: 'Total number of regular users' })
  total: number;

  @ApiProperty({ description: 'Number of active users' })
  active: number;

  @ApiProperty({ description: 'Number of inactive users' })
  inactive: number;

  @ApiProperty({ description: 'Number of banned users' })
  banned: number;

  @ApiProperty({ description: 'Number of users with verified emails' })
  emailVerified: number;

  @ApiProperty({ description: 'New users registered in last 24 hours' })
  last24Hours: number;

  @ApiProperty({ description: 'New users registered in last 7 days' })
  last7Days: number;

  @ApiProperty({ description: 'New users registered in last 30 days' })
  last30Days: number;

  @ApiProperty({ description: 'Total number of admin users (admin + super_admin)' })
  adminUsers: number;
}

export class EntityCountsDto {
  @ApiProperty({ description: 'Total number of industries' })
  industries: number;

  @ApiProperty({ description: 'Total number of categories' })
  categories: number;

  @ApiProperty({ description: 'Total number of product types' })
  productTypes: number;

  @ApiProperty({ description: 'Total number of product poses' })
  productPoses: number;

  @ApiProperty({ description: 'Total number of product themes' })
  productThemes: number;

  @ApiProperty({ description: 'Total number of product backgrounds' })
  productBackgrounds: number;

  @ApiProperty({ description: 'Total number of AI faces' })
  aiFaces: number;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ description: 'Generated images statistics', type: GeneratedImagesStatsDto })
  generatedImages: GeneratedImagesStatsDto;

  @ApiProperty({ description: 'User statistics', type: UsersStatsDto })
  users: UsersStatsDto;

  @ApiProperty({ description: 'Entity counts across the system', type: EntityCountsDto })
  entityCounts: EntityCountsDto;

  @ApiProperty({ description: 'Top 10 most used industries', type: [TopItemDto] })
  topIndustries: TopItemDto[];

  @ApiProperty({ description: 'Top 10 most used categories', type: [TopItemDto] })
  topCategories: TopItemDto[];

  @ApiProperty({ description: 'Top 10 most used product types', type: [TopItemDto] })
  topProductTypes: TopItemDto[];

  @ApiProperty({ description: 'Top 10 most used product poses', type: [TopItemDto] })
  topProductPoses: TopItemDto[];

  @ApiProperty({ description: 'Top 10 most used product themes', type: [TopItemDto] })
  topProductThemes: TopItemDto[];

  @ApiProperty({ description: 'Top 10 most used product backgrounds', type: [TopItemDto] })
  topProductBackgrounds: TopItemDto[];

  @ApiProperty({ description: 'Top 10 most used AI faces', type: [TopItemDto] })
  topAiFaces: TopItemDto[];

  @ApiProperty({ description: 'Common error messages (top 5)', type: [Object] })
  commonErrors: Array<{ message: string; count: number }>;
}

