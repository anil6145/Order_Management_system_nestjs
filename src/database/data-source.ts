import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { Product } from '../products/entities/product.entity.js';
import { Order } from '../orders/entities/order.entity.js';
import { OrderItem } from '../orders/entities/order-item.entity.js';
import { databaseConfig } from './database.config.js';
import { RefreshToken } from '../refresh-tokens/entities/refresh-token.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { StockMovement } from '../products/entities/stock-movement.entity.js';
import { OrderStatusHistory } from '../orders/entities/order-status-history.entity.js';
import { AuditLog } from '../audit/audit/entities/audit-log.entity.js';

export const orderDataSource =  new DataSource({

  ...databaseConfig,

  entities: [
    User,
    Product,
    Order,
    OrderItem,
    RefreshToken,
    Category,
    StockMovement,
    OrderStatusHistory,
    AuditLog
  ],

// entities : ['dist/**/*.entity.js'],

  migrations: ['dist/migrations/*.js'],
  logging: true,

  synchronize: false,
  
});