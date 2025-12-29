import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface IssueWarningParams {
  employee_id: number;
  site_id: number;
  warning_date: Date;
  description: string;
  issued_by: number;
}

interface FindWarningsParams {
  page: number;
  limit: number;
  employee_id?: number;
  site_id?: number;
  start_date?: Date;
  end_date?: Date;
}

interface UpdateWarningParams {
  description?: string;
  warning_date?: Date;
}

interface BulkIssueWarningsParams {
  employee_ids: number[];
  site_id: number;
  description: string;
  warning_date: Date;
  issued_by: number;
}

@Injectable()
export class WarningService {
  constructor(
    private prisma: PrismaService,
  ) {}

  // Issue a new warning
  async issueWarning(params: IssueWarningParams) {
    try {
      // Validate employee exists and is active
      const employee = await this.prisma.employees.findUnique({
        where: { employee_id: params.employee_id },
        select: { employee_id: true, first_name: true, last_name: true, status: true },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      if (employee.status !== 'active') {
        throw new BadRequestException('Cannot issue warning to inactive employee');
      }

      // Validate site exists
      const site = await this.prisma.sites.findUnique({
        where: { site_id: params.site_id },
        select: { site_id: true, site_name: true },
      });

      if (!site) {
        throw new NotFoundException('Site not found');
      }

      // Create warning
      const warning = await this.prisma.warnings.create({
        data: {
          employee_id: params.employee_id,
          site_id: params.site_id,
          warning_date: params.warning_date,
          description: params.description,
          issued_by: params.issued_by,
        },
        include: {
          employees_warnings_employee_idToemployees: {
            select: { first_name: true, last_name: true, email: true, roles: { select: { role_name: true } } },
          },
          employees_warnings_issued_byToemployees: {
            select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
          },
          sites: {
            select: { site_name: true, address: true },
          },
        },
      });

      // Get warning count for progressive discipline
      const warningCount = await this.getEmployeeWarningCount(params.employee_id);

      // TODO: Re-implement with infrastructure layer
      // - Send notification to employee
      // - Send notification to managers if employee has multiple warnings
      // - Real-time WebSocket notification

      return {
        ...warning,
        warning_count: warningCount,
        severity: this.determineWarningSeverity(warningCount),
      };

    } catch (error) {
      throw new BadRequestException(`Failed to issue warning: ${error.message}`);
    }
  }

  // Get all warnings with filters and pagination
  async findAllPaginated(params: FindWarningsParams) {
    try {
      // TODO: Re-implement with Redis caching
      const offset = (params.page - 1) * params.limit;

      // Build where clause
      const where: any = {};
      if (params.employee_id) where.employee_id = params.employee_id;
      if (params.site_id) where.site_id = params.site_id;
      if (params.start_date || params.end_date) {
        where.warning_date = {};
        if (params.start_date) where.warning_date.gte = params.start_date;
        if (params.end_date) where.warning_date.lte = params.end_date;
      }

      const [warnings, total] = await Promise.all([
        this.prisma.warnings.findMany({
          where,
          include: {
            employees_warnings_employee_idToemployees: {
              select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
            },
            employees_warnings_issued_byToemployees: {
              select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
            },
            sites: {
              select: { site_name: true, address: true },
            },
          },
          orderBy: { warning_date: 'desc' },
          skip: offset,
          take: params.limit,
        }),
        this.prisma.warnings.count({ where }),
      ]);

      // Add warning counts for each employee
      const warningsWithCounts = await Promise.all(
        warnings.map(async (warning) => {
          const count = await this.getEmployeeWarningCount(warning.employee_id);
          return {
            ...warning,
            warning_count: count,
            severity: this.determineWarningSeverity(count),
          };
        })
      );

      const result = {
        warnings: warningsWithCounts,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          pages: Math.ceil(total / params.limit),
        },
      };

      return result;

    } catch (error) {
      throw new BadRequestException(`Failed to fetch warnings: ${error.message}`);
    }
  }

  // Get all warnings with filters (no pagination)
  async findAll(params: Omit<FindWarningsParams, 'page' | 'limit'>) {
    try {
      // TODO: Re-implement with Redis caching
      
      // Build where clause
      const where: any = {};
      if (params.employee_id) where.employee_id = params.employee_id;
      if (params.site_id) where.site_id = params.site_id;
      if (params.start_date || params.end_date) {
        where.warning_date = {};
        if (params.start_date) where.warning_date.gte = params.start_date;
        if (params.end_date) where.warning_date.lte = params.end_date;
      }

      const warnings = await this.prisma.warnings.findMany({
        where,
        include: {
          employees_warnings_employee_idToemployees: {
            select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
          },
          employees_warnings_issued_byToemployees: {
            select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
          },
          sites: {
            select: { site_name: true, address: true },
          },
        },
        orderBy: { warning_date: 'desc' },
      });

      // Add warning counts for each employee
      const warningsWithCounts = await Promise.all(
        warnings.map(async (warning) => {
          const count = await this.getEmployeeWarningCount(warning.employee_id);
          return {
            ...warning,
            warning_count: count,
            severity: this.determineWarningSeverity(count),
          };
        })
      );

      return {
        warnings: warningsWithCounts,
        total: warningsWithCounts.length,
      };

    } catch (error) {
      throw new BadRequestException(`Failed to fetch all warnings: ${error.message}`);
    }
  }

  // Get specific warning by ID
  async findById(id: number) {
    try {
      // TODO: Re-implement with Redis caching
      const warning = await this.prisma.warnings.findUnique({
        where: { warning_id: id },
        include: {
          employees_warnings_employee_idToemployees: {
            select: { first_name: true, last_name: true, email: true, roles: { select: { role_name: true } } },
          },
          employees_warnings_issued_byToemployees: {
            select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
          },
          sites: {
            select: { site_name: true, address: true },
          },
        },
      });

      if (!warning) {
        throw new NotFoundException('Warning not found');
      }

      const warningCount = await this.getEmployeeWarningCount(warning.employee_id);
      const result = {
        ...warning,
        warning_count: warningCount,
        severity: this.determineWarningSeverity(warningCount),
      };

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to fetch warning: ${error.message}`);
    }
  }

  // Get employee warnings with progressive discipline info
  async getEmployeeWarnings(employeeId: number) {
    try {
      // TODO: Re-implement with Redis caching
      // Check if employee exists
      const employee = await this.prisma.employees.findUnique({
        where: { employee_id: employeeId },
        select: { employee_id: true, first_name: true, last_name: true, roles: { select: { role_name: true } } },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      const [warnings, warningCount] = await Promise.all([
        this.prisma.warnings.findMany({
          where: { employee_id: employeeId },
          include: {
            employees_warnings_issued_byToemployees: {
              select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
            },
            sites: {
              select: { site_name: true, address: true },
            },
          },
          orderBy: { warning_date: 'desc' },
        }),
        this.getEmployeeWarningCount(employeeId),
      ]);

      // Calculate next action in progressive discipline
      const nextAction = this.determineNextDisciplinaryAction(warningCount);
      const disciplineLevel = this.determineDisciplineLevel(warningCount);

      const result = {
        employee: employee,
        warnings: warnings,
        summary: {
          total_warnings: warningCount,
          discipline_level: disciplineLevel,
          next_action: nextAction,
          recent_warnings: warnings.filter(w => 
            new Date(w.warning_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          ).length,
          last_warning_date: warnings.length > 0 ? warnings[0].warning_date : null,
        },
      };

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to fetch employee warnings: ${error.message}`);
    }
  }

  // Get site warnings summary
  async getSiteWarnings(siteId: number) {
    try {
      // TODO: Re-implement with Redis caching
      const site = await this.prisma.sites.findUnique({
        where: { site_id: siteId },
        select: { site_id: true, site_name: true },
      });

      if (!site) {
        throw new NotFoundException('Site not found');
      }

      const [warnings, stats] = await Promise.all([
        this.prisma.warnings.findMany({
          where: { site_id: siteId },
          include: {
            employees_warnings_employee_idToemployees: {
              select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
            },
            employees_warnings_issued_byToemployees: {
              select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
            },
          },
          orderBy: { warning_date: 'desc' },
          take: 50, // Limit recent warnings
        }),
        this.getSiteWarningStatistics(siteId),
      ]);

      const result = {
        site: site,
        warnings: warnings,
        statistics: stats,
      };

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to fetch site warnings: ${error.message}`);
    }
  }

  // Get warning statistics
  async getWarningStatistics(startDate?: Date, endDate?: Date) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();
      
      // TODO: Re-implement with Redis caching
      const [totalWarnings, warningsByDay, topOffenders, warningsBySite] = await Promise.all([
        // Total warnings in period
        this.prisma.warnings.count({
          where: {
            warning_date: { gte: start, lte: end },
          },
        }),

        // Warnings by day
        this.prisma.$queryRaw`
          SELECT DATE(warning_date) as date, COUNT(*) as count
          FROM warnings 
          WHERE warning_date >= ${start} AND warning_date <= ${end}
          GROUP BY DATE(warning_date)
          ORDER BY date DESC
        `,

        // Top employees with warnings
        this.prisma.$queryRaw`
          SELECT CONCAT(e.first_name, ' ', e.last_name) as name, e.employee_id, COUNT(w.warning_id) as warning_count
          FROM warnings w
          JOIN employees e ON w.employee_id = e.employee_id
          WHERE w.warning_date >= ${start} AND w.warning_date <= ${end}
          GROUP BY e.employee_id, e.first_name, e.last_name
          ORDER BY warning_count DESC
          LIMIT 10
        `,

        // Warnings by site
        this.prisma.$queryRaw`
          SELECT s.site_name, s.site_id, COUNT(w.warning_id) as warning_count
          FROM warnings w
          JOIN sites s ON w.site_id = s.site_id
          WHERE w.warning_date >= ${start} AND w.warning_date <= ${end}
          GROUP BY s.site_id, s.site_name
          ORDER BY warning_count DESC
        `,
      ]);

      const result = {
        period: { start, end },
        total_warnings: totalWarnings,
        daily_breakdown: warningsByDay,
        top_offenders: topOffenders,
        warnings_by_site: warningsBySite,
        average_per_day: totalWarnings / Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      };

      return result;

    } catch (error) {
      throw new BadRequestException(`Failed to fetch warning statistics: ${error.message}`);
    }
  }

  // Get recent warnings
  async getRecentWarnings(limit: number = 10) {
    try {
      // TODO: Re-implement with Redis caching
      const warnings = await this.prisma.warnings.findMany({
        include: {
          employees_warnings_employee_idToemployees: {
            select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
          },
          employees_warnings_issued_byToemployees: {
            select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
          },
          sites: {
            select: { site_name: true, address: true },
          },
        },
        orderBy: { warning_date: 'desc' },
        take: limit,
      });

      const result = await Promise.all(
        warnings.map(async (warning) => {
          const count = await this.getEmployeeWarningCount(warning.employee_id);
          return {
            ...warning,
            warning_count: count,
            severity: this.determineWarningSeverity(count),
          };
        })
      );

      return result;

    } catch (error) {
      throw new BadRequestException(`Failed to fetch recent warnings: ${error.message}`);
    }
  }

  // Get warning trends
  async getWarningTrends(period: 'week' | 'month' | 'quarter' = 'month') {
    try {
      // TODO: Re-implement with Redis caching
      let dateFormat: string;
      let startDate: Date;
      
      switch (period) {
        case 'week':
          dateFormat = '%Y-%u'; // Year-Week
          startDate = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks
          break;
        case 'quarter':
          dateFormat = '%Y-Q%q'; // Year-Quarter
          startDate = new Date(Date.now() - 8 * 3 * 30 * 24 * 60 * 60 * 1000); // 8 quarters
          break;
        default: // month
          dateFormat = '%Y-%m'; // Year-Month
          startDate = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000); // 12 months
      }

      const trends = await this.prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(warning_date, ${dateFormat}) as period,
          COUNT(*) as warning_count,
          COUNT(DISTINCT employee_id) as employees_warned
        FROM warnings 
        WHERE warning_date >= ${startDate}
        GROUP BY DATE_FORMAT(warning_date, ${dateFormat})
        ORDER BY period DESC
      `;

      return trends;

    } catch (error) {
      throw new BadRequestException(`Failed to fetch warning trends: ${error.message}`);
    }
  }

  // Update warning
  async updateWarning(id: number, params: UpdateWarningParams) {
    try {
      const warning = await this.prisma.warnings.update({
        where: { warning_id: id },
        data: params,
        include: {
          employees_warnings_employee_idToemployees: {
            select: { first_name: true, last_name: true, roles: { select: { role_name: true } } },
          },
          sites: {
            select: { site_name: true },
          },
        },
      });

      // TODO: Re-implement with infrastructure layer
      // - Clear caches
      // - Real-time WebSocket notification

      return warning;

    } catch (error) {
      throw new BadRequestException(`Failed to update warning: ${error.message}`);
    }
  }

  // Acknowledge warning (employee acknowledges receipt)
  async acknowledgeWarning(warningId: number, employeeId: number) {
    try {
      const warning = await this.prisma.warnings.findUnique({
        where: { warning_id: warningId },
      });

      if (!warning) {
        throw new NotFoundException('Warning not found');
      }

      if (warning.employee_id !== employeeId) {
        throw new BadRequestException('You can only acknowledge your own warnings');
      }

      const updatedWarning = await this.prisma.warnings.update({
        where: { warning_id: warningId },
        data: { acknowledged_date: new Date() },
      });

      // TODO: Re-implement with infrastructure layer
      // - Clear caches
      // - Notify managers

      return updatedWarning;

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to acknowledge warning: ${error.message}`);
    }
  }

  // Appeal warning
  async appealWarning(warningId: number, employeeId: number, appealReason: string) {
    try {
      const warning = await this.prisma.warnings.findUnique({
        where: { warning_id: warningId },
      });

      if (!warning) {
        throw new NotFoundException('Warning not found');
      }

      if (warning.employee_id !== employeeId) {
        throw new BadRequestException('You can only appeal your own warnings');
      }

      const updatedWarning = await this.prisma.warnings.update({
        where: { warning_id: warningId },
        data: { 
          appeal_date: new Date(),
          appeal_reason: appealReason,
          appeal_status: 'pending',
        },
      });

      // TODO: Re-implement with infrastructure layer
      // - Notify managers about appeal

      return updatedWarning;

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to appeal warning: ${error.message}`);
    }
  }

  // Get pending appeals
  async getPendingAppeals() {
    try {
      const appeals = await this.prisma.warnings.findMany({
        where: { appeal_status: 'pending' },
        include: {
          employees_warnings_employee_idToemployees: {
            select: { first_name: true, last_name: true, email: true, roles: { select: { role_name: true } } },
          },
          sites: {
            select: { site_name: true },
          },
        },
        orderBy: { appeal_date: 'desc' },
      });

      return appeals;

    } catch (error) {
      throw new BadRequestException(`Failed to fetch pending appeals: ${error.message}`);
    }
  }

  // Resolve appeal
  async resolveAppeal(
    warningId: number, 
    resolvedBy: number, 
    decision: 'approved' | 'denied', 
    resolutionNotes?: string
  ) {
    try {
      const warning = await this.prisma.warnings.update({
        where: { warning_id: warningId },
        data: {
          appeal_status: decision,
          appeal_resolved_date: new Date(),
          appeal_resolved_by: resolvedBy,
          appeal_resolution_notes: resolutionNotes,
        },
        include: {
          employees_warnings_employee_idToemployees: {
            select: { first_name: true, last_name: true, email: true },
          },
        },
      });

      // TODO: Re-implement with infrastructure layer
      // - Notify employee of appeal decision
      // - Clear caches

      return warning;

    } catch (error) {
      throw new BadRequestException(`Failed to resolve appeal: ${error.message}`);
    }
  }

  // Delete warning
  async deleteWarning(id: number) {
    try {
      const warning = await this.prisma.warnings.findUnique({
        where: { warning_id: id },
      });

      if (!warning) {
        throw new NotFoundException('Warning not found');
      }

      await this.prisma.warnings.delete({
        where: { warning_id: id },
      });

      // TODO: Re-implement with infrastructure layer
      // - Clear caches

      return { message: 'Warning deleted successfully' };

    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to delete warning: ${error.message}`);
    }
  }

  // Bulk issue warnings
  async bulkIssueWarnings(params: BulkIssueWarningsParams) {
    try {
      const warnings = await Promise.all(
        params.employee_ids.map(async (employeeId) => {
          return this.issueWarning({
            employee_id: employeeId,
            site_id: params.site_id,
            warning_date: params.warning_date,
            description: params.description,
            issued_by: params.issued_by,
          });
        })
      );

      return {
        message: `Successfully issued ${warnings.length} warnings`,
        warnings: warnings,
      };

    } catch (error) {
      throw new BadRequestException(`Failed to bulk issue warnings: ${error.message}`);
    }
  }

  // Get warning summary report
  async getWarningSummaryReport(startDate: Date, endDate: Date) {
    try {
      // TODO: Re-implement with Redis caching
      const [
        totalWarnings,
        warningsByEmployee,
        warningsBySite,
        progressiveDisciplineStats,
        acknowledgmentStats,
        appealStats
      ] = await Promise.all([
        // Total warnings
        this.prisma.warnings.count({
          where: { warning_date: { gte: startDate, lte: endDate } },
        }),

        // Top employees by warnings
        this.prisma.$queryRaw`
          SELECT CONCAT(e.first_name, ' ', e.last_name) as name, e.employee_id, COUNT(w.warning_id) as warning_count,
                 MAX(w.warning_date) as last_warning
          FROM warnings w
          JOIN employees e ON w.employee_id = e.employee_id
          WHERE w.warning_date >= ${startDate} AND w.warning_date <= ${endDate}
          GROUP BY e.employee_id, e.first_name, e.last_name
          ORDER BY warning_count DESC
          LIMIT 20
        `,

        // Warnings by site
        this.prisma.$queryRaw`
          SELECT s.site_name, s.site_id, COUNT(w.warning_id) as warning_count
          FROM warnings w
          JOIN sites s ON w.site_id = s.site_id
          WHERE w.warning_date >= ${startDate} AND w.warning_date <= ${endDate}
          GROUP BY s.site_id, s.site_name
          ORDER BY warning_count DESC
        `,

        // Progressive discipline statistics
        this.prisma.$queryRaw`
          SELECT 
            SUM(CASE WHEN warning_count = 1 THEN 1 ELSE 0 END) as first_warnings,
            SUM(CASE WHEN warning_count = 2 THEN 1 ELSE 0 END) as second_warnings,
            SUM(CASE WHEN warning_count >= 3 THEN 1 ELSE 0 END) as repeat_offenders
          FROM (
            SELECT employee_id, COUNT(*) as warning_count
            FROM warnings
            WHERE warning_date >= ${startDate} AND warning_date <= ${endDate}
            GROUP BY employee_id
          ) employee_warnings
        `,

        // Acknowledgment statistics
        this.prisma.warnings.groupBy({
          by: ['acknowledged_date'],
          where: { 
            warning_date: { gte: startDate, lte: endDate },
          },
          _count: true,
        }),

        // Appeal statistics
        this.prisma.warnings.groupBy({
          by: ['appeal_status'],
          where: { 
            warning_date: { gte: startDate, lte: endDate },
            appeal_date: { not: null },
          },
          _count: true,
        }),
      ]);

      const result = {
        period: { start: startDate, end: endDate },
        overview: {
          total_warnings: totalWarnings,
          acknowledged: acknowledgmentStats.filter(a => a.acknowledged_date !== null).reduce((sum, a) => sum + a._count, 0),
          appealed: appealStats.reduce((sum, a) => sum + a._count, 0),
        },
        employees: warningsByEmployee,
        sites: warningsBySite,
        progressive_discipline: (progressiveDisciplineStats as any)?.[0] || {
          first_warnings: 0,
          second_warnings: 0,
          repeat_offenders: 0,
        },
        appeals: appealStats,
      };

      return result;

    } catch (error) {
      throw new BadRequestException(`Failed to generate warning report: ${error.message}`);
    }
  }

  // PRIVATE HELPER METHODS

  private async getEmployeeWarningCount(employeeId: number): Promise<number> {
    // TODO: Re-implement with Redis caching
    const count = await this.prisma.warnings.count({
      where: { employee_id: employeeId },
    });

    return count;
  }

  private async getSiteWarningStatistics(siteId: number) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [totalWarnings, recentWarnings, topOffenders] = await Promise.all([
      this.prisma.warnings.count({
        where: { site_id: siteId },
      }),
      this.prisma.warnings.count({
        where: { 
          site_id: siteId,
          warning_date: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.$queryRaw`
        SELECT CONCAT(e.first_name, ' ', e.last_name) as name, COUNT(w.warning_id) as warning_count
        FROM warnings w
        JOIN employees e ON w.employee_id = e.employee_id
        WHERE w.site_id = ${siteId}
        GROUP BY e.employee_id, e.first_name, e.last_name
        ORDER BY warning_count DESC
        LIMIT 5
      `,
    ]);

    return {
      total_warnings: totalWarnings,
      recent_warnings: recentWarnings,
      top_offenders: topOffenders,
    };
  }

  private determineWarningSeverity(warningCount: number): string {
    if (warningCount === 1) return 'low';
    if (warningCount === 2) return 'medium';
    if (warningCount === 3) return 'high';
    return 'critical';
  }

  private determineDisciplineLevel(warningCount: number): string {
    if (warningCount === 0) return 'good_standing';
    if (warningCount === 1) return 'first_warning';
    if (warningCount === 2) return 'second_warning';
    if (warningCount === 3) return 'final_warning';
    return 'termination_consideration';
  }

  private determineNextDisciplinaryAction(warningCount: number): string {
    switch (warningCount) {
      case 0: return 'No action required';
      case 1: return 'Monitor performance';
      case 2: return 'Performance improvement plan';
      case 3: return 'Final warning consideration';
      default: return 'Termination consideration';
    }
  }

  // TODO: Re-implement cache clearing with infrastructure layer
  // private async clearWarningCaches(employeeId: number, siteId: number) {
  //   Clear Redis cache patterns for warnings
  // }
}
