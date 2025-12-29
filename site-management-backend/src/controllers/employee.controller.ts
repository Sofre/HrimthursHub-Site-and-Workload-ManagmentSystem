import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { EmployeeService } from '../services/employee.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../models/employee.model';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  // CREATE - POST /employees
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  // READ ALL - GET /employees?page=1&limit=10&search=john&status=active&role=manager
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'inactive',
    @Query('role') role?: string,
  ) {
    // If search term provided, use search functionality
    if (search && search.trim().length >= 2) {
      return this.employeeService.searchEmployees(search.trim());
    }
    
    // If role filter provided, filter by role (supports both ID and name)
    if (role) {
      // Try to parse as role ID first
      const roleId = parseInt(role, 10);
      if (!isNaN(roleId)) {
        return this.employeeService.findByRole(roleId);
      } else {
        // If not a number, treat as role name
        return this.employeeService.findByRoleName(role);
      }
    }
    
    // If status filter provided, filter by status
    if (status) {
      return this.employeeService.findByStatus(status);
    }
    
    // If pagination parameters provided, use pagination
    if (page || limit) {
      const pageNum = parseInt(page || '1', 10) || 1;
      const limitNum = parseInt(limit || '10', 10) || 10;
      return this.employeeService.findWithPagination(pageNum, limitNum);
    }
    
    // Default: Get all employees (no pagination)
    return this.employeeService.findAll();
  }

  // READ ACTIVE ONLY - GET /employees/active
  @Get('active')
  async findActiveEmployees() {
    return this.employeeService.findActiveEmployees();
  }

  // GET STATISTICS - GET /employees/stats
  @Get('stats')
  async getEmployeeStats() {
    return this.employeeService.getEmployeeStats();
  }

  // READ ONE - GET /employees/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeeService.findById(id);
  }

  // UPDATE - PATCH /employees/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  // TOGGLE STATUS - PATCH /employees/:id/toggle-status
  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.employeeService.toggleEmployeeStatus(id);
  }

  // DELETE - DELETE /employees/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.employeeService.delete(id);
  }
}