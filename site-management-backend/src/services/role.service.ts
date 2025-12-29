import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from '../models/role.model';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all roles
   * Similar to: @GetMapping("/roles") in Spring Boot
   */
   async findAll() {
    return this.prisma.roles.findMany({
      include: {
        employees: true,
        wage_rates: true,
      },
    });
  }
  /**
   * Get role by ID
   * Similar to: @GetMapping("/roles/{id}") in Spring Boot
   */
  async findById(id: number) {
    const role = await this.prisma.roles.findUnique({
      where: { role_id: id },
      include: {
        employees: true,
        wage_rates: true,
      },
    });
    
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    return role;
  }

  /**
   * Create new role
   * Similar to: @PostMapping("/roles") in Spring Boot
   */
  async create(createRoleDto: CreateRoleDto) {
    // Business logic: Check if role name already exists
    const existingRole = await this.prisma.roles.findUnique({
      where: { role_name: createRoleDto.role_name }
    });
    
    if (existingRole) {
      throw new ConflictException(`Role with name '${createRoleDto.role_name}' already exists`);
    }

    return this.prisma.roles.create({
      data: createRoleDto,
      include: {
        employees: true,
        wage_rates: true,
      },
    });
  }

  /**
   * Update role
   * Similar to: @PutMapping("/roles/{id}") in Spring Boot
   */
  async update(id: number, updateRoleDto: UpdateRoleDto) {
    // Ensure role exists
    await this.findById(id);
    
    // Check role name uniqueness if role_name is being updated
    if (updateRoleDto.role_name) {
      const roleCheck = await this.prisma.roles.findUnique({
        where: { role_name: updateRoleDto.role_name }
      });
      if (roleCheck && roleCheck.role_id !== id) {
        throw new ConflictException(`Role name '${updateRoleDto.role_name}' is already in use`);
      }
    }

    return this.prisma.roles.update({
      where: { role_id: id },
      data: updateRoleDto,
      include: {
        employees: true,
        wage_rates: true,
      },
    });
  }

  /**
   * Delete role
   * Similar to: @DeleteMapping("/roles/{id}") in Spring Boot
   */
  async delete(id: number) {
    await this.findById(id); // Ensure exists
    return this.prisma.roles.delete({
      where: { role_id: id }
    });
  }

  /**
   * Find role by name
   * Business logic: Search for role by name
   */
  async findByName(roleName: string) {
    const role = await this.prisma.roles.findUnique({
      where: { role_name: roleName },
      include: {
        employees: true,
        wage_rates: true,
      },
    });
    
    if (!role) {
      throw new NotFoundException(`Role with name '${roleName}' not found`);
    }
    
    return role;
  }

  /**
   * Get role statistics
   * Business logic: Count employees per role
   */
  async getRoleStats() {
    const roles = await this.findAll();
    
    return roles.map(role => ({
      role_id: role.role_id,
      role_name: role.role_name,
      description: role.description,
      employee_count: role.employees?.length || 0,
      has_wage_rate: !!role.wage_rates
    }));
  }

  /**
   * Search roles by text
   * Business logic: Find roles matching search term
   */
  async searchRoles(searchTerm: string) {
    const searchConditions = {
      OR: [
        { 
          role_name: { 
            contains: searchTerm, 
            mode: 'insensitive' as const 
          } 
        },
        { 
          description: { 
            contains: searchTerm, 
            mode: 'insensitive' as const 
          } 
        }
      ]
    };

    return this.prisma.roles.findMany({
      where: searchConditions,
      include: {
        employees: true,
        wage_rates: true,
      },
      orderBy: { role_name: 'asc' }
    });
  }

  /**
   * Get paginated roles
   * Business logic: Basic pagination without search
   */
  async getPaginatedRoles(page: number = 1, limit: number = 10) {
    // Validate and sanitize pagination parameters
    const validPage = Math.max(1, Math.floor(page) || 1);
    const validLimit = Math.max(1, Math.min(100, Math.floor(limit) || 10));
    
    const skip = (validPage - 1) * validLimit;
    
    const [data, total] = await Promise.all([
      this.prisma.roles.findMany({
        skip,
        take: validLimit,
        include: {
          employees: true,
          wage_rates: true,
        },
        orderBy: { role_name: 'asc' }
      }),
      this.prisma.roles.count(),
    ]);
    
    const totalPages = Math.ceil(total / validLimit);
    
    return {
      data,
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
      
    };
  }

  /**
   * Get sorted roles
   * Business logic: Sort roles by specified field and order
   */
  async getSortedRoles(sortBy: string = 'role_name', sortOrder: 'asc' | 'desc' = 'asc') {
    return this.prisma.roles.findMany({
      include: {
        employees: true,
        wage_rates: true,
      },
      orderBy: { [sortBy]: sortOrder }
    });
  }

  /**
   * Advanced search with pagination and sorting
   * Business logic: Combined search, pagination, and sorting
   */
  async findWithAdvancedOptions(options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      sortBy = 'role_name', 
      sortOrder = 'asc' 
    } = options;
    
    const skip = (page - 1) * limit;
    
    const searchConditions = search ? {
      OR: [
        { 
          role_name: { 
            contains: search, 
            mode: 'insensitive' as const 
          } 
        },
        { 
          description: { 
            contains: search, 
            mode: 'insensitive' as const 
          } 
        }
      ]
    } : {};
    
    const [roles, total] = await Promise.all([
      this.prisma.roles.findMany({
        where: searchConditions,
        skip,
        take: limit,
        include: {
          employees: true,
          wage_rates: true,
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      this.prisma.roles.count({ where: searchConditions }),
    ]);
    
    return {
      data: roles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }
}