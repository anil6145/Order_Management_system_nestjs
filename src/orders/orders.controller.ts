import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UserRole } from '../users/enum/roles.enum.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import  { currentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import type { TokenUser } from '../auth/interfaces/token-user.interface.js';
import { UpdateOrderItemsDto } from './dto/update-order-item.dto.js';
import { OrderQueryDto } from './dto/order-query.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';
import { AuditInterceptor } from '../audit/audit/audit.interceptor.js';
import { AuditEvent } from '../audit/audit/audit.types.js';
import { ResponseMessage } from '../auth/decorators/response-message.decorator.js';



type AuditRequest = Request & {
  auditEvent?: AuditEvent;
};
@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Post('create')
  @Roles(UserRole.User,UserRole.Admin)
  @ResponseMessage('Order Created Successfully')
  @ApiOperation({
    summary: 'Create a new order (Authenticated User)',
    description:
      'Create an order, validate stock, calculate totals and reduce product stock inside a transaction. Requires idempotency-key header.',
  })
  @ApiHeader({
    name: 'idempotency-key',
    description: 'Unique client-generated idempotency key (1-128 characters) to prevent duplicate order placement',
    required: true,
    example: 'order-create-uuid-12345',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order, duplicate products, or insufficient stock',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'User or product not found',
  })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey : string ,
    @currentUser() user : AuthenticatedUser ,
    @Req() req : AuditRequest
  ) {

    this.logger.log(
      `[CONTROLLER] OrdersController.create - User ID: ${user.id} | DTO: CreateOrderDto (${createOrderDto.items.length} items)`,
    );

    const order = await this.ordersService.createOrder(
  user.id,
  createOrderDto,
  idempotencyKey,
);

req.auditEvent = {
  userId: user.id,
  entityType: 'ORDER',
  entityId: order.id,
  action: 'CREATE',
  oldValues: null,
  newValues: {
    status: order.status,
    totalAmount: order.totalAmount,
    items: order.items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
  },
};

return order;
  }

  @Get()
  @ResponseMessage('Orders fetched successfully')
  @ApiOperation({
    summary: 'Get orders with pagination and filtering',
    description:
      'ADMIN can view all orders across all users. Standard USER can only view their own orders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll( @currentUser() user : TokenUser,
@Query() listOrderQueryDto : ListOrdersQueryDto) {

    this.logger.log(
      `[CONTROLLER] OrdersController.findAll - User ID: ${user.id} | Role: ${user.role}`,
    );

    return this.ordersService.findAll(
      user.id,
      user.role,
      listOrderQueryDto
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order details by ID',
    description: 'Users can only view their own orders. Admins can view any order.',
  })
  @ApiParam({
    name: 'id',
    example: 'c0000000-0000-0000-0000-000000000001',
    description: 'Order UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid order UUID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'User is not allowed to view this order',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const user = req.user as {
      id: string;
      role: UserRole;
    };

    this.logger.log(
      `[CONTROLLER] OrdersController.findOne - Order ID: ${id} | User ID: ${user.id} (${user.role})`,
    );

    return this.ordersService.findOne(
      id,
      user.id,
      user.role,
    );
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order status',
    description:
      'Only ADMIN can advance order status. PENDING orders may be CANCELLED by the order owner or ADMIN. Allowed transitions: PENDING → CONFIRMED/CANCELLED, CONFIRMED → COMPLETED/CANCELLED.',
  })
  @ApiParam({
    name: 'id',
    example: 'c0000000-0000-0000-0000-000000000001',
    description: 'Order UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID format',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Only ADMIN or order owner can cancel; other transitions require ADMIN',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable Entity - Invalid status transition',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    updateOrderStatusDto: UpdateOrderStatusDto,
    @currentUser() currentUser : TokenUser,
    @Req() req: Request & { auditEvent?: AuditEvent }
  ) {
    this.logger.log(
      `[CONTROLLER] OrdersController.updateStatus - Order ID: ${id} | Target Status: ${updateOrderStatusDto.status}`,
    );

     // Keep your existing service logic.
  // This read is illustrative; verify the signature and return
  // type of your existing findOne() service method.
  const oldOrder = await this.ordersService.findOne(
    id,
    currentUser.id,
    currentUser.role,
  );

  const updatedOrder = await this.ordersService.updateStatus(
    id,
    updateOrderStatusDto,
    currentUser,
  );

  // Attach the audit event for the interceptor.
  req.auditEvent = {
    userId: currentUser.id,
    entityType: 'ORDER',
    entityId: id,
    action: 'STATUS_CHANGE',

    oldValues: {
      status: oldOrder.status,
    },

    newValues: {
      status: updatedOrder.order.status,
    },
  };

  return updatedOrder.order;
  }


  @Get(':id/history')
  @ApiBearerAuth('JWT-auth')
@ApiOperation({
  summary: 'Get order status history',
  description: 'Only the order owner or an ADMIN can view its history.',
})
@ApiParam({
  name: 'id',
  description: 'UUID of the order',
  example: 'c0000000-0000-0000-0000-000000000001',
})
@ApiResponse({
  status: 200,
  description: 'Order history retrieved successfully',
})
@ApiResponse({
  status: 400,
  description: 'Invalid order UUID',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
@ApiResponse({
  status: 403,
  description: 'You are not allowed to view this order history',
})
@ApiResponse({
  status: 404,
  description: 'Order not found',
})
  getOrderHistory(
    @Param('id',ParseUUIDPipe) id :string,
    @currentUser() currentUser : TokenUser
  ){
    return this.ordersService.getOrderHistory(id,currentUser)
  }

  
@Patch(':id')
@ApiBearerAuth('JWT-auth')
@ApiOperation({
  summary: 'Edit order items',
  description:
    'The order owner or ADMIN can add or remove items from a PENDING order. Restores or deducts stock accordingly.',
})
@ApiParam({
  name: 'id',
  description: 'UUID of the order',
  example: 'c0000000-0000-0000-0000-000000000001',
})
@ApiResponse({
  status: 200,
  description: 'Order items updated successfully',
})
@ApiResponse({
  status: 400,
  description: 'Invalid request, insufficient stock, or order is not PENDING',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
@ApiResponse({
  status: 403,
  description: 'You are not allowed to edit this order',
})
@ApiResponse({
  status: 404,
  description: 'Order or product not found',
})
updateOrderItems(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: UpdateOrderItemsDto,
  @currentUser() currentUser: TokenUser,
) {
  return this.ordersService.UpdateOrderItems(
    id,
    dto,
    currentUser
  );
}

}
