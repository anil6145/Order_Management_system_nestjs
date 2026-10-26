import { Body, Controller, Delete, Get, Logger, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseInterceptors} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/createProduct.dto.js';
import { UpdateproductDto } from './dto/updateProduct.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enum/roles.enum.js';
import { QueryProductDto } from './dto/query-product.dto.js';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';
import { currentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { AuditInterceptor } from '../audit/audit/audit.interceptor.js';
import { AuditEvent } from '../audit/audit/audit.types.js';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
export class ProductsController {
    private readonly logger = new Logger(ProductsController.name);

    constructor(
        private readonly productsService : ProductsService
    ){}

    @Post('create')
    @Roles(UserRole.Admin)
    @UseInterceptors(AuditInterceptor)
    @ApiOperation({
        summary: 'Create a product',
        description: 'Only ADMIN users can create products.',
    })
    @ApiResponse({
        status: 201,
        description: 'Product created successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid product data',
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required',
    })
    @ApiResponse({
        status: 403,
        description: 'Only ADMIN users can perform this operation',
    })
    @ApiResponse({
        status: 409,
        description: 'Product already exists',
    })
   async createProduct(@Body() createProductDto : CreateProductDto,
@currentUser() user : AuthenticatedUser,
@Req() req : Request & { auditEvent? : AuditEvent}){
        this.logger.log(
            `[CONTROLLER] ProductsController.createProduct - DTO: CreateProductDto | Name: ${createProductDto.name}`,
        );
        const product = await this.productsService.createProduct(
    createProductDto,
  );

  req.auditEvent = {
    userId: user.id,
    entityType: 'PRODUCT',
    entityId: product.id,
    action: 'CREATE',
    oldValues: null,
    newValues: {
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      status: product.status,
    },
  };

  return product;
    }

    @Get()
    @ApiOperation({
        summary: 'Get products',
        description: 'Get products using pagination, search and sorting.',
    })
    @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Number of products per page' })
    @ApiQuery({ name: 'search', required: false, example: 'Biryani', description: 'Search products by name' })
    @ApiQuery({ name: 'sortBy', required: false, example: 'price', description: 'Field used for sorting' })
    @ApiQuery({ name: 'sortOrder', required: false, example: 'DESC', description: 'Sorting direction' })
    @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
    getAllProducts(@Query() queryProductDto: QueryProductDto,
@currentUser() user : AuthenticatedUser){
        this.logger.log(
            `[CONTROLLER] ProductsController.getAllProducts - DTO: QueryProductDto | Page: ${queryProductDto.page || 1}, Limit: ${queryProductDto.limit || 10}, Search: ${queryProductDto.search || 'none'}`,
        );
        return this.productsService.getAllProducts(queryProductDto,
            user.role
            
        );
    }

    @Get('low-stock')
    @Roles(UserRole.Admin)
    @ApiOperation({
        summary: 'Get low-stock products - Admin only',
        description: 'Returns products whose stock is at or below their low-stock threshold. Admin access required.',
    })
    @ApiResponse({ status: 200, description: 'Low stock products retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden. Admin access required.' })
    getLowStockProducts() {
        return this.productsService.getLowStockProducts();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product by ID' })
    @ApiParam({ name: 'id', example: 'a0000000-0000-0000-0000-000000000001', description: 'Product UUID' })
    @ApiResponse({ status: 200, description: 'Product found' })
    @ApiResponse({ status: 400, description: 'Invalid product UUID' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    getProduct(@Param('id', ParseUUIDPipe) id : string) {
        this.logger.log(
            `[CONTROLLER] ProductsController.getProduct - Product ID: ${id}`,
        );
        return this.productsService.getProduct(id);
    }

    @Patch(':id')
    @Roles(UserRole.Admin)
    @UseInterceptors(AuditInterceptor)
    @ApiOperation({ summary: 'Update a product', description: 'Only ADMIN users can update products.' })
    @ApiParam({ name: 'id', example: 'a0000000-0000-0000-0000-000000000001', description: 'Product UUID' })
    @ApiResponse({ status: 200, description: 'Product updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid product data or UUID' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Only ADMIN can update products' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async updateProduct(
        @Param('id', ParseUUIDPipe) id : string,
        @Body() updateproductDto : UpdateproductDto,
        @currentUser() user : AuthenticatedUser,
        @Req() req : Request & {auditEvent? : AuditEvent}
    ){
        this.logger.log(
            `[CONTROLLER] ProductsController.updateProduct - Product ID: ${id} | DTO: UpdateproductDto`,
        );
         // 1. Get the product before updating it.
    const oldProduct = await this.productsService.getProduct(id);

    // 2. Update the product using your existing service.
    const updatedProduct =
        await this.productsService.updateProduct(id, updateproductDto,
            user.id
        );

    // 3. Prepare the audit event.
    req.auditEvent = {
        userId: user.id,
        entityType: 'PRODUCT',
        entityId: id,
        action: 'UPDATE',

        oldValues: {
            name: oldProduct.name,
            price: oldProduct.price,
            stock: oldProduct.stock,
            status: oldProduct.status,
        },

        newValues: {
            name: updatedProduct.name,
            price: updatedProduct.price,
            stock: updatedProduct.stock,
            status: updatedProduct.status,
        },
    };

    // 4. Return your normal product response.
    return updatedProduct;
    }

    @Delete(':id')
    @Roles(UserRole.Admin)
    @UseInterceptors(AuditInterceptor)
    @ApiOperation({ summary: 'Delete a product', description: 'Only ADMIN users can delete products.' })
    @ApiParam({ name: 'id', example: 'a0000000-0000-0000-0000-000000000001', description: 'Product UUID' })
    @ApiResponse({ status: 200, description: 'Product deleted successfully' })
    @ApiResponse({ status: 400, description: 'Invalid product UUID' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Only ADMIN can delete products' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async removeProduct(
        @Param('id', ParseUUIDPipe) id : string,
        @currentUser() user:AuthenticatedUser,
        @Req() req: Request & { auditEvent? : AuditEvent}
    ){
        this.logger.log(
            `[CONTROLLER] ProductsController.removeProduct - Product ID: ${id}`,
        );
        const product = await this.productsService.getProduct(id);

  await this.productsService.removeProduct(id);

  req.auditEvent = {
    userId: user.id,
    entityType: 'PRODUCT',
    entityId: product.id,
    action: 'DELETE',
    oldValues: {
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      status: product.status,
    },
    newValues: null,
  };

  return { message: 'Product deleted successfully' };
    }

    @Patch(':id/stock')
    @Roles(UserRole.Admin)
    @ApiOperation({
  summary: 'Adjust product stock',
  description: 'ADMIN can increase or decrease stock with a reason.',
})
@ApiParam({ name: 'id', example: 'a0000000-0000-0000-0000-000000000001', description: 'Product UUID' })
@ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
@ApiResponse({ status: 400, description: 'Invalid quantity, insufficient stock, or invalid UUID' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Only ADMIN can adjust stock' })
@ApiResponse({ status: 404, description: 'Product not found' })
    adjustStock(
        @Param('id', ParseUUIDPipe) id :string,
        @Body() adjustStockDto : AdjustStockDto,
        @currentUser() user : AuthenticatedUser,
    ){
        return this.productsService.adjustStock(id,adjustStockDto,
            user
        )
    }
}
