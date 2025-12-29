/**
 * 🔌 Simple WebSocket Example - Construction Site Management
 * 
 * This shows how WebSocket works with your backend system
 */

const io = require('socket.io-client');

console.log('🏗️ SIMPLE WEBSOCKET EXAMPLE');
console.log('=' * 40);

// Create a connection to your WebSocket server
const socket = io('http://localhost:3001/site-management', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✅ Connected to Site Management WebSocket');
  console.log('Socket ID:', socket.id);
  
  // Authenticate as a manager
  socket.emit('authenticate', {
    employeeId: 1,
    token: 'demo-token',
    siteId: 1,
  });
});

socket.on('authenticated', (data) => {
  console.log('🔐 Authentication successful!');
  console.log('Joined rooms:', data.rooms);
  
  // Subscribe to dashboard updates
  socket.emit('subscribe_dashboard', {
    employeeId: 1,
    role: 'manager'
  });
  
  console.log('\n📡 Now listening for real-time events...\n');
  startApiTestExample();
});

// Listen for all real-time events
socket.on('attendance_update', (data) => {
  console.log('📋 [REAL-TIME] Attendance Update:', JSON.stringify(data, null, 2));
});

socket.on('employee_check_in', (data) => {
  console.log('🏃‍♂️ [REAL-TIME] Employee Check-In:', JSON.stringify(data, null, 2));
});

socket.on('employee_check_out', (data) => {
  console.log('🏃‍♀️ [REAL-TIME] Employee Check-Out:', JSON.stringify(data, null, 2));
});

socket.on('site_cost_update', (data) => {
  console.log('💰 [REAL-TIME] Cost Update:', JSON.stringify(data, null, 2));
});

socket.on('low_stock_alert', (data) => {
  console.log('📦 [REAL-TIME] Low Stock Alert:', JSON.stringify(data, null, 2));
});

socket.on('payment_notification', (data) => {
  console.log('💳 [REAL-TIME] Payment Update:', JSON.stringify(data, null, 2));
});

socket.on('deadline_reminder', (data) => {
  console.log('⏰ [REAL-TIME] Deadline Reminder:', JSON.stringify(data, null, 2));
});

socket.on('dashboard_update', (data) => {
  console.log('📊 [REAL-TIME] Dashboard Update:', JSON.stringify(data, null, 2));
});

socket.on('emergency_alert', (data) => {
  console.log('🚨 [REAL-TIME] EMERGENCY ALERT:', JSON.stringify(data, null, 2));
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket');
});

socket.on('connect_error', (error) => {
  console.log('🚨 Connection error:', error.message);
  console.log('💡 Make sure your backend is running on http://localhost:3001');
});

function startApiTestExample() {
  console.log('🧪 TESTING REAL-TIME FEATURES');
  console.log('-'.repeat(40));
  console.log('Now make API calls to see WebSocket events in real-time:\n');
  
  console.log('1️⃣  TEST ATTENDANCE CHECK-IN:');
  console.log('   Run: curl -X POST http://localhost:3001/attendance/check-in \\');
  console.log('        -H "Content-Type: application/json" \\');
  console.log('        -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('        -d \'{"employee_id": 1, "site_id": 1}\'');
  console.log('   → Should trigger employee_check_in WebSocket event\n');
  
  console.log('2️⃣  TEST COST CALCULATION:');
  console.log('   Run: curl http://localhost:3001/cost-calculation/site/1 \\');
  console.log('        -H "Authorization: Bearer YOUR_TOKEN"');
  console.log('   → Would trigger site_cost_update WebSocket event (when re-enabled)\n');
  
  console.log('3️⃣  MANUAL TEST - Join another site:');
  console.log('   Run this in another terminal:');
  console.log('   node -e "');
  console.log('     const io = require(\'socket.io-client\');');
  console.log('     const s = io(\'http://localhost:3001/site-management\');');
  console.log('     s.emit(\'join_site\', {siteId: 2});');
  console.log('   "\n');
  
  setTimeout(() => {
    console.log('🎬 Simulating some events...\n');
    simulateEvents();
  }, 3000);
}

function simulateEvents() {
  // Simulate events by emitting them manually
  console.log('📤 Simulating employee check-in...');
  
  setTimeout(() => {
    // Join another site to test room functionality
    socket.emit('join_site', { siteId: 2 });
  }, 1000);
  
  setTimeout(() => {
    console.log('📤 Testing site leave...');
    socket.emit('leave_site', { siteId: 2 });
  }, 3000);
  
  setTimeout(() => {
    console.log('\n✨ WebSocket connection established and tested!');
    console.log('💡 Keep this running and test your API endpoints to see real-time updates');
    console.log('📋 The WebSocket will show live events as you use your backend API');
  }, 5000);
}

console.log('\n🔌 Connecting to WebSocket server...');