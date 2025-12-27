import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ResponseUtil } from '../../../common/utils/response.util';
import { DashboardService } from './dashboard.service';
import { DashboardStatsResponseDto } from './dto/dashboard-stats.dto';
import { ROUTES } from '../../../common/constants';

@ApiTags('Admin - Dashboard')
@Controller(ROUTES.ADMIN.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard/stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get comprehensive dashboard statistics',
    description:
      'Returns comprehensive analytics including: generated images statistics (totals, success rates, performance), user statistics (total, active, inactive, banned, email verified, new registrations), entity counts (industries, categories, product types, etc.), top items by category, and common errors. Requires admin or super admin role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getDashboardStats(): Promise<any> {
    const stats = await this.dashboardService.getDashboardStats();
    return ResponseUtil.success(stats, 'Dashboard statistics retrieved successfully');
  }
}

