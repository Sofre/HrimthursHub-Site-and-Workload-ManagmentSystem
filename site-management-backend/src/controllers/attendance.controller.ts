import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { CreateAttendanceLogDto, UpdateAttendanceLogDto } from '../models/attendance-log.model';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // CREATE - POST /attendance (Manual attendance record)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAttendanceDto: CreateAttendanceLogDto) {
    // For manual attendance record creation, use checkIn method
    return this.attendanceService.checkIn(
      createAttendanceDto.employee_id,
      createAttendanceDto.site_id
    );
  }

  // READ ALL - GET /attendance?page=1&limit=10&employee_id=1&site_id=2&date=2024-11-25
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('employee_id') employeeId?: string,
    @Query('site_id') siteId?: string,
    @Query('date') date?: string,
  ) {
    // If any pagination or filter parameters are provided, use filtered/paginated search
    if (page || limit || employeeId || siteId || date) {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 20;
      
      const filters = {
        employee_id: employeeId ? parseInt(employeeId, 10) : undefined,
        site_id: siteId ? parseInt(siteId, 10) : undefined,
        date: date ? new Date(date) : undefined,
      };
      
      return this.attendanceService.findWithPaginationAndFilters(pageNum, limitNum, filters);
    }
    
    // Otherwise return all records
    return this.attendanceService.findAll();
  }
  

  // CHECK IN - POST /attendance/check-in
  @Post('check-in')
  @HttpCode(HttpStatus.CREATED)
  async checkIn(@Body() checkInData: { employee_id: number; site_id: number }) {
    return this.attendanceService.checkIn(checkInData.employee_id, checkInData.site_id);
  }

  

  // CHECK OUT - POST /attendance/check-out
  @Post('check-out')
  async checkOut(@Body() checkOutData: { employee_id: number }) {
    return this.attendanceService.checkOutEmployee(checkOutData.employee_id);
  }

  // GET ACTIVE EMPLOYEES - GET /attendance/active
  @Get('active')
  async getActiveEmployees() {
    return this.attendanceService.getCurrentlyActive();
  }

  // GET ACTIVE ON SITE - GET /attendance/active/site/:siteId
  @Get('active/site/:siteId')
  async getActiveEmployeesOnSite(@Param('siteId', ParseIntPipe) siteId: number) {
    // Get all active employees and filter by site
    const activeEmployees = await this.attendanceService.getCurrentlyActive();
    return activeEmployees.filter(emp => emp.site_id === siteId);
  }

  // GET EMPLOYEE SUMMARY - GET /attendance/employee/:employeeId/summary?start_date=2024-01-01&end_date=2024-01-31
  @Get('employee/:employeeId/summary')
  async getEmployeeAttendanceSummary(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    // Provide default dates if not specified
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    return this.attendanceService.getEmployeeAttendanceSummary(employeeId, start, end);
  }

  // GET SITE SUMMARY - GET /attendance/site/:siteId/summary?date=2024-01-15
  @Get('site/:siteId/summary')
  async getSiteAttendanceSummary(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Query('date') date?: string,
  ) {
    const dateFilter = date ? new Date(date) : new Date();
    return this.attendanceService.getSiteAttendanceStats(siteId, dateFilter);
  }

  // GET DAILY HOURS - GET /attendance/daily-hours?employee_id=1&date=2024-01-15
  @Get('daily-hours')
  async getDailyHours(
    @Query('employee_id') employeeId?: string,
    @Query('date') date?: string,
  ) {
    const empId = employeeId ? parseInt(employeeId, 10) : undefined;
    const dateFilter = date ? new Date(date) : new Date();

    if (empId) {
      // Get hours for specific employee
      const startOfDay = new Date(dateFilter);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateFilter);
      endOfDay.setHours(23, 59, 59, 999);
      
      const summary = await this.attendanceService.getEmployeeAttendanceSummary(
        empId,
        startOfDay,
        endOfDay,
      );
      return summary;
    }

    // Get hours for all employees for the date
    return { message: 'Use specific employee_id for daily hours calculation' };
  }

  // READ ONE - GET /attendance/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.findById(id);
  }

  // UPDATE - PATCH /attendance/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAttendanceDto: UpdateAttendanceLogDto,
  ) {
    return this.attendanceService.correctAttendance(id, updateAttendanceDto);
  }

  // DELETE - DELETE /attendance/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.attendanceService.delete(id);
  }
}