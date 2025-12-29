# 🏗️ Infrastructure Layer Setup Guide

This guide explains how to set up the advanced infrastructure features that were temporarily disabled for performance optimization.

## 📊 Current Status

The application currently runs with **core functionality only** for optimal performance:
- ✅ **Database**: PostgreSQL with Prisma ORM
- ✅ **Authentication**: JWT with role-based access control
- ✅ **API Endpoints**: All CRUD operations functional
- ✅ **WebSocket**: Real-time communication infrastructure
- ❌ **Redis**: Caching layer (disabled)
- ❌ **Notifications**: Push notification system (disabled)
- ❌ **Task Scheduler**: Background jobs (disabled)

## 🚀 Infrastructure Components to Add

### 1. Redis Caching Layer

**Purpose**: Cache cost calculations, session data, and frequently accessed information.

**Setup Steps**:
```bash
# Install Redis (Windows)
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use Docker
docker run -d -p 6379:6379 --name redis redis:alpine

# Install Redis packages
npm install redis @nestjs/redis

# Verify Redis connection
redis-cli ping
```

**Implementation**:
- Uncomment Redis imports in `cost-calculation.service.ts`
- Enable caching in `calculateSiteCosts()` method
- Set cache TTL based on data freshness requirements

**Benefits**:
- 🏃‍♂️ 80% faster repeated cost calculations
- 📊 Reduced database load
- 🔄 Better scalability for multiple concurrent users

### 2. Background Task Scheduler

**Purpose**: Handle periodic cost recalculations, report generation, and data cleanup.

**Setup Steps**:
```bash
# Install Bull queue system
npm install @nestjs/bull bull

# Install agenda for cron-like scheduling
npm install @nestjs/schedule
```

**Implementation**:
```typescript
// Add to app.module.ts
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: { host: 'localhost', port: 6379 }
    })
  ]
})
```

**Use Cases**:
- 🕒 **Hourly**: Recalculate active site costs
- 🌅 **Daily**: Generate cost reports and budget alerts
- 📅 **Weekly**: Clean up old audit logs and temporary data

### 3. Push Notification System

**Purpose**: Real-time alerts for budget warnings, project milestones, and critical events.

**Setup Steps**:
```bash
# Install notification packages
npm install firebase-admin node-gcm

# Setup FCM credentials
# 1. Create Firebase project
# 2. Generate service account key
# 3. Add to environment variables
```

**Implementation**:
- Re-enable `sendBudgetWarning()` method in cost service
- Add notification preferences per user role
- Implement notification history tracking

**Notification Types**:
- 🚨 **Critical**: Budget exceeded 100%
- ⚠️ **Warning**: Budget exceeded 85%
- 📈 **Info**: Weekly cost summaries
- ✅ **Success**: Project milestones reached

### 4. Advanced Monitoring & Logging

**Purpose**: Application performance monitoring, error tracking, and audit trails.

**Setup Steps**:
```bash
# Install monitoring packages
npm install @nestjs/terminus @nestjs/swagger
npm install winston winston-daily-rotate-file

# Optional: Add external monitoring
# - Sentry for error tracking
# - DataDog for performance monitoring
# - ELK stack for log aggregation
```

**Health Check Endpoints**:
```typescript
// health/health.controller.ts
@Get('health')
@HealthCheck()
check() {
  return this.health.check([
    () => this.prisma.pingCheck('database'),
    () => this.redis.pingCheck('redis'),
    () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 })
  ]);
}
```

## 📈 Performance Optimization Roadmap

### Phase 1: Database Optimization (Immediate - Next Week)
```sql
-- Add performance indexes
CREATE INDEX idx_for_labor_site_id ON for_labor(site_id);
CREATE INDEX idx_for_labor_employee_id ON for_labor(employee_id);
CREATE INDEX idx_for_labor_payment_date ON for_labor(payment_date);
CREATE INDEX idx_for_material_site_id ON for_material(site_id);
CREATE INDEX idx_for_material_payment_date ON for_material(payment_date);

-- Add composite indexes for common queries
CREATE INDEX idx_for_labor_site_date ON for_labor(site_id, payment_date);
CREATE INDEX idx_employees_role_status ON employees(role_id, status);
```

### Phase 2: Caching Strategy (Week 2)
- **Level 1**: Application-level caching with Redis
- **Level 2**: Database query result caching
- **Level 3**: CDN for static assets and API responses

### Phase 3: Real-time Features (Week 3)
- Re-enable WebSocket broadcasts for live cost updates
- Implement user-specific notification channels
- Add real-time collaboration features

### Phase 4: Advanced Analytics (Week 4)
- Implement database triggers for automatic calculations
- Add data warehousing for historical analysis
- Create advanced reporting and forecasting

## 🎯 Recommended Implementation Order

1. **Week 1**: Database indexes + Redis caching
2. **Week 2**: Background task scheduler + notifications
3. **Week 3**: Monitoring + health checks + WebSocket re-integration
4. **Week 4**: Advanced analytics + database triggers

## 🔧 Configuration Files to Update

### Environment Variables (.env)
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Notification Configuration
FCM_PROJECT_ID=your_firebase_project_id
FCM_PRIVATE_KEY_ID=your_private_key_id
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FCM_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com

# Monitoring Configuration
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
HEALTH_CHECK_TIMEOUT=5000
```

### Docker Compose (docker-compose.yml)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/sitemanagement
      - REDIS_HOST=redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=sitemanagement
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 📊 Expected Performance Improvements

| Component | Current | With Infrastructure | Improvement |
|-----------|---------|-------------------|-------------|
| Cost calculation | 5-30 seconds | 50-200ms | **99%+ faster** |
| Site list loading | 30+ seconds | 100-500ms | **98%+ faster** |
| Real-time updates | Not available | Instant | **New feature** |
| Background processing | Manual | Automatic | **New feature** |
| Monitoring | Basic logs | Full observability | **New feature** |

## 🎯 Success Metrics

- **API Response Time**: < 200ms for cached operations
- **Database Query Time**: < 50ms average
- **Real-time Latency**: < 100ms for WebSocket updates
- **System Uptime**: > 99.9%
- **Error Rate**: < 0.1%

## 🚨 Important Notes

- **Start Simple**: Implement one component at a time
- **Monitor Performance**: Measure impact of each addition
- **Graceful Fallbacks**: Ensure system works if infrastructure fails
- **Documentation**: Update API docs when adding new features
- **Testing**: Add integration tests for each infrastructure component

## 📞 Support

If you encounter issues during infrastructure setup:
1. Check this guide for troubleshooting steps
2. Verify all dependencies are properly installed
3. Review application logs for specific error messages
4. Test components individually before integration

---

*This infrastructure was temporarily disabled to optimize development speed. Re-enabling these features will provide production-ready scalability and monitoring capabilities.*