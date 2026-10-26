import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../users/entities/user.entity.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { OrderStatusHistory } from './entities/order-status-history.entity.js';
import { OrderCleanupService } from './order-cleanup.service.js';
import { AuditModule } from '../audit/audit/audit.module.js';



@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      User,
      OrderStatusHistory
    ]),
    AuthModule,
    AuditModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService,
    OrderCleanupService
  ],
})
export class OrdersModule {}