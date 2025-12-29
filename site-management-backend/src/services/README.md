# Site Management Backend Services

This directory contains the **business logic layer** of your site management system. Each service handles specific domain operations and enforces business rules.

## 🎯 **Service Architecture Overview**

```
Controllers  ←→  Services  ←→  Repositories  ←→  Database
     ↑              ↑              ↑              ↑
  REST API    Business Logic   Data Access    PostgreSQL
```

## 📋 **Available Services**

### 1. **EmployeeService** (`employee.service.ts`)
**Employee management with comprehensive business logic**

#### Key Features:
- ✅ **CRUD Operations**: Create, read, update, delete employees
- ✅ **Email Validation**: Prevents duplicate emails
- ✅ **Status Management**: Active/inactive employee tracking
- ✅ **Search & Filter**: By name, role, status
- ✅ **Pagination**: Efficient large dataset handling
- ✅ **Statistics**: Employee metrics and reporting

#### Business Rules:
- Email uniqueness validation
- Status change workflows
- Role assignment validation
- Search term minimum length (2 chars)

```typescript
// Example usage:
const activeEmployees = await employeeService.findActiveEmployees();
const stats = await employeeService.getEmployeeStats();
await employeeService.toggleEmployeeStatus(employeeId);
```

---

### 2. **SiteService** (`site.service.ts`)
**Construction site management with project lifecycle**

#### Key Features:
- ✅ **Site CRUD**: Full site lifecycle management
- ✅ **Date Validation**: Start/end date business rules
- ✅ **Status Workflow**: Planning → Active → Completed
- ✅ **Budget Tracking**: Money spent monitoring
- ✅ **Search**: By name, address, status
- ✅ **Risk Management**: Overdue site detection

#### Business Rules:
- Deadline must be after start date
- Cannot delete active sites
- Expense tracking for active sites only
- Automatic completion workflow

```typescript
// Example usage:
const activeSites = await siteService.findActiveSites();
await siteService.addExpense(siteId, 1500, "Materials purchase");
await siteService.completeSite(siteId);
const overdue = await siteService.getOverdueSites();
```

---

### 3. **MaterialService** (`material.service.ts`)
**Inventory management with stock control**

#### Key Features:
- ✅ **Inventory CRUD**: Full material management
- ✅ **Stock Control**: Add/use material quantities
- ✅ **Low Stock Alerts**: Configurable thresholds
- ✅ **Search**: By name and description
- ✅ **Site Assignment**: Material location tracking
- ✅ **Statistics**: Inventory metrics

#### Business Rules:
- Quantity cannot be negative
- Cannot delete materials with remaining stock
- Stock validation before usage
- Automatic inventory adjustments

```typescript
// Example usage:
await materialService.addStock(materialId, 100, "New shipment");
await materialService.useMaterial(materialId, 25);
const lowStock = await materialService.getLowStockMaterials(10);
```

---

### 4. **AttendanceService** (`attendance.service.ts`)
**Employee time tracking with business validation**

#### Key Features:
- ✅ **Check-in/Check-out**: Site attendance tracking
- ✅ **Active Monitoring**: Who's currently on-site
- ✅ **Time Calculation**: Automatic hour tracking
- ✅ **Manual Corrections**: Supervisor adjustments
- ✅ **Reporting**: Employee and site summaries
- ✅ **Validation**: Prevent duplicate check-ins

#### Business Rules:
- One active check-in per employee
- Check-out requires valid check-in
- Time validation for manual corrections
- Date range limits for queries

```typescript
// Example usage:
await attendanceService.checkIn(employeeId, siteId);
await attendanceService.checkOutEmployee(employeeId);
const summary = await attendanceService.getEmployeeAttendanceSummary(
  employeeId, startDate, endDate
);
```

---

### 5. **PaymentService** (`payment.service.ts`)
**Financial transaction management**

#### Key Features:
- ✅ **Payment CRUD**: Full payment lifecycle
- ✅ **Status Workflow**: Pending → Processing → Completed
- ✅ **Site Tracking**: Payment by construction site
- ✅ **Date Filtering**: Period-based reporting
- ✅ **Statistics**: Financial analytics
- ✅ **Processing**: Payment status management

#### Business Rules:
- Amount must be positive
- Cannot modify completed payments
- Cannot delete processed payments
- Status workflow validation

```typescript
// Example usage:
await paymentService.processPayment(paymentId);
const siteTotal = await paymentService.getTotalSitePayments(siteId);
const monthly = await paymentService.getMonthlyPaymentSummary(2024, 11);
```

---


## 🔧 **Service Design Patterns**

### **1. Dependency Injection (like Spring Boot @Autowired)**
```typescript
@Injectable()
export class EmployeeService {
  constructor(
    private readonly employeeRepository: EmployeeRepository  // Injected
  ) {}
}
```

### **2. Business Validation (like Spring Boot @Valid)**
```typescript
async create(createDto: CreateEmployeeDto) {
  // Business validation before database operation
  const existing = await this.repository.findByEmail(createDto.email);
  if (existing) {
    throw new ConflictException('Email already exists');
  }
  return this.repository.create(createDto);
}
```

### **3. Exception Handling (like Spring Boot @ControllerAdvice)**
```typescript
async findById(id: number) {
  const entity = await this.repository.findById(id);
  if (!entity) {
    throw new NotFoundException(`Entity with ID ${id} not found`);
  }
  return entity;
}
```

### **4. Transaction-like Operations**
```typescript
// Coordinate multiple operations
const [usage] = await Promise.all([
  this.materialUsageRepository.create(usageData),
  this.materialService.useMaterial(materialId, quantity)
]);
```

## 🚀 **Business Logic Examples**

### **Complex Workflow: Site Completion**
```typescript
async completeSite(siteId: number) {
  const site = await this.findById(siteId);
  
  // Business validation
  if (site.status === 'completed') {
    throw new BadRequestException('Site is already completed');
  }

  // Business logic: Set end date and update status
  return this.update(siteId, {
    status: 'completed',
    end_date: new Date()
  });
}
```

### **Inventory Management with Stock Control**
```typescript
async useMaterial(materialId: number, quantityUsed: number) {
  const material = await this.findById(materialId);
  
  // Business rule: Check sufficient stock
  if (material.quantity < quantityUsed) {
    throw new BadRequestException(
      `Insufficient stock. Available: ${material.quantity}`
    );
  }

  // Update inventory
  return this.materialRepository.decreaseQuantity(materialId, quantityUsed);
}
```

## 📊 **Service Integration**

Services can call each other for complex business operations:

```typescript
// MaterialUsageService uses MaterialService
async recordUsage(createUsageDto: CreateMaterialUsageDto) {
  // Check stock via MaterialService
  const material = await this.materialService.findById(createUsageDto.material_id);
  
  // Record usage and update inventory
  const [usage] = await Promise.all([
    this.materialUsageRepository.create(createUsageDto),
    this.materialService.useMaterial(createUsageDto.material_id, createUsageDto.quantity_used)
  ]);

  return usage;
}
```

## 🎯 **Next Steps**

Now that we have comprehensive services, we can:

1. **Build Controllers** - Expose services via REST API
2. **Add Authentication** - Secure the endpoints
3. **Create Modules** - Wire everything together with NestJS DI
4. **Add Testing** - Unit and integration tests
5. **Add More Services** - Role management, reporting, etc.

## 💡 **Key Advantages Over Traditional Approaches**

- ✅ **Type Safety**: Compile-time error checking
- ✅ **Clean Architecture**: Clear separation of concerns
- ✅ **Business Logic Centralization**: All rules in services
- ✅ **Testability**: Easy to unit test each service
- ✅ **Maintainability**: Changes isolated to appropriate layers
- ✅ **Scalability**: Services can be easily extended or replaced

Your service layer is now complete with comprehensive business logic, validation, and error handling! 🚀