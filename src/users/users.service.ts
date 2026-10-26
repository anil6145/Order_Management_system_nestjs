import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';

import * as bcrypt from 'bcrypt';
import { UserRole } from './enum/roles.enum.js';
import { User } from './entities/user.entity.js';
import { ListQueryDto } from './dto/list-users-query.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    // here name is the js property it gives the name of the class

    constructor(
        @InjectRepository(User)
        private readonly UsersRepository : Repository<User>,
    ){}

    async createUser(createUserDto : CreateUserDto){
        const { email , password} = createUserDto;

        this.logger.log(`[SERVICE] UsersService.createUser - Checking if email already exists: ${email}`);
        this.logger.log(`[TYPEORM] Repository: UserRepository.findOne({ email: ${email} })`);

        const existingUser = await this.UsersRepository.findOne({
            where : { email },
        });

        if(existingUser) {
            this.logger.warn(`[SERVICE] UsersService.createUser - Conflict: Email already exists`);
            throw new ConflictException(
                'User with this email already exists'
            );
        }

        this.logger.log(`[SERVICE] UsersService.createUser - Hashing password with bcrypt`);
        const hashPassword = await bcrypt.hash(password, 10);

        this.logger.log(`[TYPEORM] Repository: UserRepository.create() - Instantiating User entity in memory`);
        const user = this.UsersRepository.create({
            ...createUserDto,
            password : hashPassword,
            role : UserRole.User
        });

        this.logger.log(`[TYPEORM] Repository: UserRepository.save() - Inserting new user into database`);
        const savedUser = await this.UsersRepository.save(user);

        this.logger.log(`[SERVICE] UsersService.createUser - User created successfully with ID: ${savedUser.id}`);
        const {password:_ , ...result} = savedUser;

        return result;
    }

    async findByEmail(email : string){
        this.logger.log(`[TYPEORM] Repository: UserRepository.findOne({ email: ${email} })`);
        return this.UsersRepository.findOne({
            where : { email }
        });
    }

    async findById(id : string) : Promise<Omit<User , 'password'>>{
        this.logger.log(`[SERVICE] UsersService.findById - Finding user with ID: ${id}`);
        this.logger.log(`[TYPEORM] Repository: UserRepository.findOne({ id: ${id} })`);

        const user = await this.UsersRepository.findOne({
            where : {id},
            
        });

        if(!user) {
            this.logger.warn(`[SERVICE] UsersService.findById - User not found for ID: ${id}`);
            throw new NotFoundException('user not found');
        }


        const {password , ...result} = user;
        return result;
    }


    async findAll(query : ListQueryDto){

        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const search = query.search?.trim();

        const skip = (page - 1) * limit;

        const qb = this.UsersRepository.createQueryBuilder('user');

        if(search) {
            qb.where(
                '(user.name ILIKE :search OR user.email ILIKE :search)' ,
                {search: `%${search}%`}
            )
        }

        qb.select([
            'user.id',
            'user.email',
            'user.email',
            'user.role',
            'user.status',
            'user.created_At',
            'user.updated_At'
        ])
        .orderBy('user.created_At','DESC')
        .skip(skip)
        .take(limit)

        const [users , total] = await qb.getManyAndCount();

        return {
            users,
            pagination : {
                total,
                page,
                limit,
                totalPages : Math.ceil(total/limit)
            }
        }
        
    }

    async updateStatus(id : string ,updateUserStatusDto : UpdateUserStatusDto) {
        const user = await this.UsersRepository.findOne({
            where : {id},
        })

        if(!user){
            throw new NotFoundException('user not found')
        }

        user.status = updateUserStatusDto.status

        await this.UsersRepository.save(user)

        return {
            message : `User ${updateUserStatusDto.status.toLowerCase()} successfully`,
            id : user.id,
            name : user.name,
            email : user.email,
            status : user.status
        }
    }
}


