import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { stringify } from 'querystring';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private firebase: admin.app.App;

  constructor(private readonly prisma: PrismaService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      if (!admin.apps.length) {
        const serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });

        this.logger.log('Firebase Admin SDK initialized successfully');
      }
      this.firebase = admin.app();
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      // Don't throw here - allow service to work without Firebase in development
    }
  }

  async sendNotificationToEmployee(
    employeeId: number,
    notification: NotificationPayload,
  ): Promise<boolean> {
    try {
      // 1. Check notification preferences first
      const preferences = await this.prisma.notification_preferences.findUnique({
        where: { employee_id: employeeId }
      });

      if (!preferences?.push_enabled) {
        this.logger.log(`Notifications disabled for employee ${employeeId}`);
        return false;
      }

      // 2. Get active device tokens
      const deviceTokens = await this.prisma.device_tokens.findMany({
        where: {
          employee_id: employeeId,
          is_active: true
        }
      });

      if (deviceTokens.length === 0) {
        this.logger.warn(`No active device tokens for employee ${employeeId}`);
        return false;
      }

      // 3. Store notification in database first
      const dbNotification = await this.prisma.notifications.create({
        data: {
          employee_id: employeeId,
          title: notification.title,
          message: notification.body,
          type: 'general',
          data: notification.data ? notification.data : undefined,
          is_sent: false, // Will update after Firebase
        },
      });

      // 4. Send via Firebase FCM
      const tokens = deviceTokens.map(token => token.device_token);
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        tokens: tokens,
      };

      const response = await admin.messaging().sendMulticast(message);

      // 5. Update notification as sent
      await this.prisma.notifications.update({
        where: { notification_id: dbNotification.notification_id },
        data: {
          is_sent: true,
          sent_at: new Date(),
        },
      });

      // 6. Handle failed tokens
      if (response.failureCount > 0) {
        await this.handleFailedTokens(response.responses, deviceTokens);
      }

      this.logger.log(
        `Notification sent to employee ${employeeId}. Success: ${response.successCount}, Failed: ${response.failureCount}`
      );
      return response.successCount > 0;
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      return false;
    }
  }

  // Alias for compatibility
  async sendNotificationToUser(
    employeeId: number,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<void> {
    await this.sendNotificationToEmployee(employeeId, notification);
  }

  // Send notification to all employees with specific role
  async sendNotificationToRole(
    role: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<void> {
    try {
      const employees = await this.prisma.employees.findMany({
        where: { 
          roles: {
            role_name: role
          }
        },
        select: { employee_id: true },
      });

      await Promise.all(
        employees.map(employee =>
          this.sendNotificationToEmployee(employee.employee_id, notification)
        )
      );
    } catch (error) {
      this.logger.error(`Failed to send notification to role ${role}:`, error);
    }
  }

  // Handle failed FCM tokens
  private async handleFailedTokens(
    responses: admin.messaging.SendResponse[],
    deviceTokens: any[]
  ): Promise<void> {
    const failedTokens = responses
      .map((response, index) => ({
        response,
        token: deviceTokens[index]
      }))
      .filter(({ response }) => !response.success)
      .filter(({ response }) => 
        response.error?.code === 'messaging/registration-token-not-registered'
      );

    // Deactivate invalid tokens
    for (const { token } of failedTokens) {
      await this.prisma.device_tokens.update({
        where: { token_id: token.token_id },
        data: { is_active: false }
      });
    }

    this.logger.log(`Deactivated ${failedTokens.length} invalid FCM tokens`);
  }

  // Check if notification type is allowed for employee
  private async checkNotificationPermission(
    employeeId: number, 
    notificationType: string
  ): Promise<boolean> {
    const preferences = await this.prisma.notification_preferences.findUnique({
      where: { employee_id: employeeId }
    });

    if (!preferences?.push_enabled) return false;

    const typeMap = {
      'warning': preferences.warning_push,
      'payment': preferences.payment_push,
      'deadline': preferences.deadline_push,
      'low_stock': preferences.low_stock_push,
      'check_in': preferences.check_in_push,
    };

    return typeMap[notificationType] ?? true; // Default to true for unknown types
  }

  // Device token management
  async registerDeviceToken(employeeId: number, token: string, deviceType: string): Promise<void> {
    try {
      await this.prisma.device_tokens.upsert({
        where: {
          employee_id_device_token: {
            employee_id: employeeId,
            device_token: token,
          },
        },
        update: {
          is_active: true,
          updated_at: new Date(),
        },
        create: {
          employee_id: employeeId,
          device_token: token,
          device_type: deviceType,
          is_active: true,
        },
      });

      this.logger.log(`Device token registered for employee ${employeeId}`);
    } catch (error) {
      this.logger.error('Failed to register device token:', error);
    }
  }

  async unregisterDeviceToken(token: string): Promise<void> {
    try {
      await this.prisma.device_tokens.updateMany({
        where: { device_token: token },
        data: { is_active: false },
      });

      this.logger.log('Device token unregistered');
    } catch (error) {
      this.logger.error('Failed to unregister device token:', error);
    }
  }

  // Notification preferences
  async updateNotificationPreferences(
    employeeId: number,
    preferences: {
      push_enabled?: boolean;
      email_enabled?: boolean;
      warning_push?: boolean;
      payment_push?: boolean;
      deadline_push?: boolean;
      low_stock_push?: boolean;
      check_in_push?: boolean;
    }
  ): Promise<void> {
    try {
      await this.prisma.notification_preferences.upsert({
        where: { employee_id: employeeId },
        update: {
          ...preferences,
          updated_at: new Date(),
        },
        create: {
          employee_id: employeeId,
          ...preferences,
        },
      });

      this.logger.log(`Notification preferences updated for employee ${employeeId}`);
    } catch (error) {
      this.logger.error('Failed to update notification preferences:', error);
    }
  }

  // Get notifications for employee
  async getEmployeeNotifications(employeeId: number, unreadOnly: boolean = false) {
    try {
      const where: any = { employee_id: employeeId };
      if (unreadOnly) {
        where.is_read = false;
      }

      return await this.prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: 50,
      });
    } catch (error) {
      this.logger.error('Failed to get employee notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      await this.prisma.notifications.update({
        where: { notification_id: notificationId },
        data: { is_read: true },
      });
    } catch (error) {
      this.logger.error('Failed to mark notification as read:', error);
    }
  }

  // Additional methods for compatibility
  async sendDeadlineReminder(reminderData: any): Promise<void> {
    // Send to all supervisors and managers at the site
    const employees = await this.prisma.employees.findMany({
      where: {
        attendance_logs: {
          some: {
            site_id: reminderData.site_id,
            status: 'checked_in'
          }
        },
        roles: {
          role_name: { in: ['supervisor', 'manager'] }
        }
      },
      select: { employee_id: true }
    });

    await Promise.all(
      employees.map(employee =>
        this.sendNotificationWithType(employee.employee_id, {
          title: '⏰ Deadline Reminder',
          body: `Site ${reminderData.site_name} deadline is approaching`,
          data: reminderData
        }, 'deadline')
      )
    );
  }

  async sendLowStockAlert(material: any): Promise<void> {
    // Send to supervisors at the site where material is low
    const employees = await this.prisma.employees.findMany({
      where: {
        attendance_logs: {
          some: {
            site_id: material.site_id,
            status: 'checked_in'
          }
        },
        roles: {
          role_name: { in: ['supervisor', 'manager'] }
        }
      },
      select: { employee_id: true }
    });

    await Promise.all(
      employees.map(employee =>
        this.sendNotificationWithType(employee.employee_id, {
          title: '🚨 Low Stock Alert',
          body: `Low stock for material: ${material.name}. Only ${material.quantity} ${material.unit} remaining.`,
          data: material
        }, 'low_stock')
      )
    );
  }

  async sendWarningNotification(
    employeeId: number,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    await this.sendNotificationWithType(employeeId, {
      title: `⚠️ ${title}`,
      body: message,
      data
    }, 'warning');
  }

  // Helper method to send notifications with type checking
  private async sendNotificationWithType(
    employeeId: number,
    notification: NotificationPayload,
    type: string
  ): Promise<boolean> {
    // Check if employee wants this type of notification
    const hasPermission = await this.checkNotificationPermission(employeeId, type);
    if (!hasPermission) {
      this.logger.log(`Employee ${employeeId} has disabled ${type} notifications`);
      return false;
    }

    return this.sendNotificationToEmployee(employeeId, notification);
  }
}