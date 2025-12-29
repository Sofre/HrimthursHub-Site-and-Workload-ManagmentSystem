import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePaymentDto, UpdatePaymentDto } from '../models/payment.model';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all payments with site and labor/material details
   */
  async findAll() {
    return this.prisma.payments.findMany({
      include: {
        sites: true,
        for_labor: true,
        for_material: true,
      },
    });
  }

  /**
   * Get payment by ID with full details
   */
  async findById(id: number) {
    const payment = await this.prisma.payments.findUnique({
      where: { payment_id: id },
      include: {
        sites: true,
        for_labor: true,
        for_material: true,
      },
    });
    
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    
    return payment;
  }

  /**
   * Create new payment
   */
  async create(createPaymentDto: CreatePaymentDto) {
    // Business validation
    if (createPaymentDto.amount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    const paymentData = {
      ...createPaymentDto,
      payment_date: createPaymentDto.payment_date || new Date(),
      status: createPaymentDto.status || 'pending'
    };

    return this.prisma.payments.create({
      data: paymentData,
      include: {
        sites: true,
        for_labor: true,
        for_material: true,
      },
    });
  }

  /**
   * Update payment information
   */
  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.findById(id);
    
    // Business rule: Can't modify completed payments
    if (payment.status === 'completed' && updatePaymentDto.amount) {
      throw new BadRequestException('Cannot modify amount of completed payment');
    }

    if (updatePaymentDto.amount !== undefined && updatePaymentDto.amount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    return this.prisma.payments.update({
      where: { payment_id: id },
      data: updatePaymentDto,
      include: {
        sites: true,
        for_labor: true,
        for_material: true,
      },
    });
  }

  /**
   * Delete payment
   */
  async delete(id: number) {
    const payment = await this.findById(id);
    
    // Business rule: Can't delete processed payments
    if (payment.status === 'completed') {
      throw new BadRequestException('Cannot delete completed payment');
    }

    return this.prisma.payments.delete({
      where: { payment_id: id },
    });
  }

  // Payment Management Business Logic

  /**
   * Get payments for specific site
   */
  async findBySite(siteId: number) {
    return this.prisma.payments.findMany({
      where: { site_id: siteId },
      include: {
        sites: true,
        for_labor: true,
        for_material: true,
      },
      orderBy: { payment_date: 'desc' },
    });
  }

  /**
   * Get payments by status
   */
  async findByStatus(status: string) {
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return this.prisma.payments.findMany({
      where: { status },
      include: {
        sites: true,
        for_labor: true,
        for_material: true,
      },
      orderBy: { payment_date: 'desc' },
    });
  }

  /**
   * Get payments in date range
   */
  async findByDateRange(startDate: Date, endDate: Date) {
    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    return this.prisma.payments.findMany({
      where: {
        payment_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        sites: true,
        for_labor: true,
        for_material: true,
      },
      orderBy: { payment_date: 'desc' },
    });
  }

  /**
   * Process payment (change status to completed)
   */
  async processPayment(paymentId: number, processingNotes?: string) {
    const payment = await this.findById(paymentId);
    
    if (payment.status === 'completed') {
      throw new BadRequestException('Payment is already completed');
    }

    if (payment.status === 'cancelled') {
      throw new BadRequestException('Cannot process cancelled payment');
    }

    return this.update(paymentId, { 
      status: 'completed'
      // Note: In real implementation, you might save processingNotes
    });
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: number, reason?: string) {
    const payment = await this.findById(paymentId);
    
    if (payment.status === 'completed') {
      throw new BadRequestException('Cannot cancel completed payment');
    }

    if (payment.status === 'cancelled') {
      throw new BadRequestException('Payment is already cancelled');
    }

    return this.update(paymentId, { status: 'cancelled' });
  }

  /**
   * Get total amount paid for a site
   */
  async getTotalSitePayments(siteId: number) {
    const result = await this.prisma.payments.aggregate({
      where: {
        site_id: siteId,
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });
    return result._sum.amount || 0;
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics() {
    const [total, pending, completed, failed] = await Promise.all([
      this.prisma.payments.count(),
      this.prisma.payments.findMany({ where: { status: 'pending' } }),
      this.prisma.payments.findMany({ where: { status: 'completed' } }),
      this.prisma.payments.findMany({ where: { status: 'failed' } })
    ]);

    return {
      total,
      pending: pending.length,
      completed: completed.length,
      failed: failed.length,
      processing: total - pending.length - completed.length - failed.length
    };
  }

  /**
   * Get monthly payment summary
   */
  async getMonthlyPaymentSummary(year: number, month: number) {
    // Create date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const payments = await this.findByDateRange(startDate, endDate);

    const summary = {
      month: `${year}-${month.toString().padStart(2, '0')}`,
      totalPayments: payments.length,
      totalAmount: 0,
      completedAmount: 0,
      pendingAmount: 0,
      byStatus: {
        pending: 0,
        completed: 0,
        processing: 0,
        failed: 0,
        cancelled: 0
      }
    };

    payments.forEach(payment => {
      const amount = Number(payment.amount);
      summary.totalAmount += amount;
      summary.byStatus[payment.status] = (summary.byStatus[payment.status] || 0) + 1;
      
      if (payment.status === 'completed') {
        summary.completedAmount += amount;
      } else if (payment.status === 'pending') {
        summary.pendingAmount += amount;
      }
    });

    return summary;
  }

  /**
   * Get pending payments (for dashboard)
   */
  async getPendingPayments() {
    return this.findByStatus('pending');
  }

  /**
   * Get recent payments (last 30 days)
   */
  async getRecentPayments(days: number = 30) {
    if (days > 365) days = 365; // Limit to one year
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.findByDateRange(startDate, endDate);
  }

  /**
   * Get paginated payments
   */
  async findWithPagination(page: number = 1, limit: number = 25) {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 25;

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payments.findMany({
        skip,
        take: limit,
        include: {
          sites: true,
          for_labor: true,
          for_material: true,
        },
        orderBy: { payment_date: 'desc' },
      }),
      this.prisma.payments.count(),
    ]);

    return {
      data: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create gas payment for employee
   */
  async createGasPayment(employeeId: number, siteId: number, amount: number, description?: string) {
    // Create the main payment
    const payment = await this.prisma.payments.create({
      data: {
        amount,
        status: 'completed',
        site_id: siteId,
        payment_date: new Date()
      }
    });

    // Create the for_labor entry for gas
    await this.prisma.for_labor.create({
      data: {
        payment_id: payment.payment_id,
        employee_id: employeeId,
        site_id: siteId,
        for_labor_amount: amount,
        payment_date: new Date(),
        payment_type: 'gas',
        status: 'completed'
      }
    });

    return this.findById(payment.payment_id);
  }

  /**
   * Get all gas payments
   */
  async getGasPayments() {
    return this.prisma.for_labor.findMany({
      where: { payment_type: 'gas' },
      include: {
        employees: true,
        sites: true,
        payments: true
      },
      orderBy: { payment_date: 'desc' }
    });
  }

  /**
   * Get gas payments for specific employee
   */
  async getEmployeeGasPayments(employeeId: number) {
    return this.prisma.for_labor.findMany({
      where: {
        employee_id: employeeId,
        payment_type: 'gas'
      },
      include: {
        sites: true,
        payments: true
      },
      orderBy: { payment_date: 'desc' }
    });
  }

  /**
   * Get gas payments for specific site
   */
  async getSiteGasPayments(siteId: number) {
    return this.prisma.for_labor.findMany({
      where: {
        site_id: siteId,
        payment_type: 'gas'
      },
      include: {
        employees: true,
        payments: true
      },
      orderBy: { payment_date: 'desc' }
    });
  }

  /**
   * Get total gas payments for employee
   */
  async getEmployeeTotalGasPayments(employeeId: number) {
    const result = await this.prisma.for_labor.aggregate({
      where: {
        employee_id: employeeId,
        payment_type: 'gas',
        status: 'completed'
      },
      _sum: {
        for_labor_amount: true
      }
    });
    return result._sum.for_labor_amount || 0;
  }

  /**
   * Create overtime payment for employee
   */
  async createOvertimePayment(employeeId: number, siteId: number, amount: number, description?: string) {
    // Create the main payment
    const payment = await this.prisma.payments.create({
      data: {
        amount,
        status: 'completed',
        site_id: siteId,
        payment_date: new Date()
      }
    });

    // Create the for_labor entry for overtime
    await this.prisma.for_labor.create({
      data: {
        payment_id: payment.payment_id,
        employee_id: employeeId,
        site_id: siteId,
        for_labor_amount: amount,
        payment_date: new Date(),
        payment_type: 'overtime',
        status: 'completed'
      }
    });

    return this.findById(payment.payment_id);
  }

  /**
   * Get all overtime payments
   */
  async getOvertimePayments() {
    return this.prisma.for_labor.findMany({
      where: { payment_type: 'overtime' },
      include: {
        employees: true,
        sites: true,
        payments: true
      },
      orderBy: { payment_date: 'desc' }
    });
  }

  /**
   * Get overtime payments for specific employee
   */
  async getEmployeeOvertimePayments(employeeId: number) {
    return this.prisma.for_labor.findMany({
      where: {
        employee_id: employeeId,
        payment_type: 'overtime'
      },
      include: {
        sites: true,
        payments: true
      },
      orderBy: { payment_date: 'desc' }
    });
  }

  /**
   * Get overtime payments for specific site
   */
  async getSiteOvertimePayments(siteId: number) {
    return this.prisma.for_labor.findMany({
      where: {
        site_id: siteId,
        payment_type: 'overtime'
      },
      include: {
        employees: true,
        payments: true
      },
      orderBy: { payment_date: 'desc' }
    });
  }

  /**
   * Get total overtime payments for employee
   */
  async getEmployeeTotalOvertimePayments(employeeId: number) {
    const result = await this.prisma.for_labor.aggregate({
      where: {
        employee_id: employeeId,
        payment_type: 'overtime',
        status: 'completed'
      },
      _sum: {
        for_labor_amount: true
      }
    });
    return result._sum.for_labor_amount || 0;
  }

  /**
   * Create bonus payment for employee
   */
  async createBonusPayment(employeeId: number, siteId: number, amount: number, description?: string) {
    // Create the main payment
    const payment = await this.prisma.payments.create({
      data: {
        amount,
        status: 'completed',
        site_id: siteId,
        payment_date: new Date()
      }
    });

    // Create the for_labor entry for bonus
    await this.prisma.for_labor.create({
      data: {
        payment_id: payment.payment_id,
        employee_id: employeeId,
        site_id: siteId,
        for_labor_amount: amount,
        payment_date: new Date(),
        payment_type: 'bonus',
        status: 'completed'
      }
    });

    return this.findById(payment.payment_id);
  }

  /**
   * Get all bonus payments
   */
  async getBonusPayments() {
    return this.prisma.for_labor.findMany({
      where: { payment_type: 'bonus' },
      include: {
        employees: true,
        sites: true,
        payments: true
      },
      orderBy: { payment_date: 'desc' }
    });
  }

  /**
   * Get bonus payments for specific employee
   */
  async getEmployeeBonusPayments(employeeId: number) {
    return this.prisma.for_labor.findMany({
      where: {
        employee_id: employeeId,
        payment_type: 'bonus'
      },
      include: {
        sites: true,
        payments: true
      },
      orderBy: { payment_date: 'desc' }
    });
  }

  /**
   * Get bonus payments for specific site
   */
  async getSiteBonusPayments(siteId: number) {
    return this.prisma.for_labor.findMany({
      where: {
        site_id: siteId,
        payment_type: 'bonus'
      },
      include: {
        employees: true,
        payments: true
      },
      orderBy: { payment_date: 'desc' }
    });
  }

  /**
   * Get total bonus payments for employee
   */
  async getEmployeeTotalBonusPayments(employeeId: number) {
    const result = await this.prisma.for_labor.aggregate({
      where: {
        employee_id: employeeId,
        payment_type: 'bonus',
        status: 'completed'
      },
      _sum: {
        for_labor_amount: true
      }
    });
    return result._sum.for_labor_amount || 0;
  }

  /**
   * Get payments by payment type
   */
  async getPaymentsByType(paymentType: string) {
    return this.prisma.for_labor.findMany({
      where: { payment_type: paymentType },
      include: {
        employees: true,
        sites: true,
        payments: true
      },
      orderBy: { payment_date: 'desc' }
    });
  }

  /**
   * Calculate hourly payment based on attendance and wage rate
   */
  async calculateHourlyPayment(employeeId: number, siteId: number, startDate: Date, endDate: Date) {
    // Get employee's role and wage rate
    const employee = await this.prisma.employees.findUnique({
      where: { employee_id: employeeId },
      include: {
        roles: {
          include: {
            wage_rates: true
          }
        }
      }
    });

    if (!employee?.roles.wage_rates) {
      throw new Error('No wage rate found for employee role');
    }

    const hourlyRate = Number(employee.roles.wage_rates.hourly_rate);

    // Get attendance logs for the period
    const attendanceLogs = await this.prisma.attendance_logs.findMany({
      where: {
        employee_id: employeeId,
        site_id: siteId,
        check_in_time: {
          gte: startDate,
          lte: endDate
        },
        check_out_time: {
          not: null
        },
        status: 'completed'
      }
    });

    // Calculate total hours worked
    let totalHours = 0;
    const workDetails: Array<{
      date: Date;
      hours: number;
      check_in: Date;
      check_out: Date;
    }> = [];

    for (const log of attendanceLogs) {
      if (log.check_out_time) {
        const hoursWorked = (new Date(log.check_out_time).getTime() - new Date(log.check_in_time).getTime()) / (1000 * 60 * 60);
        totalHours += hoursWorked;
        workDetails.push({
          date: log.check_in_time,
          hours: hoursWorked,
          check_in: log.check_in_time,
          check_out: log.check_out_time
        });
      }
    }

    const totalAmount = totalHours * hourlyRate;

    return {
      employeeId,
      siteId,
      hourlyRate,
      totalHours: Number(totalHours.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      period: { startDate, endDate },
      workDetails
    };
  }

  /**
   * Create hourly payment based on calculated hours and wage rate
   */
  async createCalculatedHourlyPayment(employeeId: number, siteId: number, startDate: Date, endDate: Date) {
    // Calculate the payment first
    const calculation = await this.calculateHourlyPayment(employeeId, siteId, startDate, endDate);

    if (calculation.totalHours === 0) {
      throw new Error('No working hours found for the specified period');
    }

    // Create the main payment
    const payment = await this.prisma.payments.create({
      data: {
        amount: calculation.totalAmount,
        status: 'completed',
        site_id: siteId,
        payment_date: new Date()
      }
    });

    // Create the for_labor entry for hourly payment
    const forLabor = await this.prisma.for_labor.create({
      data: {
        payment_id: payment.payment_id,
        employee_id: employeeId,
        site_id: siteId,
        for_labor_amount: calculation.totalAmount,
        payment_date: new Date(),
        payment_type: 'hourly',
        status: 'completed'
      }
    });

    return {
      payment: await this.findById(payment.payment_id),
      calculation,
      forLabor
    };
  }

  /**
   * Get hourly payment calculations for employee without creating payment
   */
  async getEmployeeHourlyCalculation(employeeId: number, siteId: number, startDate: Date, endDate: Date) {
    return this.calculateHourlyPayment(employeeId, siteId, startDate, endDate);
  }

  /**
   * Get all employees' hourly calculations for a site and period
   */
  async getSiteHourlyCalculations(siteId: number, startDate: Date, endDate: Date) {
    // Get all employees who worked at this site during the period
    const attendanceLogs = await this.prisma.attendance_logs.findMany({
      where: {
        site_id: siteId,
        check_in_time: {
          gte: startDate,
          lte: endDate
        }
      },
      distinct: ['employee_id'],
      select: {
        employee_id: true
      }
    });

    const calculations: Array<{
      employeeId: number;
      siteId: number;
      hourlyRate: number;
      totalHours: number;
      totalAmount: number;
      period: { startDate: Date; endDate: Date };
      workDetails: Array<{
        date: Date;
        hours: number;
        check_in: Date;
        check_out: Date;
      }>;
    }> = [];
    for (const log of attendanceLogs) {
      try {
        const calc = await this.calculateHourlyPayment(log.employee_id, siteId, startDate, endDate);
        calculations.push(calc);
      } catch (error) {
        console.warn(`Could not calculate hours for employee ${log.employee_id}:`, error);
      }
    }

    return calculations;
  }
}