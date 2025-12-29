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
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto, UpdatePaymentDto, CreateGasPaymentDto, CreateOvertimePaymentDto, CreateBonusPaymentDto, CreateHourlyPaymentDto, HourlyCalculationDto } from '../models/payment.model';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // CREATE - POST /payments
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  // READ ALL - GET /payments?page=1&limit=10&status=completed&site_id=2
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: 'pending' | 'processing' | 'completed' | 'failed',
    @Query('site_id') siteId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const sId = siteId ? parseInt(siteId, 10) : undefined;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.paymentService.findAll();
  }

  // GET BY STATUS - GET /payments/status/:status
  @Get('status/:status')
  async findByStatus(@Param('status') status: 'pending' | 'processing' | 'completed' | 'failed') {
    return this.paymentService.findByStatus(status);
  }

  // GET PENDING PAYMENTS - GET /payments/pending
  @Get('pending')
  async getPendingPayments() {
    return this.paymentService.findByStatus('pending');
  }

  // GET COMPLETED PAYMENTS - GET /payments/completed
  @Get('completed')
  async getCompletedPayments() {
    return this.paymentService.findByStatus('completed');
  }

  // GET MONTHLY SUMMARY - GET /payments/monthly-summary?year=2024&month=11
  @Get('monthly-summary')
  async getMonthlyPaymentSummary(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    const monthNum = month ? parseInt(month, 10) : new Date().getMonth() + 1;

    return this.paymentService.getMonthlyPaymentSummary(yearNum, monthNum);
  }

  // GET SITE PAYMENTS - GET /payments/site/:siteId
  @Get('site/:siteId')
  async getSitePayments(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.paymentService.findBySite(siteId);
  }

  // GET SITE TOTAL - GET /payments/site/:siteId/total
  @Get('site/:siteId/total')
  async getSitePaymentTotal(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.paymentService.getTotalSitePayments(siteId);
  }

  // GET PAYMENT ANALYTICS - GET /payments/analytics?start_date=2024-01-01&end_date=2024-12-31
  @Get('analytics')
  async getPaymentAnalytics(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    // Use getPaymentStatistics since getPaymentAnalytics doesn't exist
    return this.paymentService.getPaymentStatistics();
  }

  // READ ONE - GET /payments/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.findById(id);
  }

  // UPDATE - PATCH /payments/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentService.update(id, updatePaymentDto);
  }

  // PROCESS PAYMENT - PATCH /payments/:id/process
  @Patch(':id/process')
  async processPayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.processPayment(id);
  }

  // MARK AS COMPLETED - PATCH /payments/:id/complete
  @Patch(':id/complete')
  async completePayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.update(id, { status: 'completed' });
  }

  // MARK AS FAILED - PATCH /payments/:id/fail
  @Patch(':id/fail')
  async failPayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.update(id, { status: 'failed' });
  }

  // GAS PAYMENT ENDPOINTS
  
  // CREATE GAS PAYMENT - POST /payments/gas
  @Post('gas')
  @HttpCode(HttpStatus.CREATED)
  async createGasPayment(@Body() gasPaymentData: CreateGasPaymentDto) {
    return this.paymentService.createGasPayment(
      gasPaymentData.employee_id,
      gasPaymentData.site_id,
      gasPaymentData.amount,
      gasPaymentData.description
    );
  }

  // GET ALL GAS PAYMENTS - GET /payments/gas
  @Get('gas')
  async getAllGasPayments() {
    return this.paymentService.getGasPayments();
  }

  // GET EMPLOYEE GAS PAYMENTS - GET /payments/gas/employee/:employeeId
  @Get('gas/employee/:employeeId')
  async getEmployeeGasPayments(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.paymentService.getEmployeeGasPayments(employeeId);
  }

  // GET SITE GAS PAYMENTS - GET /payments/gas/site/:siteId
  @Get('gas/site/:siteId')
  async getSiteGasPayments(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.paymentService.getSiteGasPayments(siteId);
  }

  // GET EMPLOYEE TOTAL GAS PAYMENTS - GET /payments/gas/employee/:employeeId/total
  @Get('gas/employee/:employeeId/total')
  async getEmployeeTotalGasPayments(@Param('employeeId', ParseIntPipe) employeeId: number) {
    const total = await this.paymentService.getEmployeeTotalGasPayments(employeeId);
    return { total };
  }

  // OVERTIME PAYMENT ENDPOINTS
  
  // CREATE OVERTIME PAYMENT - POST /payments/overtime
  @Post('overtime')
  @HttpCode(HttpStatus.CREATED)
  async createOvertimePayment(@Body() overtimePaymentData: CreateOvertimePaymentDto) {
    return this.paymentService.createOvertimePayment(
      overtimePaymentData.employee_id,
      overtimePaymentData.site_id,
      overtimePaymentData.amount,
      overtimePaymentData.description
    );
  }

  // GET ALL OVERTIME PAYMENTS - GET /payments/overtime
  @Get('overtime')
  async getAllOvertimePayments() {
    return this.paymentService.getOvertimePayments();
  }

  // GET EMPLOYEE OVERTIME PAYMENTS - GET /payments/overtime/employee/:employeeId
  @Get('overtime/employee/:employeeId')
  async getEmployeeOvertimePayments(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.paymentService.getEmployeeOvertimePayments(employeeId);
  }

  // GET SITE OVERTIME PAYMENTS - GET /payments/overtime/site/:siteId
  @Get('overtime/site/:siteId')
  async getSiteOvertimePayments(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.paymentService.getSiteOvertimePayments(siteId);
  }

  // GET EMPLOYEE TOTAL OVERTIME PAYMENTS - GET /payments/overtime/employee/:employeeId/total
  @Get('overtime/employee/:employeeId/total')
  async getEmployeeTotalOvertimePayments(@Param('employeeId', ParseIntPipe) employeeId: number) {
    const total = await this.paymentService.getEmployeeTotalOvertimePayments(employeeId);
    return { total };
  }

  // BONUS PAYMENT ENDPOINTS
  
  // CREATE BONUS PAYMENT - POST /payments/bonus
  @Post('bonus')
  @HttpCode(HttpStatus.CREATED)
  async createBonusPayment(@Body() bonusPaymentData: CreateBonusPaymentDto) {
    return this.paymentService.createBonusPayment(
      bonusPaymentData.employee_id,
      bonusPaymentData.site_id,
      bonusPaymentData.amount,
      bonusPaymentData.description
    );
  }

  // GET ALL BONUS PAYMENTS - GET /payments/bonus
  @Get('bonus')
  async getAllBonusPayments() {
    return this.paymentService.getBonusPayments();
  }

  // GET EMPLOYEE BONUS PAYMENTS - GET /payments/bonus/employee/:employeeId
  @Get('bonus/employee/:employeeId')
  async getEmployeeBonusPayments(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.paymentService.getEmployeeBonusPayments(employeeId);
  }

  // GET SITE BONUS PAYMENTS - GET /payments/bonus/site/:siteId
  @Get('bonus/site/:siteId')
  async getSiteBonusPayments(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.paymentService.getSiteBonusPayments(siteId);
  }

  // GET EMPLOYEE TOTAL BONUS PAYMENTS - GET /payments/bonus/employee/:employeeId/total
  @Get('bonus/employee/:employeeId/total')
  async getEmployeeTotalBonusPayments(@Param('employeeId', ParseIntPipe) employeeId: number) {
    const total = await this.paymentService.getEmployeeTotalBonusPayments(employeeId);
    return { total };
  }

  // GET PAYMENTS BY TYPE - GET /payments/type/:paymentType
  @Get('type/:paymentType')
  async getPaymentsByType(@Param('paymentType') paymentType: string) {
    return this.paymentService.getPaymentsByType(paymentType);
  }

  // HOURLY PAYMENT CALCULATION ENDPOINTS
  
  // CALCULATE HOURLY PAYMENT - POST /payments/hourly/calculate
  @Post('hourly/calculate')
  async calculateHourlyPayment(@Body() calculationData: HourlyCalculationDto) {
    const startDate = new Date(calculationData.start_date);
    const endDate = new Date(calculationData.end_date);
    return this.paymentService.getEmployeeHourlyCalculation(
      calculationData.employee_id,
      calculationData.site_id,
      startDate,
      endDate
    );
  }

  // CREATE CALCULATED HOURLY PAYMENT - POST /payments/hourly
  @Post('hourly')
  @HttpCode(HttpStatus.CREATED)
  async createCalculatedHourlyPayment(@Body() hourlyPaymentData: CreateHourlyPaymentDto) {
    const startDate = new Date(hourlyPaymentData.start_date);
    const endDate = new Date(hourlyPaymentData.end_date);
    return this.paymentService.createCalculatedHourlyPayment(
      hourlyPaymentData.employee_id,
      hourlyPaymentData.site_id,
      startDate,
      endDate
    );
  }

  // GET SITE HOURLY CALCULATIONS - GET /payments/hourly/site/:siteId/calculate
  @Get('hourly/site/:siteId/calculate')
  async getSiteHourlyCalculations(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string
  ) {
    if (!startDate || !endDate) {
      throw new Error('start_date and end_date query parameters are required');
    }
    return this.paymentService.getSiteHourlyCalculations(
      siteId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  // DELETE - DELETE /payments/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.paymentService.delete(id);
  }
}