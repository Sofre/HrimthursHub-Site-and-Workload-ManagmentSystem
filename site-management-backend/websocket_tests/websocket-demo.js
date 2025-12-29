/**
 * 🔌 LIVE WebSocket Demo - Construction Site Management
 * 
 * This demo shows how WebSocket works with your backend system
 * Run this alongside your backend to see real-time features in action
 */

const io = require('socket.io-client');

console.log('🏗️ CONSTRUCTION SITE MANAGEMENT - WEBSOCKET DEMO');
console.log('='.repeat(60));
console.log('This demo simulates multiple users on a construction site\n');

// Demo users
const users = [
  { id: 1, name: 'Sarah Manager', role: 'manager', siteId: 1 },
  { id: 2, name: 'John Supervisor', role: 'supervisor', siteId: 1 },
  { id: 3, name: 'Mike Worker', role: 'employee', siteId: 1 },
  { id: 4, name: 'Lisa Admin', role: 'admin', siteId: null }, // Admin monitors all sites
];

class WebSocketDemo {
  constructor() {
    this.connections = new Map();
    this.messageCount = 0;
  }

  async start() {
    console.log('📡 Connecting users to WebSocket...\n');
    
    // Connect all demo users
    for (const user of users) {
      await this.connectUser(user);
      await this.sleep(500); // Stagger connections
    }

    console.log('\n🎬 Starting real-time simulation...\n');

    // Start demo scenarios
    setTimeout(() => this.simulateEmployeeCheckIn(), 2000);
    setTimeout(() => this.simulateCostUpdate(), 4000);
    setTimeout(() => this.simulateMaterialAlert(), 6000);
    setTimeout(() => this.simulatePaymentNotification(), 8000);
    setTimeout(() => this.simulateDeadlineReminder(), 10000);
    setTimeout(() => this.simulateDashboardUpdate(), 12000);
    
    // Keep demo running
    setTimeout(() => {
      console.log('\n🎯 DEMO COMPLETE - WebSocket connections will stay open for testing');
      console.log('You can now test real API calls to see live updates!');
      this.showApiTestingInstructions();
    }, 14000);
  }

  async connectUser(user) {
    const socket = io('http://localhost:3001/site-management', {
      transports: ['websocket'],
      timeout: 5000,
    });

    this.connections.set(user.id, { user, socket });

    socket.on('connect', () => {
      console.log(`✅ ${user.name} (${user.role}) connected`);
      
      // Authenticate user
      socket.emit('authenticate', {
        employeeId: user.id,
        token: 'demo-token', // In real app, use actual JWT
        siteId: user.siteId,
      });
    });

    socket.on('authenticated', (data) => {
      console.log(`🔐 ${user.name} authenticated - joined rooms:`, data.rooms);
      
      // Subscribe to dashboard if admin/manager
      if (user.role === 'admin' || user.role === 'manager') {
        socket.emit('subscribe_dashboard', {
          employeeId: user.id,
          role: user.role,
        });
      }
    });

    // Listen for all real-time events
    this.setupEventListeners(socket, user);

    socket.on('disconnect', () => {
      console.log(`❌ ${user.name} disconnected`);
    });

    socket.on('connect_error', (error) => {
      console.log(`🚨 ${user.name} connection error:`, error.message);
    });

    return new Promise((resolve) => {
      socket.on('authenticated', resolve);
    });
  }

  setupEventListeners(socket, user) {
    // Attendance updates
    socket.on('attendance_update', (data) => {
      this.logEvent(user, '📋 Attendance Update', data);
    });

    socket.on('employee_check_in', (data) => {
      this.logEvent(user, '🏃‍♂️ Employee Check-In', data);
    });

    socket.on('employee_check_out', (data) => {
      this.logEvent(user, '🏃‍♀️ Employee Check-Out', data);
    });

    // Cost updates
    socket.on('site_cost_update', (data) => {
      this.logEvent(user, '💰 Cost Update', data);
    });

    // Material alerts
    socket.on('low_stock_alert', (data) => {
      this.logEvent(user, '📦 Low Stock Alert', data);
    });

    // Payment notifications
    socket.on('payment_notification', (data) => {
      this.logEvent(user, '💳 Payment Update', data);
    });

    // Deadline reminders
    socket.on('deadline_reminder', (data) => {
      this.logEvent(user, '⏰ Deadline Reminder', data);
    });

    // Dashboard updates
    socket.on('dashboard_update', (data) => {
      this.logEvent(user, '📊 Dashboard Update', data);
    });

    // Direct messages
    socket.on('direct_message', (data) => {
      this.logEvent(user, '📨 Direct Message', data);
    });

    // Emergency alerts
    socket.on('emergency_alert', (data) => {
      this.logEvent(user, '🚨 EMERGENCY ALERT', data);
    });
  }

  logEvent(user, eventType, data) {
    this.messageCount++;
    console.log(`[${this.messageCount}] ${user.name} received: ${eventType}`);
    if (data.data || data.employee || data.material) {
      console.log(`    Details: ${JSON.stringify(data.data || data.employee || data.material || data.message || 'Event triggered')}`);
    }
  }

  // Simulation methods that would normally be triggered by your API
  async simulateEmployeeCheckIn() {
    console.log('\n🎭 SIMULATION: Employee checking in to site...');
    
    // This simulates what happens when someone calls POST /attendance/check-in
    const gateway = this.getGatewayReference();
    if (gateway) {
      await gateway.broadcastEmployeeCheckIn(1, {
        employee_id: 3,
        employee_name: 'Mike Worker',
        check_in_time: new Date(),
        site_id: 1,
      });
    }
  }

  async simulateCostUpdate() {
    console.log('\n🎭 SIMULATION: Site cost calculation updated...');
    
    // This simulates what happens when cost calculation service runs
    const gateway = this.getGatewayReference();
    if (gateway) {
      await gateway.broadcastSiteCostUpdate(1, {
        site_id: 1,
        total_cost: 15750.50,
        labor_cost: 12000.00,
        material_cost: 3750.50,
        budget_percentage: 78.5,
      });
    }
  }

  async simulateMaterialAlert() {
    console.log('\n🎭 SIMULATION: Low stock alert triggered...');
    
    const gateway = this.getGatewayReference();
    if (gateway) {
      await gateway.broadcastLowStockAlert({
        material_id: 1,
        name: 'Concrete Mix',
        current_quantity: 5,
        minimum_quantity: 10,
        site_id: 1,
      });
    }
  }

  async simulatePaymentNotification() {
    console.log('\n🎭 SIMULATION: Payment processed for employee...');
    
    const gateway = this.getGatewayReference();
    if (gateway) {
      await gateway.notifyPaymentUpdate(3, {
        payment_id: 101,
        amount: 1200.00,
        payment_type: 'weekly_salary',
        payment_date: new Date(),
        status: 'completed',
      });
    }
  }

  async simulateDeadlineReminder() {
    console.log('\n🎭 SIMULATION: Project deadline approaching...');
    
    const gateway = this.getGatewayReference();
    if (gateway) {
      await gateway.broadcastDeadlineReminder(1, {
        site_name: 'Downtown Office Complex',
        deadline: '2025-12-15',
        days_remaining: 11,
        completion_percentage: 65,
        status: 'warning',
      });
    }
  }

  async simulateDashboardUpdate() {
    console.log('\n🎭 SIMULATION: Dashboard metrics updated...');
    
    const gateway = this.getGatewayReference();
    if (gateway) {
      await gateway.broadcastDashboardUpdate('manager', {
        active_employees: 25,
        total_cost_today: 8500.00,
        materials_low_stock: 3,
        attendance_rate: 92.5,
        budget_alerts: 1,
      });
    }
  }

  getGatewayReference() {
    // In a real scenario, you'd inject the gateway service
    // For demo purposes, we'll simulate the events
    return {
      async broadcastEmployeeCheckIn(siteId, data) {
        // Emit to all connected sockets in site room
        users.forEach(user => {
          const conn = this.connections.get(user.id);
          if (conn && (user.siteId === siteId || user.role === 'admin')) {
            conn.socket.emit('employee_check_in', {
              type: 'check_in',
              siteId,
              employee: data,
              timestamp: new Date(),
            });
          }
        });
      },
      
      async broadcastSiteCostUpdate(siteId, data) {
        users.forEach(user => {
          const conn = this.connections.get(user.id);
          if (conn && (user.siteId === siteId || user.role === 'admin' || user.role === 'manager')) {
            conn.socket.emit('site_cost_update', {
              type: 'cost_update',
              siteId,
              data,
              timestamp: new Date(),
            });
          }
        });
      },
      
      async broadcastLowStockAlert(data) {
        users.forEach(user => {
          const conn = this.connections.get(user.id);
          if (conn && (user.role === 'manager' || user.role === 'admin' || user.role === 'supervisor')) {
            conn.socket.emit('low_stock_alert', {
              type: 'low_stock_alert',
              material: data,
              timestamp: new Date(),
            });
          }
        });
      },
      
      async notifyPaymentUpdate(employeeId, data) {
        const conn = this.connections.get(employeeId);
        if (conn) {
          conn.socket.emit('payment_notification', {
            type: 'payment_update',
            payment: data,
            timestamp: new Date(),
          });
        }
      },
      
      async broadcastDeadlineReminder(siteId, data) {
        users.forEach(user => {
          const conn = this.connections.get(user.id);
          if (conn && (user.siteId === siteId || user.role === 'admin' || user.role === 'manager')) {
            conn.socket.emit('deadline_reminder', {
              type: 'deadline_reminder',
              siteId,
              deadline: data,
              timestamp: new Date(),
            });
          }
        });
      },
      
      async broadcastDashboardUpdate(role, data) {
        users.forEach(user => {
          const conn = this.connections.get(user.id);
          if (conn && user.role === role) {
            conn.socket.emit('dashboard_update', {
              type: 'dashboard_update',
              role,
              data,
              timestamp: new Date(),
            });
          }
        });
      },
    };
  }

  showApiTestingInstructions() {
    console.log('\n📖 API TESTING INSTRUCTIONS:');
    console.log('='.repeat(50));
    console.log('While this demo is running, test these API calls to see live WebSocket updates:');
    console.log('');
    console.log('1. 📋 ATTENDANCE CHECK-IN:');
    console.log('   POST http://localhost:3001/attendance/check-in');
    console.log('   Body: {"employee_id": 3, "site_id": 1}');
    console.log('   → Will trigger employee_check_in WebSocket event');
    console.log('');
    console.log('2. 💰 COST CALCULATION:');
    console.log('   GET http://localhost:3001/cost-calculation/site/1');
    console.log('   → Will trigger site_cost_update WebSocket event (if re-enabled)');
    console.log('');
    console.log('3. 💳 PAYMENT PROCESSING:');
    console.log('   POST http://localhost:3001/payments');
    console.log('   Body: {"employee_id": 3, "amount": 500, "payment_type": "bonus"}');
    console.log('   → Will trigger payment_notification WebSocket event');
    console.log('');
    console.log('4. 📦 MATERIAL UPDATES:');
    console.log('   PUT http://localhost:3001/materials/1');
    console.log('   Body: {"quantity": 5}  # Below minimum threshold');
    console.log('   → Will trigger low_stock_alert WebSocket event');
    console.log('');
    console.log('💡 Watch the console above to see real-time events as you make API calls!');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up connections...');
    for (const [id, conn] of this.connections) {
      conn.socket.disconnect();
    }
    this.connections.clear();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down WebSocket demo...');
  process.exit(0);
});

// Start the demo
async function runDemo() {
  console.log('🚀 Make sure your backend is running on http://localhost:3001');
  console.log('📡 Starting WebSocket demo in 3 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const demo = new WebSocketDemo();
  await demo.start();
}

// Only run if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = WebSocketDemo;