import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CostCalculationService } from '../services/cost-calculation.service';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../auth/decorators';

@Controller('cost-calculation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CostCalculationController {
  constructor(private readonly costService: CostCalculationService) {}

  // GET /cost-calculation/site/:siteId - Real-time site cost calculation
  @Get('site/:siteId')
  @Roles('manager', 'admin', 'supervisor')
  async getSiteCostCalculation(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.costService.calculateSiteCosts(siteId);
  }

  // GET /cost-calculation/site/:siteId/breakdown - Detailed cost breakdown
  @Get('site/:siteId/breakdown')
  @Roles('manager', 'admin')
  async getSiteCostBreakdown(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.costService.getSiteCostBreakdown(siteId);
  }

  // GET /cost-calculation/site/:siteId/history - Historical cost data
  @Get('site/:siteId/history')
  @Roles('manager', 'admin')
  async getSiteCostHistory(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.costService.getSiteCostHistory(siteId, start, end);
  }

  // GET /cost-calculation/all-sites - All sites cost summary
  @Get('all-sites')
  @Roles('manager', 'admin')
  async getAllSitesCosts() {
    return this.costService.getAllSitesCostSummary();
  }

  // GET /cost-calculation/budget-alerts - Sites exceeding budget
  @Get('budget-alerts')
  @Roles('manager', 'admin')
  async getBudgetAlerts() {
    return this.costService.getBudgetAlerts();
  }

  // POST /cost-calculation/recalculate/:siteId - Force recalculation
  @Post('recalculate/:siteId')
  @Roles('manager', 'admin')
  async recalculateSiteCosts(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.costService.recalculateSiteCosts(siteId);
  }

  // GET /cost-calculation/projections/:siteId - Cost projections
  @Get('projections/:siteId')
  @Roles('manager', 'admin')
  async getCostProjections(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.costService.getCostProjections(siteId);
  }

  // GET /cost-calculation/employee/:employeeId/costs - Employee cost tracking
  @Get('employee/:employeeId/costs')
  @Roles('manager', 'admin', 'supervisor')
  async getEmployeeCosts(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.costService.getEmployeeCosts(employeeId, start, end);
  }

  // GET /cost-calculation/material-costs/:siteId - Material cost breakdown
  @Get('material-costs/:siteId')
  @Roles('manager', 'admin')
  async getMaterialCosts(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.costService.getMaterialCosts(siteId);
  }

  // POST /cost-calculation/budget-update/:siteId - Update site budget
  @Post('budget-update/:siteId')
  @Roles('manager', 'admin')
  async updateSiteBudget(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Body() body: { new_budget: number; reason?: string },
  ) {
    return this.costService.updateSiteBudget(siteId, body.new_budget, body.reason);
  }
}