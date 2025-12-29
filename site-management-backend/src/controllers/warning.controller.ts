import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { WarningService } from '../services/warning.service';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../auth/decorators';

export interface CreateWarningDto {
  employee_id: number;
  site_id: number;
  warning_date: Date;
  description: string;
}

export interface UpdateWarningDto {
  description?: string;
  warning_date?: Date;
}

@Controller('warnings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarningController {
  constructor(private readonly warningService: WarningService) {}

  // CREATE - POST /warnings
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('manager', 'admin', 'supervisor')
  async create(@Request() req, @Body() createWarningDto: CreateWarningDto) {
    return this.warningService.issueWarning({
      ...createWarningDto,
      issued_by: req.user.employee_id,
    });
  }

  // READ ALL - GET /warnings?page=1&limit=10&employee_id=5&site_id=2 (with pagination) or GET /warnings (all warnings)
  @Get()
  @Roles('manager', 'admin', 'supervisor')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('employee_id') employeeId?: string,
    @Query('site_id') siteId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const empId = employeeId ? parseInt(employeeId, 10) : undefined;
    const sId = siteId ? parseInt(siteId, 10) : undefined;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Check if pagination parameters are provided
    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      
      return this.warningService.findAllPaginated({
        page: pageNum,
        limit: limitNum,
        employee_id: empId,
        site_id: sId,
        start_date: start,
        end_date: end,
      });
    } else {
      // Return all warnings without pagination
      return this.warningService.findAll({
        employee_id: empId,
        site_id: sId,
        start_date: start,
        end_date: end,
      });
    }
  }

  // GET EMPLOYEE WARNINGS - GET /warnings/employee/:employeeId
  @Get('employee/:employeeId')
  async getEmployeeWarnings(
    @Request() req,
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {
    // Employees can only view their own warnings unless they're managers
    if (req.user.role !== 'manager' && req.user.role !== 'admin' && 
        req.user.employee_id !== employeeId) {
      throw new Error('Unauthorized to view these warnings');
    }

    return this.warningService.getEmployeeWarnings(employeeId);
  }

  // GET SITE WARNINGS - GET /warnings/site/:siteId
  @Get('site/:siteId')
  @Roles('manager', 'admin', 'supervisor')
  async getSiteWarnings(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.warningService.getSiteWarnings(siteId);
  }

  // GET WARNING STATISTICS - GET /warnings/stats
  @Get('stats')
  @Roles('manager', 'admin')
  async getWarningStatistics(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.warningService.getWarningStatistics(start, end);
  }

  // GET RECENT WARNINGS - GET /warnings/recent?limit=5
  @Get('recent')
  @Roles('manager', 'admin', 'supervisor')
  async getRecentWarnings(@Query('limit') limit: string = '10') {
    const limitNum = parseInt(limit, 10);
    return this.warningService.getRecentWarnings(limitNum);
  }

  // GET WARNING TRENDS - GET /warnings/trends
  @Get('trends')
  @Roles('manager', 'admin')
  async getWarningTrends(
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month',
  ) {
    return this.warningService.getWarningTrends(period);
  }

  // READ ONE - GET /warnings/:id
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const warning = await this.warningService.findById(id);
    
    // Check permissions - employees can only view their own warnings
    if (req.user.role !== 'manager' && req.user.role !== 'admin' && 
        req.user.role !== 'supervisor' && warning.employee_id !== req.user.employee_id) {
      throw new Error('Unauthorized to view this warning');
    }

    return warning;
  }

  // UPDATE - PATCH /warnings/:id
  @Patch(':id')
  @Roles('manager', 'admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWarningDto: UpdateWarningDto,
  ) {
    return this.warningService.updateWarning(id, updateWarningDto);
  }

  // ACKNOWLEDGE WARNING - PATCH /warnings/:id/acknowledge
  @Patch(':id/acknowledge')
  async acknowledgeWarning(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.warningService.acknowledgeWarning(id, req.user.employee_id);
  }

  // APPEAL WARNING - POST /warnings/:id/appeal
  @Post(':id/appeal')
  async appealWarning(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { appeal_reason: string },
  ) {
    return this.warningService.appealWarning(
      id, 
      req.user.employee_id, 
      body.appeal_reason
    );
  }

  // GET WARNING APPEALS - GET /warnings/appeals/pending
  @Get('appeals/pending')
  @Roles('manager', 'admin')
  async getPendingAppeals() {
    return this.warningService.getPendingAppeals();
  }

  // RESOLVE APPEAL - PATCH /warnings/:id/appeal/resolve
  @Patch(':id/appeal/resolve')
  @Roles('manager', 'admin')
  async resolveAppeal(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { decision: 'approved' | 'denied'; resolution_notes?: string },
  ) {
    return this.warningService.resolveAppeal(
      id,
      req.user.employee_id,
      body.decision,
      body.resolution_notes
    );
  }

  // DELETE - DELETE /warnings/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('manager', 'admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.warningService.deleteWarning(id);
  }

  // BULK OPERATIONS
  
  // POST /warnings/bulk-issue - Issue warnings to multiple employees
  @Post('bulk-issue')
  @Roles('manager', 'admin')
  async bulkIssueWarnings(
    @Request() req,
    @Body() body: {
      employee_ids: number[];
      site_id: number;
      description: string;
      warning_date?: Date;
    },
  ) {
    return this.warningService.bulkIssueWarnings({
      ...body,
      issued_by: req.user.employee_id,
      warning_date: body.warning_date || new Date(),
    });
  }

  // GET /warnings/reports/summary - Warning summary report
  @Get('reports/summary')
  @Roles('manager', 'admin')
  async getWarningSummaryReport(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    return this.warningService.getWarningSummaryReport(start, end);
  }
}