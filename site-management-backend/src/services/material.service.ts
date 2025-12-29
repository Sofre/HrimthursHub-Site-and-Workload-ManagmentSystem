import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMaterialDto, UpdateMaterialDto } from '../models/material.model';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaterialService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all materials with site information
   */
  async findAll() {
    return this.prisma.materials.findMany({
      include: {
        sites: true,
      },
    });
  }

  /**
   * Get material by ID with usage history
   */
  async findById(id: number) {
    const material = await this.prisma.materials.findUnique({
      where: { material_id: id },
      include: {
        sites: true,
      },
    });
    
    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }
    
    return material;
  }

  /**
   * Create new material in inventory
   */
  async create(createMaterialDto: CreateMaterialDto) {
    // Business validation
    if (createMaterialDto.quantity < 0) {
      throw new BadRequestException('Initial quantity cannot be negative');
    }

    return this.prisma.materials.create({
      data: createMaterialDto,
      include: {
        sites: true,
      },
    });
  }

  /**
   * Update material information
   */
  async update(id: number, updateMaterialDto: UpdateMaterialDto) {
    await this.findById(id); // Ensure exists
    
    if (updateMaterialDto.quantity !== undefined && updateMaterialDto.quantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    return this.prisma.materials.update({
      where: { material_id: id },
      data: updateMaterialDto,
      include: {
        sites: true,
      },
    });
  }

  /**
   * Delete material from inventory
   */
  async delete(id: number) {
    const material = await this.findById(id);
    
    // Business rule: Can't delete materials with remaining quantity
    if (material.quantity > 0) {
      throw new BadRequestException('Cannot delete material with remaining stock. Set quantity to 0 first.');
    }

    return this.prisma.materials.delete({
      where: { material_id: id },
    });
  }

  // Inventory Management Business Logic

  /**
   * Get materials by site
   */
  async findBySite(siteId: number) {
    return this.prisma.materials.findMany({
      where: { site_id: siteId },
      include: {
        sites: true,
      },
    });
  }

  /**
   * Get low stock materials (inventory alert)
   */
  async getLowStockMaterials(threshold: number = 10) {
    if (threshold < 0) {
      throw new BadRequestException('Threshold must be non-negative');
    }

    return this.prisma.materials.findMany({
      where: {
        quantity: {
          lte: threshold,
        },
      },
      include: {
        sites: true,
      },
    });
  }

  /**
   * Search materials by name or description
   */
  async searchMaterials(searchTerm: string) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException('Search term must be at least 2 characters');
    }

    return this.prisma.materials.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm.trim(), mode: 'insensitive' } },
          { description: { contains: searchTerm.trim(), mode: 'insensitive' } }
        ]
      },
      include: {
        sites: true,
      },
    });
  }

  /**
   * Add stock to material (receiving shipment)
   */
  async addStock(materialId: number, quantity: number, notes?: string) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity to add must be positive');
    }

    const material = await this.findById(materialId);
    const newQuantity = material.quantity + quantity;

    return this.prisma.materials.update({
      where: { material_id: materialId },
      data: { quantity: newQuantity },
      include: {
        sites: true,
      },
    });
  }

  /**
   * Use material (reduce stock)
   */
  async useMaterial(materialId: number, quantityUsed: number) {
    if (quantityUsed <= 0) {
      throw new BadRequestException('Quantity used must be positive');
    }

    const material = await this.findById(materialId);
    
    if (material.quantity < quantityUsed) {
      throw new BadRequestException(`Insufficient stock. Available: ${material.quantity}, Requested: ${quantityUsed}`);
    }

    const newQuantity = material.quantity - quantityUsed;
    
    return this.prisma.materials.update({
      where: { material_id: materialId },
      data: { quantity: newQuantity },
      include: {
        sites: true,
      },
    });
  }

  /**
   * Get material statistics
   */
  async getMaterialStatistics() {
    const [total, lowStock, outOfStock] = await Promise.all([
      this.prisma.materials.count(),
      this.getLowStockMaterials(10),
      this.getLowStockMaterials(0)
    ]);

    return {
      total,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      inStock: total - outOfStock.length
    };
  }

  /**
   * Get paginated materials
   */
  async findWithPagination(page: number = 1, limit: number = 20) {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 20;

    const skip = (page - 1) * limit;

    const [materials, total] = await Promise.all([
      this.prisma.materials.findMany({
        skip,
        take: limit,
        include: {
          sites: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.materials.count(),
    ]);

    return {
      data: materials,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}