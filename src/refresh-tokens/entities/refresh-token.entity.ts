import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity.js";

@Entity({
    name : 'refresh_tokens',
    schema : 'auth',
    comment : 'it stores the refresh tokens'
})

export class RefreshToken {

    @PrimaryGeneratedColumn('uuid')
    id : string;

    @Column({name : 'user_id' , type : 'uuid'})
    userId : string;

    @Column({name : 'token_hash', type : 'varchar'})
    tokenHash : string;

    @Column({name : 'expires_at',type : 'timestamptz'})
    expiresAt : Date;

    @Column({ name : 'revoked_at', type : 'timestamptz', nullable : true})
    revokedAt : Date | null;

    @CreateDateColumn({name : 'created_at' , type : 'timestamptz'})
    createdAt : Date

    @ManyToOne(() => User,
    (user) => user.tokens,
    {
        onDelete: 'CASCADE',
    })
    @JoinColumn({name : 'user_id'})
    user : User

}