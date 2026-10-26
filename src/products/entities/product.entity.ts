import { Check, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn,  ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "typeorm";
import { ProductStatus } from "../enum/product-status.enum.js";
import { OrderItem } from "../../orders/entities/order-item.entity.js";
import { Category } from "../../categories/entities/category.entity.js";
import { priceTransformer } from "../transformer/price.transformer.js";

@Entity({name : 'products' ,
  comment : 'it stores products',
  schema : 'order_management'
})
@Check('"price" > 0')
@Check('"stock" >=0')

@Index('idx_products_category_id',['categoryId'])

@Index('idx_products_name_trgm',['name'])
export class Product {

    @PrimaryGeneratedColumn('uuid')
    id : string;

    @Column({ type : 'varchar' , length : 50 , unique : true})
    sku : string

    @Column({type : 'varchar' , length : 100,nullable : false})
    name : string;

    @Column({type : 'text'})
    description : string;

    @Column({ type : 'uuid' , name : 'category_id'})
    categoryId : string

    @ManyToOne(()=> Category, (category)=> category.products,{
      nullable : false,
      onDelete : 'RESTRICT'
    })
    @JoinColumn({ name : 'category_id'})
    category : Category

    @Column({type : 'numeric' , precision : 12 , scale : 2 , nullable : false,
      transformer : priceTransformer
    })
    price : string;

    @Column({type : 'int', default : 0})
    stock : number;

    @Column ({
      type : 'integer',
      name : 'low_stock_threshold',
      default : 5
    })
    lowStockthreshold : number

    @Column({
  type: 'enum',
  enum: ProductStatus,
  default: ProductStatus.ACTIVE,
})
status: ProductStatus;

   @VersionColumn({ type : 'integer'})
   version : number

    @CreateDateColumn({ 
      type : 'timestamptz',
      name :'created_at'
    })
    createdAt : Date;

    @UpdateDateColumn({
      type : 'timestamptz',
      name : 'updated_at'
    })
    updatedAt : Date;  

    // one product can appear in many orders 
    @OneToMany(()=> OrderItem ,
     (orderItem) => orderItem.product)
    orderItems :OrderItem[]

    @DeleteDateColumn({
      name : 'deleted_at',
      type : 'timestamptz',
      nullable : true
    })
    deletedAt : Date | null;

 

}