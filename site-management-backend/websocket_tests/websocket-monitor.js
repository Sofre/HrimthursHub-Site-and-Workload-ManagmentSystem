const { io } = require('socket.io-client');

console.log('🔌 WebSocket Event Monitor - Running in background');

const socket = io('http://localhost:3001/site-management', {
  transports: ['websocket'],
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ Monitor connected:', socket.id);
  
  // Authenticate as employee 2
  socket.emit('authenticate', {
    employeeId: 2,
    siteId: 1
  });
});

socket.on('authenticated', (data) => {
  console.log('✅ Monitor authenticated, joined rooms:', data.rooms);
});

// Listen for all possible events
const events = [
  'attendance_update',
  'employee_check_in', 
  'employee_check_out',
  'site_cost_update',
  'low_stock_alert',
  'payment_notification',
  'warning_notification',
  'deadline_reminder',
  'emergency_alert',
  'check_in_confirmed'
];

events.forEach(event => {
  socket.on(event, (data) => {
    console.log(`🔥 REAL-TIME EVENT: ${event.toUpperCase()}`);
    console.log('   Data:', JSON.stringify(data, null, 2));
    console.log('   ==========================================');
  });
});

socket.on('connection', (data) => {
  console.log('📨 Connection confirmed:', data.message);
});

// Keep monitor running
console.log('🎧 Monitoring WebSocket events... Press Ctrl+C to stop');

process.on('SIGINT', () => {
  console.log('\n👋 Stopping monitor...');
  socket.disconnect();
  process.exit(0);
});