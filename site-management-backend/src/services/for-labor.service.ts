import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateForLaborDto, UpdateForLaborDto, LaborPaymentType, LaborStatus, ForLabor } from '../models/for-labor.model';
import { PrismaService } from '../prisma/prisma.service';
import { CostCalculationService } from './cost-calculation.service';

interface FindForLaborParams {
  page?: number;
  limit?: number;
  employee_id?: number;
  site_id?: number;
  payment_id?: number;
  start_date?: Date;
  end_date?: Date;
  status?: string;
  payment_type?: string;
}

@Injectable()
export class ForLaborService {
  private readonly logger = new Logger(ForLaborService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly costCalculationService: CostCalculationService
  ) {}

  /**
   * Get all labor records with filters and pagination
   */
  async findAll(params: FindForLaborParams) {
    try {
      // Build where clause
      const where: any = {};
      if (params.employee_id) where.employee_id = params.employee_id;
      if (params.site_id) where.site_id = params.site_id;
      if (params.payment_id) where.payment_id = params.payment_id;
      if (params.status) where.status = params.status;
      if (params.payment_type) where.payment_type = params.payment_type;
      if (params.start_date || params.end_date) {
        where.payment_date = {};
        if (params.start_date) where.payment_date.gte = params.start_date;
        if (params.end_date) where.payment_date.lte = params.end_date;
      }

      if (params.page && params.limit) {
        // Paginated results
        const offset = (params.page - 1) * params.limit;
        const [laborRecords, total] = await Promise.all([
          this.prisma.for_labor.findMany({
            where,
            include: {
              employees: {
                select: { first_name: true, last_name: true },
              },
              payments: {
                select: { amount: true, payment_date: true, status: true },
              },
              sites: {
                select: { site_name: true, address: true },
              },
            },
            orderBy: { payment_date: 'desc' },
            skip: offset,
            take: params.limit,
          }),
          this.prisma.for_labor.count({ where }),
        ]);

        return {
          labor_records: laborRecords,
          pagination: {
            page: params.page,
            limit: params.limit,
            total,
            pages: Math.ceil(total / params.limit),
          },
        };
      } else {
        // All results without pagination
        const laborRecords = await this.prisma.for_labor.findMany({
          where,
          include: {
            employees: {
              select: { first_name: true, last_name: true },
            },
            payments: {
              select: { amount: true, payment_date: true, status: true },
            },
            sites: {
              select: { site_name: true, address: true },
            },
          },
          orderBy: { payment_date: 'desc' },
        });

        return {
          labor_records: laborRecords,
          total: laborRecords.length,
        };
      }
    } catch (error) {
      throw new BadRequestException(`Failed to fetch labor records: ${error.message}`);
    }
  }

  /**
   * Get labor record by ID
   */
  async findById(id: number) {
    try {
      const laborRecord = await this.prisma.for_labor.findUnique({
        where: { for_labor_id: id },
        include: {
          employees: {
            select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
          },
          payments: {
            select: { amount: true, payment_date: true, status: true },
          },
          sites: {
            select: { site_name: true, address: true },
          },
        },
      });

      if (!laborRecord) {
        throw new NotFoundException(`Labor record with ID ${id} not found`);
      }

      return laborRecord;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to fetch labor record: ${error.message}`);
    }
  }

  /**
   * Get employee labor summary
   */
  async getEmployeeLaborSummary(employeeId: number, startDate?: Date, endDate?: Date) {
    try {
      // Check if employee exists
      const employee = await this.prisma.employees.findUnique({
        where: { employee_id: employeeId },
        select: { first_name: true, last_name: true },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      const where: any = { employee_id: employeeId };
      if (startDate || endDate) {
        where.payment_date = {};
        if (startDate) where.payment_date.gte = startDate;
        if (endDate) where.payment_date.lte = endDate;
      }

      const [laborRecords, totalAmount, recordCount] = await Promise.all([
        this.prisma.for_labor.findMany({
          where,
          include: {
            sites: {
              select: { site_name: true },
            },
          },
          orderBy: { payment_date: 'desc' },
        }),
        this.prisma.for_labor.aggregate({
          where,
          _sum: { for_labor_amount: true },
        }),
        this.prisma.for_labor.count({ where }),
      ]);

      // Group by site
      const laborBySite = laborRecords.reduce((acc, record) => {
        const siteName = record.sites?.site_name || 'Unknown Site';
        if (!acc[siteName]) {
          acc[siteName] = { count: 0, total_amount: 0 };
        }
        acc[siteName].count += 1;
        acc[siteName].total_amount += Number(record.for_labor_amount);
        return acc;
      }, {});

      return {
        employee: employee,
        summary: {
          total_records: recordCount,
          total_amount: Number(totalAmount._sum.for_labor_amount) || 0,
          average_amount: recordCount > 0 ? Number(totalAmount._sum.for_labor_amount || 0) / recordCount : 0,
        },
        labor_by_site: laborBySite,
        recent_records: laborRecords.slice(0, 10),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to fetch employee labor summary: ${error.message}`);
    }
  }

  /**
   * Get site labor summary
   */
  async getSiteLaborSummary(siteId: number, startDate?: Date, endDate?: Date) {
    try {
      // Check if site exists
      const site = await this.prisma.sites.findUnique({
        where: { site_id: siteId },
        select: { site_name: true, address: true },
      });

      if (!site) {
        throw new NotFoundException('Site not found');
      }

      const where: any = { site_id: siteId };
      if (startDate || endDate) {
        where.payment_date = {};
        if (startDate) where.payment_date.gte = startDate;
        if (endDate) where.payment_date.lte = endDate;
      }

      const [laborRecords, totalAmount, recordCount, uniqueEmployees] = await Promise.all([
        this.prisma.for_labor.findMany({
          where,
          include: {
            employees: {
              select: { first_name: true, last_name: true },
            },
          },
          orderBy: { payment_date: 'desc' },
        }),
        this.prisma.for_labor.aggregate({
          where,
          _sum: { for_labor_amount: true },
        }),
        this.prisma.for_labor.count({ where }),
        this.prisma.for_labor.findMany({
          where,
          select: { employee_id: true },
          distinct: ['employee_id'],
        }),
      ]);

      // Group by employee
      const laborByEmployee = laborRecords.reduce((acc, record) => {
        const employeeName = `${record.employees?.first_name} ${record.employees?.last_name}`;
        if (!acc[employeeName]) {
          acc[employeeName] = { count: 0, total_amount: 0 };
        }
        acc[employeeName].count += 1;
        acc[employeeName].total_amount += Number(record.for_labor_amount);
        return acc;
      }, {});

      return {
        site: site,
        summary: {
          total_records: recordCount,
          total_amount: Number(totalAmount._sum.for_labor_amount) || 0,
          unique_employees: uniqueEmployees.length,
          average_amount: recordCount > 0 ? Number(totalAmount._sum.for_labor_amount || 0) / recordCount : 0,
        },
        labor_by_employee: laborByEmployee,
        recent_records: laborRecords.slice(0, 10),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to fetch site labor summary: ${error.message}`);
    }
  }

  /**
   * Create new labor record
   */
  async create(createForLaborDto: CreateForLaborDto) {
    try {
      // Validate input data
      const validationResult = this.costCalculationService.validateLaborCostInputs(createForLaborDto);
      if (!validationResult.isValid) {
        throw new BadRequestException(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Validate employee exists
      const employee = await this.prisma.employees.findUnique({
        where: { employee_id: createForLaborDto.employee_id },
        select: { employee_id: true, status: true },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      if (employee.status !== 'active') {
        throw new BadRequestException('Cannot create labor record for inactive employee');
      }

      // Validate site exists
      const site = await this.prisma.sites.findUnique({
        where: { site_id: createForLaborDto.site_id },
        select: { site_id: true },
      });

      if (!site) {
        throw new NotFoundException('Site not found');
      }

      // Validate payment exists
      const payment = await this.prisma.payments.findUnique({
        where: { payment_id: createForLaborDto.payment_id },
        select: { payment_id: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Calculate cost breakdown
      const costCalculation = this.costCalculationService.calculateLaborCost(createForLaborDto);

      // Prepare data with calculated amounts
      const laborData = {
        ...createForLaborDto,
        for_labor_amount: createForLaborDto.for_labor_amount || costCalculation.total_cost,
        base_amount: costCalculation.base_cost,
        overtime_amount: costCalculation.overtime_cost,
        bonus_amount: costCalculation.bonus_amount,
        status: createForLaborDto.status || LaborStatus.PENDING,
      };

      const laborRecord = await this.prisma.for_labor.create({
        data: laborData,
        include: {
          employees: {
            select: { first_name: true, last_name: true },
          },
          payments: {
            select: { amount: true, payment_date: true, status: true },
          },
          sites: {
            select: { site_name: true, address: true },
          },
        },
      });

      // Return with cost calculation details
      return {
        ...laborRecord,
        cost_calculation: costCalculation,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to create labor record: ${error.message}`);
    }
  }

  /**
   * Create labor record automatically from attendance data for a specific date
   */
  async createFromAttendance(
    employeeId: number,
    workDate: Date,
    siteId: number,
    paymentId: number,
    useProgressiveOvertime: boolean = true
  ) {
    try {
      // Calculate cost from attendance data
      const costCalculation = await this.costCalculationService.calculateLaborCostFromAttendance(
        employeeId,
        workDate,
        siteId,
        useProgressiveOvertime
      );

      if (costCalculation.total_cost === 0) {
        throw new BadRequestException('No attendance data found for the specified date');
      }

      // Validate employee exists
      const employee = await this.prisma.employees.findUnique({
        where: { employee_id: employeeId },
        select: { employee_id: true, status: true },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      if (employee.status !== 'active') {
        throw new BadRequestException('Cannot create labor record for inactive employee');
      }

      // Validate site exists
      const site = await this.prisma.sites.findUnique({
        where: { site_id: siteId },
        select: { site_id: true },
      });

      if (!site) {
        throw new NotFoundException('Site not found');
      }

      // Validate payment exists
      const payment = await this.prisma.payments.findUnique({
        where: { payment_id: paymentId },
        select: { payment_id: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Create labor record with calculated data
      const laborData = {
        employee_id: employeeId,
        site_id: siteId,
        payment_id: paymentId,
        for_labor_amount: costCalculation.total_cost,
        payment_date: workDate,
        payment_type: LaborPaymentType.HOURLY,
        status: LaborStatus.PENDING,
        // Additional calculated fields (if they exist in the schema)
        base_amount: costCalculation.base_cost,
        overtime_amount: costCalculation.overtime_cost,
        hours_worked: costCalculation.attendance_hours.total_hours,
        overtime_hours: costCalculation.attendance_hours.overtime_hours,
        hourly_rate: costCalculation.wage_info?.hourly_rate,
      };

      const laborRecord = await this.prisma.for_labor.create({
        data: {
          employee_id: laborData.employee_id,
          site_id: laborData.site_id,
          payment_id: laborData.payment_id,
          for_labor_amount: laborData.for_labor_amount,
          payment_date: laborData.payment_date,
          payment_type: laborData.payment_type,
          status: laborData.status,
        },
        include: {
          employees: {
            select: { first_name: true, last_name: true },
          },
          payments: {
            select: { amount: true, payment_date: true, status: true },
          },
          sites: {
            select: { site_name: true, address: true },
          },
        },
      });

      // Return with detailed cost calculation
      return {
        ...laborRecord,
        cost_calculation: costCalculation,
        attendance_breakdown: {
          total_hours: costCalculation.attendance_hours.total_hours,
          regular_hours: costCalculation.attendance_hours.regular_hours,
          overtime_hours: costCalculation.attendance_hours.overtime_hours,
          double_time_hours: costCalculation.attendance_hours.double_time_hours,
        },
        wage_info: costCalculation.wage_info,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to create labor record from attendance: ${error.message}`);
    }
  }
  async generateLaborRecordsFromAttendance(
    employeeId: number,
    startDate: Date,
    endDate: Date,
    siteId: number,
    paymentId: number,
    useProgressiveOvertime: boolean = true
  ): Promise<{
    created_records: any[];
    period_summary: any;
    skipped_dates: Date[];
  }> {
    try {
      const createdRecords: any[] = [];
      const skippedDates: Date[] = [];

      // Calculate cost for the entire period first to get summary
      const periodCost = await this.costCalculationService.calculateLaborCostForPeriod(
        employeeId,
        startDate,
        endDate,
        siteId
      );

      // Create individual labor records for each day with attendance
      for (const dailyData of periodCost.daily_breakdown) {
        try {
          // Check if record already exists for this date
          const existingRecord = await this.prisma.for_labor.findFirst({
            where: {
              employee_id: employeeId,
              site_id: siteId,
              payment_date: dailyData.date,
            },
          });

          if (existingRecord) {
            skippedDates.push(dailyData.date);
            continue;
          }

          // Create labor record for this day
          const laborRecord = await this.prisma.for_labor.create({
            data: {
              employee_id: employeeId,
              site_id: siteId,
              payment_id: paymentId,
              for_labor_amount: dailyData.cost_calculation.total_cost,
              payment_date: dailyData.date,
              payment_type: LaborPaymentType.HOURLY,
              status: LaborStatus.PENDING,
            },
            include: {
              employees: {
                select: { first_name: true, last_name: true },
              },
              sites: {
                select: { site_name: true, address: true },
              },
            },
          });

          createdRecords.push({
            ...laborRecord,
            daily_cost_breakdown: dailyData.cost_calculation,
          });
        } catch (dayError) {
          this.logger.warn(`Failed to create labor record for ${dailyData.date}:`, dayError);
          skippedDates.push(dailyData.date);
        }
      }

      return {
        created_records: createdRecords,
        period_summary: {
          total_days_processed: periodCost.daily_breakdown.length,
          total_records_created: createdRecords.length,
          total_cost: periodCost.total_cost_calculation.total_cost,
          total_tax: periodCost.total_cost_calculation.tax_amount,
          total_net: periodCost.total_cost_calculation.net_amount,
          wage_rate: periodCost.wage_info?.hourly_rate,
        },
        skipped_dates: skippedDates,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to generate labor records from attendance: ${error.message}`);
    }
  }

  /**
   * Get attendance-based cost preview for an employee and date range
   */
  async getAttendanceCostPreview(
    employeeId: number,
    startDate: Date,
    endDate: Date,
    siteId?: number
  ) {
    try {
      const periodCost = await this.costCalculationService.calculateLaborCostForPeriod(
        employeeId,
        startDate,
        endDate,
        siteId
      );

      return {
        period: { start: startDate, end: endDate },
        employee_id: employeeId,
        site_id: siteId,
        cost_summary: periodCost.total_cost_calculation,
        daily_breakdown: periodCost.daily_breakdown.map(day => ({
          date: day.date,
          hours: {
            total: day.cost_calculation.attendance_hours.total_hours,
            regular: day.cost_calculation.attendance_hours.regular_hours,
            overtime: day.cost_calculation.attendance_hours.overtime_hours,
            double_time: day.cost_calculation.attendance_hours.double_time_hours,
          },
          costs: {
            base_cost: day.cost_calculation.base_cost,
            overtime_cost: day.cost_calculation.overtime_cost,
            total_cost: day.cost_calculation.total_cost,
            tax_amount: day.cost_calculation.tax_amount,
            net_amount: day.cost_calculation.net_amount,
          },
        })),
        wage_info: periodCost.wage_info,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get attendance cost preview: ${error.message}`);
    }
  }

  /**
   * Update labor record
   */
  async update(id: number, updateForLaborDto: UpdateForLaborDto) {
    try {
      // Check if record exists
      const existingRecord = await this.prisma.for_labor.findUnique({
        where: { for_labor_id: id },
      });

      if (!existingRecord) {
        throw new NotFoundException(`Labor record with ID ${id} not found`);
      }

      // Validate employee if provided
      if (updateForLaborDto.employee_id) {
        const employee = await this.prisma.employees.findUnique({
          where: { employee_id: updateForLaborDto.employee_id },
          select: { employee_id: true, status: true },
        });

        if (!employee || employee.status !== 'active') {
          throw new BadRequestException('Invalid or inactive employee');
        }
      }

      // Validate site if provided
      if (updateForLaborDto.site_id) {
        const site = await this.prisma.sites.findUnique({
          where: { site_id: updateForLaborDto.site_id },
        });

        if (!site) {
          throw new NotFoundException('Site not found');
        }
      }

      const updatedRecord = await this.prisma.for_labor.update({
        where: { for_labor_id: id },
        data: updateForLaborDto,
        include: {
          employees: {
            select: { first_name: true, last_name: true },
          },
          payments: {
            select: { amount: true, payment_date: true, status: true },
          },
          sites: {
            select: { site_name: true, address: true },
          },
        },
      });

      return updatedRecord;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to update labor record: ${error.message}`);
    }
  }

  /**
   * Delete labor record
   */
  async delete(id: number) {
    try {
      const record = await this.prisma.for_labor.findUnique({
        where: { for_labor_id: id },
      });

      if (!record) {
        throw new NotFoundException(`Labor record with ID ${id} not found`);
      }

      await this.prisma.for_labor.delete({
        where: { for_labor_id: id },
      });

      return { message: 'Labor record deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to delete labor record: ${error.message}`);
    }
  }

  /**
   * Get labor statistics
   */
  async getLaborStatistics(startDate?: Date, endDate?: Date) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      const where: any = {
        payment_date: { gte: start, lte: end },
      };

      const [totalRecords, totalAmount, avgAmount, topEmployees, topSites] = await Promise.all([
        this.prisma.for_labor.count({ where }),
        this.prisma.for_labor.aggregate({
          where,
          _sum: { for_labor_amount: true },
        }),
        this.prisma.for_labor.aggregate({
          where,
          _avg: { for_labor_amount: true },
        }),
        this.prisma.$queryRaw`
          SELECT CONCAT(e.first_name, ' ', e.last_name) as name, e.employee_id, 
                 COUNT(fl.for_labor_id) as labor_count,
                 SUM(fl.for_labor_amount) as total_amount
          FROM for_labor fl
          JOIN employees e ON fl.employee_id = e.employee_id
          WHERE fl.payment_date >= ${start} AND fl.payment_date <= ${end}
          GROUP BY e.employee_id, e.first_name, e.last_name
          ORDER BY total_amount DESC
          LIMIT 10
        `,
        this.prisma.$queryRaw`
          SELECT s.site_name, s.site_id,
                 COUNT(fl.for_labor_id) as labor_count,
                 SUM(fl.for_labor_amount) as total_amount
          FROM for_labor fl
          JOIN sites s ON fl.site_id = s.site_id
          WHERE fl.payment_date >= ${start} AND fl.payment_date <= ${end}
          GROUP BY s.site_id, s.site_name
          ORDER BY total_amount DESC
        `,
      ]);

      return {
        period: { start, end },
        overview: {
          total_records: totalRecords,
          total_amount: totalAmount._sum.for_labor_amount || 0,
          average_amount: avgAmount._avg.for_labor_amount || 0,
        },
        top_employees: topEmployees,
        top_sites: topSites,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch labor statistics: ${error.message}`);
    }
  }

  /**
   * Get payment type analytics
   */
  async getPaymentTypeAnalytics(startDate?: Date, endDate?: Date): Promise<{
    payment_type_breakdown: Array<{
      payment_type: LaborPaymentType;
      count: number;
      total_amount: number;
      average_amount: number;
      percentage_of_total: number;
    }>;
    cost_summary: {
      total_gross: number;
      total_tax: number;
      total_net: number;
    };
  }> {
    try {
      const where: any = {};
      if (startDate && endDate) {
        where.payment_date = { gte: startDate, lte: endDate };
      }

      // Get all labor records for the period
      const laborRecords = await this.prisma.for_labor.findMany({
        where,
        select: {
          payment_type: true,
          for_labor_amount: true,
        },
      });

      // Calculate YTD costs with tax breakdown
      const ytdCosts = this.costCalculationService.calculateYTDLaborCosts(laborRecords);

      // Group by payment type
      const paymentTypeGroups = laborRecords.reduce((acc, record) => {
        const type = record.payment_type as LaborPaymentType;
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            total_amount: 0,
            records: [],
          };
        }
        acc[type].count += 1;
        acc[type].total_amount += Number(record.for_labor_amount) || 0;
        acc[type].records.push(record);
        return acc;
      }, {} as Record<string, any>);

      // Calculate breakdown
      const totalAmount = laborRecords.reduce((sum, record) => sum + (Number(record.for_labor_amount) || 0), 0);
      
      const payment_type_breakdown = Object.entries(paymentTypeGroups).map(([type, data]) => ({
        payment_type: type as LaborPaymentType,
        count: data.count,
        total_amount: data.total_amount,
        average_amount: data.total_amount / data.count,
        percentage_of_total: totalAmount > 0 ? (data.total_amount / totalAmount) * 100 : 0,
      }));

      return {
        payment_type_breakdown,
        cost_summary: {
          total_gross: ytdCosts.grandTotal,
          total_tax: ytdCosts.totalTax,
          total_net: ytdCosts.netTotal,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch payment type analytics: ${error.message}`);
    }
  }

  /**
   * Get employee YTD summary with payment type breakdown
   */
  async getEmployeeYTDSummary(employeeId: number, year?: number): Promise<{
    employee_info: any;
    ytd_summary: any;
    payment_type_breakdown: any;
  }> {
    try {
      const currentYear = year || new Date().getFullYear();
      const startDate = new Date(`${currentYear}-01-01`);
      const endDate = new Date(`${currentYear}-12-31`);

      const [employee, laborRecords] = await Promise.all([
        this.prisma.employees.findUnique({
          where: { employee_id: employeeId },
          select: {
            employee_id: true,
            first_name: true,
            last_name: true,
          },
        }),
        this.prisma.for_labor.findMany({
          where: {
            employee_id: employeeId,
            payment_date: { gte: startDate, lte: endDate },
          },
          select: {
            payment_type: true,
            for_labor_amount: true,
            payment_date: true,
          },
        }),
      ]);

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      const ytdSummary = this.costCalculationService.calculateYTDLaborCosts(laborRecords);

      return {
        employee_info: employee,
        ytd_summary: ytdSummary,
        payment_type_breakdown: laborRecords.reduce((acc, record) => {
          const type = record.payment_type;
          if (!acc[type]) {
            acc[type] = { count: 0, total: 0 };
          }
          acc[type].count += 1;
          acc[type].total += Number(record.for_labor_amount) || 0;
          return acc;
        }, {} as Record<string, any>),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to fetch employee YTD summary: ${error.message}`);
    }
  }
}