import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { CreateProductDto } from './dto/createProduct.dto.js';
import { UpdateproductDto } from './dto/updateProduct.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';
import { UserRole } from '../users/enum/roles.enum.js';
import { StockMovement } from './entities/stock-movement.entity.js';
import { User } from '../users/entities/user.entity.js';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { AuditService } from '../audit/audit/audit-queue.service.js';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);
    
    constructor(
        @InjectRepository(Product)
        private readonly productsRepositorty : Repository<Product>,
        private readonly dataSource : DataSource,
        private readonly auditService : AuditService,
    ) {}

    async createProduct(createProductDto : CreateProductDto) {
        const {name} = createProductDto;

        this.logger.log(`[SERVICE] ProductsService.createProduct - Checking product existence: ${name}`);
        this.logger.log(`[TYPEORM] Repository: ProductRepository.findOne({ name: "${name}" })`);

        const existingProduct = await this.productsRepositorty.findOne({
            where : { sku : createProductDto.sku }
        });

        if(existingProduct) {
            this.logger.warn(`[SERVICE] ProductsService.createProduct - Conflict: Product already exists`);
            throw new ConflictException('Product SKU already exists');
        }

        this.logger.log(`[TYPEORM] Entity: Product - Instantiating Product entity in memory`);
        
        const product = this.productsRepositorty.create(createProductDto);

        this.logger.log(`[TYPEORM] Repository: ProductRepository.save() - Inserting Product into DB`);

        const savedProduct = await this.productsRepositorty.save(product);

        this.logger.log(`[SERVICE] ProductsService.createProduct - Product created successfully with ID: ${savedProduct.id}`);
        return savedProduct;
    }

    async getAllProducts(queryProductDto: QueryProductDto,
        userRole : UserRole
    ) {
        const {
          page = 1,
          limit = 10,
          search,
          categoryId,
          status,
          minPrice,
          maxPrice,
          inStock,
          includeInactive,
          sortBy = 'created_at',
          sortOrder = 'DESC',
        } = queryProductDto;

        const skip = (page - 1) * limit;

        if ( minPrice !== undefined && maxPrice !==undefined && minPrice > maxPrice) {
            throw new BadRequestException('minPrice cannot be grater than maxPrice')
        }

        // only admins may request inactive products
        const isAdmin = userRole === UserRole.Admin;
        const canIncludeInactive = isAdmin && includeInactive == true;

        if(status === 'INACTIVE' && !canIncludeInactive) {
            throw new BadRequestException('set includeInactive=true to query inactive products as an admin')
        }

        if(includeInactive === true && !isAdmin) {
            throw new BadRequestException('Only admins can include inactive products')
        }

        this.logger.log(`[SERVICE] ProductsService.getAllProducts - Initializing QueryBuilder`);
        this.logger.log(`[TYPEORM] QueryBuilder - Entity: Product | alias: "product"`);

        const queryBuilder = this.productsRepositorty.createQueryBuilder('product');

        // By default, show ACTIVE products only.
    // Inactive products are included only for an admin who opts in.
    if (!canIncludeInactive) {
      queryBuilder.andWhere('product.status = :activeStatus', {
        activeStatus: 'ACTIVE',
      });
    }

        if (search) {

          this.logger.log(`[TYPEORM] QueryBuilder - Adding filter: LOWER(product.name) LIKE LOWER("%${search}%")`);

          queryBuilder.andWhere(
            'LOWER(product.name) LIKE LOWER(:search)',
            { search: `%${search}%` },
          );
        }

        // Category filter
    if (categoryId) {
      // Assumes categoryId is a mapped Product entity property.
      queryBuilder.andWhere('product.categoryId = :categoryId', {
        categoryId,
      });
    }

    // Optional status filter
    if (status) {
      queryBuilder.andWhere('product.status = :requestedStatus', {
        requestedStatus: status,
      });
    }

    // Minimum price
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice,
      });
    }

    // Maximum price
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice,
      });
    }

    // Stock filter: true means available, false means zero stock
    if (inStock === true) {
      queryBuilder.andWhere('product.stock > 0');
    } else if (inStock === false) {
      queryBuilder.andWhere('product.stock = 0');
    }

        const allowedSortFields = ['name', 'price', 'stock', 'created_at'];

        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

        this.logger.log(`[TYPEORM] QueryBuilder - Ordering by: product.${safeSortBy} ${sortOrder} | Skip: ${skip}, Take: ${limit}`);

        queryBuilder
          .orderBy(`product.${safeSortBy}`, sortOrder)
          .skip(skip)
          .take(limit);

        this.logger.log(`[TYPEORM] QueryBuilder - Executing getManyAndCount()`);

        const [products, total] = await queryBuilder.getManyAndCount();

        this.logger.log(`[SERVICE] ProductsService.getAllProducts - Found ${products.length} item(s) on current page out of ${total} total`);

        return {
          items: products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasPreviousPage : page > 1,
            hasNextPage : page * limit < total,
          },
        };
    }

    async getProduct(id : string){
        this.logger.log(`[SERVICE] ProductsService.getProduct - Finding product ID: ${id}`);
        this.logger.log(`[TYPEORM] Repository: ProductRepository.findOne({ id: ${id} })`);

        const product = await this.productsRepositorty.findOne({
            where : {id}
        });

        if(!product) {
            this.logger.warn(`[SERVICE] ProductsService.getProduct - Product not found for ID: ${id}`);
            throw new NotFoundException('product not found');
        }

        return product;
    }

    async updateProduct(id: string, updateProductDto: UpdateproductDto,
        userId : string
    ){
        this.logger.log(`[SERVICE] ProductsService.updateProduct - Updating product ID: ${id}`);

        const product = await this.getProduct(id);

        const oldValues = {
    name: product.name,
    sku: product.sku,
    price: product.price,
    stock: product.stock,
    status: product.status,
  };

        Object.assign(product, updateProductDto);

        this.logger.log(`[TYPEORM] Repository: ProductRepository.save() - Updating Product ID: ${id}`);

        const updatedProduct = await this.productsRepositorty.save(product);

        const newValues = {
    name: updatedProduct.name,
    sku: updatedProduct.sku,
    price: updatedProduct.price,
    stock: updatedProduct.stock,
    status: updatedProduct.status,
  };

  await this.auditService.saveAuditLog({
    userId,
    entityType: 'PRODUCT',
    entityId: updatedProduct.id,
    action: 'UPDATE',
    oldValues,
    newValues
    
  });

        this.logger.log(`[SERVICE] ProductsService.updateProduct - Product updated successfully`);

        return updatedProduct;
    }

    async removeProduct(id : string){
        this.logger.log(`[SERVICE] ProductsService.removeProduct - Deleting product ID: ${id}`);

        const product = await this.getProduct(id);

        this.logger.log(`[TYPEORM] Repository: ProductRepository.remove() - Deleting Product ID: ${id}`);
        
        await this.productsRepositorty.softDelete(id);

        this.logger.log(`[SERVICE] ProductsService.removeProduct - Product deleted successfully`);
        return {
            message : 'product deleted successfully'
        };
    }

    async getLowStockProducts() {
        return this.productsRepositorty
        .createQueryBuilder('product')
        .where('product.stock <= product.lowStockThreshold')
        .getMany()
    }

    async adjustStock(id : string, adjustStockDto : AdjustStockDto,
        user : AuthenticatedUser
    ){
        return this.dataSource.transaction(async (manager) => {
            const productRepository = manager.getRepository(Product);
            const movementRepository = manager.getRepository(StockMovement);
            const userRepository = manager.getRepository(User);

            // lock the product row to prevent concurrent stock adjustments 

            const product = await productRepository.findOne({
                where : {id},
                lock : { mode : 'pessimistic_write'}
            });

            if(!product) {
                throw new NotFoundException('Product not found')
            }

            const existingUser = await userRepository.findOne({
                where : {id : user.id}
            })

            if(!existingUser){
                throw new NotFoundException('User not found')
            }
            const previousStock = product.stock

            const newSock = product.stock + adjustStockDto.quantity

            if (newSock < 0) {
                throw new BadRequestException('Insufficient stock. Stock cannot be negative')
            }

            product.stock = newSock;
            await productRepository.save(product)

            const movement = movementRepository.create({
                product,
                change : adjustStockDto.quantity,
                reason : adjustStockDto.reason.trim(),
                user,
            })

            await movementRepository.save(movement)

            return {
                message : 'Stock adjusted successfully',
                productId : product.id,
                previousStock,
                adjustment : adjustStockDto.quantity,
                currentStock : product.stock,
                reason : movement.reason
            }
        })
    }


    
}

