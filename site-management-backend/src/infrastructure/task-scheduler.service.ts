import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from './redis.service';
import { SiteManagementGateway } from './websocket.gateway';
import { NotificationService } from './notification-simple.service';

export interface JobResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly websocketGateway: SiteManagementGateway,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Daily Worker-Hour Aggregation
   * Runs every day at 1:00 AM
   */
  @Cron('0 1 * * *', {
    name: 'daily-hour-aggregation',
    timeZone: 'America/New_York', // Adjust timezone as needed
  })
  async handleDailyWorkerHourAggregation(): Promise<JobResult> {
    const jobId = `daily_aggregation_${new Date().toISOString().split('T')[0]}`;
    
    try {
      this.logger.log('Starting daily worker-hour aggregation...');
      
      // Store job state in Redis
      await this.redisService.cacheJobState(jobId, {
        status: 'processing',
        startedAt: new Date(),
      });

      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      // Aggregate attendance data for yesterday
      const attendanceData = await this.prisma.attendance_logs.findMany({
        where: {
          check_in_time: {
            gte: yesterday,
            lte: endOfYesterday,
          },
          check_out_time: {
            not: null,
          },
        },
        include: {
          employees: true,
          sites: true,
        },
      });

      // Calculate total hours worked per employee per site
      const aggregatedData = this.aggregateWorkerHours(attendanceData);

      // Store aggregation results
      await this.prisma.background_jobs.create({
        data: {
          job_type: 'daily_aggregation',
          status: 'completed',
          data: { date: yesterday.toISOString().split('T')[0] },
          result: aggregatedData,
          scheduled_at: yesterday,
          started_at: new Date(),
          completed_at: new Date(),
        },
      });

      // Update Redis cache
      await this.redisService.cacheJobState(jobId, {
        status: 'completed',
        completedAt: new Date(),
        result: aggregatedData,
      });

      // Invalidate relevant caches
      await this.redisService.deletePattern('dashboard:stats:*');
      await this.redisService.deletePattern('employee:profile:*');

      this.logger.log(`Daily aggregation completed for ${attendanceData.length} attendance records`);

      return {
        success: true,
        message: `Processed ${attendanceData.length} attendance records`,
        data: aggregatedData,
      };

    } catch (error) {
      this.logger.error('Daily aggregation failed:', error);
      
      await this.redisService.cacheJobState(jobId, {
        status: 'failed',
        error: error.message,
        failedAt: new Date(),
      });

      return {
        success: false,
        message: 'Daily aggregation failed',
        error: error.message,
      };
    }
  }

  /**
   * Weekly Site Cost Calculations
   * Runs every Sunday at 2:00 AM
   */
  @Cron('0 2 * * 0', {
    name: 'weekly-cost-calculation',
  })
  async handleWeeklySiteCostCalculation(): Promise<JobResult> {
    try {
      this.logger.log('Starting weekly site cost calculation...');

      // Get all active sites
      const activeSites = await this.prisma.sites.findMany({
        where: {
          status: 'active',
        },
        include: {
          for_labor: {
            where: {
              payment_date: {
                gte: this.getStartOfWeek(),
                lte: this.getEndOfWeek(),
              },
            },
          },
          for_material: {
            where: {
              payment_date: {
                gte: this.getStartOfWeek(),
                lte: this.getEndOfWeek(),
              },
            },
          },
        },
      });

      const costCalculations: any[] = [];

      for (const site of activeSites) {
        const laborCost = site.for_labor.reduce(
          (sum, labor) => sum + Number(labor.for_labor_amount), 
          0
        );
        
        const materialCost = site.for_material.reduce(
          (sum, material) => sum + Number(material.for_material_amount), 
          0
        );

        const totalWeeklyCost = laborCost + materialCost;

        const calculation = {
          site_id: site.site_id,
          site_name: site.site_name,
          labor_cost: laborCost,
          material_cost: materialCost,
          total_cost: totalWeeklyCost,
          week_start: this.getStartOfWeek(),
          week_end: this.getEndOfWeek(),
        };

        costCalculations.push(calculation);

        // Cache the calculation
        await this.redisService.cacheSiteCostCalculation(site.site_id, calculation);

        // Broadcast update via WebSocket
        await this.websocketGateway.broadcastSiteCostUpdate(site.site_id, calculation);
      }

      // Store job result
      await this.prisma.background_jobs.create({
        data: {
          job_type: 'weekly_calculation',
          status: 'completed',
          data: { week_start: this.getStartOfWeek(), week_end: this.getEndOfWeek() },
          result: { sites_processed: costCalculations.length, calculations: costCalculations },
          scheduled_at: new Date(),
          started_at: new Date(),
          completed_at: new Date(),
        },
      });

      this.logger.log(`Weekly cost calculation completed for ${activeSites.length} sites`);

      return {
        success: true,
        message: `Calculated costs for ${activeSites.length} active sites`,
        data: costCalculations,
      };

    } catch (error) {
      this.logger.error('Weekly cost calculation failed:', error);
      return {
        success: false,
        message: 'Weekly cost calculation failed',
        error: error.message,
      };
    }
  }

  /**
   * Deadline Reminders
   * Runs every day at 9:00 AM
   */
  @Cron('0 9 * * *', {
    name: 'deadline-reminders',
  })
  async handleDeadlineReminders(): Promise<JobResult> {
    try {
      this.logger.log('Processing deadline reminders...');

      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find sites with approaching deadlines
      const sitesWithDeadlines = await this.prisma.sites.findMany({
        where: {
          status: 'active',
          deadline: {
            lte: oneWeekFromNow,
            gte: now,
          },
        },
      });

      const reminders: any[] = [];

      for (const site of sitesWithDeadlines) {
        const daysUntilDeadline = Math.ceil(
          (site.deadline!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        let urgencyLevel = 'normal';
        if (daysUntilDeadline <= 1) urgencyLevel = 'critical';
        else if (daysUntilDeadline <= 3) urgencyLevel = 'high';
        else if (daysUntilDeadline <= 7) urgencyLevel = 'medium';

        const reminderData = {
          site_id: site.site_id,
          site_name: site.site_name,
          deadline: site.deadline,
          days_until_deadline: daysUntilDeadline,
          urgency_level: urgencyLevel,
        };

        reminders.push(reminderData);

        // Send notifications to relevant employees
        await this.notificationService.sendDeadlineReminder(reminderData);

        // Broadcast via WebSocket
        await this.websocketGateway.broadcastDeadlineReminder(site.site_id, reminderData);

        this.logger.warn(
          `Deadline reminder: Site "${site.site_name}" due in ${daysUntilDeadline} days`
        );
      }

      return {
        success: true,
        message: `Processed ${reminders.length} deadline reminders`,
        data: reminders,
      };

    } catch (error) {
      this.logger.error('Deadline reminders failed:', error);
      return {
        success: false,
        message: 'Deadline reminders failed',
        error: error.message,
      };
    }
  }

  /**
   * Cleanup Jobs
   * Runs every day at 3:00 AM
   */
  @Cron('0 3 * * *', {
    name: 'cleanup-jobs',
  })
  async handleCleanupJobs(): Promise<JobResult> {
    try {
      this.logger.log('Starting cleanup jobs...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Cleanup old job records
      const oldJobs = await this.prisma.background_jobs.deleteMany({
        where: {
          created_at: {
            lt: thirtyDaysAgo,
          },
          status: 'completed',
        },
      });

      // Cleanup old notifications
      const oldNotifications = await this.prisma.notifications.deleteMany({
        where: {
          created_at: {
            lt: thirtyDaysAgo,
          },
          is_read: true,
        },
      });

      // Cleanup expired cache entries (handled by Redis TTL, but double-check)
      const expiredCacheKeys = await this.redisService.getRedisClient().keys('*');
      let expiredCount = 0;
      
      for (const key of expiredCacheKeys) {
        const ttl = await this.redisService.getRedisClient().ttl(key);
        if (ttl === -1) { // Key exists but has no TTL
          await this.redisService.delete(key);
          expiredCount++;
        }
      }

      // Cleanup old device tokens (inactive for 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const oldTokens = await this.prisma.device_tokens.deleteMany({
        where: {
          updated_at: {
            lt: ninetyDaysAgo,
          },
          is_active: false,
        },
      });

      const cleanupResult = {
        jobs_cleaned: oldJobs.count,
        notifications_cleaned: oldNotifications.count,
        cache_keys_cleaned: expiredCount,
        tokens_cleaned: oldTokens.count,
      };

      this.logger.log(`Cleanup completed: ${JSON.stringify(cleanupResult)}`);

      return {
        success: true,
        message: 'Cleanup jobs completed',
        data: cleanupResult,
      };

    } catch (error) {
      this.logger.error('Cleanup jobs failed:', error);
      return {
        success: false,
        message: 'Cleanup jobs failed',
        error: error.message,
      };
    }
  }

  /**
   * Low Stock Check
   * Runs every 2 hours during business hours (8 AM - 6 PM)
   */
  @Cron('0 8-18/2 * * *', {
    name: 'low-stock-check',
  })
  async handleLowStockCheck(): Promise<JobResult> {
    try {
      this.logger.log('Checking for low stock materials...');

      // Find materials with low stock
      const lowStockMaterials = await this.prisma.materials.findMany({
        where: {
          quantity: {
            lte: 10, // Default threshold, can be configurable per material
          },
        },
      });

      for (const material of lowStockMaterials) {
        // Check if we've already sent an alert recently
        const recentAlert = await this.redisService.get(`low_stock_alert:${material.material_id}`);
        
        if (!recentAlert) {
          // Send low stock alert
          await this.notificationService.sendLowStockAlert(material);
          
          // Broadcast via WebSocket
          await this.websocketGateway.broadcastLowStockAlert(material);
          
          // Set flag to prevent duplicate alerts for 4 hours
          await this.redisService.set(
            `low_stock_alert:${material.material_id}`, 
            { sent_at: new Date() }, 
            14400 // 4 hours
          );
        }
      }

      return {
        success: true,
        message: `Checked ${lowStockMaterials.length} low stock items`,
        data: lowStockMaterials,
      };

    } catch (error) {
      this.logger.error('Low stock check failed:', error);
      return {
        success: false,
        message: 'Low stock check failed',
        error: error.message,
      };
    }
  }

  /**
   * Manual Job Triggers (for testing or on-demand execution)
   */

  async triggerDailyAggregation(): Promise<JobResult> {
    this.logger.log('Manually triggering daily aggregation...');
    return this.handleDailyWorkerHourAggregation();
  }

  async triggerWeeklyCostCalculation(): Promise<JobResult> {
    this.logger.log('Manually triggering weekly cost calculation...');
    return this.handleWeeklySiteCostCalculation();
  }

  async triggerDeadlineReminders(): Promise<JobResult> {
    this.logger.log('Manually triggering deadline reminders...');
    return this.handleDeadlineReminders();
  }

  /**
   * Helper Methods
   */

  private aggregateWorkerHours(attendanceData: any[]): any {
    const aggregated = new Map();

    attendanceData.forEach(record => {
      if (!record.check_out_time) return;

      const key = `${record.employee_id}-${record.site_id}`;
      const hoursWorked = this.calculateHoursWorked(
        record.check_in_time,
        record.check_out_time
      );

      if (aggregated.has(key)) {
        aggregated.get(key).total_hours += hoursWorked;
        aggregated.get(key).sessions++;
      } else {
        aggregated.set(key, {
          employee_id: record.employee_id,
          employee_name: `${record.employees.first_name} ${record.employees.last_name}`,
          site_id: record.site_id,
          site_name: record.sites.site_name,
          total_hours: hoursWorked,
          sessions: 1,
        });
      }
    });

    return Array.from(aggregated.values());
  }

  private calculateHoursWorked(checkIn: Date, checkOut: Date): number {
    const diffMs = checkOut.getTime() - checkIn.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  }

  private getStartOfWeek(): Date {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  private getEndOfWeek(): Date {
    const startOfWeek = this.getStartOfWeek();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }

  /**
   * Job Status Monitoring
   */

  async getJobHistory(jobType?: string): Promise<any[]> {
    return this.prisma.background_jobs.findMany({
      where: jobType ? { job_type: jobType } : undefined,
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async getJobStatus(jobType: string): Promise<any> {
    return this.prisma.background_jobs.findFirst({
      where: { job_type: jobType },
      orderBy: { created_at: 'desc' },
    });
  }
}