import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { SalesSummaryQueryDto } from './dto/sales-summary-query.dto.js';
import { UserRole } from '../users/enum/roles.enum.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { TopProductsQueryDto } from './dto/top-products-query.dto.js';
import type { Response } from 'express';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@Roles(UserRole.Admin)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('sales-summary')
  @ApiOperation({
    summary: 'Get aggregated sales summary - Admin only',
    description:
      'Aggregates orders, items sold, and revenue grouped by day or month across the specified date range using Asia/Kolkata timezone.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales summary retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date range or format',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
  })
  getSalesSummary(
    @Query() query: SalesSummaryQueryDto,
  ) {
    return this.reportsService.getSalesSummary(query);
  }

  @Get('sales-summary/export')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Export sales summary as CSV - Admin only',
    description:
      'Streams sales summary as a downloadable CSV file. Bypasses JSON response envelope.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file download (text/csv)',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date range or format',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
  })
  async exportSalesSummary(
    @Query() query: SalesSummaryQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const stream =
      await this.reportsService.exportSalesSummary(query);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sales-summary.csv"',
    );

    stream.on('error', (error) => {
      res.destroy(error);
    });

    stream.pipe(res);
  }

  @Get('top-products')
  @ApiOperation({
    summary: 'Get top selling products - Admin only',
    description:
      'Aggregates order items to return the top selling products by quantity and revenue.',
  })
  @ApiResponse({
    status: 200,
    description: 'Top products retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date range or limit',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
  })
  async getTopProducts(
    @Query() query: TopProductsQueryDto,
  ) {
    const result =
      await this.reportsService.getTopProducts(query);

    return {
      success: true,
      message: 'Top products retrieved successfully',
      data: result.data,
    };
  }

  @Get('low-stock')
  @ApiOperation({
    summary: 'Get low stock products report - Admin only',
    description:
      'Returns active products where stock is at or below their low-stock threshold.',
  })
  @ApiResponse({
    status: 200,
    description: 'Low stock products retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
  })
  async getLowStockProducts() {
    const data =
      await this.reportsService.getLowStockProducts();

    return {
      success: true,
      message: 'Low-stock products retrieved successfully',
      data,
    };
  }
}
