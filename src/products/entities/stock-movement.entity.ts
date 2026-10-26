import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";
import { User } from "../../users/entities/user.entity";


@Entity({
    name : 'stock_movements',
    schema : 'order_management'
})
export class StockMovement {
    @PrimaryGeneratedColumn('uuid')
    id : string;

    @ManyToOne(() => Product , {nullable : false , onDelete : 'RESTRICT'})
    @JoinColumn({ name : 'product_id'})
    product : Product;

    @Column({ name : 'quantity_change' , type : 'integer'})
    change : number;

    @Column({ type : 'varchar' , length : 250})
    reason : string

    @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  referenceType: string | null;

  @Column({
    name: 'reference_id',
    type: 'uuid',
    nullable: true,
  })
  referenceId: string | null;

    @ManyToOne(() => User, { nullable : false, onDelete : 'RESTRICT'})
    @JoinColumn({ name : 'created_by'})
    user : User

    @CreateDateColumn({ name : 'created_at',
        type : 'timestamptz'
    })
    createdAt : Date
}