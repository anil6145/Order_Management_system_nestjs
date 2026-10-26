import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "../../products/entities/product.entity";

@Entity({
    name : 'categories',
    schema : 'order_management'
})

export class Category {
    @PrimaryGeneratedColumn('uuid')
    id : string;

    @Column({ type : 'varchar' , length : 100 , unique : true})
    name : string

    @OneToMany(()=> Product , (product) => product.category)
    products : Product[]
}