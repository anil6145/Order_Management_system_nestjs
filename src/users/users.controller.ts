import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from './enum/roles.enum.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { ListQueryDto } from './dto/list-users-query.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
  })
  createUser(
    @Body() createUserDto: CreateUserDto,
  ) {
    this.logger.log(
      `[CONTROLLER] UsersController.createUser - DTO: CreateUserDto | Email: ${createUserDto.email}`,
    );
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all users - Admin only',
  })
  @ApiResponse({
    status: 200,
    description: 'All users retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. JWT access token is missing or invalid.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
  })
  getAllUsers(@Query() query : ListQueryDto) {
    this.logger.log(
      `[CONTROLLER] UsersController.getAllUsers - Retrieving all users (Admin)`,
    );
    return this.usersService.findAll(query);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get logged-in user profile',
    description:
      'Returns the profile of the currently authenticated user based on the JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged-in user profile retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. JWT access token is missing or invalid.',
  })
  async getMyProfile(@Request() req: any) {
    this.logger.log(
      `[CONTROLLER] UsersController.getMyProfile - User ID: ${req.user.id}`,
    );
    return this.usersService.findById(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile by ID - Admin only',
    description:
      'Returns a specific user by ID. Admin access required.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: '6d3910aa-7b85-46dc-a404-bde9feaf2b98',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (UUID expected)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. JWT access token is missing or invalid.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getProfile(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.logger.log(
      `[CONTROLLER] UsersController.getProfile - Target User ID: ${id}`,
    );
    return await this.usersService.findById(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.Admin)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user status - Admin only',
    description: 'Activate or deactivate a user account. Admin access required.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: '6d3910aa-7b85-46dc-a404-bde9feaf2b98',
  })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (invalid UUID or status)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. JWT access token is missing or invalid.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Admin access required.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, updateUserStatusDto);
  }
}
