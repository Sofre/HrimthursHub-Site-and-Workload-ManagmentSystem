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
import { MaterialService } from '../services/material.service';
import { CreateMaterialDto, UpdateMaterialDto } from '../models/material.model';

@Controller('materials')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  // CREATE - POST /materials
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialService.create(createMaterialDto);
  }

  // READ ALL - GET /materials?page=1&limit=10&search=cement
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    // If search term provided, use search functionality
    if (search && search.trim().length >= 2) {
      return this.materialService.searchMaterials(search.trim());
    }
    if (page || limit) {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;
      return this.materialService.findWithPagination(pageNum, limitNum);
    }
    // Return all materials if no pagination or search
    return this.materialService.findAll();
  }

  // GET LOW STOCK - GET /materials/low-stock?threshold=10
  @Get('low-stock')
  async getLowStockMaterials(@Query('threshold') threshold: string = '10') {
    const thresholdNum = parseInt(threshold, 10);
    return this.materialService.getLowStockMaterials(thresholdNum);
  }

  // GET STATISTICS - GET /materials/stats
  @Get('stats')
  async getMaterialStats() {
    return this.materialService.getMaterialStatistics();
  }

  // SEARCH BY SITE - GET /materials/by-site/:siteId
  @Get('by-site/:siteId')
  async findBySite(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.materialService.findBySite(siteId);
  }

  // READ ONE - GET /materials/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialService.findById(id);
  }

  // UPDATE - PATCH /materials/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.materialService.update(id, updateMaterialDto);
  }

  // ADD STOCK - POST /materials/:id/stock
  @Post(':id/stock')
  async addStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() stockData: { quantity: number; description?: string },
  ) {
    return this.materialService.addStock(
      id,
      stockData.quantity,
      stockData.description || 'Stock added via API',
    );
  }

  // USE MATERIAL - POST /materials/:id/use
  @Post(':id/use')
  async useMaterial(
    @Param('id', ParseIntPipe) id: number,
    @Body() usageData: { quantity: number },
  ) {
    return this.materialService.useMaterial(id, usageData.quantity);
  }

  // GET CURRENT STOCK - GET /materials/:id/stock
  @Get(':id/stock')
  async getCurrentStock(@Param('id', ParseIntPipe) id: number) {
    const material = await this.materialService.findById(id);
    return {
      material_id: id,
      name: material.name,
      current_stock: material.quantity,
      unit: material.unit,
    };
  }

  // DELETE - DELETE /materials/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.materialService.delete(id);
  }

}