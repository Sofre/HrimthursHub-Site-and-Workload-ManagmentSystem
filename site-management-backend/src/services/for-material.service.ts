import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateForMaterialDto, UpdateForMaterialDto } from '../models/for-material.model';
import { PrismaService } from '../prisma/prisma.service';

interface FindForMaterialParams {
  page?: number;
  limit?: number;
  material_id?: number;
  site_id?: number;
  payment_id?: number;
  start_date?: Date;
  end_date?: Date;
  status?: string;
  supplier_name?: string;
}

@Injectable()
export class ForMaterialService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all material records with filters and pagination
   */
  async findAll(params: FindForMaterialParams) {
    try {
      // Build where clause
      const where: any = {};
      if (params.material_id) where.material_id = params.material_id;
      if (params.site_id) where.site_id = params.site_id;
      if (params.payment_id) where.payment_id = params.payment_id;
      if (params.status) where.status = params.status;
      if (params.supplier_name) where.supplier_name = { contains: params.supplier_name, mode: 'insensitive' };
      if (params.start_date || params.end_date) {
        where.payment_date = {};
        if (params.start_date) where.payment_date.gte = params.start_date;
        if (params.end_date) where.payment_date.lte = params.end_date;
      }

      if (params.page && params.limit) {
        // Paginated results
        const offset = (params.page - 1) * params.limit;
        const [materialRecords, total] = await Promise.all([
          this.prisma.for_material.findMany({
            where,
            include: {
              materials: {
                select: { name: true, quantity: true, description: true },
              },
              payments: {
                select: { amount: true, payment_date: true, status: true },
              },
              sites: {
                select: { site_name: true, address: true },
              },
            },
            orderBy: { payment_date: 'desc' },
            skip: offset,
            take: params.limit,
          }),
          this.prisma.for_material.count({ where }),
        ]);

        return {
          material_records: materialRecords,
          pagination: {
            page: params.page,
            limit: params.limit,
            total,
            pages: Math.ceil(total / params.limit),
          },
        };
      } else {
        // All results without pagination
        const materialRecords = await this.prisma.for_material.findMany({
          where,
          include: {
            materials: {
              select: { name: true, quantity: true, description: true },
            },
            payments: {
              select: { amount: true, payment_date: true, status: true },
            },
            sites: {
              select: { site_name: true, address: true },
            },
          },
          orderBy: { payment_date: 'desc' },
        });

        return {
          material_records: materialRecords,
          total: materialRecords.length,
        };
      }
    } catch (error) {
      throw new BadRequestException(`Failed to fetch material records: ${error.message}`);
    }
  }

  /**
   * Get material record by ID
   */
  async findById(id: number) {
    try {
      const materialRecord = await this.prisma.for_material.findUnique({
        where: { for_material_id: id },
        include: {
          materials: {
            select: { name: true, quantity: true, description: true },
          },
          payments: {
            select: { amount: true, payment_date: true, status: true },
          },
          sites: {
            select: { site_name: true, address: true },
          },
        },
      });

      if (!materialRecord) {
        throw new NotFoundException(`Material record with ID ${id} not found`);
      }

      return materialRecord;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to fetch material record: ${error.message}`);
    }
  }

  /**
   * Get material usage summary
   */
  async getMaterialUsageSummary(materialId: number, startDate?: Date, endDate?: Date) {
    try {
      // Check if material exists
      const material = await this.prisma.materials.findUnique({
        where: { material_id: materialId },
        select: { name: true, quantity: true, description: true },
      });

      if (!material) {
        throw new NotFoundException('Material not found');
      }

      const where: any = { material_id: materialId };
      if (startDate || endDate) {
        where.payment_date = {};
        if (startDate) where.payment_date.gte = startDate;
        if (endDate) where.payment_date.lte = endDate;
      }

      const [materialRecords, totalAmount, recordCount, uniqueSites] = await Promise.all([
        this.prisma.for_material.findMany({
          where,
          include: {
            sites: {
              select: { site_name: true },
            },
          },
          orderBy: { payment_date: 'desc' },
        }),
        this.prisma.for_material.aggregate({
          where,
          _sum: { for_material_amount: true },
        }),
        this.prisma.for_material.count({ where }),
        this.prisma.for_material.findMany({
          where,
          select: { site_id: true },
          distinct: ['site_id'],
        }),
      ]);

      // Group by site
      const usageBySite = materialRecords.reduce((acc, record) => {
        const siteName = record.sites?.site_name || 'Unknown Site';
        if (!acc[siteName]) {
          acc[siteName] = { count: 0, total_amount: 0 };
        }
        acc[siteName].count += 1;
        acc[siteName].total_amount += Number(record.for_material_amount);
        return acc;
      }, {});

      // Group by supplier
      const usageBySupplier = materialRecords.reduce((acc, record) => {
        const supplier = record.supplier_name || 'Unknown Supplier';
        if (!acc[supplier]) {
          acc[supplier] = { count: 0, total_amount: 0 };
        }
        acc[supplier].count += 1;
        acc[supplier].total_amount += Number(record.for_material_amount);
        return acc;
      }, {});

      return {
        material: material,
        summary: {
          total_records: recordCount,
          total_amount: Number(totalAmount._sum.for_material_amount) || 0,
          unique_sites: uniqueSites.length,
          average_amount: recordCount > 0 ? Number(totalAmount._sum.for_material_amount || 0) / recordCount : 0,
        },
        usage_by_site: usageBySite,
        usage_by_supplier: usageBySupplier,
        recent_records: materialRecords.slice(0, 10),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to fetch material usage summary: ${error.message}`);
    }
  }

  /**
   * Get site material summary
   */
  async getSiteMaterialSummary(siteId: number, startDate?: Date, endDate?: Date) {
    try {
      // Check if site exists
      const site = await this.prisma.sites.findUnique({
        where: { site_id: siteId },
        select: { site_name: true, address: true },
      });

      if (!site) {
        throw new NotFoundException('Site not found');
      }

      const where: any = { site_id: siteId };
      if (startDate || endDate) {
        where.payment_date = {};
        if (startDate) where.payment_date.gte = startDate;
        if (endDate) where.payment_date.lte = endDate;
      }

      const [materialRecords, totalAmount, recordCount, uniqueMaterials] = await Promise.all([
        this.prisma.for_material.findMany({
          where,
          include: {
            materials: {
              select: { name: true, description: true },
            },
          },
          orderBy: { payment_date: 'desc' },
        }),
        this.prisma.for_material.aggregate({
          where,
          _sum: { for_material_amount: true },
        }),
        this.prisma.for_material.count({ where }),
        this.prisma.for_material.findMany({
          where,
          select: { material_id: true },
          distinct: ['material_id'],
        }),
      ]);

      // Group by material
      const usageByMaterial = materialRecords.reduce((acc, record) => {
        const materialName = record.materials?.name || 'Unknown Material';
        if (!acc[materialName]) {
          acc[materialName] = { count: 0, total_amount: 0 };
        }
        acc[materialName].count += 1;
        acc[materialName].total_amount += Number(record.for_material_amount);
        return acc;
      }, {});

      // Group by supplier
      const usageBySupplier = materialRecords.reduce((acc, record) => {
        const supplier = record.supplier_name || 'Unknown Supplier';
        if (!acc[supplier]) {
          acc[supplier] = { count: 0, total_amount: 0 };
        }
        acc[supplier].count += 1;
        acc[supplier].total_amount += Number(record.for_material_amount);
        return acc;
      }, {});

      return {
        site: site,
        summary: {
          total_records: recordCount,
          total_amount: Number(totalAmount._sum.for_material_amount) || 0,
          unique_materials: uniqueMaterials.length,
          average_amount: recordCount > 0 ? Number(totalAmount._sum.for_material_amount || 0) / recordCount : 0,
        },
        usage_by_material: usageByMaterial,
        usage_by_supplier: usageBySupplier,
        recent_records: materialRecords.slice(0, 10),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to fetch site material summary: ${error.message}`);
    }
  }

  /**
   * Create new material record
   */
  async create(createForMaterialDto: CreateForMaterialDto) {
    try {
      // Validate material exists
      const material = await this.prisma.materials.findUnique({
        where: { material_id: createForMaterialDto.material_id },
        select: { material_id: true, quantity: true },
      });

      if (!material) {
        throw new NotFoundException('Material not found');
      }

      // Validate site exists
      const site = await this.prisma.sites.findUnique({
        where: { site_id: createForMaterialDto.site_id },
        select: { site_id: true },
      });

      if (!site) {
        throw new NotFoundException('Site not found');
      }

      // Validate payment exists
      const payment = await this.prisma.payments.findUnique({
        where: { payment_id: createForMaterialDto.payment_id },
        select: { payment_id: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const materialRecord = await this.prisma.for_material.create({
        data: createForMaterialDto,
        include: {
          materials: {
            select: { name: true, quantity: true },
          },
          payments: {
            select: { amount: true, payment_date: true, status: true },
          },
          sites: {
            select: { site_name: true, address: true },
          },
        },
      });

      return materialRecord;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to create material record: ${error.message}`);
    }
  }

  /**
   * Update material record
   */
  async update(id: number, updateForMaterialDto: UpdateForMaterialDto) {
    try {
      // Check if record exists
      const existingRecord = await this.prisma.for_material.findUnique({
        where: { for_material_id: id },
      });

      if (!existingRecord) {
        throw new NotFoundException(`Material record with ID ${id} not found`);
      }

      // Validate material if provided
      if (updateForMaterialDto.material_id) {
        const material = await this.prisma.materials.findUnique({
          where: { material_id: updateForMaterialDto.material_id },
        });

        if (!material) {
          throw new NotFoundException('Material not found');
        }
      }

      // Validate site if provided
      if (updateForMaterialDto.site_id) {
        const site = await this.prisma.sites.findUnique({
          where: { site_id: updateForMaterialDto.site_id },
        });

        if (!site) {
          throw new NotFoundException('Site not found');
        }
      }

      const updatedRecord = await this.prisma.for_material.update({
        where: { for_material_id: id },
        data: updateForMaterialDto,
        include: {
          materials: {
            select: { name: true, quantity: true },
          },
          payments: {
            select: { amount: true, payment_date: true, status: true },
          },
          sites: {
            select: { site_name: true, address: true },
          },
        },
      });

      return updatedRecord;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to update material record: ${error.message}`);
    }
  }

  /**
   * Delete material record
   */
  async delete(id: number) {
    try {
      const record = await this.prisma.for_material.findUnique({
        where: { for_material_id: id },
      });

      if (!record) {
        throw new NotFoundException(`Material record with ID ${id} not found`);
      }

      await this.prisma.for_material.delete({
        where: { for_material_id: id },
      });

      return { message: 'Material record deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to delete material record: ${error.message}`);
    }
  }

  /**
   * Get material statistics
   */
  async getMaterialStatistics(startDate?: Date, endDate?: Date) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      const where: any = {
        payment_date: { gte: start, lte: end },
      };

      const [totalRecords, totalAmount, avgAmount, topMaterials, topSuppliers] = await Promise.all([
        this.prisma.for_material.count({ where }),
        this.prisma.for_material.aggregate({
          where,
          _sum: { for_material_amount: true },
        }),
        this.prisma.for_material.aggregate({
          where,
          _avg: { for_material_amount: true },
        }),
        this.prisma.$queryRaw`
          SELECT m.name, m.material_id,
                 COUNT(fm.for_material_id) as usage_count,
                 SUM(fm.for_material_amount) as total_amount
          FROM for_material fm
          JOIN materials m ON fm.material_id = m.material_id
          WHERE fm.payment_date >= ${start} AND fm.payment_date <= ${end}
          GROUP BY m.material_id, m.name
          ORDER BY total_amount DESC
          LIMIT 10
        `,
        this.prisma.$queryRaw`
          SELECT supplier_name,
                 COUNT(for_material_id) as usage_count,
                 SUM(for_material_amount) as total_amount
          FROM for_material
          WHERE payment_date >= ${start} AND payment_date <= ${end}
          GROUP BY supplier_name
          ORDER BY total_amount DESC
          LIMIT 10
        `,
      ]);

      return {
        period: { start, end },
        overview: {
          total_records: totalRecords,
          total_amount: totalAmount._sum.for_material_amount || 0,
          average_amount: avgAmount._avg.for_material_amount || 0,
        },
        top_materials: topMaterials,
        top_suppliers: topSuppliers,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch material statistics: ${error.message}`);
    }
  }

  /**
   * Get supplier performance report
   */
  async getSupplierPerformanceReport(startDate?: Date, endDate?: Date) {
    try {
      const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      const end = endDate || new Date();

      const supplierStats = await this.prisma.$queryRaw`
        SELECT 
          supplier_name,
          COUNT(for_material_id) as total_orders,
          SUM(for_material_amount) as total_amount,
          AVG(for_material_amount) as avg_order_amount,
          COUNT(DISTINCT site_id) as sites_served,
          COUNT(DISTINCT material_id) as materials_supplied
        FROM for_material
        WHERE payment_date >= ${start} AND payment_date <= ${end}
        GROUP BY supplier_name
        ORDER BY total_amount DESC
      `;

      return {
        period: { start, end },
        supplier_performance: supplierStats,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch supplier performance report: ${error.message}`);
    }
  }
}