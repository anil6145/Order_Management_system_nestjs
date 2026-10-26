import { Body, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enum/roles.enum.js';
import { RedisCacheService } from '../redis-cache/redis-cache.service.js';
import { RedisHttpCacheInterceptor } from '../redis-cache/redis-http-cache.interceptor.js';

@ApiTags('Categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly redisCache : RedisCacheService
  ) {}


  @Get()
  @UseInterceptors(RedisHttpCacheInterceptor)
  @ApiOperation({
    summary: 'Get all product categories',
    description: 'Returns all available product categories. Requires authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. JWT access token is missing or invalid.',
  })
  getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  @Post('create')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Create a product category - Admin only',
    description: 'Creates a new product category with a unique name. Admin access required.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. JWT access token is missing or invalid.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
  })
  @ApiResponse({
    status: 409,
    description: 'Category name already exists',
  })
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const result = await this.categoriesService.createCategory(createCategoryDto);

    await this.redisCache.deleteByPattern(
      'oms:http-cache:*categories',
    );

    return result
  }
}
