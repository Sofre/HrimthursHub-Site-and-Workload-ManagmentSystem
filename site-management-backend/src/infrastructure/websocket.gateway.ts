import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface ClientSession {
  employeeId?: number;
  siteId?: number;
  role?: string;
  rooms: string[];
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/site-management',
})
export class SiteManagementGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SiteManagementGateway.name);
  private connectedClients = new Map<string, ClientSession>();

  constructor(private readonly redisService: RedisService) {}

  /**
   * Connection Management
   */

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Initialize client session
    this.connectedClients.set(client.id, {
      rooms: [],
    });

    // Store session in Redis for scaling across multiple servers
    await this.redisService.storeWebSocketSession(client.id, {
      connectedAt: new Date(),
      clientIp: client.handshake.address,
    });

    // Send welcome message
    client.emit('connection', {
      message: 'Connected to Site Management WebSocket',
      timestamp: new Date(),
    });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    const session = this.connectedClients.get(client.id);
    if (session) {
      // Leave all rooms
      session.rooms.forEach(room => {
        client.leave(room);
      });
    }

    // Cleanup
    this.connectedClients.delete(client.id);
    await this.redisService.removeWebSocketSession(client.id);
  }

  /**
   * Authentication & Room Management
   */

  @SubscribeMessage('authenticate')
  async handleAuthentication(
    @ConnectedSocket() client: Socket,
    @MessageBody() authData: { employeeId: number; token?: string; siteId?: number }
  ) {
    try {
      // In production, validate the token here
      // const isValid = await this.validateAuthToken(authData.token);
      
      const session = this.connectedClients.get(client.id);
      if (session) {
        session.employeeId = authData.employeeId;
        session.siteId = authData.siteId;
      }

      // Join employee-specific room
      const employeeRoom = `employee:${authData.employeeId}`;
      client.join(employeeRoom);
      session?.rooms.push(employeeRoom);

      // Join site-specific room if provided
      if (authData.siteId) {
        const siteRoom = `site:${authData.siteId}`;
        client.join(siteRoom);
        session?.rooms.push(siteRoom);
      }

      this.logger.log(`Employee ${authData.employeeId} authenticated and joined rooms`);
      
      client.emit('authenticated', {
        success: true,
        employeeId: authData.employeeId,
        rooms: session?.rooms || [],
      });

    } catch (error) {
      this.logger.error('Authentication error:', error);
      client.emit('authentication_error', { message: 'Authentication failed' });
    }
  }

  @SubscribeMessage('join_site')
  async handleJoinSite(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { siteId: number }
  ) {
    const session = this.connectedClients.get(client.id);
    if (!session?.employeeId) {
      client.emit('error', { message: 'Must authenticate first' });
      return;
    }

    const siteRoom = `site:${data.siteId}`;
    client.join(siteRoom);
    session.rooms.push(siteRoom);
    session.siteId = data.siteId;

    this.logger.log(`Employee ${session.employeeId} joined site ${data.siteId}`);
    
    client.emit('joined_site', { siteId: data.siteId });

    // Notify others in the site room
    client.to(siteRoom).emit('employee_joined_site', {
      employeeId: session.employeeId,
      siteId: data.siteId,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('leave_site')
  async handleLeaveSite(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { siteId: number }
  ) {
    const session = this.connectedClients.get(client.id);
    if (!session) return;

    const siteRoom = `site:${data.siteId}`;
    client.leave(siteRoom);
    session.rooms = session.rooms.filter(room => room !== siteRoom);

    client.emit('left_site', { siteId: data.siteId });

    // Notify others in the site room
    client.to(siteRoom).emit('employee_left_site', {
      employeeId: session.employeeId,
      siteId: data.siteId,
      timestamp: new Date(),
    });
  }

  /**
   * Real-time Event Broadcasting
   */

  // Attendance Events
  async broadcastAttendanceUpdate(siteId: number, data: any) {
    const siteRoom = `site:${siteId}`;
    this.server.to(siteRoom).emit('attendance_update', {
      type: 'attendance_update',
      siteId,
      data,
      timestamp: new Date(),
    });

    // Cache the update in Redis
    await this.redisService.publishAttendanceUpdate(siteId, data);
    
    this.logger.log(`Broadcasted attendance update to site ${siteId}`);
  }

  async broadcastEmployeeCheckIn(siteId: number, employeeData: any) {
    const siteRoom = `site:${siteId}`;
    this.server.to(siteRoom).emit('employee_check_in', {
      type: 'check_in',
      siteId,
      employee: employeeData,
      timestamp: new Date(),
    });

    // Also notify the employee directly
    const employeeRoom = `employee:${employeeData.employee_id}`;
    this.server.to(employeeRoom).emit('check_in_confirmed', {
      siteId,
      timestamp: new Date(),
    });
  }

  async broadcastEmployeeCheckOut(siteId: number, employeeData: any) {
    const siteRoom = `site:${siteId}`;
    this.server.to(siteRoom).emit('employee_check_out', {
      type: 'check_out',
      siteId,
      employee: employeeData,
      timestamp: new Date(),
    });
  }

  // Site Cost Updates
  async broadcastSiteCostUpdate(siteId: number, costData: any) {
    const siteRoom = `site:${siteId}`;
    this.server.to(siteRoom).emit('site_cost_update', {
      type: 'cost_update',
      siteId,
      costData,
      timestamp: new Date(),
    });

    await this.redisService.publishSiteCostUpdate(siteId, costData);
    this.logger.log(`Broadcasted cost update to site ${siteId}`);
  }

  // Material Usage Updates
  async broadcastMaterialUsage(materialId: number, usageData: any) {
    // Notify all relevant rooms (sites where material is used)
    const affectedSites = usageData.sites || [];
    
    // Material usage update methods removed - using simplified inventory management
  }

  // Low Stock Alerts
  async broadcastLowStockAlert(materialData: any) {
    // Notify all managers and supervisors
    this.server.emit('low_stock_alert', {
      type: 'low_stock_alert',
      material: materialData,
      timestamp: new Date(),
    });

    await this.redisService.publishLowStockAlert(materialData);
    this.logger.warn(`Low stock alert: ${materialData.name} (${materialData.quantity} remaining)`);
  }

  // Payment Notifications
  async notifyPaymentUpdate(employeeId: number, paymentData: any) {
    const employeeRoom = `employee:${employeeId}`;
    this.server.to(employeeRoom).emit('payment_notification', {
      type: 'payment_update',
      payment: paymentData,
      timestamp: new Date(),
    });
  }

  // Warning Notifications
  async notifyWarningIssued(employeeId: number, warningData: any) {
    const employeeRoom = `employee:${employeeId}`;
    this.server.to(employeeRoom).emit('warning_notification', {
      type: 'warning_issued',
      warning: warningData,
      timestamp: new Date(),
    });
  }

  // Deadline Reminders
  async broadcastDeadlineReminder(siteId: number, deadlineData: any) {
    const siteRoom = `site:${siteId}`;
    this.server.to(siteRoom).emit('deadline_reminder', {
      type: 'deadline_reminder',
      siteId,
      deadline: deadlineData,
      timestamp: new Date(),
    });
  }

  /**
   * Dashboard Events
   */

  @SubscribeMessage('subscribe_dashboard')
  async handleDashboardSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { employeeId: number; role: string }
  ) {
    // Join dashboard room based on role
    const dashboardRoom = `dashboard:${data.role}`;
    client.join(dashboardRoom);

    const session = this.connectedClients.get(client.id);
    if (session) {
      session.role = data.role;
      session.rooms.push(dashboardRoom);
    }

    // Send initial dashboard data
    const dashboardStats = await this.redisService.getDashboardStats(data.employeeId);
    if (dashboardStats) {
      client.emit('dashboard_data', dashboardStats);
    }

    this.logger.log(`Employee ${data.employeeId} subscribed to dashboard as ${data.role}`);
  }

  async broadcastDashboardUpdate(role: string, updateData: any) {
    const dashboardRoom = `dashboard:${role}`;
    this.server.to(dashboardRoom).emit('dashboard_update', {
      type: 'dashboard_update',
      role,
      data: updateData,
      timestamp: new Date(),
    });
  }

  /**
   * Utility Methods
   */

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get clients by site
  getClientsBySite(siteId: number): string[] {
    const siteRoom = `site:${siteId}`;
    return Array.from(this.server.sockets.adapter.rooms.get(siteRoom) || []);
  }

  // Send direct message to employee
  async sendDirectMessage(employeeId: number, message: any) {
    const employeeRoom = `employee:${employeeId}`;
    this.server.to(employeeRoom).emit('direct_message', {
      ...message,
      timestamp: new Date(),
    });
  }

  // Emergency broadcast to all clients
  async emergencyBroadcast(message: any) {
    this.server.emit('emergency_alert', {
      type: 'emergency',
      message,
      timestamp: new Date(),
    });
    
    this.logger.warn(`Emergency broadcast sent: ${JSON.stringify(message)}`);
  }
}