import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';
import { OrderStatus } from '../enums/order-status.enum.js';
import { OrderItem } from './order-item.entity.js';
import { OrderStatusHistory } from './order-status-history.entity.js';

@Entity({name : 'orders',
  schema : 'order_management',
  comment : 'it stores the orders'
})

@Check(
  `"status" IN ('PENDING', 'CONFIRMED','COMPLETED', 'CANCELLED')`,
)

@Unique('UQ_orders_user_idempotency', ['user', 'idempotencyKey'])

@Index('idx_orders_user_created_at',['user', 'createdAt'])

@Index('idx_orders_status_createdAt',['status','createdAt'])

export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name : 'order_number',
    type : 'varchar',
    length : 50,
    unique : true,
    default : () => 
      `'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_management.order_number_seq')::TEXT,6,'0')`
  })
  order_number : string;

  // many orders belong to one user 
  // nullable : false means every order must have a user 
  @ManyToOne(()=> User, (user) => user.orders, {
    nullable: false,
    
  })

  // maps the relation to the user_id in the orders table 
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Postgres numeric values are safest to handle as strings 
  @Column({
    name : 'total_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  totalAmount: string;

  // stores the current status of the order
  // only values defined in OrderStatus are allowed
  // new orders automatically start as pending 
  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName : 'order_status_enum',
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    name : 'idempotency_key',
    type : 'varchar',
    nullable : true,
    unique : true
  })
  idempotencyKey : string | null;

  // one order can contain multiple order items 
  @OneToMany( () => OrderItem, (orderItem) => orderItem.order,{cascade: true},
  )
  items: OrderItem[];

  @Column({
    type : 'text',
    nullable : true
  })
  notes : string | null

   // Enable this after creating OrderStatusHistory:
  @OneToMany(
    () => OrderStatusHistory,
    (history) => history.order,
  )
  statusHistory: OrderStatusHistory[];

  @CreateDateColumn({ name : 'created_at'})
  createdAt: Date;

  @UpdateDateColumn({ name : 'updated_at'})
  updatedAt: Date;
}