
import { createHash } from 'crypto';

import {
    ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  IsNull,
  MoreThan,
  Repository,
} from 'typeorm';

import { RefreshToken } from './entities/refresh-token.entity.js';
import { User } from '../users/entities/user.entity.js';
import { UserStatus } from '../users/enum/userStatus.enum.js';
import { TokenUser } from '../auth/interfaces/token-user.interface.js';
import { TokenPayload } from '../auth/interfaces/token-payload.interface.js';

@Injectable()
export class RefreshTokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,

    @InjectRepository(User)
    private readonly userRepository : Repository<User>
  ) {}

  private get refreshSecret(): string {
    return this.configService.getOrThrow<string>(
      'JWT_REFRESH_SECRET',
    );
  }

  private hashToken(token: string): string {
    return createHash('sha256') 
      .update(token)
      .digest('hex');
  }


  private async verifyRefreshToken(
    token: string,
  ): Promise<TokenPayload> {
    try {
      const payload =
        await this.jwtService.verifyAsync<TokenPayload>(
          token,
          { secret: this.refreshSecret },
        );

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        typeof payload.role !== 'string' ||
        typeof payload.exp !== 'number'
      ) {
        throw new Error('Invalid refresh-token claims');
      }

      return payload;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }
  }

  // Called after login credentials are validated.
async saveRefreshToken(
  userId: string,
  refreshToken: string,
): Promise<void> {
  const payload = await this.verifyRefreshToken(refreshToken);

  if (payload.sub !== userId) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  await this.refreshTokenRepository.save(
    this.refreshTokenRepository.create({
      userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(payload.exp! * 1000),
      revokedAt: null,
    }),
  );
}

async validateForRotation(
  refreshToken: string,
): Promise<TokenUser> {
  const payload = await this.verifyRefreshToken(refreshToken);
  const tokenHash = this.hashToken(refreshToken);

  const storedToken = await this.refreshTokenRepository.findOne({
    where: { tokenHash },
  });

  if (
    !storedToken ||
    storedToken.userId !== payload.sub ||
    storedToken.revokedAt !== null ||
    storedToken.expiresAt.getTime() <= Date.now()
  ) {
    throw new UnauthorizedException(
      'Refresh token is invalid, expired, or revoked',
    );
  }

  const user = await this.userRepository.findOne({
    where: { id: payload.sub },
  });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new ForbiddenException('Your account is deactivated');
  }

  // Use current user information from the database.
  return {
    id: user.id,
    name : user.name,
    email: user.email,
    role: user.role,
  };
}

  // Called when POST /auth/refresh is received.
  async rotate(oldRefreshToken: string,
    newRefreshToken : string
  ) : Promise<void> {
    const oldPayload = await this.verifyRefreshToken(oldRefreshToken);

    const newPayload = this.verifyRefreshToken(newRefreshToken);

if (oldPayload.sub !== (await newPayload).sub) {
      throw new UnauthorizedException(
        'Refresh tokens belong to different users',
      );
    }

    const oldTokenHash = this.hashToken(oldRefreshToken);
    const newTokenHash = this.hashToken(newRefreshToken);

    if (oldTokenHash === newTokenHash) {
      throw new UnauthorizedException(
        'A new refresh token is required',
      );
    }
    const user = await this.userRepository.findOne({
        where : {id : oldPayload.sub}
    })

    if(!user) {
        throw new UnauthorizedException('user not found')
    }

    if(user.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException('Your account is deactivated')
    }

    // Revoke the old token and save the new token atomically.
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.update(
        RefreshToken,
        {
        tokenHash: oldTokenHash,
          userId: oldPayload.sub,
          revoked_at: IsNull(),
          expires_at: MoreThan(new Date()),
        },
        {
          revokedAt: new Date(),
        },
      );

      // Only one concurrent request can revoke this record.
      if (result.affected !== 1) {
        throw new UnauthorizedException(
          'Refresh token is invalid, expired, or already used',
        );
      }

      await manager.insert(RefreshToken, {
        userId: (await newPayload).sub,
        tokenHash: newTokenHash,
        expiresAt: new Date((await newPayload).exp! * 1000),
        revokedAt: null,
      });
    });
  }

  // Called when POST /auth/logout is received.
  async revoke(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);

    const result = await this.refreshTokenRepository.update(
      {
        tokenHash,
        userId: payload.sub,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      {
        revokedAt: new Date(),
      },
    );

    if (result.affected !== 1) {
      throw new UnauthorizedException(
        'Refresh token is invalid, expired, or revoked',
      );
    }

    return { message: 'Logged out successfully' };
  }
}