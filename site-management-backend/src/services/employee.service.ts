import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../models/employee.model';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * Get all employees with their roles
   * Similar to: @GetMapping("/employees") in Spring Boot
   */
  async findAll() {
    return this.prisma.employees.findMany({
      include: {
        roles: true,
      },
    });
  }

  /**
   * Get employee by ID with full details
   * Similar to: @GetMapping("/employees/{id}") in Spring Boot
   */
  /**
   * Get employee by ID  
   * Similar to: @GetMapping("/employees/{id}") in Spring Boot
   */
  async findById(id: number) {
    return this.findOne(id);
  }

  async findOne(id: number) {
    const employee = await this.prisma.employees.findUnique({
      where: { employee_id: id },
      include: {
        roles: true,
      },
    });
    
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    
    return employee;
  }

  /**
   * Create new employee
   * Similar to: @PostMapping("/employees") in Spring Boot
   * Includes business validation
   */
  async create(createEmployeeDto: CreateEmployeeDto) {
    // Business logic: Check if email already exists
    const existingEmployee = await this.prisma.employees.findUnique({
      where: { email: createEmployeeDto.email },
    });
    
    if (existingEmployee) {
      throw new ConflictException(`Employee with email ${createEmployeeDto.email} already exists`);
    }

    // Validate role exists
    const role = await this.prisma.roles.findUnique({
      where: { role_id: createEmployeeDto.role_id }
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${createEmployeeDto.role_id} not found`);
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(createEmployeeDto.password, 12);

    // Convert date_hired to proper Date object if it's a string
    const dateHired = typeof createEmployeeDto.date_hired === 'string' 
      ? new Date(createEmployeeDto.date_hired) 
      : createEmployeeDto.date_hired;

    return this.prisma.employees.create({
      data: {
        ...createEmployeeDto,
        password: hashedPassword,
        date_hired: dateHired,
        force_password_change: createEmployeeDto.force_password_change !== undefined 
          ? createEmployeeDto.force_password_change 
          : true // Default to true for new employees
      },
      include: {
        roles: true,
      },
    });
  }

  /**
   * Update employee
   * Similar to: @PutMapping("/employees/{id}") in Spring Boot
   */
  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    // Ensure employee exists
    await this.findById(id);
    
    // Check email uniqueness if email is being updated
    if (updateEmployeeDto.email) {
      const emailCheck = await this.prisma.employees.findUnique({
        where: { email: updateEmployeeDto.email },
      });
      if (emailCheck && emailCheck.employee_id !== id) {
        throw new ConflictException(`Email ${updateEmployeeDto.email} is already in use`);
      }
    }

    // Validate role if role_id is being updated
    if (updateEmployeeDto.role_id) {
      const role = await this.prisma.roles.findUnique({
        where: { role_id: updateEmployeeDto.role_id }
      });
      
      if (!role) {
        throw new NotFoundException(`Role with ID ${updateEmployeeDto.role_id} not found`);
      }
    }

    return this.prisma.employees.update({
      where: { employee_id: id },
      data: updateEmployeeDto,
      include: {
        roles: true,
      },
    });
  }

  /**
   * Delete employee
   * Similar to: @DeleteMapping("/employees/{id}") in Spring Boot
   */
  async delete(id: number) {
    await this.findById(id); // Ensure exists
    await this.prisma.employees.delete({
      where: { employee_id: id },
    });
  }

  // Business Logic Methods (like Spring Boot @Service methods)

  /**
   * Get employees by role (supports both role ID and role name)
   * Business logic: Filter employees by role with validation
   */
  async findByRole(roleId: number) {
    return this.prisma.employees.findMany({
      where: { role_id: roleId },
      include: {
        roles: true,
      },
    });
  }

  /**
   * Get employees by role name
   * Business logic: Filter employees by role name with automatic ID lookup
   */
  async findByRoleName(roleName: string) {
    return this.prisma.employees.findMany({
      where: {
        roles: {
          role_name: {
            equals: roleName,
            mode: 'insensitive',
          }
        }
      },
      include: {
        roles: true,
      },
    });
  }

  /**
   * Get active employees only
   * Business logic: Filter for active status
   */
  async findActiveEmployees() {
    return this.prisma.employees.findMany({
      where: { status: 'active' },
      include: {
        roles: true,
      },
    });
  }

  /**
   * Get employees by status
   * Business logic: Filter employees by status
   */
  async findByStatus(status: string) {
    return this.prisma.employees.findMany({
      where: { status },
      include: {
        roles: true,
      },
    });
  }

  /**
   * Search employees by name
   * Business logic: Full-text search across name fields
   */
  async searchEmployees(searchTerm: string) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException('Search term must be at least 2 characters');
    }
    
    return this.prisma.employees.findMany({
      where: {
        OR: [
          {
            first_name: {
              contains: searchTerm.trim(),
              mode: 'insensitive',
            },
          },
          {
            last_name: {
              contains: searchTerm.trim(),
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        roles: true,
      },
    });
  }

  /**
   * Get paginated employees
   * Business logic: Pagination with validation
   */
  async findWithPagination(page: number = 1, limit: number = 10, sortBy: string = 'first_name') {
    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.employees.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: 'asc' },
        include: {
          roles: true,
        },
      }),
      this.prisma.employees.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


  /**
   * Get employee statistics
   * Business logic: Calculate metrics (like Spring Boot @Service)
   */
  async getEmployeeStats() {
    const [total, active, allEmployees] = await Promise.all([
      this.prisma.employees.count(),
      this.prisma.employees.findMany({
        where: { status: 'active' },
      }),
      this.prisma.employees.findMany({
        include: {
          roles: true,
        },
      }),
    ]);

    // Group employees by role
    const byRole: { [key: string]: number } = {};
    allEmployees.forEach(employee => {
      const roleName = employee.roles?.role_name || 'Unassigned';
      byRole[roleName] = (byRole[roleName] || 0) + 1;
    });

    return {
      total,
      active: active.length,
      inactive: total - active.length,
      byRole,
    };
  }

  /**
   * Activate/Deactivate employee
   * Business logic method (like Spring Boot service methods)
   */
  async toggleEmployeeStatus(id: number) {
    const employee = await this.findById(id);
    const newStatus = employee.status === 'active' ? 'inactive' : 'active';
    
    return this.update(id, { status: newStatus });
  }
}
