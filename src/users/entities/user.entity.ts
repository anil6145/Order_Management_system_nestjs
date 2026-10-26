import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserRole } from "../enum/roles.enum.js";
import { Order } from "../../orders/entities/order.entity.js";
import { UserStatus } from "../enum/userStatus.enum.js";
import { RefreshToken } from "../../refresh-tokens/entities/refresh-token.entity.js";

@Entity({name : 'users',
    comment : 'stores user information',
    schema : 'auth'
})
export class User {
    @PrimaryGeneratedColumn('uuid')
    id : string;

    @Column({type : 'varchar' , length : 100})
    name : string;

    @Column({unique : true})

    email : string;

    @Column({
        type : 'varchar',
        length : 255,
    })
    password : string;

    @Column({
        type : 'enum',
        enum : UserRole,
        default : UserRole.User
    })
    role : UserRole

    @CreateDateColumn({name : 'created_at'})
    createdAt : Date;
    
    @UpdateDateColumn({ name : 'updated_at'})
    updatedAt : Date

    // one usermay have many orders
    // the actual foreign key is maintained on the Order Side 
    // using @ManyToOne()

    @OneToMany(()=>Order , (order) => order.user )

    orders : Order[]

    @Column({
        type : 'enum',
        enum : UserStatus,
        default : UserStatus.ACTIVE
    })
    status : UserStatus;

    @OneToMany(()=> RefreshToken ,(token)=>token.user)
    tokens : RefreshToken[]

    
}    

    // @OneToMany(()=> RefreshToken, (token)=>token.user)
    // tokens : RefreshToken[]
    // here a user may login many times so user can have multiple refresh tokens
