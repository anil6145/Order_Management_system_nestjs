import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class QueryProductDto {

    // pagination 
    @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of products per page',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  // search 
  @ApiPropertyOptional({
    example: 'Biryani',
    description: 'Search by product name',
  })
  @IsOptional()
  @Transform(({ value}) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  search?: string;
  
  @ApiPropertyOptional({
    example : '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsUUID()
  categoryId? : string;

  @ApiPropertyOptional({
    enum : ['ACTIVE', 'INACTIVE']
  })
  @IsOptional()
  @IsIn(['ACTIVE','INACTIVE'])
  status : 'ACTIVE' | 'INACTIVE';

  @ApiPropertyOptional({
    example : 50 , minimum : 0
  })
  @IsOptional()
  @Type(()=> Number)
  @IsNumber({ maxDecimalPlaces : 2})
  @Min(0)
  minPrice? : number;

  @ApiPropertyOptional({ example : 500 , minimum :0})
  @IsOptional()
  @Type(()=> Number)
  @IsNumber( { maxDecimalPlaces : 2})
  @Min(0)
  maxPrice? : number

  @ApiPropertyOptional({ example : true})
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;

    return value;
  })
  @IsBoolean()
  inStock? : boolean;

  @ApiPropertyOptional({
    example : true,
    description : 'Include inactive products (Admin only)'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;

    return value;
  })
  @IsBoolean()
  includeInactive? : boolean;

  
  // sorting 
  @ApiPropertyOptional({
    example: 'price',
    enum: ['name', 'price', 'stock', 'created_at'],
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(['name', 'price', 'stock', 'created_at'])
  sortBy: string = 'created_at';

  @ApiPropertyOptional({
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC';

}