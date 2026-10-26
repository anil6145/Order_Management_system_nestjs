import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  maxLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderItemDto } from './create-order-item.dto.js';

export class CreateOrderDto {
  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Array of items to purchase (at least 1 item required)',
    example: [
      {
        productId: 'a0000000-0000-0000-0000-000000000001',
        quantity: 2,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Special delivery notes or instructions',
    example: 'Please leave at the door',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string; 
}