import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ForMaterialService } from '../services/for-material.service';
import { CreateForMaterialDto, UpdateForMaterialDto } from '../models/for-material.model';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guard';
import { Roles } from '../auth/decorators';

@Controller('for-material')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ForMaterialController {
  constructor(private readonly forMaterialService: ForMaterialService) {}

  // CREATE - POST /for-material
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('manager', 'admin', 'supervisor')
  async create(@Body() createForMaterialDto: CreateForMaterialDto) {
    return this.forMaterialService.create(createForMaterialDto);
  }

  // READ ALL - GET /for-material?page=1&limit=10&material_id=5&site_id=2
  @Get()
  @Roles('manager', 'admin', 'supervisor')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('material_id') materialId?: string,
    @Query('site_id') siteId?: string,
    @Query('payment_id') paymentId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('status') status?: string,
    @Query('supplier_name') supplierName?: string,
  ) {
    const matId = materialId ? parseInt(materialId, 10) : undefined;
    const sId = siteId ? parseInt(siteId, 10) : undefined;
    const pId = paymentId ? parseInt(paymentId, 10) : undefined;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const params = {
      material_id: matId,
      site_id: sId,
      payment_id: pId,
      start_date: start,
      end_date: end,
      status,
      supplier_name: supplierName,
    };

    // Check if pagination parameters are provided
    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      
      return this.forMaterialService.findAll({
        ...params,
        page: pageNum,
        limit: limitNum,
      });
    } else {
      return this.forMaterialService.findAll(params);
    }
  }

  // READ ONE - GET /for-material/:id
  @Get(':id')
  @Roles('manager', 'admin', 'supervisor')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.forMaterialService.findById(id);
  }

  // GET MATERIAL USAGE SUMMARY - GET /for-material/material/:materialId/summary
  @Get('material/:materialId/summary')
  @Roles('manager', 'admin', 'supervisor')
  async getMaterialUsageSummary(
    @Param('materialId', ParseIntPipe) materialId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.forMaterialService.getMaterialUsageSummary(materialId, start, end);
  }

  // GET SITE MATERIAL SUMMARY - GET /for-material/site/:siteId/summary
  @Get('site/:siteId/summary')
  @Roles('manager', 'admin', 'supervisor')
  async getSiteMaterialSummary(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.forMaterialService.getSiteMaterialSummary(siteId, start, end);
  }

  // GET MATERIAL STATISTICS - GET /for-material/statistics
  @Get('statistics/overview')
  @Roles('manager', 'admin')
  async getMaterialStatistics(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.forMaterialService.getMaterialStatistics(start, end);
  }

  // GET SUPPLIER PERFORMANCE - GET /for-material/suppliers/performance
  @Get('suppliers/performance')
  @Roles('manager', 'admin')
  async getSupplierPerformanceReport(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.forMaterialService.getSupplierPerformanceReport(start, end);
  }

  // UPDATE - PATCH /for-material/:id
  @Patch(':id')
  @Roles('manager', 'admin', 'supervisor')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateForMaterialDto: UpdateForMaterialDto,
  ) {
    return this.forMaterialService.update(id, updateForMaterialDto);
  }

  // DELETE - DELETE /for-material/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('manager', 'admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.forMaterialService.delete(id);
  }

  // BULK OPERATIONS - POST /for-material/bulk
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @Roles('manager', 'admin')
  async createBulk(@Body() createForMaterialDtos: CreateForMaterialDto[]) {
    const results = await Promise.all(
      createForMaterialDtos.map(dto => this.forMaterialService.create(dto))
    );
    
    return {
      message: `Successfully created ${results.length} material records`,
      records: results,
    };
  }

  // GET MATERIALS BY SUPPLIER - GET /for-material/supplier/:supplierName
  @Get('supplier/:supplierName')
  @Roles('manager', 'admin', 'supervisor')
  async getMaterialsBySupplier(
    @Param('supplierName') supplierName: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const params = {
      supplier_name: decodeURIComponent(supplierName),
      start_date: start,
      end_date: end,
    };

    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      
      return this.forMaterialService.findAll({
        ...params,
        page: pageNum,
        limit: limitNum,
      });
    } else {
      return this.forMaterialService.findAll(params);
    }
  }

  // GET MATERIAL BY SITE - GET /for-material/site/:siteId
  @Get('site/:siteId')
  @Roles('manager', 'admin', 'supervisor')
  async getMaterialBySite(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const params = {
      site_id: siteId,
      start_date: start,
      end_date: end,
    };

    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      
      return this.forMaterialService.findAll({
        ...params,
        page: pageNum,
        limit: limitNum,
      });
    } else {
      return this.forMaterialService.findAll(params);
    }
  }

  // GET MATERIAL USAGE - GET /for-material/material/:materialId
  @Get('material/:materialId')
  @Roles('manager', 'admin', 'supervisor')
  async getMaterialUsage(
    @Param('materialId', ParseIntPipe) materialId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const params = {
      material_id: materialId,
      start_date: start,
      end_date: end,
    };

    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      
      return this.forMaterialService.findAll({
        ...params,
        page: pageNum,
        limit: limitNum,
      });
    } else {
      return this.forMaterialService.findAll(params);
    }
  }

  // GET RECENT MATERIAL RECORDS - GET /for-material/recent
  @Get('recent/records')
  @Roles('manager', 'admin', 'supervisor')
  async getRecentMaterialRecords(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    return this.forMaterialService.findAll({
      limit: limitNum,
    });
  }

  // GET MATERIAL RECORDS BY STATUS - GET /for-material/status/:status
  @Get('status/:status')
  @Roles('manager', 'admin', 'supervisor')
  async getMaterialRecordsByStatus(
    @Param('status') status: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const params = { status };

    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      
      return this.forMaterialService.findAll({
        ...params,
        page: pageNum,
        limit: limitNum,
      });
    } else {
      return this.forMaterialService.findAll(params);
    }
  }
}