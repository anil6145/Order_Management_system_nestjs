import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsUUID, Min } from "class-validator";

export class CreateOrderItemDto {

    @ApiProperty({
    description: 'UUID of the product to order',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
     description: 'Quantity of product to purchase', example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}