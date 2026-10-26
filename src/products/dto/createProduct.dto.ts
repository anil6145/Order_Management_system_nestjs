import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, isString, IsString, IsUUID, Length, length, Matches, MaxLength, MIN, Min } from "class-validator";
import { ProductStatus } from "../enum/product-status.enum.js";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";


export class CreateProductDto {
  @ApiProperty({
    description: 'Unique SKU (uppercase letters, digits, and hyphens)',
    example: 'PRD-FOOD-001',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'SKU must contain only uppercase letters, digits and hypens',
  })
  sku: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Chicken Biryani',
    minLength: 2,
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed product description',
    example: 'Hyderabadi Chicken Biryani with authentic spices',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Category UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'Product price as string with at most 2 decimal places',
    example: '250.00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[1-9])\d{1,10}(\.\d{1,2})?$/, {
    message: 'Price must be greater than 0 and at most 2 decimal places',
  })
  price: string;

  @ApiProperty({
    description: 'Available stock quantity',
    example: 50,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    description: 'Threshold below which the product is marked low stock',
    example: 5,
    default: 5,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({
    description: 'Product lifecycle status',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}