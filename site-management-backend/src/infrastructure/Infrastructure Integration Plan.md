# 🚨 Infrastructure Integration Plan

The Warning System has been simplified to core functionality for optimal development speed. This document outlines the infrastructure features that will be added in future iterations.

## 📊 Current Status

### ✅ **Core Features (Operational)**
- ✅ **Warning Management**: Create, read, update, delete warnings
- ✅ **Progressive Discipline**: Automatic severity calculation based on warning count
- ✅ **Employee Warning History**: Complete warning records per employee
- ✅ **Site Warning Analytics**: Warning statistics and summaries per site
- ✅ **Appeal System**: Warning appeal submission and resolution
- ✅ **Bulk Operations**: Issue warnings to multiple employees
- ✅ **Advanced Reporting**: Statistical analysis and trend reports

### ⚠️ **Infrastructure Features (Setup Status)**
- ❌ **Redis Caching**: Performance optimization for frequent queries *(Not set up)*
- ❌ **Real-time Notifications**: Push notifications to employees and managers *(Not set up)*
- 🔧 **WebSocket Updates**: Live warning updates across connected clients *(Set up, not implemented)*
- ❌ **Email Notifications**: Automated email alerts for warnings and appeals *(Not set up)*
- ❌ **Cost Calculation Integration**: Dynamic cost tracking and budget alerts *(Not set up)*

## 🔧 Infrastructure Components to Add

### 1. Redis Caching System

**Purpose**: Improve performance for frequently accessed warning data and reduce database load.

**Implementation Areas**:
```typescript
// Example: Cache employee warning counts
private async getEmployeeWarningCount(employeeId: number): Promise<number> {
  const cacheKey = `employee:${employeeId}:warning_count`;
  const cached = await this.redis.get(cacheKey);
  if (cached) return parseInt(cached, 10);
  
  const count = await this.prisma.warnings.count({
    where: { employee_id: employeeId },
  });
  
  await this.redis.setex(cacheKey, 600, count.toString()); // 10 min cache
  return count;
}
```

**Cache Strategies**:
- **Warning Lists**: 5-minute cache for paginated warning lists
- **Employee Warning Counts**: 10-minute cache for progressive discipline calculations
- **Site Statistics**: 30-minute cache for warning analytics
- **Trend Reports**: 1-hour cache for statistical reports

### 2. Real-time Notification System

**Purpose**: Instant alerts for warning-related events to relevant stakeholders.

**Notification Types**:

#### **Employee Notifications**
```typescript
// New Warning Issued
await this.notification.sendNotificationToUser(employeeId, {
  title: 'New Warning Issued',
  body: `You have received a warning: ${description}`,
  data: {
    type: 'warning',
    warning_id: warning.warning_id.toString(),
    severity: this.determineWarningSeverity(warningCount),
  },
});

// Appeal Decision
await this.notification.sendNotificationToUser(employeeId, {
  title: `Warning Appeal ${decision === 'approved' ? 'Approved' : 'Denied'}`,
  body: `Your appeal for warning #${warningId} has been ${decision}`,
  data: {
    type: 'appeal_resolved',
    warning_id: warningId.toString(),
    decision: decision,
  },
});
```

#### **Manager Notifications**
```typescript
// Multiple Warnings Alert
if (warningCount >= 2) {
  await this.notification.sendNotificationToRole('manager', {
    title: 'Employee Warning Alert',
    body: `${employee.first_name} ${employee.last_name} has received ${warningCount} warnings`,
    data: {
      type: 'warning_alert',
      employee_id: employeeId.toString(),
      warning_count: warningCount.toString(),
    },
  });
}

// Appeal Submitted
await this.notification.sendNotificationToRole('manager', {
  title: 'Warning Appeal Submitted',
  body: `Employee has appealed warning #${warningId}`,
  data: {
    type: 'warning_appeal',
    warning_id: warningId.toString(),
    employee_id: employeeId.toString(),
  },
});
```

### 3. WebSocket Real-time Updates

**Purpose**: Live updates for warning dashboard and employee interfaces.

**Real-time Events**:

```typescript
// Warning Issued Event
this.websocket.server.emit('warningIssued', {
  warning_id: warning.warning_id,
  employee_name: `${employee.first_name} ${employee.last_name}`,
  site_name: site.site_name,
  warning_count: warningCount,
  severity: this.determineWarningSeverity(warningCount),
  timestamp: new Date(),
});

// Warning Updated Event
this.websocket.server.to(`site:${siteId}`).emit('warningUpdated', {
  warning_id: warning.warning_id,
  employee_name: `${employee.first_name} ${employee.last_name}`,
  changes: updatedFields,
  timestamp: new Date(),
});

// Appeal Status Change
this.websocket.server.to(`employee:${employeeId}`).emit('appealStatusChanged', {
  warning_id: warningId,
  status: newStatus,
  resolution_notes: resolutionNotes,
  timestamp: new Date(),
});
```

### 4. Cost Calculation Infrastructure Integration

**Purpose**: Dynamic cost tracking and automated budget alerts for warning-related administrative overhead.

**Cost Integration Areas**:

#### **Warning Administrative Costs**
```typescript
// Track costs for each warning issued
private async calculateWarningCosts(warningId: number): Promise<WarningCostBreakdown> {
  const warning = await this.prisma.warnings.findUnique({
    where: { warning_id: warningId },
    include: { employee: true, site: true },
  });

  // Calculate administrative time costs
  const adminCosts = {
    investigation_time: 30, // minutes
    documentation_time: 15, // minutes
    meeting_time: warningCount >= 2 ? 45 : 0, // minutes for serious warnings
    hr_review_time: warningCount >= 3 ? 60 : 0, // minutes for final warnings
  };

  const totalMinutes = Object.values(adminCosts).reduce((sum, min) => sum + min, 0);
  const costPerMinute = await this.costService.getAdministrativeCostPerMinute(warning.site_id);
  
  const warningCost = {
    total_admin_time_minutes: totalMinutes,
    cost_per_minute: costPerMinute,
    total_cost: totalMinutes * costPerMinute,
    cost_breakdown: adminCosts,
    warning_severity: this.determineWarningSeverity(await this.getEmployeeWarningCount(warning.employee_id)),
  };

  // Cache cost calculation for reporting
  await this.redis.setex(
    `warning:${warningId}:cost`,
    3600, // 1 hour cache
    JSON.stringify(warningCost)
  );

  return warningCost;
}
```

#### **Progressive Discipline Cost Tracking**
```typescript
// Calculate escalating costs for repeat offenders
private async trackProgressiveDisciplineCosts(employeeId: number): Promise<DisciplineCostAnalysis> {
  const warningCount = await this.getEmployeeWarningCount(employeeId);
  
  const disciplineCosts = {
    warning_1: { time_minutes: 45, legal_risk: 'low' },
    warning_2: { time_minutes: 90, legal_risk: 'medium', manager_meeting: true },
    warning_3: { time_minutes: 180, legal_risk: 'high', hr_involvement: true, legal_review: true },
    termination_prep: { time_minutes: 240, legal_risk: 'very_high', documentation_required: true },
  };

  const currentCosts = disciplineCosts[`warning_${Math.min(warningCount, 3)}`] || disciplineCosts.termination_prep;
  
  // Notify cost service of high-cost employee
  if (warningCount >= 2) {
    await this.costService.flagHighCostEmployee({
      employee_id: employeeId,
      warning_count: warningCount,
      estimated_annual_cost: currentCosts.time_minutes * 52 * await this.costService.getAdministrativeCostPerMinute(siteId),
      risk_level: currentCosts.legal_risk,
    });
  }

  return currentCosts;
}
```

#### **Budget Alert Integration**
```typescript
// Trigger budget alerts for warning-related costs
private async checkWarningBudgetImpact(siteId: number, monthlyCosts: number): Promise<void> {
  const budgetThresholds = await this.costService.getBudgetThresholds(siteId);
  
  if (monthlyCosts > budgetThresholds.warning_budget * 0.8) {
    // 80% of warning budget used - send alert
    await this.notification.sendNotificationToRole('manager', {
      title: 'Warning Budget Alert',
      body: `Warning-related costs are at ${Math.round(monthlyCosts / budgetThresholds.warning_budget * 100)}% of monthly budget`,
      data: {
        type: 'budget_alert',
        site_id: siteId.toString(),
        current_costs: monthlyCosts.toString(),
        budget_limit: budgetThresholds.warning_budget.toString(),
      },
    });

    // Real-time dashboard update
    this.websocket.server.to(`site:${siteId}`).emit('budgetAlert', {
      type: 'warning_costs',
      current_costs: monthlyCosts,
      budget_limit: budgetThresholds.warning_budget,
      percentage_used: Math.round(monthlyCosts / budgetThresholds.warning_budget * 100),
      timestamp: new Date(),
    });
  }
}
```

### 5. Employee Performance Infrastructure Integration

**Purpose**: Cross-system integration between warnings and performance metrics.

**Performance Integration Features**:

#### **Performance Score Impact**
```typescript
// Update performance scores based on warning history
private async updatePerformanceScoreForWarning(employeeId: number, warningType: string): Promise<void> {
  const performanceImpact = {
    'attendance': -5,     // points
    'conduct': -10,       // points  
    'safety': -15,        // points
    'quality': -8,        // points
    'policy_violation': -12, // points
  };

  const scoreReduction = performanceImpact[warningType] || -10;
  
  // Update performance service
  await this.performanceService.adjustScore({
    employee_id: employeeId,
    adjustment: scoreReduction,
    reason: `Warning issued: ${warningType}`,
    category: 'disciplinary_action',
    effective_date: new Date(),
  });

  // Cache updated performance metrics
  await this.redis.del(`employee:${employeeId}:performance:*`);
  
  // Real-time performance update
  this.websocket.server.to(`employee:${employeeId}`).emit('performanceUpdated', {
    employee_id: employeeId,
    score_change: scoreReduction,
    reason: 'Warning issued',
    new_total: await this.performanceService.getCurrentScore(employeeId),
    timestamp: new Date(),
  });
}
```

#### **Review Cycle Integration**
```typescript
// Flag employees for early performance reviews
private async flagForEarlyReview(employeeId: number, warningCount: number): Promise<void> {
  if (warningCount >= 2) {
    await this.performanceService.scheduleEarlyReview({
      employee_id: employeeId,
      review_type: 'disciplinary_performance_review',
      scheduled_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      reason: `Multiple warnings (${warningCount}) require performance review`,
      priority: warningCount >= 3 ? 'urgent' : 'high',
    });

    // Notify HR and managers
    await this.notification.sendNotificationToRole('hr', {
      title: 'Early Performance Review Required',
      body: `Employee with ${warningCount} warnings needs immediate performance review`,
      data: {
        type: 'early_review_required',
        employee_id: employeeId.toString(),
        warning_count: warningCount.toString(),
        review_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  }
}
```

### 6. Scheduling System Integration

**Purpose**: Dynamic shift and scheduling adjustments based on warning patterns.

**Scheduling Integration Features**:

#### **Shift Restriction Implementation**
```typescript
// Apply scheduling restrictions based on warnings
private async applySchedulingRestrictions(employeeId: number, warningType: string): Promise<void> {
  const restrictions = {
    'attendance': {
      no_overtime: true,
      preferred_shifts_only: true,
      duration_days: 30,
    },
    'safety': {
      no_hazardous_areas: true,
      supervisor_proximity_required: true,
      duration_days: 90,
    },
    'conduct': {
      no_customer_facing: true,
      no_cash_handling: true,
      duration_days: 60,
    },
  };

  const restriction = restrictions[warningType];
  if (restriction) {
    await this.schedulingService.applyRestrictions({
      employee_id: employeeId,
      restrictions: restriction,
      start_date: new Date(),
      end_date: new Date(Date.now() + restriction.duration_days * 24 * 60 * 60 * 1000),
      reason: `Warning-based restriction: ${warningType}`,
    });

    // Clear scheduling cache
    await this.redis.deletePattern(`schedule:employee:${employeeId}:*`);
    
    // Real-time scheduling update
    this.websocket.server.to(`employee:${employeeId}`).emit('schedulingRestrictionApplied', {
      employee_id: employeeId,
      restrictions: restriction,
      duration_days: restriction.duration_days,
      effective_immediately: true,
      timestamp: new Date(),
    });
  }
}
```

### 7. Payroll Integration Infrastructure

**Purpose**: Automatic payroll adjustments and documentation for warning-related actions.

**Payroll Integration Features**:

#### **Suspension Without Pay Calculations**
```typescript
// Calculate payroll impacts for severe warnings
private async calculateSuspensionImpact(employeeId: number, suspensionDays: number): Promise<PayrollAdjustment> {
  const employee = await this.prisma.employees.findUnique({
    where: { employee_id: employeeId },
  });

  const dailyWage = employee.hourly_rate * 8; // 8-hour standard day
  const totalDeduction = dailyWage * suspensionDays;

  const payrollAdjustment = {
    employee_id: employeeId,
    adjustment_type: 'suspension_deduction',
    amount: -totalDeduction,
    days_affected: suspensionDays,
    reason: 'Disciplinary suspension without pay',
    effective_pay_period: await this.payrollService.getCurrentPayPeriod(),
  };

  // Create payroll adjustment record
  await this.payrollService.createAdjustment(payrollAdjustment);
  
  // Cache payroll impact
  await this.redis.setex(
    `payroll:adjustment:${employeeId}:suspension`,
    7 * 24 * 3600, // 1 week cache
    JSON.stringify(payrollAdjustment)
  );

  return payrollAdjustment;
}
```

### 8. Email Notification Integration

**Purpose**: Formal documentation and external communication for serious warnings.

**Email Templates**:

#### **Warning Notification Email**
```typescript
// Formal Warning Email
await this.emailService.sendWarningNotification({
  to: employee.email,
  cc: [manager.email],
  subject: `Formal Warning - ${warning.description}`,
  template: 'warning-notification',
  data: {
    employee_name: `${employee.first_name} ${employee.last_name}`,
    warning_description: warning.description,
    warning_date: warning.warning_date,
    warning_count: warningCount,
    next_action: this.determineNextDisciplinaryAction(warningCount),
    site_name: site.site_name,
    issued_by: `${issuedBy.first_name} ${issuedBy.last_name}`,
  },
});
```

#### **Progressive Discipline Email**
```typescript
// Critical Warning Level Email
if (warningCount >= 3) {
  await this.emailService.sendProgressiveDisciplineNotice({
    to: [employee.email, hr.email],
    cc: managerEmails,
    subject: `Progressive Discipline Notice - Final Warning`,
    template: 'progressive-discipline',
    data: {
      employee_name: `${employee.first_name} ${employee.last_name}`,
      total_warnings: warningCount,
      discipline_level: this.determineDisciplineLevel(warningCount),
      next_action: 'Termination consideration if additional infractions occur',
      review_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });
}
```

### 5. Advanced Cache Invalidation

**Purpose**: Intelligent cache management to ensure data consistency.

**Cache Invalidation Patterns**:

```typescript
private async clearWarningCaches(employeeId: number, siteId: number) {
  const patterns = [
    `warnings:list:*`,                    // Clear all warning lists
    `warnings:recent:*`,                  // Clear recent warnings cache
    `employee:${employeeId}:*`,           // Clear all employee data
    `site:${siteId}:*`,                   // Clear all site data
    `warning:stats:*`,                    // Clear statistics cache
    `warning:trends:*`,                   // Clear trends cache
    `warning:report:*`,                   // Clear reports cache
  ];

  await Promise.all(
    patterns.map(pattern => this.redis.deletePattern(pattern))
  );
}

// Selective cache clearing
private async clearEmployeeWarningCache(employeeId: number) {
  await this.redis.del(`employee:${employeeId}:warning_count`);
  await this.redis.deletePattern(`employee:${employeeId}:warnings*`);
}
```

## 📈 Performance Impact Expectations

| Feature | Current Performance | With Infrastructure | Improvement |
|---------|-------------------|-------------------|-------------|
| Warning List Loading | 50-200ms | 10-50ms | **75%+ faster** |
| Employee Warning Count | 20-100ms | 1-5ms | **95%+ faster** |
| Site Analytics | 200-500ms | 20-100ms | **80%+ faster** |
| Real-time Updates | Not available | Instant | **New feature** |
| Trend Reports | 500ms-2s | 50-200ms | **90%+ faster** |

## 🔄 Implementation Phases

### Phase 1: Caching Layer (Week 1)
- Implement Redis caching for warning counts and lists
- Add cache invalidation logic
- Performance testing and optimization

### Phase 2: Real-time Features (Week 2)
- WebSocket integration for live updates
- Real-time dashboard notifications
- Live warning counters and alerts

### Phase 3: Notification System (Week 3)
- Push notification integration
- Email notification templates
- Notification preference management

### Phase 4: Advanced Analytics (Week 4)
- Enhanced caching for complex reports
- Real-time analytics updates
- Dashboard performance optimization

## 🎯 Configuration Requirements

### Environment Variables
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Notification Services
FCM_PROJECT_ID=your_firebase_project_id
FCM_PRIVATE_KEY=your_firebase_private_key
FCM_CLIENT_EMAIL=your_firebase_client_email

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@company.com
SMTP_PASSWORD=your_app_password

# WebSocket Configuration
WEBSOCKET_CORS_ORIGIN=http://localhost:3000
WEBSOCKET_NAMESPACE=/warnings
```

### Service Dependencies
```typescript
// Add to warning.service.ts constructor when implementing
constructor(
  private prisma: PrismaService,
  private redis: RedisService,                    // Caching
  private notification: NotificationService,      // Push notifications  
  private websocket: SiteManagementGateway,      // Real-time updates
  private email: EmailService,                   // Email notifications
) {}
```

## 📋 Testing Strategy

### Performance Testing
- Load testing with 1000+ concurrent warning operations
- Cache hit ratio monitoring (target: >80%)
- Response time benchmarking for all endpoints

### Notification Testing
- End-to-end notification delivery testing
- WebSocket connection stress testing
- Email template rendering and delivery verification

### Cache Testing
- Cache invalidation accuracy testing
- Data consistency verification
- Cache warming strategies

## 🚨 Important Notes

1. **Graceful Degradation**: System continues to work if infrastructure components fail
2. **Data Consistency**: Cache invalidation must be atomic with database operations
3. **Notification Failures**: Must not block warning creation/updates
4. **Performance Monitoring**: Redis hit rates, notification delivery rates, WebSocket connection counts
5. **Security**: All notifications must respect user permissions and data privacy

---

**Status**: Infrastructure features temporarily disabled for development speed optimization.
**Implementation**: Scheduled for post-MVP release after frontend development is complete.
**Contact**: Development team for infrastructure integration timeline and requirements.