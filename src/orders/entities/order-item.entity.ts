import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Order } from './order.entity.js';
import { Product } from '../../products/entities/product.entity.js';

@Entity({name : 'order_items',
  schema : 'order_management',
  comment : 'stores the order_items'
})
@Check('CHK_order_items_quantity_positive','"quantity" >0')

@Index('idx_order_items_order_id',['order'])
@Index('idx_order_items_product_id',['product'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // many orderItems belong to one Order
  @ManyToOne(()=> Order , (order) => order.items, {
    nullable: false,
    // every OrderItem must belong to an order
    onDelete: 'CASCADE',
    // if order is deleted its orderItems are automtically deletd by database 
  })
  @JoinColumn({ name: 'order_id'  })
  order: Order;

  // Many OrderItems can refer to the same product 
  @ManyToOne(()=>Product, (product) => product.orderItems, {
    nullable: false,
    // every OrderItem must reference an existing product 
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type : 'integer'})
  quantity: number;

  @Column({
    name : 'unit_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  unitPrice: string;

  @Column({
    name : 'line_total',
    type : 'numeric',
    precision : 12,
    scale : 2
  })
  lineTotal : string
}