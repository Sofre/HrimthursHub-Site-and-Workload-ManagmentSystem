const { io } = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3001';
const NAMESPACE = '/site-management';

console.log('🔌 Starting WebSocket Testing Suite for Site Management Backend\n');

class WebSocketTester {
  constructor() {
    this.socket = null;
    this.testResults = {
      connection: false,
      authentication: false,
      joinSite: false,
      attendanceUpdate: false,
      employeeCheckIn: false,
      employeeCheckOut: false,
      siteCostUpdate: false,
      lowStockAlert: false,
      paymentNotification: false,
      warningNotification: false,
      deadlineReminder: false,
      emergencyAlert: false
    };
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log('📡 Connecting to WebSocket server...');
      
      this.socket = io(`${SERVER_URL}${NAMESPACE}`, {
        transports: ['websocket'],
        forceNew: true,
        timeout: 5000
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server');
        console.log(`   Client ID: ${this.socket.id}`);
        this.testResults.connection = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.log('❌ Connection failed:', error.message);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('📴 Disconnected from server');
      });

      // Setup event listeners for testing
      this.setupEventListeners();
    });
  }

  setupEventListeners() {
    // Connection confirmation
    this.socket.on('connection', (data) => {
      console.log('📨 Connection message received:', data.message);
      console.log('   Timestamp:', data.timestamp);
    });

    // Authentication response
    this.socket.on('authenticated', (data) => {
      console.log('✅ Authentication successful');
      console.log('   Employee ID:', data.employeeId);
      console.log('   Rooms joined:', data.rooms);
      this.testResults.authentication = true;
    });

    this.socket.on('authentication_error', (error) => {
      console.log('❌ Authentication failed:', error.message);
    });

    // Site joining
    this.socket.on('joined_site', (data) => {
      console.log('✅ Joined site successfully');
      console.log('   Site ID:', data.siteId);
      this.testResults.joinSite = true;
    });

    this.socket.on('employee_joined_site', (data) => {
      console.log('👥 Employee joined site notification:');
      console.log('   Employee ID:', data.employeeId);
      console.log('   Site ID:', data.siteId);
    });

    // Attendance events
    this.socket.on('attendance_update', (data) => {
      console.log('📊 Attendance update received:');
      console.log('   Site ID:', data.siteId);
      console.log('   Data:', JSON.stringify(data.data, null, 2));
      this.testResults.attendanceUpdate = true;
    });

    this.socket.on('employee_check_in', (data) => {
      console.log('👋 Employee check-in notification:');
      console.log('   Site ID:', data.siteId);
      console.log('   Employee:', JSON.stringify(data.employee, null, 2));
      this.testResults.employeeCheckIn = true;
    });

    this.socket.on('employee_check_out', (data) => {
      console.log('👋 Employee check-out notification:');
      console.log('   Site ID:', data.siteId);
      console.log('   Employee:', JSON.stringify(data.employee, null, 2));
      this.testResults.employeeCheckOut = true;
    });

    this.socket.on('check_in_confirmed', (data) => {
      console.log('✅ Check-in confirmed for employee');
      console.log('   Site ID:', data.siteId);
    });

    // Cost updates
    this.socket.on('site_cost_update', (data) => {
      console.log('💰 Site cost update received:');
      console.log('   Site ID:', data.siteId);
      console.log('   Cost Data:', JSON.stringify(data.costData, null, 2));
      this.testResults.siteCostUpdate = true;
    });

    // Stock alerts
    this.socket.on('low_stock_alert', (data) => {
      console.log('⚠️  Low stock alert received:');
      console.log('   Material:', JSON.stringify(data.material, null, 2));
      this.testResults.lowStockAlert = true;
    });

    // Payment notifications
    this.socket.on('payment_notification', (data) => {
      console.log('💳 Payment notification received:');
      console.log('   Payment:', JSON.stringify(data.payment, null, 2));
      this.testResults.paymentNotification = true;
    });

    // Warning notifications
    this.socket.on('warning_notification', (data) => {
      console.log('⚠️  Warning notification received:');
      console.log('   Warning:', JSON.stringify(data.warning, null, 2));
      this.testResults.warningNotification = true;
    });

    // Deadline reminders
    this.socket.on('deadline_reminder', (data) => {
      console.log('⏰ Deadline reminder received:');
      console.log('   Site ID:', data.siteId);
      console.log('   Deadline:', JSON.stringify(data.deadline, null, 2));
      this.testResults.deadlineReminder = true;
    });

    // Emergency alerts
    this.socket.on('emergency_alert', (data) => {
      console.log('🚨 EMERGENCY ALERT received:');
      console.log('   Message:', JSON.stringify(data.message, null, 2));
      this.testResults.emergencyAlert = true;
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message);
    });
  }

  async authenticate() {
    console.log('\n🔐 Testing authentication...');
    this.socket.emit('authenticate', {
      employeeId: 2,
      token: 'test-token-123',
      siteId: 1
    });

    // Wait for authentication response
    await this.wait(1000);
  }

  async joinSite() {
    console.log('\n🏢 Testing site joining...');
    this.socket.emit('join_site', {
      siteId: 2
    });

    await this.wait(1000);
  }

  async testManualEvents() {
    console.log('\n📋 Testing manual event triggers...');
    console.log('Note: These would normally be triggered by backend services');
    
    // Simulate various events by emitting them directly
    // (In production, these would be called from backend services)
    
    console.log('\nℹ️  To test real events, trigger actions in the backend:');
    console.log('   - Create attendance records');
    console.log('   - Update site costs');
    console.log('   - Create payments');
    console.log('   - Issue warnings');
    console.log('   - Update material stock');
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async disconnect() {
    if (this.socket) {
      console.log('\n📴 Disconnecting from server...');
      this.socket.disconnect();
      await this.wait(500);
    }
  }

  printResults() {
    console.log('\n📊 WebSocket Test Results:');
    console.log('================================');
    
    Object.entries(this.testResults).forEach(([test, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    });
    
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(Boolean).length;
    
    console.log('\n📈 Summary:');
    console.log(`   Passed: ${passedTests}/${totalTests} tests`);
    console.log(`   Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All WebSocket tests passed!');
    } else {
      console.log('\n⚠️  Some tests did not complete. Check server logs for details.');
    }
  }
}

// Main test execution
async function runWebSocketTests() {
  const tester = new WebSocketTester();

  try {
    // Test connection
    await tester.connect();
    await tester.wait(1000);

    // Test authentication
    await tester.authenticate();
    await tester.wait(1000);

    // Test site joining
    await tester.joinSite();
    await tester.wait(1000);

    // Test manual events
    await tester.testManualEvents();
    
    // Keep connection alive for a bit to receive any backend events
    console.log('\n⏳ Waiting 10 seconds for backend events...');
    await tester.wait(10000);

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    // Disconnect and show results
    await tester.disconnect();
    tester.printResults();
  }
}

// Run the tests
runWebSocketTests().catch(console.error);