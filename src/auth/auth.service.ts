import { ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
// creating and verifying jwt tokens 
import { LoginUserDto } from '../users/dto/login-user.dto.js';

import * as bcrypt from 'bcrypt'
import { ConfigService } from '@nestjs/config';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service.js';
import { UserStatus } from '../users/enum/userStatus.enum.js';
import type { TokenUser } from './interfaces/token-user.interface.js';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly usersService : UsersService,
        private readonly jwtService : JwtService,
        private readonly refreshTokensService: RefreshTokensService,
        private readonly configService : ConfigService,

        
    ){}

    private get accessSecret(): string {
  return this.configService.getOrThrow<string>(
    'JWT_ACCESS_SECRET',
  );
}

private get refreshSecret(): string {
  return this.configService.getOrThrow<string>(
    'JWT_REFRESH_SECRET',
  );
}

private get accessExpiry(): string {
  return this.configService.getOrThrow<string>(
    'JWT_ACCESS_EXPIRES_IN',
  );
}

private get refreshExpiry(): string {
  return this.configService.getOrThrow<string>(
    'JWT_REFRESH_EXPIRES_IN',
  );
}

   private async createAccessToken(
     user: TokenUser,
   ): Promise<string> {
     return this.jwtService.signAsync(
       {
         sub: user.id,
         email: user.email,
         role: user.role,
       },
       {
         secret: this.accessSecret,
         expiresIn:
           this.accessExpiry as JwtSignOptions['expiresIn'],
       },
     );
   }
 
    async createRefreshToken(
     user: TokenUser,
   ): Promise<string> {
     return this.jwtService.signAsync(
       {
         sub: user.id,
         email: user.email,
         role: user.role,
       },
       {
         secret: this.refreshSecret,
         expiresIn:
           this.refreshExpiry as JwtSignOptions['expiresIn'],
       },
     );
   }

    async login(loginUserDto:LoginUserDto){
        const {email,password} = loginUserDto;
        this.logger.log(`[SERVICE] AuthService.login - Looking up user by email: ${email}`);

        const user = await this.usersService.findByEmail(email);

        if(!user){
            this.logger.warn(`[SERVICE] AuthService.login - User not found for email: ${email}`);
            throw new UnauthorizedException(
                'Invalid email or password'
            );
        }

        this.logger.log(`[SERVICE] AuthService.login - Comparing password hash for user ID: ${user.id}`);
        const ispasswordValid = await bcrypt.compare(password,user.password);

        if(!ispasswordValid) {
            this.logger.warn(`[SERVICE] AuthService.login - Invalid password for user ID: ${user.id}`);
            throw new UnauthorizedException('Invalid email or password');
        }

        if(user.status !== UserStatus.ACTIVE){
            throw new ForbiddenException('Your account is deactivated')
        }

        this.logger.log(
      `Login successful for user ID: ${user.id}`,
    );

   
const tokenUser: TokenUser = {
      id: user.id,
      name : user.name,
      email: user.email,
      role: user.role,
    };

    // AuthService generates both tokens.
    const accessToken = await this.createAccessToken(tokenUser);
    const refreshToken = await this.createRefreshToken(tokenUser);

    // RefreshTokensService stores only the refresh-token hash.
    await this.refreshTokensService.saveRefreshToken(
      user.id,
      refreshToken,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // POST /auth/refresh
  async refreshAccessToken(refreshToken: string) {
    // Validate the old token and get current user details.
    const user =
      await this.refreshTokensService.validateForRotation(
        refreshToken,
      );

    // AuthService generates the replacement token pair.
    const accessToken = await this.createAccessToken(user);
    const newRefreshToken = await this.createRefreshToken(user);

    // RefreshTokensService revokes the old token and stores the new hash.
    await this.refreshTokensService.rotate(
      refreshToken,
      newRefreshToken,
    );

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  // POST /auth/logout
  async logout(refreshToken: string) {
    return this.refreshTokensService.revoke(refreshToken);
  }

}

