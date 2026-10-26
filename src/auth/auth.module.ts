import { Module } from '@nestjs/common';
// here it organizes the application , the controllers and services are defined here 
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { PassportModule } from '@nestjs/passport';
// passportModule integrates passport authentication 
// passport provides the authentication framework the autentication logic is defined in a strategy 
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module.js';

@Module({
  imports: [
    RefreshTokensModule,
    // AuthService needs access to UsersService
    UsersModule,

    // Registers Passport and sets JWT as the default strategy
    PassportModule.register({
      defaultStrategy: 'jwt',
      
    }),

    // Configures JWT token generation and verification 
    JwtModule.register({
      secret: 'my-access-secret',

    }),
  ],

  // handles authentication-related http requests 
  controllers: [AuthController],

  providers: [

    // contains authentication business logic
    AuthService,
    // tells passport how to validate JWT tokens
    JwtStrategy,
    // protects routes using the JWT Passport strategy 
    JwtAuthGuard
  ],

  exports : [
    JwtAuthGuard,
    AuthService,
    PassportModule
  ]
})
export class AuthModule {}