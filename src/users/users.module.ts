import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { PassportModule } from '@nestjs/passport';
import { RefreshToken } from '../refresh-tokens/entities/refresh-token.entity.js';


@Module({
  imports : [
    TypeOrmModule.forFeature([User,
      RefreshToken
    ]),

    PassportModule.register({
      defaultStrategy : 'jwt'
    })
  ],
  controllers: [UsersController],
  providers: [UsersService
  ],
  exports : [UsersService]
})
export class UsersModule {}
