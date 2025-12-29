# Site Management Infrastructure

This directory contains the **infrastructure services** that power your site management system's advanced features: real-time updates, caching, notifications, task scheduling, and location services.

## 🏗️ **Infrastructure Architecture**

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Frontend       │   Controllers   │    Services     │  Infrastructure │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ React/Mobile    │ REST Endpoints  │ Business Logic  │ System Services │
│ WebSocket UI    │ HTTP Handlers   │ Domain Rules    │ Background Jobs │
│ Push Notifications│ Route Guards  │ Data Validation │ External APIs   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
                                                             ↓
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│     Redis       │   WebSockets    │   Scheduler     │   Notifications │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Caching Layer   │ Real-time Comms │ Background Jobs │ Push Messaging  │
│ Session Storage │ Live Updates    │ Cron Tasks      │ Firebase FCM    │
│ Pub/Sub Events  │ Room Management │ Data Aggregation│ Device Tokens   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
                                                             ↓
┌─────────────────────────────────┬─────────────────────────────────────┐
│          Maps Integration       │            Database                 │
├─────────────────────────────────┼─────────────────────────────────────┤
│ Google Maps API                 │ PostgreSQL + Prisma                 │
│ Geocoding & Distance Calc       │ Site Locations, Device Tokens       │
│ Check-in Verification           │ Notifications, Background Jobs      │
└─────────────────────────────────┴─────────────────────────────────────┘
```

---

## 🔧 **Infrastructure Services Overview**

### **1. Redis Service** (`redis.service.ts`)
**High-performance caching and pub/sub messaging**

#### **Caching Strategies with TTL:**
- **Employee Profiles**: 1 hour TTL - `employee:profile:{id}`
- **Site Cost Calculations**: 30 min TTL - `site:cost:{id}`
- **Material Usage**: 15 min TTL - `material:usage:{id}`
- **Active Employees**: 5 min TTL - `site:active_employees:{id}`
- **WebSocket Sessions**: 24 hour TTL - `ws:session:{id}`
- **Search Results**: 10 min TTL - `search:{hash}`
- **Dashboard Stats**: 5 min TTL - `dashboard:stats:{id}`

#### **Pub/Sub Channels:**
- `attendance:site:{id}` - Real-time attendance updates
- `cost:site:{id}` - Site cost calculations
- `material:usage:{id}` - Material consumption events
- `alerts:low_stock` - Low stock notifications

```typescript
// Usage Examples
await redisService.cacheEmployeeProfile(employeeId, profile);
await redisService.publishAttendanceUpdate(siteId, attendanceData);
const cachedProfile = await redisService.getEmployeeProfile(employeeId);
```

---

### **2. WebSocket Gateway** (`websocket.gateway.ts`) 
**Real-time bidirectional communication**

#### **WebSocket Features:**
- **Authentication**: Employee-based session management
- **Room Management**: Site-specific and role-based rooms
- **Real-time Events**: Live attendance, cost updates, alerts
- **Background Sync**: Redis-backed session persistence

#### **Event Types:**
- `attendance_update` - Employee check-in/out events
- `employee_check_in` / `employee_check_out` - Site attendance
- `site_cost_update` - Real-time cost calculations
- `material_usage_update` - Inventory changes
- `low_stock_alert` - Material shortage warnings
- `payment_notification` - Payment status updates
- `deadline_reminder` - Project deadline alerts
- `emergency_alert` - Critical site notifications

```typescript
// Client Connection Examples
socket.emit('authenticate', { employeeId: 5, siteId: 2 });
socket.emit('join_site', { siteId: 2 });

// Server Broadcasting
await gateway.broadcastAttendanceUpdate(siteId, attendanceData);
await gateway.broadcastLowStockAlert(materialData);
```

---

### **3. Task Scheduler Service** (`task-scheduler.service.ts`)
**Automated background job processing**

#### **Scheduled Tasks:**
- **Daily Aggregation** (1:00 AM) - Worker-hour calculations
- **Weekly Costs** (Sunday 2:00 AM) - Site expense summaries  
- **Deadline Reminders** (9:00 AM daily) - Project alerts
- **Cleanup Jobs** (3:00 AM daily) - Data housekeeping
- **Low Stock Check** (Every 2 hours, 8AM-6PM) - Inventory monitoring

#### **Job Processing:**
- **Redis State Management** - Job tracking and results
- **Database Logging** - Audit trail in `background_jobs` table
- **Error Handling** - Failure tracking and retry logic
- **Manual Triggers** - On-demand job execution

```typescript
// Manual Job Triggers
await scheduler.triggerDailyAggregation();
await scheduler.triggerWeeklyCostCalculation();
const jobHistory = await scheduler.getJobHistory('daily_aggregation');
```

---

### **4. Notification Service** (`notification.service.ts`)
**Firebase Cloud Messaging integration**

#### **Notification Types:**
- **Warning Notifications** - Employee disciplinary alerts
- **Payment Updates** - Salary and payment status
- **Deadline Reminders** - Project timeline alerts  
- **Low Stock Alerts** - Inventory shortage warnings
- **Check-in Confirmations** - Attendance verification
- **Emergency Broadcasts** - Critical site alerts

#### **Features:**
- **Device Token Management** - iOS, Android, Web support
- **Preference Settings** - Per-employee notification controls
- **Batch Notifications** - Efficient multi-user messaging
- **Delivery Tracking** - Success/failure monitoring
- **Invalid Token Cleanup** - Automatic token maintenance

```typescript
// Notification Examples
await notificationService.sendWarningNotification(employeeId, warningData);
await notificationService.sendLowStockAlert(materialData);
await notificationService.registerDeviceToken(employeeId, token, 'ios');
```

---

### **5. Maps Service** (`maps.service.ts`)
**Google Maps API integration for location features**

#### **Location Features:**
- **Address Geocoding** - Convert addresses to coordinates
- **Reverse Geocoding** - Get addresses from coordinates
- **Address Autocomplete** - Smart address suggestions
- **Distance Calculations** - Route planning and measurement
- **Check-in Verification** - Location-based attendance validation

#### **Site Management:**
- **Site Location Storage** - Coordinate management in database
- **Proximity Detection** - Find nearby employees/sites
- **Batch Geocoding** - Process all site addresses
- **Validation History** - Audit check-in attempts

```typescript
// Location Usage Examples
const address = await mapsService.geocodeAddress("123 Main St");
const validation = await mapsService.validateCheckInLocation(employeeId, siteId, coords);
const nearbySites = await mapsService.getSitesNearLocation(coords, 10);
await mapsService.storeSiteLocation(siteId, addressDetails);
```

---

## 🚀 **Setup Instructions**

### **1. Install Dependencies**
```bash
npm install ioredis cache-manager cache-manager-redis-yet
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install @nestjs/schedule cron bull @nestjs/bull
npm install firebase-admin
npm install @googlemaps/google-maps-services-js
```

### **2. Redis Setup**

#### **Option A: Local Redis**
```bash
# Windows (via Chocolatey)
choco install redis-64

# Start Redis
redis-server
```

#### **Option B: Docker Redis**
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

#### **Option C: Redis Cloud** (Recommended for production)
- Sign up at [Redis Cloud](https://redis.com/cloud/)
- Create database and get connection details

### **3. Firebase Setup**
1. **Create Firebase Project**: [Firebase Console](https://console.firebase.google.com/)
2. **Enable Cloud Messaging**: Project Settings → Cloud Messaging
3. **Generate Service Account**: Project Settings → Service Accounts → Generate Key
4. **Add Credentials to .env**:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-key\n-----END PRIVATE KEY-----"
```

### **4. Google Maps Setup**
1. **Enable APIs**: [Google Cloud Console](https://console.cloud.google.com/)
   - Geocoding API
   - Distance Matrix API
   - Places API
2. **Create API Key**: APIs & Services → Credentials
3. **Add to Environment**:
```env
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### **5. Environment Configuration**
Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/site_management"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# APIs
GOOGLE_MAPS_API_KEY=your_maps_key
FIREBASE_PROJECT_ID=your_firebase_project
FIREBASE_CLIENT_EMAIL=your_firebase_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"

# Application
FRONTEND_URL=http://localhost:3000
MAX_CHECKIN_DISTANCE_METERS=100
```

---

## 🔌 **Integration Examples**

### **Enhanced Attendance with Location Verification**

```typescript
// In AttendanceService - enhanced check-in
async checkInWithLocationVerification(
  employeeId: number, 
  siteId: number, 
  location: { latitude: number; longitude: number }
) {
  // Validate location
  const validation = await this.mapsService.validateCheckInLocation(
    employeeId, siteId, location
  );
  
  if (!validation.is_valid) {
    throw new BadRequestException(validation.message);
  }

  // Perform check-in
  const attendance = await this.checkIn(employeeId, siteId);
  
  // Real-time notification
  await this.websocketGateway.broadcastEmployeeCheckIn(siteId, {
    employee_id: employeeId,
    location_verified: true,
    distance_meters: validation.distance_meters,
  });
  
  // Send confirmation
  await this.notificationService.sendCheckInConfirmation(employeeId, siteData);
  
  // Cache active employees
  const activeEmployees = await this.getActiveEmployeesOnSite(siteId);
  await this.redisService.cacheActiveEmployees(siteId, activeEmployees);
  
  return attendance;
}
```

### **Smart Material Usage with Real-time Alerts**

```typescript
// In MaterialUsageService - enhanced usage recording
async recordUsageWithAlerts(usageData: CreateMaterialUsageDto) {
  // Record usage (updates inventory)
  const usage = await this.recordUsage(usageData);
  
  // Check for low stock
  const material = await this.materialService.findById(usageData.material_id);
  if (material.quantity <= 10) {
    // Send low stock alert
    await this.notificationService.sendLowStockAlert(material);
    await this.websocketGateway.broadcastLowStockAlert(material);
  }
  
  // Real-time usage update
  await this.websocketGateway.broadcastMaterialUsage(
    usageData.material_id, 
    { ...usage, current_stock: material.quantity }
  );
  
  // Cache material usage analytics
  const analytics = await this.getMaterialUsageAnalytics(usageData.material_id);
  await this.redisService.cacheMaterialUsage(usageData.material_id, analytics);
  
  return usage;
}
```

### **Automated Cost Tracking with Notifications**

```typescript
// In SiteService - enhanced expense tracking
async addExpenseWithTracking(siteId: number, amount: number, description: string) {
  // Add expense
  const updatedSite = await this.addExpense(siteId, amount, description);
  
  // Calculate cost impact
  const costData = {
    site_id: siteId,
    new_expense: amount,
    total_spent: updatedSite.money_spent,
    budget_remaining: updatedSite.budget - updatedSite.money_spent,
    percentage_used: (updatedSite.money_spent / updatedSite.budget) * 100,
  };
  
  // Cache updated calculation
  await this.redisService.cacheSiteCostCalculation(siteId, costData);
  
  // Real-time cost update
  await this.websocketGateway.broadcastSiteCostUpdate(siteId, costData);
  
  // Budget warnings
  if (costData.percentage_used > 90) {
    await this.notificationService.sendBudgetWarning(siteId, costData);
  }
  
  return updatedSite;
}
```

---

## 📊 **Monitoring & Analytics**

### **Performance Metrics**
- **Cache Hit Rates**: Monitor Redis cache efficiency
- **WebSocket Connections**: Track real-time user engagement  
- **Job Success Rates**: Background task completion monitoring
- **Notification Delivery**: FCM success/failure tracking
- **API Usage**: Google Maps API consumption

### **Health Checks**
```typescript
// Add to your health check endpoint
async getInfrastructureHealth() {
  return {
    redis: await this.redisService.getRedisClient().ping() === 'PONG',
    websocket: this.websocketGateway.getConnectedClientsCount(),
    scheduled_jobs: await this.taskScheduler.getJobStatus('daily_aggregation'),
    maps_api: await this.mapsService.getApiUsageStats(),
  };
}
```

---

## 🎯 **Production Considerations**

### **Scaling**
- **Redis Cluster**: For high availability and horizontal scaling
- **WebSocket Scaling**: Use Redis adapter for multi-server deployments
- **Job Queues**: Consider Bull/BullMQ for complex job processing
- **Rate Limiting**: Implement API rate limits and request throttling

### **Security**
- **API Key Security**: Store sensitive keys in secure environment variables
- **WebSocket Authentication**: Implement proper JWT validation
- **Location Privacy**: Encrypt sensitive location data
- **Notification Privacy**: Respect user preferences and data protection

### **Cost Optimization**
- **Cache TTL Tuning**: Optimize cache lifetimes for your usage patterns
- **API Usage Monitoring**: Track Google Maps API costs
- **Notification Batching**: Group notifications to reduce FCM costs
- **Job Scheduling**: Optimize cron schedules for off-peak execution

Your infrastructure layer provides enterprise-grade capabilities for real-time communication, intelligent caching, automated workflows, and location-aware features! 🚀