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
  BadRequestException,
} from '@nestjs/common';
import { SiteService } from '../services/site.service';
import { CreateSiteDto, UpdateSiteDto } from '../models/site.model';
import { Public } from '../auth/decorators';

@Controller('sites')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Public()
  @Get()
  async getAllSites(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    // If status query param is provided, use status filter
    if (status) {
      return this.siteService.findByStatus(status.toLowerCase());
    }

    // If search is provided, check if it's a valid status first
    if (search && search.trim().length >= 2) {
      const validStatuses = ['planning', 'active', 'completed', 'cancelled'];
      const searchTerm = search.trim().toLowerCase();
      
      // If searching for exact status, use status filter instead
      if (validStatuses.includes(searchTerm)) {
        return this.siteService.findByStatus(searchTerm);
      }
      
      // Otherwise use text search
      return this.siteService.searchSites(search);
    }

    // If page/limit are provided, use pagination
    if (page || limit) {
      const pageNum = page ? parseInt(page) : 1;
      const limitNum = limit ? parseInt(limit) : 10;
      return this.siteService.findWithPagination(pageNum, limitNum);
    }

    // Otherwise return all sites
    return this.siteService.findAll();
  }

  @Public()
  @Get('active')
  async getActiveSites() {
    return this.siteService.findActiveSites();
  }

  @Public()
  @Get('status/:status')
  async getSitesByStatus(@Param('status') status: string) {
    return this.siteService.findByStatus(status);
  }

  @Public()
  @Get('statistics')
  async getSiteStatistics() {
    return this.siteService.getSiteStatistics();
  }

  @Public()
  @Get('overdue')
  async getOverdueSites() {
    return this.siteService.getOverdueSites();
  }

  @Public()
  @Get('budget-range')
  async getSitesByBudgetRange(
    @Query('min') minBudget?: string,
    @Query('max') maxBudget?: string,
  ) {
    const min = minBudget ? parseFloat(minBudget) : undefined;
    const max = maxBudget ? parseFloat(maxBudget) : undefined;
    
    if (min && isNaN(min) || max && isNaN(max)) {
      throw new BadRequestException('Budget values must be valid numbers');
    }
    
    return this.siteService.findSitesByBudgetRange(min, max);
  }

  @Public()
  @Get('search')
  async searchSites(@Query('term') searchTerm: string) {
    if (!searchTerm) {
      throw new BadRequestException('Search term is required');
    }
    return this.siteService.searchSites(searchTerm);
  }

  @Public()
  @Get(':id')
  async getSiteById(@Param('id', ParseIntPipe) id: number) {
    return this.siteService.findById(id);
  }

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSite(@Body() createSiteDto: CreateSiteDto) {
    return this.siteService.create(createSiteDto);
  }

  @Public()
  @Put(':id')
  async updateSite(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSiteDto: UpdateSiteDto,
  ) {
    return this.siteService.update(id, updateSiteDto);
  }

  @Public()
  @Patch(':id')
  async patchSite(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSiteDto: Partial<UpdateSiteDto>,
  ) {
    return this.siteService.update(id, updateSiteDto);
  }

  @Public()
  @Post(':id/expense')
  async addExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body() new_amount:number  //add in expense amount only in body 
  ) {
    if (!new_amount || new_amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    
    return this.siteService.addExpense(id, new_amount);
  }

  @Public()
  @Post(':id/complete')
  async completeSite(@Param('id', ParseIntPipe) id: number) {
    return this.siteService.completeSite(id);
  }

  @Public()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSite(@Param('id', ParseIntPipe) id: number) {
    await this.siteService.delete(id);
  }
  @Public()
  @Post(':id/start')
  async startSiteConstruction(@Param('id', ParseIntPipe) id: number) {
    return this.siteService.startSiteConstruction(id);
  }
}