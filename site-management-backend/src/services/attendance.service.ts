import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAttendanceLogDto, UpdateAttendanceLogDto } from '../models/attendance-log.model';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all attendance logs with employee and site details
   */
  async findAll() {
    return this.prisma.attendance_logs.findMany({
      include: {
        employees: true,
        sites: true,
      },
    });
  }

  /**
   * Create a new attendance log entry
   */
  async create(createAttendanceLogDto: CreateAttendanceLogDto) {
    return this.prisma.attendance_logs.create({
      data: createAttendanceLogDto,
      include: {
        employees: true,
        sites: true,
      },
    });
  }

  /**
   * Get attendance log by ID
   */
  async findById(id: number) {
    const log = await this.prisma.attendance_logs.findUnique({
      where: { log_id: id },
      include: {
        employees: true,
        sites: true,
      },
    });
    
    if (!log) {
      throw new NotFoundException(`Attendance log with ID ${id} not found`);
    }
    
    return log;
  }

  /**
   * Employee check-in to a site
   * Business logic: Ensure no duplicate active check-ins
   */
  async checkIn(employeeId: number, siteId: number) {
    // Check if employee already has an active check-in
    const existingCheckIn = await this.prisma.attendance_logs.findFirst({
      where: {
        employee_id: employeeId,
        status: 'checked_in',
        check_out_time: null,
      },
    });
    
    if (existingCheckIn) {
      throw new BadRequestException(`Employee is already checked in at site ${existingCheckIn.site_id}`);
    }

    const checkInData = {
      employee_id: employeeId,
      site_id: siteId,
      check_in_time: new Date(),
      status: 'checked_in'
    };

    return this.prisma.attendance_logs.create({
      data: checkInData,
      include: {
        employees: true,
        sites: true,
      },
    });
  }

  /**
   * Employee check-out
   * Business logic: Validate check-in exists and calculate hours
   */
  async checkOut(logId: number) {
    const log = await this.findById(logId);
    
    if (log.check_out_time) {
      throw new BadRequestException('Employee is already checked out');
    }

    if (log.status !== 'checked_in') {
      throw new BadRequestException('Invalid attendance status for check-out');
    }

    return this.prisma.attendance_logs.update({
      where: { log_id: logId },
      data: {
        check_out_time: new Date(),
        status: 'checked_out',
      },
      include: {
        employees: true,
        sites: true,
      },
    });
  }

  /**
   * Quick check-out by employee (find their active check-in)
   */
  async checkOutEmployee(employeeId: number) {
    const employeeLog = await this.prisma.attendance_logs.findFirst({
      where: {
        employee_id: employeeId,
        status: 'checked_in',
        check_out_time: null,
      },
    });
    
    if (!employeeLog) {
      throw new NotFoundException('No active check-in found for this employee');
    }

    return this.checkOut(employeeLog.log_id);
  }

  /**
   * Get attendance history for specific employee
   */
  async findByEmployee(employeeId: number, limit: number = 50) {
    if (limit > 200) limit = 200; // Prevent excessive data
    
    return this.prisma.attendance_logs.findMany({
      where: { employee_id: employeeId },
      include: {
        employees: true,
        sites: true,
      },
      orderBy: { check_in_time: 'desc' },
      take: limit,
    });
  }

  /**
   * Get attendance for specific site
   */
  async findBySite(siteId: number, limit: number = 100) {
    if (limit > 500) limit = 500;
    
    return this.prisma.attendance_logs.findMany({
      where: { site_id: siteId },
      include: {
        employees: true,
        sites: true,
      },
      orderBy: { check_in_time: 'desc' },
      take: limit,
    });
  }

  /**
   * Get attendance logs for date range
   */
  async findByDateRange(startDate: Date, endDate: Date) {
    // Business validation
    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    // Limit range to prevent excessive queries
    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference > 365) {
      throw new BadRequestException('Date range cannot exceed 365 days');
    }

    return this.prisma.attendance_logs.findMany({
      where: {
        check_in_time: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employees: true,
        sites: true,
      },
      orderBy: { check_in_time: 'desc' },
    });
  }

  /**
   * Get currently active attendance (who's checked in right now)
   */
  async getCurrentlyActive() {
    return this.prisma.attendance_logs.findMany({
      where: {
        status: 'checked_in',
        check_out_time: null,
      },
      include: {
        employees: true,
        sites: true,
      },
      orderBy: { check_in_time: 'desc' },
    });
  }

  /**
   * Manual attendance correction (for supervisors)
   */
  async correctAttendance(logId: number, updateData: UpdateAttendanceLogDto) {
    const log = await this.findById(logId);
    
    // Business validation for manual corrections
    if (updateData.check_in_time && updateData.check_out_time) {
      if (new Date(updateData.check_in_time) >= new Date(updateData.check_out_time)) {
        throw new BadRequestException('Check-in time must be before check-out time');
      }
    }

    return this.prisma.attendance_logs.update({
      where: { log_id: logId },
      data: updateData,
      include: {
        employees: true,
        sites: true,
      },
    });
  }

  /**
   * Get attendance summary for employee in date range
   */
  async getEmployeeAttendanceSummary(employeeId: number, startDate: Date, endDate: Date) {
    const logs = await this.findByDateRange(startDate, endDate);
    const employeeLogs = logs.filter(log => log.employee_id === employeeId);

    let totalHours = 0;
    let daysWorked = 0;
    let completeSessions = 0;

    employeeLogs.forEach(log => {
      if (log.check_out_time) {
        const checkIn = new Date(log.check_in_time);
        const checkOut = new Date(log.check_out_time);
        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
        completeSessions++;
      }
    });

    // Count unique days
    const uniqueDays = new Set(
      employeeLogs.map(log => new Date(log.check_in_time).toDateString())
    );
    daysWorked = uniqueDays.size;

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      daysWorked,
      totalSessions: employeeLogs.length,
      completeSessions,
      incompleteSessions: employeeLogs.length - completeSessions,
      averageHoursPerDay: daysWorked > 0 ? Math.round((totalHours / daysWorked) * 100) / 100 : 0
    };
  }

  /**
   * Get site attendance statistics
   */
  async getSiteAttendanceStats(siteId: number, date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const [dayLogs, activeLogs] = await Promise.all([
      this.findByDateRange(startOfDay, endOfDay),
      this.getCurrentlyActive()
    ]);

    const siteLogs = dayLogs.filter(log => log.site_id === siteId);
    const siteActive = activeLogs.filter(log => log.site_id === siteId);

    return {
      date: targetDate.toDateString(),
      totalCheckIns: siteLogs.length,
      currentlyActive: siteActive.length,
      completedSessions: siteLogs.filter(log => log.check_out_time).length,
      uniqueEmployees: new Set(siteLogs.map(log => log.employee_id)).size
    };
  }

  /**
   * Get paginated attendance logs
   */
  async findWithPagination(page: number = 1, limit: number = 50) {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 200) limit = 50;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.attendance_logs.findMany({
        skip,
        take: limit,
        include: {
          employees: true,
          sites: true,
        },
        orderBy: { check_in_time: 'desc' },
      }),
      this.prisma.attendance_logs.count(),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get paginated attendance logs with filters
   */
  async findWithPaginationAndFilters(
    page: number = 1, 
    limit: number = 50, 
    filters: { 
      employee_id?: number; 
      site_id?: number; 
      date?: Date; 
    } = {}
  ) {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 200) limit = 50;

    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = {};

    if (filters.employee_id) {
      where.employee_id = filters.employee_id;
    }

    if (filters.site_id) {
      where.site_id = filters.site_id;
    }

    if (filters.date) {
      // Filter by specific date (start and end of day)
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.check_in_time = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.attendance_logs.findMany({
        where,
        skip,
        take: limit,
        include: {
          employees: {
            select: {
              employee_id: true,
              first_name: true,
              last_name: true,
              email: true,
              roles: {
                select: {
                  role_name: true,
                },
              },
            },
          },
          sites: {
            select: {
              site_id: true,
              site_name: true,
              address: true,
            },
          },
        },
        orderBy: { check_in_time: 'desc' },
      }),
      this.prisma.attendance_logs.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters,
    };
  }

  /**
   * Delete attendance log (admin only)
   */
  async delete(id: number) {
    await this.findById(id); // Ensure exists
    return this.prisma.attendance_logs.delete({
      where: { log_id: id },
    });
  }
}