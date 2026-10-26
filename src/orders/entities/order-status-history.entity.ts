import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Order } from "./order.entity";
import { OrderStatus } from "../enums/order-status.enum";

@Entity({
    name : 'order_status_history',
    schema : 'order_management',
    comment : 'Stores order status change history',
})
@Index('idx_order_status_history_order_id', ['order'])
export class OrderStatusHistory {
    @PrimaryGeneratedColumn('uuid')
    id : string;

    @ManyToOne(() => Order, (order) => order.statusHistory,{
        nullable : false,
        onDelete : 'RESTRICT'
    })
    @JoinColumn({ name : 'order_id'})
    order : Order


    @Column({
        name : 'from_status',
        type : 'varchar',
        length : 30,
        nullable : true
    })
    fromStatus : OrderStatus | null;

    @Column({
        name : 'to_status',
        type : 'varchar',
        length : 30,
    })
    toStatus : OrderStatus;

    @ManyToOne(()=> User , {
        nullable : true,
        onDelete : 'SET NULL'
    })
    @JoinColumn({ name : 'changed_by'})
    changedBy : User | null;

    @Column({
        type : 'text',
        nullable : true
    })
    reason : string | null

    @CreateDateColumn({
        name : 'created_at',
        type : 'timestamptz',
        default : () => 'CURRENT_TIMESTAMP'
    })
    createdAt : Date
}