import { IsEnum } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum.js';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';


export class UpdateOrderStatusDto {

    @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
    description: 'New order status',
  })
  @Transform(({ value }) =>
  typeof value === 'string' ? value.toUpperCase() : value,
)
  @IsEnum(OrderStatus)
  status: OrderStatus;
}