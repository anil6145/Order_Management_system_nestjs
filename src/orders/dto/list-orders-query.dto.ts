
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum.js';

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ description: 'Number of orders per page', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filter by order status' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)', example: '2026-01-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true, strictSeparator: true })
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)', example: '2026-12-31' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true, strictSeparator: true })
  toDate?: string;

  @ApiPropertyOptional({ description: 'Minimum order total amount', example: 50.00 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minTotal?: number;

  @ApiPropertyOptional({ description: 'Search by order number (partial match)', example: 'ORD-2026' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['created_at', 'total_amount', 'order_number'],
    default: 'created_at',
    description: 'Sort by field',
  })
  @IsOptional()
  @IsIn(['created_at', 'total_amount', 'order_number'])
  sortBy: 'created_at' | 'total_amount' | 'order_number' = 'created_at';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC', description: 'Sort direction' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  cursor?: string;

  @IsOptional()
@IsIn(['page', 'cursor'])
paginationMode: 'page' | 'cursor' = 'page';
}
