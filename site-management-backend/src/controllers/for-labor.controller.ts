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
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ForLaborService } from '../services/for-labor.service';
import { CreateForLaborDto, UpdateForLaborDto, LaborPaymentType } from '../models/for-labor.model';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../auth/decorators';

@Controller('for-labor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ForLaborController {
  constructor(private readonly forLaborService: ForLaborService) {}

  // CREATE - POST /for-labor
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('manager', 'admin', 'supervisor')
  async create(@Body() createForLaborDto: CreateForLaborDto) {
    return this.forLaborService.create(createForLaborDto);
  }

  // READ ALL - GET /for-labor?page=1&limit=10&employee_id=5&site_id=2
  @Get()
  @Roles('manager', 'admin', 'supervisor')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('employee_id') employeeId?: string,
    @Query('site_id') siteId?: string,
    @Query('payment_id') paymentId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('status') status?: string,
    @Query('payment_type') paymentType?: string,
  ) {
    const empId = employeeId ? parseInt(employeeId, 10) : undefined;
    const sId = siteId ? parseInt(siteId, 10) : undefined;
    const pId = paymentId ? parseInt(paymentId, 10) : undefined;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const params = {
      employee_id: empId,
      site_id: sId,
      payment_id: pId,
      start_date: start,
      end_date: end,
      status,
      payment_type: paymentType,
    };

    // Check if pagination parameters are provided
    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      
      return this.forLaborService.findAll({
        ...params,
        page: pageNum,
        limit: limitNum,
      });
    } else {
      return this.forLaborService.findAll(params);
    }
  }

  // READ ONE - GET /for-labor/:id
  @Get(':id')
  @Roles('manager', 'admin', 'supervisor')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.forLaborService.findById(id);
  }

  // GET EMPLOYEE LABOR SUMMARY - GET /for-labor/employee/:employeeId/summary
  @Get('employee/:employeeId/summary')
  @Roles('manager', 'admin', 'supervisor', 'employee')
  async getEmployeeLaborSummary(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.forLaborService.getEmployeeLaborSummary(employeeId, start, end);
  }

  // GET SITE LABOR SUMMARY - GET /for-labor/site/:siteId/summary
  @Get('site/:siteId/summary')
  @Roles('manager', 'admin', 'supervisor')
  async getSiteLaborSummary(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.forLaborService.getSiteLaborSummary(siteId, start, end);
  }

  // GET LABOR STATISTICS - GET /for-labor/statistics
  @Get('statistics/overview')
  @Roles('manager', 'admin')
  async getLaborStatistics(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.forLaborService.getLaborStatistics(start, end);
  }

  // UPDATE - PATCH /for-labor/:id
  @Patch(':id')
  @Roles('manager', 'admin', 'supervisor')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateForLaborDto: UpdateForLaborDto,
  ) {
    return this.forLaborService.update(id, updateForLaborDto);
  }

  // DELETE - DELETE /for-labor/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('manager', 'admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.forLaborService.delete(id);
  }

  // BULK OPERATIONS - POST /for-labor/bulk
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @Roles('manager', 'admin')
  async createBulk(@Body() createForLaborDtos: CreateForLaborDto[]) {
    const results = await Promise.all(
      createForLaborDtos.map(dto => this.forLaborService.create(dto))
    );
    
    return {
      message: `Successfully created ${results.length} labor records`,
      records: results,
    };
  }

  // GET LABOR BY EMPLOYEE - GET /for-labor/employee/:employeeId
  @Get('employee/:employeeId')
  @Roles('manager', 'admin', 'supervisor', 'employee')
  async getLaborByEmployee(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const params = {
      employee_id: employeeId,
      start_date: start,
      end_date: end,
    };

    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      
      return this.forLaborService.findAll({
        ...params,
        page: pageNum,
        limit: limitNum,
      });
    } else {
      return this.forLaborService.findAll(params);
    }
  }

  // GET LABOR BY SITE - GET /for-labor/site/:siteId
  @Get('site/:siteId')
  @Roles('manager', 'admin', 'supervisor')
  async getLaborBySite(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const params = {
      site_id: siteId,
      start_date: start,
      end_date: end,
    };

    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      
      return this.forLaborService.findAll({
        ...params,
        page: pageNum,
        limit: limitNum,
      });
    } else {
      return this.forLaborService.findAll(params);
    }
  }

  // GET RECENT LABOR RECORDS - GET /for-labor/recent
  @Get('recent/records')
  @Roles('manager', 'admin', 'supervisor')
  async getRecentLaborRecords(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    return this.forLaborService.findAll({
      limit: limitNum,
    });
  }

  // CREATE LABOR RECORD FROM ATTENDANCE - POST /for-labor/from-attendance
  @Post('from-attendance')
  @Roles('manager', 'admin', 'supervisor')
  @HttpCode(HttpStatus.CREATED)
  async createFromAttendance(
    @Body() createData: {
      employee_id: number;
      work_date: string;
      site_id: number;
      payment_id: number;
      use_progressive_overtime?: boolean;
    }
  ) {
    const workDate = new Date(createData.work_date);
    return this.forLaborService.createFromAttendance(
      createData.employee_id,
      workDate,
      createData.site_id,
      createData.payment_id,
      createData.use_progressive_overtime ?? true
    );
  }

  // GENERATE LABOR RECORDS FOR PERIOD - POST /for-labor/generate-period
  @Post('generate-period')
  @Roles('manager', 'admin', 'supervisor')
  @HttpCode(HttpStatus.CREATED)
  async generateFromAttendancePeriod(
    @Body() generateData: {
      employee_id: number;
      start_date: string;
      end_date: string;
      site_id: number;
      payment_id: number;
      use_progressive_overtime?: boolean;
    }
  ) {
    const startDate = new Date(generateData.start_date);
    const endDate = new Date(generateData.end_date);
    
    return this.forLaborService.generateLaborRecordsFromAttendance(
      generateData.employee_id,
      startDate,
      endDate,
      generateData.site_id,
      generateData.payment_id,
      generateData.use_progressive_overtime ?? true
    );
  }

  // GET ATTENDANCE COST PREVIEW - GET /for-labor/attendance-preview
  @Get('attendance-preview')
  @Roles('manager', 'admin', 'supervisor', 'employee')
  async getAttendanceCostPreview(
    @Query('employee_id', ParseIntPipe) employeeId: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('site_id') siteId?: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const siteIdNum = siteId ? parseInt(siteId, 10) : undefined;
    
    return this.forLaborService.getAttendanceCostPreview(
      employeeId,
      start,
      end,
      siteIdNum
    );
  }

  // GET PAYMENT TYPE ANALYTICS - GET /for-labor/analytics/payment-types
  @Get('analytics/payment-types')
  @Roles('manager', 'admin')
  async getPaymentTypeAnalytics(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.forLaborService.getPaymentTypeAnalytics(start, end);
  }

  // GET EMPLOYEE YTD SUMMARY - GET /for-labor/analytics/employee/:id/ytd
  @Get('analytics/employee/:id/ytd')
  @Roles('manager', 'admin', 'supervisor', 'employee')
  async getEmployeeYTDSummary(
    @Param('id', ParseIntPipe) employeeId: number,
    @Query('year') year?: string
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.forLaborService.getEmployeeYTDSummary(employeeId, yearNum);
  }
}