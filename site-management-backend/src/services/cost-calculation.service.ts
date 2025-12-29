import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LaborPaymentType, LaborRates, CostCalculation, CreateForLaborDto, AttendanceHours, WageRateInfo, ProgressiveOvertimeConfig } from '../models/for-labor.model';

export interface SiteCostCalculation {
  site_id: number;
  site_name: string;
  total_labor_cost: number;
  total_material_cost: number;
  total_cost: number;
  budget: number;
  remaining_budget: number;
  budget_percentage_used: number;
  calculation_date: Date;
}

export interface CostBreakdown {
  labor_costs: {
    total: number;
    by_role: Array<{ role: string; cost: number; hours: number }>;
    by_employee: Array<{ employee_name: string; cost: number; hours: number }>;
  };
  material_costs: {
    total: number;
    by_material: Array<{ material_name: string; cost: number; quantity: number }>;
  };
  overhead_costs?: {
    total: number;
    breakdown: Array<{ type: string; cost: number }>;
  };
}

@Injectable()
export class CostCalculationService {
  private readonly logger = new Logger(CostCalculationService.name);
  private wageRateCache = new Map<number, { wageInfo: WageRateInfo; expiry: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async calculateSiteCosts(siteId: number): Promise<SiteCostCalculation> {
    try {
      // Get site information
      const site = await this.prisma.sites.findUnique({
        where: { site_id: siteId },
      });

      if (!site) {
        throw new Error(`Site with ID ${siteId} not found`);
      }

      // Calculate labor costs
      const laborCosts = await this.calculateLaborCosts(siteId);

      // Calculate material costs
      const materialCosts = await this.calculateMaterialCosts(siteId);

      // Calculate totals
      const totalCost = laborCosts + materialCosts;
      const budget = Number(site.money_spent) || 0; // Assuming budget is stored in money_spent
      const remainingBudget = budget - totalCost;
      const budgetPercentageUsed = budget > 0 ? (totalCost / budget) * 100 : 0;

      const calculation: SiteCostCalculation = {
        site_id: siteId,
        site_name: site.site_name,
        total_labor_cost: laborCosts,
        total_material_cost: materialCosts,
        total_cost: totalCost,
        budget: budget,
        remaining_budget: remainingBudget,
        budget_percentage_used: budgetPercentageUsed,
        calculation_date: new Date(),
      };

      this.logger.log(`Site cost calculated for site ${siteId}: $${totalCost}`);
      return calculation;

    } catch (error) {
      this.logger.error(`Error calculating site costs for site ${siteId}:`, error);
      throw error;
    }
  }

  async getSiteCostBreakdown(siteId: number): Promise<CostBreakdown> {
    // Labor cost breakdown
    const laborBreakdown = await this.prisma.for_labor.findMany({
      where: { site_id: siteId },
      include: {
        employees: {
          include: { roles: true },
        },
      },
    });

    const laborByRole = new Map<string, { cost: number; hours: number }>();
    const laborByEmployee = new Map<string, { cost: number; hours: number }>();

    for (const labor of laborBreakdown) {
      const roleName = labor.employees.roles.role_name;
      const employeeName = `${labor.employees.first_name} ${labor.employees.last_name}`;
      const cost = Number(labor.for_labor_amount);

      // Calculate hours (simplified - you might want to get actual hours from attendance)
      const hourlyRate = 25; // You'd get this from wage_rates table
      const hours = cost / hourlyRate;

      // By role
      if (laborByRole.has(roleName)) {
        const existing = laborByRole.get(roleName)!;
        laborByRole.set(roleName, {
          cost: existing.cost + cost,
          hours: existing.hours + hours,
        });
      } else {
        laborByRole.set(roleName, { cost, hours });
      }

      // By employee
      if (laborByEmployee.has(employeeName)) {
        const existing = laborByEmployee.get(employeeName)!;
        laborByEmployee.set(employeeName, {
          cost: existing.cost + cost,
          hours: existing.hours + hours,
        });
      } else {
        laborByEmployee.set(employeeName, { cost, hours });
      }
    }

    // Material cost breakdown
    const materialBreakdown = await this.prisma.for_material.findMany({
      where: { site_id: siteId },
      include: {
        materials: true,
      },
    });

    const materialCosts = materialBreakdown.map(material => ({
      material_name: material.materials.name,
      cost: Number(material.for_material_amount),
      quantity: 1, // Default quantity since field doesn't exist in schema
    }));

    return {
      labor_costs: {
        total: Array.from(laborByRole.values()).reduce((sum, item) => sum + item.cost, 0),
        by_role: Array.from(laborByRole.entries()).map(([role, data]) => ({
          role,
          cost: data.cost,
          hours: data.hours,
        })),
        by_employee: Array.from(laborByEmployee.entries()).map(([employee_name, data]) => ({
          employee_name,
          cost: data.cost,
          hours: data.hours,
        })),
      },
      material_costs: {
        total: materialCosts.reduce((sum, item) => sum + item.cost, 0),
        by_material: materialCosts,
      },
    };
  }

  async getSiteCostHistory(
    siteId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate || new Date();

    const laborHistory = await this.prisma.for_labor.findMany({
      where: {
        site_id: siteId,
        payment_date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { payment_date: 'asc' },
    });

    const materialHistory = await this.prisma.for_material.findMany({
      where: {
        site_id: siteId,
        payment_date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { payment_date: 'asc' },
    });

    // Combine and group by date
    const costHistory = new Map<string, { date: string; labor_cost: number; material_cost: number }>();

    laborHistory.forEach(labor => {
      const date = labor.payment_date.toISOString().split('T')[0];
      if (costHistory.has(date)) {
        costHistory.get(date)!.labor_cost += Number(labor.for_labor_amount);
      } else {
        costHistory.set(date, {
          date,
          labor_cost: Number(labor.for_labor_amount),
          material_cost: 0,
        });
      }
    });

    materialHistory.forEach(material => {
      const date = material.payment_date.toISOString().split('T')[0];
      if (costHistory.has(date)) {
        costHistory.get(date)!.material_cost += Number(material.for_material_amount);
      } else {
        costHistory.set(date, {
          date,
          labor_cost: 0,
          material_cost: Number(material.for_material_amount),
        });
      }
    });

    return Array.from(costHistory.values()).map(item => ({
      ...item,
      total_cost: item.labor_cost + item.material_cost,
    }));
  }

  async getAllSitesCostSummary(): Promise<SiteCostCalculation[]> {
    const activeSites = await this.prisma.sites.findMany({
      where: { status: { in: ['active', 'planning'] } },
    });

    const calculations = await Promise.all(
      activeSites.map(site => this.calculateSiteCosts(site.site_id))
    );

    return calculations;
  }

  async getBudgetAlerts(): Promise<any[]> {
    const allSites = await this.getAllSitesCostSummary();
    
    return allSites
      .filter(site => site.budget_percentage_used > 85) // Alert at 85%+
      .sort((a, b) => b.budget_percentage_used - a.budget_percentage_used);
  }

  async recalculateSiteCosts(siteId: number): Promise<SiteCostCalculation> {
    // Force recalculation (no cache to clear)
    return this.calculateSiteCosts(siteId);
  }

  async getCostProjections(siteId: number): Promise<any> {
    const currentCosts = await this.calculateSiteCosts(siteId);
    const site = await this.prisma.sites.findUnique({
      where: { site_id: siteId },
    });

    if (!site || !site.deadline) {
      throw new Error('Site or deadline not found');
    }

    const today = new Date();
    const deadline = new Date(site.deadline);
    const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalProjectDays = Math.ceil((deadline.getTime() - site.start_date.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = totalProjectDays - daysRemaining;

    if (daysElapsed <= 0) {
      return { message: 'Project has not started yet' };
    }

    const averageDailyCost = currentCosts.total_cost / daysElapsed;
    const projectedTotalCost = averageDailyCost * totalProjectDays;
    const projectedRemainingCost = averageDailyCost * daysRemaining;

    return {
      current_costs: currentCosts.total_cost,
      projected_total_cost: projectedTotalCost,
      projected_remaining_cost: projectedRemainingCost,
      average_daily_cost: averageDailyCost,
      days_remaining: daysRemaining,
      budget_projection_percentage: (projectedTotalCost / currentCosts.budget) * 100,
      is_over_budget: projectedTotalCost > currentCosts.budget,
    };
  }

  async getEmployeeCosts(
    employeeId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const laborCosts = await this.prisma.for_labor.findMany({
      where: {
        employee_id: employeeId,
        payment_date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        sites: true,
      },
    });

    const totalCost = laborCosts.reduce((sum, labor) => sum + Number(labor.for_labor_amount), 0);
    const costsBySite = laborCosts.reduce((acc, labor) => {
      const siteName = labor.sites.site_name;
      acc[siteName] = (acc[siteName] || 0) + Number(labor.for_labor_amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      employee_id: employeeId,
      total_cost: totalCost,
      costs_by_site: costsBySite,
      period: { start, end },
      payment_count: laborCosts.length,
    };
  }

  async getMaterialCosts(siteId: number): Promise<any> {
    const materialCosts = await this.prisma.for_material.findMany({
      where: { site_id: siteId },
      include: {
        materials: true,
      },
    });

    const totalCost = materialCosts.reduce((sum, material) => sum + Number(material.for_material_amount), 0);
    const costsByMaterial = materialCosts.map(material => ({
      material_name: material.materials.name,
      quantity_purchased: 1, // Default since field doesn't exist
      cost: Number(material.for_material_amount),
      unit_cost: Number(material.for_material_amount),
      date_bought: material.payment_date,
    }));

    return {
      site_id: siteId,
      total_material_cost: totalCost,
      materials: costsByMaterial,
    };
  }

  async updateSiteBudget(siteId: number, newBudget: number, reason?: string): Promise<any> {
    // Update site budget (assuming we store it in money_spent for now)
    const updatedSite = await this.prisma.sites.update({
      where: { site_id: siteId },
      data: { money_spent: newBudget },
    });

    // Recalculate costs with new budget
    const newCalculation = await this.calculateSiteCosts(siteId);

    // Log budget change
    this.logger.log(`Budget updated for site ${siteId}: $${newBudget}. Reason: ${reason || 'N/A'}`);

    return {
      message: 'Budget updated successfully',
      old_budget: Number(updatedSite.money_spent),
      new_budget: newBudget,
      cost_calculation: newCalculation,
    };
  }

  private async calculateLaborCosts(siteId: number): Promise<number> {
    const laborCosts = await this.prisma.for_labor.aggregate({
      where: { site_id: siteId },
      _sum: { for_labor_amount: true },
    });

    return Number(laborCosts._sum.for_labor_amount) || 0;
  }

  private async calculateMaterialCosts(siteId: number): Promise<number> {
    const materialCosts = await this.prisma.for_material.aggregate({
      where: { site_id: siteId },
      _sum: { for_material_amount: true },
    });

    return Number(materialCosts._sum.for_material_amount) || 0;
  }

  /**
   * Calculate total labor cost based on payment type
   */
  calculateLaborCost(laborData: CreateForLaborDto, rates?: LaborRates): CostCalculation {
    switch (laborData.payment_type) {
      case LaborPaymentType.HOURLY:
        return this.calculateHourlyCost(laborData, rates);
      case LaborPaymentType.MONTHLY:
        return this.calculateMonthlyCost(laborData);
      case LaborPaymentType.BONUS:
        return this.calculateBonusCost(laborData);
      case LaborPaymentType.OVERTIME:
        return this.calculateOvertimeCost(laborData, rates);
      case LaborPaymentType.COMMISSION:
        return this.calculateCommissionCost(laborData);
      default:
        throw new Error(`Unsupported payment type: ${laborData.payment_type}`);
    }
  }

  /**
   * Calculate hourly-based cost
   */
  private calculateHourlyCost(laborData: CreateForLaborDto, rates?: LaborRates): CostCalculation {
    const hoursWorked = laborData.hours_worked || 0;
    const hourlyRate = laborData.hourly_rate || rates?.base_rate || 0;
    const overtimeHours = laborData.overtime_hours || 0;
    const overtimeRate = laborData.overtime_rate || rates?.overtime_rate || (hourlyRate * 1.5);

    const baseCost = hoursWorked * hourlyRate;
    const overtimeCost = overtimeHours * overtimeRate;
    const totalCost = baseCost + overtimeCost;
    
    // Calculate tax (assuming 15% tax rate)
    const taxAmount = totalCost * 0.15;
    const netAmount = totalCost - taxAmount;

    return {
      base_cost: baseCost,
      overtime_cost: overtimeCost,
      total_cost: totalCost,
      tax_amount: taxAmount,
      net_amount: netAmount
    };
  }

  /**
   * Calculate monthly salary cost
   */
  private calculateMonthlyCost(laborData: CreateForLaborDto): CostCalculation {
    const monthlySalary = laborData.for_labor_amount || 0;
    const bonusAmount = laborData.bonus_amount || 0;
    const totalCost = monthlySalary + bonusAmount;
    
    // Calculate tax (assuming 20% tax rate for monthly salary)
    const taxAmount = totalCost * 0.20;
    const netAmount = totalCost - taxAmount;

    return {
      base_cost: monthlySalary,
      bonus_amount: bonusAmount,
      total_cost: totalCost,
      tax_amount: taxAmount,
      net_amount: netAmount
    };
  }

  /**
   * Calculate bonus payment cost
   */
  private calculateBonusCost(laborData: CreateForLaborDto): CostCalculation {
    const bonusAmount = laborData.for_labor_amount || laborData.bonus_amount || 0;
    
    // Bonus tax rate is typically higher (25%)
    const taxAmount = bonusAmount * 0.25;
    const netAmount = bonusAmount - taxAmount;

    return {
      base_cost: 0,
      bonus_amount: bonusAmount,
      total_cost: bonusAmount,
      tax_amount: taxAmount,
      net_amount: netAmount
    };
  }

  /**
   * Calculate overtime-only payment cost
   */
  private calculateOvertimeCost(laborData: CreateForLaborDto, rates?: LaborRates): CostCalculation {
    const overtimeHours = laborData.overtime_hours || 0;
    const baseRate = laborData.hourly_rate || rates?.base_rate || 0;
    const overtimeRate = laborData.overtime_rate || rates?.overtime_rate || (baseRate * 1.5);
    
    const overtimeCost = overtimeHours * overtimeRate;
    const taxAmount = overtimeCost * 0.18;
    const netAmount = overtimeCost - taxAmount;

    return {
      base_cost: 0,
      overtime_cost: overtimeCost,
      total_cost: overtimeCost,
      tax_amount: taxAmount,
      net_amount: netAmount
    };
  }

  /**
   * Calculate commission-based cost
   */
  private calculateCommissionCost(laborData: CreateForLaborDto): CostCalculation {
    const commissionAmount = laborData.for_labor_amount || 0;
    
    // Commission tax rate
    const taxAmount = commissionAmount * 0.22;
    const netAmount = commissionAmount - taxAmount;

    return {
      base_cost: 0,
      bonus_amount: commissionAmount,
      total_cost: commissionAmount,
      tax_amount: taxAmount,
      net_amount: netAmount
    };
  }

  /**
   * Get tax rate based on payment type
   */
  getTaxRate(paymentType: LaborPaymentType): number {
    const taxRates = {
      [LaborPaymentType.HOURLY]: 0.15,
      [LaborPaymentType.MONTHLY]: 0.20,
      [LaborPaymentType.BONUS]: 0.25,
      [LaborPaymentType.OVERTIME]: 0.18,
      [LaborPaymentType.COMMISSION]: 0.22,
    };
    
    return taxRates[paymentType] || 0.15;
  }

  /**
   * Calculate year-to-date labor costs for an employee
   */
  calculateYTDLaborCosts(laborRecords: any[]): {
    totalHourly: number;
    totalMonthly: number;
    totalBonus: number;
    totalOvertime: number;
    totalCommission: number;
    grandTotal: number;
    totalTax: number;
    netTotal: number;
  } {
    const ytdCosts = {
      totalHourly: 0,
      totalMonthly: 0,
      totalBonus: 0,
      totalOvertime: 0,
      totalCommission: 0,
      grandTotal: 0,
      totalTax: 0,
      netTotal: 0,
    };

    laborRecords.forEach(record => {
      const amount = Number(record.for_labor_amount) || 0;
      const taxRate = this.getTaxRate(record.payment_type);
      const taxAmount = amount * taxRate;
      const netAmount = amount - taxAmount;

      switch (record.payment_type) {
        case LaborPaymentType.HOURLY:
          ytdCosts.totalHourly += amount;
          break;
        case LaborPaymentType.MONTHLY:
          ytdCosts.totalMonthly += amount;
          break;
        case LaborPaymentType.BONUS:
          ytdCosts.totalBonus += amount;
          break;
        case LaborPaymentType.OVERTIME:
          ytdCosts.totalOvertime += amount;
          break;
        case LaborPaymentType.COMMISSION:
          ytdCosts.totalCommission += amount;
          break;
      }

      ytdCosts.totalTax += taxAmount;
      ytdCosts.netTotal += netAmount;
    });

    ytdCosts.grandTotal = ytdCosts.totalHourly + ytdCosts.totalMonthly + 
                         ytdCosts.totalBonus + ytdCosts.totalOvertime + 
                         ytdCosts.totalCommission;

    return ytdCosts;
  }

  /**
   * Validate labor cost calculation inputs
   */
  validateLaborCostInputs(laborData: CreateForLaborDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!laborData.payment_type) {
      errors.push('Payment type is required');
    }

    switch (laborData.payment_type) {
      case LaborPaymentType.HOURLY:
        if (!laborData.hours_worked || laborData.hours_worked <= 0) {
          errors.push('Hours worked must be greater than 0 for hourly payments');
        }
        if (!laborData.hourly_rate || laborData.hourly_rate <= 0) {
          errors.push('Hourly rate must be greater than 0');
        }
        break;

      case LaborPaymentType.MONTHLY:
        if (!laborData.for_labor_amount || laborData.for_labor_amount <= 0) {
          errors.push('Monthly amount must be greater than 0');
        }
        break;

      case LaborPaymentType.BONUS:
      case LaborPaymentType.COMMISSION:
        if (!laborData.for_labor_amount || laborData.for_labor_amount <= 0) {
          errors.push('Amount must be greater than 0');
        }
        break;

      case LaborPaymentType.OVERTIME:
        if (!laborData.overtime_hours || laborData.overtime_hours <= 0) {
          errors.push('Overtime hours must be greater than 0');
        }
        if (!laborData.overtime_rate && !laborData.hourly_rate) {
          errors.push('Overtime rate or base hourly rate is required');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get employee wage rate from database with caching
   */
  async getEmployeeWageRate(employeeId: number): Promise<WageRateInfo | null> {
    try {
      // Check cache first
      const cached = this.wageRateCache.get(employeeId);
      if (cached && Date.now() < cached.expiry) {
        return cached.wageInfo;
      }

      const employee = await this.prisma.employees.findUnique({
        where: { employee_id: employeeId },
        include: {
          roles: {
            include: {
              wage_rates: true,
            },
          },
        },
      });

      if (!employee || !employee.roles.wage_rates) {
        return null;
      }

      const wageRate = employee.roles.wage_rates;
      const wageInfo: WageRateInfo = {
        wage_rate_id: wageRate.wage_rate_id,
        role_id: wageRate.role_id,
        hourly_rate: Number(wageRate.hourly_rate),
        effective_date: wageRate.effective_date,
        overtime_multiplier: 1.5, // Standard overtime multiplier
        double_time_multiplier: 2.0, // Standard double-time multiplier
      };

      // Cache the result
      this.wageRateCache.set(employeeId, {
        wageInfo,
        expiry: Date.now() + this.CACHE_TTL,
      });

      return wageInfo;
    } catch (error) {
      this.logger.error(`Failed to get wage rate for employee ${employeeId}:`, error);
      return null;
    }
  }

  /**
   * Clear wage rate cache for specific employee or all employees
   */
  clearWageRateCache(employeeId?: number): void {
    if (employeeId) {
      this.wageRateCache.delete(employeeId);
      this.logger.log(`Cleared wage rate cache for employee ${employeeId}`);
    } else {
      this.wageRateCache.clear();
      this.logger.log('Cleared all wage rate cache');
    }
  }

  /**
   * Calculate hours worked from attendance logs for a specific date
   */
  async calculateAttendanceHours(employeeId: number, workDate: Date, siteId?: number): Promise<AttendanceHours> {
    try {
      const startOfDay = new Date(workDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(workDate);
      endOfDay.setHours(23, 59, 59, 999);

      const whereClause: any = {
        employee_id: employeeId,
        check_in_time: {
          gte: startOfDay,
          lte: endOfDay,
        },
        check_out_time: {
          not: null,
        },
      };

      if (siteId) {
        whereClause.site_id = siteId;
      }

      const attendanceRecords = await this.prisma.attendance_logs.findMany({
        where: whereClause,
        orderBy: {
          check_in_time: 'asc',
        },
      });

      let totalMinutes = 0;
      
      for (const record of attendanceRecords) {
        if (record.check_out_time) {
          const checkIn = new Date(record.check_in_time);
          const checkOut = new Date(record.check_out_time);
          const diffMs = checkOut.getTime() - checkIn.getTime();
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          totalMinutes += diffMinutes;
        }
      }

      const totalHours = totalMinutes / 60;
      
      // Calculate regular and overtime hours (standard 8-hour workday)
      const regularHours = Math.min(totalHours, 8);
      const overtimeHours = Math.max(0, Math.min(totalHours - 8, 4)); // Up to 4 hours overtime
      const doubleTimeHours = Math.max(0, totalHours - 12); // Beyond 12 hours is double-time

      return {
        total_hours: totalHours,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        double_time_hours: doubleTimeHours,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate attendance hours for employee ${employeeId}:`, error);
      return {
        total_hours: 0,
        regular_hours: 0,
        overtime_hours: 0,
        double_time_hours: 0,
      };
    }
  }

  /**
   * Calculate progressive overtime rate where rate increases per hour
   * Formula: base_rate * (base_multiplier + (hour_number - start_after_hours) * increment_per_hour)
   */
  calculateProgressiveOvertimeRate(
    baseRate: number,
    overtimeHour: number,
    config: ProgressiveOvertimeConfig = {
      base_multiplier: 1.5,
      increment_per_hour: 0.1,
      max_multiplier: 3.0,
      start_after_hours: 8,
    }
  ): number {
    if (overtimeHour <= config.start_after_hours) {
      return baseRate; // Regular rate for first 8 hours
    }

    const overtimeHourNumber = overtimeHour - config.start_after_hours;
    let multiplier = config.base_multiplier + (overtimeHourNumber - 1) * config.increment_per_hour;
    
    // Apply maximum multiplier if specified
    if (config.max_multiplier && multiplier > config.max_multiplier) {
      multiplier = config.max_multiplier;
    }

    return baseRate * multiplier;
  }

  /**
   * Calculate enhanced labor cost using wage rates and attendance data
   */
  async calculateLaborCostFromAttendance(
    employeeId: number,
    workDate: Date,
    siteId?: number,
    progressiveOvertime: boolean = true
  ): Promise<CostCalculation & { attendance_hours: AttendanceHours; wage_info: WageRateInfo | null }> {
    try {
      // Get wage rate and attendance hours
      const [wageInfo, attendanceHours] = await Promise.all([
        this.getEmployeeWageRate(employeeId),
        this.calculateAttendanceHours(employeeId, workDate, siteId),
      ]);

      if (!wageInfo) {
        throw new Error(`No wage rate found for employee ${employeeId}`);
      }

      const baseRate = wageInfo.hourly_rate;
      let baseCost = 0;
      let overtimeCost = 0;
      let doubleTimeCost = 0;

      // Calculate regular hours cost
      baseCost = attendanceHours.regular_hours * baseRate;

      // Calculate overtime cost (progressive or standard)
      if (attendanceHours.overtime_hours > 0) {
        if (progressiveOvertime) {
          // Progressive overtime calculation
          let totalOvertimeCost = 0;
          for (let hour = 1; hour <= attendanceHours.overtime_hours; hour++) {
            const hourRate = this.calculateProgressiveOvertimeRate(baseRate, 8 + hour);
            totalOvertimeCost += hourRate;
          }
          overtimeCost = totalOvertimeCost;
        } else {
          // Standard overtime (1.5x rate)
          overtimeCost = attendanceHours.overtime_hours * (baseRate * 1.5);
        }
      }

      // Calculate double-time cost (2x rate)
      if (attendanceHours.double_time_hours > 0) {
        doubleTimeCost = attendanceHours.double_time_hours * (baseRate * 2.0);
      }

      const totalCost = baseCost + overtimeCost + doubleTimeCost;
      const taxRate = this.getTaxRate(LaborPaymentType.HOURLY);
      const taxAmount = totalCost * taxRate;
      const netAmount = totalCost - taxAmount;

      return {
        base_cost: baseCost,
        overtime_cost: overtimeCost + doubleTimeCost,
        total_cost: totalCost,
        tax_amount: taxAmount,
        net_amount: netAmount,
        attendance_hours: attendanceHours,
        wage_info: wageInfo,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate labor cost from attendance:`, error);
      throw new Error(`Labor cost calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate labor cost for a date range using attendance data
   */
  async calculateLaborCostForPeriod(
    employeeId: number,
    startDate: Date,
    endDate: Date,
    siteId?: number
  ): Promise<{
    total_cost_calculation: CostCalculation;
    daily_breakdown: Array<{
      date: Date;
      cost_calculation: CostCalculation & { attendance_hours: AttendanceHours; wage_info: WageRateInfo | null };
    }>;
    wage_info: WageRateInfo | null;
  }> {
    try {
      const dailyBreakdown: Array<{
        date: Date;
        cost_calculation: CostCalculation & { attendance_hours: AttendanceHours; wage_info: WageRateInfo | null };
      }> = [];
      let totalBaseCost = 0;
      let totalOvertimeCost = 0;
      let totalGrossCost = 0;
      let totalTaxAmount = 0;
      let totalNetAmount = 0;

      // Get wage info once
      const wageInfo = await this.getEmployeeWageRate(employeeId);

      // Iterate through each day in the period
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dailyCostCalculation = await this.calculateLaborCostFromAttendance(
          employeeId,
          new Date(currentDate),
          siteId
        );

        if (dailyCostCalculation.total_cost > 0) {
          dailyBreakdown.push({
            date: new Date(currentDate),
            cost_calculation: dailyCostCalculation,
          });

          totalBaseCost += dailyCostCalculation.base_cost;
          totalOvertimeCost += dailyCostCalculation.overtime_cost || 0;
          totalGrossCost += dailyCostCalculation.total_cost;
          totalTaxAmount += dailyCostCalculation.tax_amount || 0;
          totalNetAmount += dailyCostCalculation.net_amount;
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        total_cost_calculation: {
          base_cost: totalBaseCost,
          overtime_cost: totalOvertimeCost,
          total_cost: totalGrossCost,
          tax_amount: totalTaxAmount,
          net_amount: totalNetAmount,
        },
        daily_breakdown: dailyBreakdown,
        wage_info: wageInfo,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate period labor cost:`, error);
      throw new Error(`Period labor cost calculation failed: ${error.message}`);
    }
  }

  // TODO: Re-implement budget warnings with infrastructure layer
  // private async sendBudgetWarning(siteId: number, calculation: SiteCostCalculation): Promise<void> {}
}