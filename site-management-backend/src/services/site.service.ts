import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto, UpdateSiteDto } from '../models/site.model';

@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all sites with basic info
   * Similar to Spring Boot @GetMapping("/sites")
   */
  async findAll() {
    return this.prisma.sites.findMany({
      include: {
        attendance_logs: {
          where: {
            check_out_time: null, // Only active attendance (checked in)
          },
          include: {
            employees: true,
          },
        },
        payments: true,
        for_labor: true,
        for_material: true,
        materials: true,
        warnings: {
          where: {
            acknowledged_date: null, // Only unacknowledged warnings
          },
        },
      },
    });
  }

  /**
   * Get site by ID with full details (employees, materials, payments)
   * Similar to Spring Boot with @EntityGraph or fetch joins
   */
  async findById(id: number) {
    const site = await this.prisma.sites.findUnique({
      where: { site_id: id },
      include: {
        attendance_logs: {
          include: {
            employees: true,
          },
        },
        payments: true,
      },
    });
    
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }
    
    return site;
  }

  /**
   * Create new construction site
   * Business validation included
   */
  async create(createSiteDto: CreateSiteDto) {
    // Business logic: Validate dates
    const startDate = createSiteDto.start_date || createSiteDto.start_date;
    const deadlineDate = createSiteDto.deadline || createSiteDto.estimated_end_date;
    
    if (deadlineDate && startDate) {
      const start = new Date(startDate);
      const deadline = new Date(deadlineDate);
      if (deadline <= start) {
        throw new BadRequestException('Deadline must be after start date');
      }
    }

    // Convert date strings to Date objects for Prisma
    const siteData: any = {
      site_name: createSiteDto.site_name,
      address: createSiteDto.address || 'Unknown',  // Fallback to 'Unknown'
      latitude: createSiteDto.latitude !== undefined ? createSiteDto.latitude : null,  // Fallback to null
      longitude: createSiteDto.longitude !== undefined ? createSiteDto.longitude : null,  // Fallback to null
      money_spent: createSiteDto.money_spent || 0,
      status: createSiteDto.status || 'planning'
    };

    // Only add dates if they are provided
    if (createSiteDto.start_date) {
      siteData.start_date = new Date(createSiteDto.start_date);
    }
    if (createSiteDto.deadline) {
      siteData.deadline = new Date(createSiteDto.deadline);
    }
    if (createSiteDto.estimated_end_date) {
      siteData.deadline = new Date(createSiteDto.estimated_end_date);
    }
    if (createSiteDto.end_date) {
      siteData.end_date = new Date(createSiteDto.end_date);
    }
    if (createSiteDto.actual_end_date) {
      siteData.end_date = new Date(createSiteDto.actual_end_date);
    }

    return this.prisma.sites.create({
      data: siteData,
      include: {
        attendance_logs: true,
        payments: true,
      },
    });
  }

  /**
   * Update site information
   */
  async update(id: number, updateSiteDto: UpdateSiteDto) {
    await this.findById(id); // Ensure exists
    
    // Business validation for date updates
    const startDate = updateSiteDto.start_date;
    const deadlineDate = updateSiteDto.deadline || updateSiteDto.estimated_end_date;
    
    if (deadlineDate && startDate) {
      const start = new Date(startDate);
      const deadline = new Date(deadlineDate);
      if (deadline <= start) {
        throw new BadRequestException('Deadline must be after start date');
      }
    }

    // Convert date strings to Date objects for Prisma
    const updateData: any = {};
    
    // Handle optional fields with proper fallbacks
    if (updateSiteDto.site_name !== undefined) {
      updateData.site_name = updateSiteDto.site_name;
    }
    if (updateSiteDto.address !== undefined) {
      updateData.address = updateSiteDto.address || 'Unknown';
    }
    if (updateSiteDto.latitude !== undefined) {
      updateData.latitude = updateSiteDto.latitude !== null ? updateSiteDto.latitude : null;
    }
    if (updateSiteDto.longitude !== undefined) {
      updateData.longitude = updateSiteDto.longitude !== null ? updateSiteDto.longitude : null;
    }
    if (updateSiteDto.status !== undefined) {
      updateData.status = updateSiteDto.status;
    }
    if (updateSiteDto.money_spent !== undefined) {
      updateData.money_spent = updateSiteDto.money_spent;
    }
    
    if (updateSiteDto.start_date) {
      updateData.start_date = new Date(updateSiteDto.start_date);
    }
    if (updateSiteDto.deadline) {
      updateData.deadline = new Date(updateSiteDto.deadline);
    }
    if (updateSiteDto.estimated_end_date) {
      updateData.deadline = new Date(updateSiteDto.estimated_end_date);
    }
    if (updateSiteDto.end_date) {
      updateData.end_date = new Date(updateSiteDto.end_date);
    }
    if (updateSiteDto.actual_end_date) {
      updateData.end_date = new Date(updateSiteDto.actual_end_date);
    }

    return this.prisma.sites.update({
      where: { site_id: id },
      data: updateData,
      include: {
        attendance_logs: true,
        
        payments: true,
      },
    });
  }

  /**
   * Delete site (with business rules)
   */
  async delete(id: number) {
    const site = await this.findById(id);
    
    // Business rule: Can't delete active sites
    if (site.status === 'active') {
      throw new BadRequestException('Cannot delete active site. Mark as completed first.');
    }

    return this.prisma.sites.delete({
      where: { site_id: id },
    });
  }

  // Advanced Business Logic Methods

  /**
   * Get active sites only
   * Business logic: Filter active sites with future deadlines
   */
  async findActiveSites() {
    return this.prisma.sites.findMany({
      where: { status: 'active' },
      include: {
        attendance_logs: true,
        
        payments: true,
      },
    });
  }

  /**
   * Get sites by status with filtering
   */
  async findByStatus(status: string) {
    const validStatuses = ['planning', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return this.prisma.sites.findMany({
      where: { status },
      include: {
        attendance_logs: true,
        
        payments: true,
      },
    });
  }

  /**
   * Search sites by name or address
   * Full-text search functionality
   */
  async searchSites(searchTerm: string) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException('Search term must be at least 2 characters');
    }

    return this.prisma.sites.findMany({
      where: {
        OR: [
          {
            site_name: {
              contains: searchTerm.trim(),
              mode: 'insensitive',
            },
          },
          {
            address: {
              contains: searchTerm.trim(),
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        attendance_logs: true,
        
        payments: true,
      },
    });
  }

  /**
   * Get sites within budget range
   * Business logic: Financial filtering
   */
  async findSitesByBudgetRange(minBudget?: number, maxBudget?: number) {
    if (minBudget && maxBudget && minBudget > maxBudget) {
      throw new BadRequestException('Minimum budget cannot be greater than maximum budget');
    }

    const where: any = {};
    
    if (minBudget !== undefined || maxBudget !== undefined) {
      where.budget = {};
      if (minBudget !== undefined) where.budget.gte = minBudget;
      if (maxBudget !== undefined) where.budget.lte = maxBudget;
    }

    return this.prisma.sites.findMany({
      where,
      include: {
        attendance_logs: true,
        
        payments: true,
      },
    });
  }

  /**
   * Get paginated sites
   */
  async findWithPagination(page: number = 1, limit: number = 10) {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const [sites, totalCount] = await Promise.all([
      this.prisma.sites.findMany({
        skip,
        take: limit,
        orderBy: { start_date: 'desc' },
        include: {
          attendance_logs: true,
          
          payments: true,
        },
      }),
      this.prisma.sites.count(),
    ]);

    return {
      data: sites,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  // Site Management Business Logic

  /**
   * Add expense to site (update money_spent)
   * Business logic: Track site expenses
   */
  async addExpense(siteId: number, amount: number,) {
    if (amount <= 0) {
      throw new BadRequestException('Expense amount must be positive');
    }

    const site = await this.findById(siteId);
    
    if (site.status === 'completed' || site.status === 'cancelled') {
      throw new BadRequestException('Cannot add expenses to completed or cancelled sites');
    }

    return this.prisma.sites.update({
      where: { site_id: siteId },
      data: {
        money_spent: {
          increment: amount,
        },
      },
      include: {
        attendance_logs: true,
        
        payments: true,
      },
    });
  }

  /**
   * Complete a site
   * Business workflow method
   */
  async completeSite(siteId: number) {
    const site = await this.findById(siteId);
    
    if (site.status === 'completed') {
      throw new BadRequestException('Site is already completed');
    }

    return this.update(siteId, {
      status: 'completed',
      end_date: new Date()
    });
    
  }

  /**
   * Get site statistics and metrics
   * Business intelligence method
   */
  async getSiteStatistics() {
    const [allSitesCount, activeSites, completedSites] = await Promise.all([
      this.prisma.sites.count(),
      this.prisma.sites.findMany({
        where: { status: 'active' },
      }),
      this.prisma.sites.findMany({
        where: { status: 'completed' },
      }),
    ]);

    return {
      total: allSitesCount,
      active: activeSites.length,
      completed: completedSites.length,
      planning: allSitesCount - activeSites.length - completedSites.length,
    };
  }

  /**
   * Get overdue sites (deadline passed but still active)
   * Business logic: Risk management
   */
  async getOverdueSites() {
    const now = new Date();
    
    return this.prisma.sites.findMany({
      where: {
        status: 'active',
        deadline: {
          lt: now,
        },
      },
      include: {
        attendance_logs: true,
        
        payments: true,
      },
    });
  }
  async startSiteConstruction(siteId: number) {
    const site = await this.findById(siteId); 
    if (site.status !== 'planning') {
      throw new BadRequestException('Only sites in planning status can be started');
    }
    // automaticly updates site status to active and sets start date to current date
    return this.update(siteId, {
      status: 'active',
      start_date: new Date()
    });
  }

}
