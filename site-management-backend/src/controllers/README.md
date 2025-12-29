# Site Management Backend Controllers

This directory contains the **REST API layer** of your site management system. Each controller exposes HTTP endpoints for frontend applications to interact with your business logic.

## 🎯 **Controller Architecture Overview**

```
Frontend  ←→  Controllers  ←→  Services  ←→  Prisma Service ←→  Database
     ↑             ↑             ↑             ↑             ↑
   React     REST Endpoints  Business Logic  Data Access   PostgreSQL
```

## 🚀 **Available API Endpoints**

### 1. **Employee API** (`/employees`) - `employee.controller.ts`

#### **CRUD Operations**
- `POST /employees` - Create new employee
- `GET /employees` - List all employees with pagination & search
- `GET /employees/:id` - Get employee by ID
- `PATCH /employees/:id` - Update employee
- `DELETE /employees/:id` - Delete employee

#### **Business Operations**
- `GET /employees/active` - Get active employees only
- `GET /employees/stats` - Employee statistics
- `GET /employees/by-role?role=manager` - Filter by role
- `PATCH /employees/:id/toggle-status` - Toggle active/inactive
- `PATCH /employees/:id/activate` - Activate employee
- `PATCH /employees/:id/deactivate` - Deactivate employee

#### **Query Examples**
```bash
# Get paginated employees with search
GET /employees?page=1&limit=10&search=john&status=active

# Get all managers
GET /employees/by-role?role=manager

# Employee stats
GET /employees/stats
```

---

### 2. **Site API** (`/sites`) - `site.controller.ts`

#### **CRUD Operations**
- `POST /sites` - Create new construction site
- `GET /sites` - List all sites with pagination & filters
- `GET /sites/:id` - Get site by ID
- `PATCH /sites/:id` - Update site details
- `DELETE /sites/:id` - Delete site

#### **Business Operations**
- `GET /sites/active` - Get active construction sites
- `GET /sites/overdue` - Get overdue sites
- `GET /sites/by-status?status=active` - Filter by status
- `PATCH /sites/:id/start` - Start site construction
- `PATCH /sites/:id/complete` - Mark site as completed
- `POST /sites/:id/expenses` - Add expense to site
- `GET /sites/:id/total-expenses` - Get expense summary

#### **Query Examples**
```bash
# Get active sites only
GET /sites/active

# Add expense to site
POST /sites/5/expenses
{
  "amount": 1500,
  "description": "Materials purchase"
}

# Check site budget
GET /sites/5/total-expenses
```

---

### 3. **Material API** (`/materials`) - `material.controller.ts`

#### **CRUD Operations**
- `POST /materials` - Create new material
- `GET /materials` - List all materials with search
- `GET /materials/:id` - Get material by ID
- `PATCH /materials/:id` - Update material
- `DELETE /materials/:id` - Delete material

#### **Inventory Operations**
- `GET /materials/low-stock?threshold=10` - Low stock alerts
- `GET /materials/stats` - Inventory statistics
- `GET /materials/by-site/:siteId` - Materials at specific site
- `POST /materials/:id/stock` - Add stock to material
- `POST /materials/:id/use` - Use material (reduce stock)
- `GET /materials/:id/stock` - Current stock level

#### **Query Examples**
```bash
# Check low stock items
GET /materials/low-stock?threshold=5

# Add stock to cement
POST /materials/3/stock
{
  "quantity": 100,
  "description": "New shipment from supplier"
}

# Use 25 units of cement
POST /materials/3/use
{
  "quantity": 25
}
```

---

### 4. **Attendance API** (`/attendance`) - `attendance.controller.ts`

#### **CRUD Operations**
- `POST /attendance` - Manual attendance record
- `GET /attendance` - List attendance records
- `GET /attendance/:id` - Get specific attendance record
- `PATCH /attendance/:id` - Update attendance record
- `DELETE /attendance/:id` - Delete attendance record

#### **Time Tracking Operations**
- `POST /attendance/check-in` - Employee check-in to site
- `POST /attendance/check-out` - Employee check-out
- `GET /attendance/active` - Currently checked-in employees
- `GET /attendance/active/site/:siteId` - Active employees on specific site
- `GET /attendance/employee/:employeeId/summary` - Employee attendance summary
- `GET /attendance/site/:siteId/summary` - Site attendance summary
- `GET /attendance/daily-hours` - Daily hours calculation

#### **Query Examples**
```bash
# Check-in employee to site
POST /attendance/check-in
{
  "employee_id": 5,
  "site_id": 2
}

# Check-out employee
POST /attendance/check-out
{
  "employee_id": 5
}

# Get employee attendance summary
GET /attendance/employee/5/summary?start_date=2024-01-01&end_date=2024-01-31

# Who's currently on-site?
GET /attendance/active/site/2
```

---

### 5. **Payment API** (`/payments`) - `payment.controller.ts`

#### **CRUD Operations**
- `POST /payments` - Create new payment
- `GET /payments` - List payments with filters
- `GET /payments/:id` - Get payment by ID
- `PATCH /payments/:id` - Update payment
- `DELETE /payments/:id` - Delete payment

#### **Financial Operations**
- `GET /payments/status/:status` - Filter by payment status
- `GET /payments/pending` - Pending payments
- `GET /payments/completed` - Completed payments
- `GET /payments/monthly-summary` - Monthly payment summary
- `GET /payments/site/:siteId` - Payments for specific site
- `GET /payments/site/:siteId/total` - Total site payments
- `PATCH /payments/:id/process` - Process payment
- `PATCH /payments/:id/complete` - Mark as completed
- `PATCH /payments/:id/fail` - Mark as failed

#### **Query Examples**
```bash
# Get pending payments
GET /payments/pending

# Process a payment
PATCH /payments/15/process

# Monthly financial summary
GET /payments/monthly-summary?year=2024&month=11

# Site payment total
GET /payments/site/3/total
```

---

### 6. **Material Usage API** (`/material-usage`) - `material-usage.controller.ts`

#### **CRUD Operations**
- `POST /material-usage` - Record material usage
- `GET /material-usage` - List usage records
- `GET /material-usage/:id` - Get specific usage record
- `PATCH /material-usage/:id` - Update usage record
- `DELETE /material-usage/:id` - Delete usage record

#### **Analytics Operations**
- `GET /material-usage/site/:siteId/summary` - Site usage summary
- `GET /material-usage/employee/:employeeId/stats` - Employee usage stats
- `GET /material-usage/by-material/:materialId` - Usage by material
- `GET /material-usage/by-employee/:employeeId` - Usage by employee
- `GET /material-usage/by-site/:siteId` - Usage by site
- `GET /material-usage/daily` - Daily usage summary
- `GET /material-usage/top-materials` - Most used materials
- `PATCH /material-usage/:id/correct` - Correct usage record

#### **Query Examples**
```bash
# Record material usage
POST /material-usage
{
  "material_id": 3,
  "employee_id": 5,
  "site_id": 2,
  "quantity_used": 10
}

# Site usage summary
GET /material-usage/site/2/summary

# Top 5 most used materials
GET /material-usage/top-materials?limit=5

# Daily usage for specific site
GET /material-usage/daily?date=2024-01-15&site_id=2
```

---

## 🎯 **HTTP Status Codes & Response Patterns**

### **Standard Responses**
```javascript
// Success Responses
200 OK          - Successful GET, PATCH
201 Created     - Successful POST
204 No Content  - Successful DELETE

// Error Responses  
400 Bad Request - Validation errors, business rule violations
404 Not Found   - Resource doesn't exist
409 Conflict    - Duplicate email, business logic conflicts
500 Server Error - Unexpected server issues
```

### **Response Format Examples**
```javascript
// Success Response
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com", 
  "status": "active"
}

// Paginated Response
{
  "data": [...],
  "page": 1,
  "limit": 10,
  "total": 45,
  "totalPages": 5
}

// Error Response
{
  "statusCode": 400,
  "message": "Email already exists",
  "error": "Bad Request"
}
```

## 🔧 **Controller Design Patterns**

### **1. NestJS Decorators (like Spring Boot annotations)**
```typescript
@Controller('employees')           // @RestController
export class EmployeeController {
  
  @Post()                         // @PostMapping
  @HttpCode(HttpStatus.CREATED)   // @ResponseStatus
  async create(@Body() dto) {}    // @RequestBody
  
  @Get(':id')                     // @GetMapping("/{id}")
  async findOne(@Param('id', ParseIntPipe) id: number) {} // @PathVariable
  
  @Get()                          // @GetMapping with @RequestParam
  async findAll(@Query('search') search?: string) {}
}
```

### **2. Dependency Injection (like Spring Boot @Autowired)**
```typescript
@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService  // @Autowired
  ) {}
}
```

### **3. Request/Response Handling**
```typescript
// Request body validation (like @Valid)
@Post()
async create(@Body() createDto: CreateEmployeeDto) {
  return this.service.create(createDto);
}

// Path parameters (like @PathVariable)
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  return this.service.findById(id);
}

// Query parameters (like @RequestParam)
@Get()
async findAll(@Query('search') search?: string) {
  return this.service.findAll({ search });
}
```

## 🚀 **Integration Examples**

### **Frontend Integration (React/Angular)**
```javascript
// Employee API calls
const employees = await fetch('/employees?page=1&limit=10&search=john');
const newEmployee = await fetch('/employees', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
});

// Material usage tracking
await fetch('/material-usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    material_id: 3,
    employee_id: 5, 
    site_id: 2,
    quantity_used: 10
  })
});
```

### **Mobile App Integration**
```javascript
// Check-in employee via mobile
const checkIn = await fetch('/attendance/check-in', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employee_id: getCurrentEmployee().id,
    site_id: getCurrentSite().id
  })
});
```

## 📊 **API Documentation & Testing**

### **Swagger/OpenAPI Integration** (Future Enhancement)
```typescript
// Add these decorators for API documentation
@ApiTags('employees')
@ApiOperation({ summary: 'Create new employee' })
@ApiResponse({ status: 201, description: 'Employee created successfully' })
@Post()
async create(@Body() createDto: CreateEmployeeDto) {}
```

### **Testing with Postman/curl**
```bash
# Create employee
curl -X POST http://localhost:3000/employees \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","role":"manager"}'

# Check-in employee
curl -X POST http://localhost:3000/attendance/check-in \
  -H "Content-Type: application/json" \
  -d '{"employee_id":5,"site_id":2}'

# Get low stock materials
curl http://localhost:3000/materials/low-stock?threshold=10
```

## 🎯 **Next Steps**

Now that controllers are complete, you can:

1. **Wire Everything Together** - Update app.module.ts with all controllers and services
2. **Add Authentication** - JWT tokens, guards, and role-based access
3. **Add Validation Pipes** - DTO validation with class-validator
4. **Add Swagger** - API documentation 
5. **Testing** - Unit tests and E2E API tests
6. **Production Setup** - Environment configs, logging, monitoring

## 💡 **Key Advantages**

- ✅ **Spring Boot Familiarity**: Similar patterns you already know
- ✅ **Type Safety**: Compile-time error checking for all endpoints  
- ✅ **Clean Architecture**: Controllers only handle HTTP concerns
- ✅ **RESTful Design**: Standard REST conventions
- ✅ **Comprehensive APIs**: Full CRUD + business operations
- ✅ **Developer Experience**: Excellent tooling and debugging

Your REST API layer is complete with 70+ endpoints covering all business operations! 🚀