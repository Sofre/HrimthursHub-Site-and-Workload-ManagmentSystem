# Site Management Backend Models

This directory contains NestJS models/DTOs based on the Prisma schema. Each model includes:

- **Entity class**: Represents the database table structure
- **Create DTO**: For creating new records
- **Update DTO**: For updating existing records

## Available Models:

### Core Entities
1. **Employee** (`employee.model.ts`)
   - Employee management with roles and status
   - Includes first_name, last_name, email, phone_number, role_id, date_hired, status

2. **Role** (`role.model.ts`)
   - Role definitions for employees
   - Includes role_name and description

3. **Site** (`site.model.ts`)
   - Construction site/project management
   - Includes site_name, address, coordinates, dates, status, money_spent

4. **Material** (`material.model.ts`)
   - Material inventory management
   - Includes name, description, quantity, unit, site_id

5. **Payment** (`payment.model.ts`)
   - Payment tracking
   - Includes amount, status, site_id, payment_date

6. **WageRate** (`wage-rate.model.ts`)
   - Employee wage rate definitions
   - Includes role_id, hourly_rate, effective_date

### Relationship Entities
7. **AttendanceLog** (`attendance-log.model.ts`)
   - Employee attendance tracking
   - Includes employee_id, site_id, check_in/out times, status

8. **ForLabor** (`for-labor.model.ts`)
   - Labor payment records
   - Includes payment_id, employee_id, site_id, amount, payment_date, type

9. **ForMaterial** (`for-material.model.ts`)
   - Material payment records
   - Includes payment_id, material_id, site_id, amount, supplier_name


11. **Warning** (`warning.model.ts`)
    - Employee warning system
    - Includes employee_id, issued_by, site_id, warning_date, description

## Usage Example:

```typescript
import { Employee, CreateEmployeeDto } from './models/employee.model';
import { Site, CreateSiteDto } from './models/site.model';

// Create a new employee
const newEmployee: CreateEmployeeDto = {
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  role_id: 1,
  date_hired: new Date(),
  status: "active"
};

// Create a new site
const newSite: CreateSiteDto = {
  site_name: "Downtown Construction",
  address: "123 Main St",
  start_date: new Date(),
  status: "active"
};
```

## Notes:
- All models are designed to work with your existing Prisma schema
- Relationship fields are referenced by ID to avoid circular dependencies
- DTOs include validation-friendly structures for API endpoints
- Models can be extended with decorators for validation, transformation, etc.