import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { Category } from '../categories/entities/category.entity.js';
import { StockMovement } from './entities/stock-movement.entity.js';
import { AuditModule } from '../audit/audit/audit.module.js';

@Module({
  imports : [
   // registers the product repository for dependency injection  
    TypeOrmModule.forFeature([Product,Category,StockMovement]),
    // imports authentication - related providers which productmodule needs 
AuthModule,
AuditModule],
  controllers: [ProductsController],
  providers: [ProductsService]
})
export class ProductsModule {}
