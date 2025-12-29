import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { CreateRoleDto, UpdateRoleDto } from '../models/role.model';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../auth/decorators';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // CREATE - POST /roles
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin')
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  // READ ALL - GET /roles
  @Get()
  @Roles('admin', 'manager')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,  
    @Query('search') search?: string,
  ) {
    // If search query param is provided, use search
    if (search && search.trim()) {
      return this.roleService.searchRoles(search.trim());
    }
    
    // If page/limit are provided, use pagination
    if (page || limit) {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;
      
      // Validate parsed numbers
      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        // Return all roles if invalid pagination params
        return this.roleService.findAll();
      }
      
      return this.roleService.getPaginatedRoles(pageNum, limitNum);
    }
    
    // Otherwise return all roles
    return this.roleService.findAll();
  }


 
  // SORTED ROLES - GET /roles/sorted?sortBy=role_name&sortOrder=desc
  @Get('sorted')
  @Roles('admin', 'manager')
  async getSorted(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.roleService.getSortedRoles(sortBy, sortOrder);
  }

  // ADVANCED SEARCH - GET /roles/advanced?page=1&limit=10&search=admin&sortBy=role_name&sortOrder=asc
  @Get('advanced')
  @Roles('admin', 'manager')
  async getAdvanced(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.roleService.findWithAdvancedOptions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      sortBy,
      sortOrder,
    });
  }

  // GET STATISTICS - GET /roles/stats
  @Get('stats')
  @Roles('admin', 'manager')
  async getRoleStats() {
    return this.roleService.getRoleStats();
  }

  // FIND BY NAME - GET /roles/by-name/:name
  @Get('by-name/:name')
  @Roles('admin', 'manager', 'supervisor')
  async findByName(@Param('name') name: string) {
    return this.roleService.findByName(name);
  }

  // READ ONE - GET /roles/:id
  @Get(':id')
  @Roles('admin', 'manager', 'supervisor')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findById(id);
  }

  // UPDATE - PUT /roles/:id
  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, updateRoleDto);
  }

  // PARTIAL UPDATE - PATCH /roles/:id
  @Patch(':id')
  @Roles('admin')
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: Partial<UpdateRoleDto>,
  ) {
    return this.roleService.update(id, updateRoleDto);
  }

  // DELETE - DELETE /roles/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.delete(id);
  }
}