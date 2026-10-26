import { Body, Controller, Post, HttpCode, HttpStatus, Logger, UseFilters, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginUserDto } from '../users/dto/login-user.dto.js';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator.js';
import { RefreshTokenDto } from '../refresh-tokens/dto/refresh-token.dto.js';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';


@ApiTags('Authentication')
// here put all endpoints from this controller under the authentication 
@Controller('auth') 

export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({default : {limit : 5 , ttl : 60000}})
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Login using email and password to receive JWT access and refresh tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns access_token and refresh_token',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (e.g., invalid email format, missing password)',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
  })
  @ApiResponse({
    status: 403,
    description: 'Account is deactivated',
  })
  async login(
    @Body() loginUserDto: LoginUserDto,
  ) {
    this.logger.log(
      `[CONTROLLER] AuthController.login - Processing login for email: ${loginUserDto.email}`,
    );
    return this.authService.login(loginUserDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Validate and rotate the refresh token to receive a new access token and refresh token pair.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed and rotated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (missing or invalid refresh token)',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid, expired, or already revoked refresh token',
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
  ) {
    this.logger.log(
      `[CONTROLLER] AuthController.refresh - Processing refresh token request`,
    );
    return this.authService.refreshAccessToken(dto.refresh_token);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke refresh token (logout)',
    description: 'Revokes the supplied refresh token so it can no longer be used.',
  })
  @ApiResponse({
    status: 200,
    description: 'Refresh token revoked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (missing or invalid refresh token)',
  })
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refresh_token);
  }
}


    

