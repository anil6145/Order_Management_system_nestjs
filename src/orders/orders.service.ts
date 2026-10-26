import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { User } from '../users/entities/user.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { Order } from './entities/order.entity.js';
import { OrderStatus } from './enums/order-status.enum.js';
import { UserRole } from '../users/enum/roles.enum.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { ProductStatus } from '../products/enum/product-status.enum.js';
import { OrderStatusHistory } from './entities/order-status-history.entity.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { currentUser } from '../auth/decorators/current-user.decorator.js';
import type { TokenUser } from '../auth/interfaces/token-user.interface.js';
import { StockMovement } from '../products/entities/stock-movement.entity.js';
import { UpdateOrderItemsDto } from './dto/update-order-item.dto.js';
import { OrderStatusHistoryResponseDto } from './dto/order-status-history-response.dto.js';
import { OrderQueryDto } from './dto/order-query.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';
import { OrderCursor } from './interface/orderCursor.interface.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  private readonly allowedTransitions: Record<
    OrderStatus,
    OrderStatus[]
  > = {
    [OrderStatus.PENDING]: [
      OrderStatus.CONFIRMED,
      OrderStatus.CANCELLED,
    ],

    [OrderStatus.CONFIRMED]: [
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ],

    [OrderStatus.CANCELLED]: [],

    [OrderStatus.COMPLETED]: [],
  };

  constructor(
    private readonly dataSource: DataSource,
  ) {}

// create an order  
async createOrder(
  userId: string,
  createOrderDto: CreateOrderDto,
  idempotencyKey : string
) : Promise<OrderResponseDto> {

  if(
    !idempotencyKey || idempotencyKey.length > 128 
  ) {
    throw new BadRequestException('Idempotency key must contain 1 to 128 characters');
  }

  // logger
  this.logger.log(
    `[SERVICE] OrdersService.createOrder - Initiating order creation for User ID: ${userId}`,
  );

  //  logger
  this.logger.log(`[TRANSACTION] Creating QueryRunner`);


  const queryRunner = this.dataSource.createQueryRunner();

  try {
    //  Connect QueryRunner to database
    this.logger.log(`[QUERY-RUNNER] Connecting to database`);
    await queryRunner.connect();

    //  Start transaction
    this.logger.log(`[TRANSACTION] START`);
    await queryRunner.startTransaction();
    // Use this manager for ALL database operations
    const manager = queryRunner.manager;

    //  User Validation
    this.logger.log(
      `[TRANSACTION] User validation - Querying database for User ID: ${userId}`,
    );

    this.logger.log(
      `[TYPEORM] Entity: User - findOne({ id: ${userId} })`,
    );

    // find the user 
    const user = await manager.findOne(User, {
      where: { id: userId },
    });

    // validating the user 
    if (!user) {
      this.logger.warn(
        `[SERVICE] OrdersService.createOrder - User ID ${userId} not found`,
      );

      throw new NotFoundException('User not found');
    }

    // logger
    this.logger.log(
      `[TRANSACTION] User validation - User ID: ${userId} (${user.email}) validated successfully`,
    );

    // logger
    this.logger.log(
      `[TRANSACTION] Order validation - Validating request items count: ${createOrderDto.items.length}`,
    );

    // check idempotency key 
    const existingOrder = await manager.findOne(Order,{
      where : {
        user : {id : userId},
        idempotencyKey,
      },
      relations : {
        user : true,
        items : {product : true}
      }
    })
    if(existingOrder){
      await queryRunner.commitTransaction()
      return this.toOrderResponse(existingOrder);
    }
 

    // map iterates over order items and creates a new array containing of product ids  
    const productIds = createOrderDto.items.map(
      (item) => item.productId,
    );


    if (new Set(productIds).size !== productIds.length) {
      this.logger.warn(
        `[SERVICE] OrdersService.createOrder - Duplicate products detected in request`,
      );

      throw new BadRequestException(
        'Duplicate products are not allowed in the same order',
      );
    }

    this.logger.log(
      `[TRANSACTION] Order validation - No duplicate products found`,
    );

    const orderItems: OrderItem[] = [];
    let orderTotal = 0;

    // Products & Stock Validation
    for (const itemDto of createOrderDto.items) {
      this.logger.log(
        `[TRANSACTION] Product validation - Querying Product ID: ${itemDto.productId} with pessimistic_write lock`,
      );

      this.logger.log(
        `[TYPEORM] Entity: Product - findOne({ id: ${itemDto.productId} })`,
      );

      // find the product with id and lock the row for current transaction the lock is released when the transaction commits or rollback
      const product = await manager.findOne(Product, {
        where: { id: itemDto.productId },
        lock: {
          mode: 'pessimistic_write',
        },

      });

      if (!product) {
        this.logger.warn(
          `[SERVICE] OrdersService.createOrder - Product ID ${itemDto.productId} not found`,
        );

        throw new NotFoundException(
          `Product ${itemDto.productId} not found`,
        );
      }

      // Product status validation
      if (product.status !== ProductStatus.ACTIVE) {
        this.logger.warn(
          `[SERVICE] OrdersService.createOrder - Product "${product.name}" is inactive`,
        );

        throw new BadRequestException(
          `Product ${product.name} is currently inactive`,
        );
      }

      this.logger.log(
        `[TRANSACTION] Product validation - Product "${product.name}" is ACTIVE`,
      );

      // Stock validation
      this.logger.log(
        `[TRANSACTION] Stock validation - Checking inventory for "${product.name}" (Available: ${product.stock}, Requested: ${itemDto.quantity})`,
      );

      // stock validation 
      if (product.stock < itemDto.quantity) {
        this.logger.warn(
          `[SERVICE] OrdersService.createOrder - Insufficient stock for "${product.name}"`,
        );

        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available stock: ${product.stock}, requested: ${itemDto.quantity}`,
        );
      }

      this.logger.log(
        `[TRANSACTION] Stock validation - Stock available for "${product.name}"`,
      );

      // here converting the price from string to number
      const price = Number(product.price);

      // calculating the order total 
      const itemTotal = price * itemDto.quantity;

      orderTotal += itemTotal;

      // current stock
      const oldStock = product.stock;

      // current stock - item ordered quantity 
      product.stock -= itemDto.quantity;

      this.logger.log(
        `[TRANSACTION] Stock update - Decrementing stock for "${product.name}" from ${oldStock} to ${product.stock}`,
      );

      this.logger.log(
        `[TYPEORM] Repository: ProductRepository.save()`,
      );

      // save the product into the database 
      await manager.save(Product, product);

     
      this.logger.log(
        `[TRANSACTION] OrderItem creation - Instantiating OrderItem for Product "${product.name}" (Qty: ${itemDto.quantity}, Price: $${price}, Subtotal: $${itemTotal})`,
      );

      this.logger.log(`[TYPEORM] Entity: OrderItem`);

       // Create OrderItem
      const orderItem = manager.create(OrderItem, {
        product,
        quantity: itemDto.quantity,
      unitPrice : price.toFixed(2),
      lineTotal : itemTotal.toFixed(2)
      });

      // one order can contaion multiple products  
      orderItems.push(orderItem);
    }

  
    this.logger.log(
      `[TRANSACTION] Order creation - Instantiating Order entity (User: ID ${user.id}, Total: $${orderTotal}, Initial Status: PENDING, Items: ${orderItems.length})`,
    );

    this.logger.log(`[TYPEORM] Entity: Order`);

      //  Create Order
    const order = manager.create(Order, {
      user,
      totalAmount: orderTotal.toFixed(2),
      status: OrderStatus.PENDING,
      idempotencyKey,
      items: orderItems,
      notes : createOrderDto.notes ?? null
    });

    //  Save Order + OrderItems
    this.logger.log(
      `[POSTGRESQL] Executing database persistence: INSERT INTO orders & INSERT INTO order_items`,
    ); 

    const savedOrder = await manager.save(Order, order);

    const history = manager.create(OrderStatusHistory,{
      order : savedOrder,
      fromStatus : null,
      toStatus : OrderStatus.PENDING,
      reason : 'Order created',
      changedBy : user
    })

    await manager.save(OrderStatusHistory,history);

    // Record stock deductions for this order
for (const item of orderItems) {
  const movement = manager.create(StockMovement, {
    product: item.product,
    change: -item.quantity,
    reason: 'Order created',
    referenceType: 'ORDER',
    referenceId: savedOrder.id,
    user,
  });

  await manager.save(StockMovement, movement);
}

this.logger.log(
  `[TRANSACTION] Stock movements created for Order ID: ${savedOrder.id}`,
);

    //  Commit transaction
    await queryRunner.commitTransaction();

    this.logger.log(`[TRANSACTION] COMMIT`);

    //  Fetch final order
    const result = await this.dataSource.getRepository(Order).findOne({
      where: {
        id: savedOrder.id,
      },
      relations: {
        user: true, 
        items: {
          product: true,
        },
      },
    });

    this.logger.log(
      `[SERVICE] OrdersService.createOrder - Order created successfully with Order ID: ${result?.id}`,
    );
    if(!result){
      throw new NotFoundException('Order not found after creation');
    }

    return this.toOrderResponse(result);
  } catch (error) {
    // 1 Rollback transaction
    this.logger.error(
      `[TRANSACTION] ROLLBACK - Reason: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );

    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }

    throw error;
  } finally {
    // 11. Release database connection
    this.logger.log(`[QUERY-RUNNER] Releasing QueryRunner`);

    await queryRunner.release();
  }
}

async findAll(
  userId: string,
  role: UserRole,
  query : ListOrdersQueryDto
) {
  this.logger.log(
    `[SERVICE] OrdersService.findAll - Querying orders for User ID: ${userId} (${role})`,
  );

  const {
    page = 1,
    limit = 10,
    status,
    fromDate,
    toDate,
    minTotal,
    search,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    cursor,
    paginationMode = 'page',
  } = query;

  // Validate the date range when both dates are provided.
  if (fromDate && toDate) {
    if (fromDate > toDate) {
      throw new BadRequestException(
        'fromDate must be before or equal to toDate',
      );
    }

    const startDate = new Date(`${fromDate}T00:00:00.000Z`);
    const endDate = new Date(`${toDate}T00:00:00.000Z`);

    const calendarDays =
      (endDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24) +
      1;

    if (calendarDays > 366) {
      throw new BadRequestException(
        'Date range cannot exceed 366 calendar dates',
      );
    }
  }

  console.log({
  paginationMode,
  sortBy,
  sortOrder,
  hasCursor: !!cursor,
});

  // Cursor pagination uses created_at DESC ordering.
  if ( paginationMode === 'cursor' ||!! cursor && (sortBy !== 'created_at' || sortOrder !== 'DESC')) {
    throw new BadRequestException(
      'Cursor pagination supports only created_at DESC sorting',
    );
  }

  const repository = this.dataSource.getRepository(Order);

  // Start building the order query.
  const queryBuilder = repository
    .createQueryBuilder('orders')
    .leftJoinAndSelect('orders.user', 'user')
    .leftJoinAndSelect('orders.items', 'items')
    .leftJoinAndSelect('items.product', 'product');

  // USER sees only their own orders.
  // ADMIN can see orders belonging to all users.
  if (role !== UserRole.Admin) {
    queryBuilder.andWhere(
      'user.id = :userId',
      { userId },
    );
  }

  // Filter by order status.
  if (status) {
    queryBuilder.andWhere(
      'orders.status = :status',
      { status },
    );
  }

  // Include the starting date.
  // Dates are interpreted in Asia/Kolkata.
  if (fromDate) {
    queryBuilder.andWhere(
      `orders.createdAt >= (
        CAST(:fromDate AS date)::timestamp
        AT TIME ZONE 'Asia/Kolkata'
      )`,
      { fromDate },
    );
  }

  // Include the entire ending date.
  // Using the next day as an exclusive boundary includes
  // orders created at any time on toDate.
  if (toDate) {
    queryBuilder.andWhere(
      `orders.createdAt < (
        (CAST(:toDate AS date) + 1)::timestamp
        AT TIME ZONE 'Asia/Kolkata'
      )`,
      { toDate },
    );
  }

  // Filter by minimum order total.
  if (minTotal !== undefined) {
    queryBuilder.andWhere(
      'orders.totalAmount >= :minTotal',
      { minTotal },
    );
  }

  // Search by order number.
  if (search) {
    queryBuilder.andWhere(
      'orders.orderNumber ILIKE :search',
      { search: `%${search}%` },
    );
  }

  

   // Cursor pagination.
  if (cursor) {
    const decoded = this.decodeCursor(cursor);

    queryBuilder.andWhere(
      `(
        orders.createdAt < :createdAt
        OR (
          orders.createdAt = :createdAt
          AND orders.id > :id
        )
      )`,
      {
        createdAt: decoded.createdAt,
        id: decoded.id,
      },
    );

    const orders = await queryBuilder
      .orderBy('orders.createdAt', 'DESC')
      .addOrderBy('orders.id', 'ASC')
      .take(limit + 1)
      .getMany();

    const hasNextPage = orders.length > limit;

    if (hasNextPage) {
      orders.pop();
    }

    const lastOrder = orders.at(-1);

    return {
      items: orders.map((order) =>
        this.toOrderResponse(order),
      ),
      pagination: {
        mode: 'cursor',
        limit,
        hasNextPage,
        nextCursor:
          hasNextPage && lastOrder
            ? this.encodeCursor(lastOrder)
            : null,
      },
    };
  }

  // Never use a client-provided string directly as a SQL column.
  const sortColumns: Record<string, string> = {
    created_at: 'orders.createdAt',
    total_amount: 'orders.totalAmount',
    order_number: 'orders.orderNumber',
  };

  queryBuilder
    .orderBy(sortColumns[sortBy], sortOrder)
    .addOrderBy('orders.id', 'ASC');

  // Apply pagination.
  queryBuilder
    .skip((page - 1) * limit)
    .take(limit);

  const [orders, total] =
    await queryBuilder.getManyAndCount();

  return {
    items: orders.map((order) =>
      this.toOrderResponse(order),
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  async findOne(
    id: string,
    userId: string,
    role: UserRole,
  ) {
    this.logger.log(`[SERVICE] OrdersService.findOne - Fetching Order ID: ${id}`);
    this.logger.log(`[TYPEORM] Repository: OrderRepository.findOne({ id: ${id} })`);

    const order = await this.dataSource
      .getRepository(Order)
      .findOne({
        where: { id },
        relations: {
          user: true,
          items: { product: true },
        },
      });

    if (!order) {
      this.logger.warn(`[SERVICE] OrdersService.findOne - Order ID ${id} not found`);
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (role !== UserRole.Admin && order.user.id !== userId) {
      this.logger.warn(`[SERVICE] OrdersService.findOne - Access denied: User ${userId} attempted to view order of User ${order.user.id}`);
      throw new ForbiddenException('You are not allowed to view this order');
    }

    return this.toOrderResponse(order);
  }

  
private encodeCursor(order: Order): string {
  const cursor: OrderCursor = {
    createdAt: new Date(order.createdAt).toISOString(),
    id: order.id,
  };

  return Buffer.from(
    JSON.stringify(cursor),
    'utf8',
  ).toString('base64url');
}

private decodeCursor(cursor: string): OrderCursor {
  try {
    const decoded = Buffer.from(
      cursor,
      'base64url',
    ).toString('utf8');

    const value: unknown = JSON.parse(decoded);

    if (
      typeof value !== 'object' ||
      value === null ||
      !('createdAt' in value) ||
      !('id' in value) ||
      typeof value.createdAt !== 'string' ||
      typeof value.id !== 'string' ||
      !Number.isFinite(Date.parse(value.createdAt)) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value.id,
      )
    ) {
      throw new Error('Invalid cursor');
    }

    return {
      createdAt: new Date(value.createdAt).toISOString(),
      id: value.id,
    };
  } catch {
    throw new BadRequestException(
      'Invalid cursor. Use the nextCursor returned by the API.',
    );
  }
}


  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    currentUser : TokenUser
  ) {
    this.logger.log(`[SERVICE] OrdersService.updateStatus - Updating Order ID: ${id} to status: ${updateOrderStatusDto.status}`);
    this.logger.log(`[TRANSACTION] Initiating status update transaction`);

    try {
      const result = await this.dataSource.transaction(
        async (manager) => {
          this.logger.log(`[TRANSACTION] BEGIN`);

          this.logger.log(`[TYPEORM] Entity: Order - Locking Order ID: ${id} | Lock mode: pessimistic_write`);

          
          const order = await manager.findOne(Order, {
            where: { id },
            lock: { mode: 'pessimistic_write' },
          });

          if (!order) {
            this.logger.warn(`[SERVICE] OrdersService.updateStatus - Order ID ${id} not found`);
            throw new NotFoundException('Order not found');
          }

          const oldStatus = order.status;
          const newStatus = updateOrderStatusDto.status;

          this.logger.log(`[SERVICE] OrdersService.updateStatus - Validating status transition: ${oldStatus} → ${newStatus}`);

          const allowed = this.allowedTransitions[oldStatus];

          if (!allowed.includes(newStatus)) {
            this.logger.warn(`[SERVICE] OrdersService.updateStatus - Invalid transition from ${oldStatus} to ${newStatus}`);
            throw new UnprocessableEntityException({
    statusCode: 422,
    errorCode: 'INVALID_STATUS_TRANSITION',
    message: `Cannot change order from ${oldStatus} to ${newStatus}`,
  });
          }

          const orderWithItems = await manager.findOne(Order, {
            where: { id },
            relations: {
              user : true,
              items: { product: true },
            },
          });

          


          if (!orderWithItems) {
            throw new NotFoundException('Order not found');
          }

          // 3. ADD YOUR PERMISSION CHECK HERE.
if (
  oldStatus === OrderStatus.PENDING &&
  newStatus === OrderStatus.CANCELLED
) {
  // Owner or ADMIN can cancel a pending order.
  if (
    currentUser.role !== UserRole.Admin &&
    orderWithItems.user.id !== currentUser.id
  ) {
    throw new ForbiddenException(
      'Only the order owner or ADMIN can cancel a pending order',
    );
  }
} else if (currentUser.role !== UserRole.Admin) {
  // All other valid transitions require ADMIN.
  throw new ForbiddenException(
    'Only ADMIN can perform this status transition',
  );
}
            const admin = await manager.findOneByOrFail(User, {
  id: currentUser.id,
});

          if (newStatus === OrderStatus.CANCELLED) {
            this.logger.log(`[SERVICE] OrdersService.updateStatus - Order cancellation detected. Restoring product stock`);

            for (const item of orderWithItems.items) {
              this.logger.log(`[TYPEORM] Entity: Product - Locking Product ID: ${item.product.id} | Lock mode: pessimistic_write`);

              const product = await manager.findOne(Product, {
                where: { id: item.product.id },
                lock: { mode: 'pessimistic_write' },
              });

              if (!product) {
                throw new NotFoundException(`Product ${item.product.id} not found`);
              }

              product.stock += item.quantity;


              this.logger.log(`[TYPEORM] Entity: Product - Restored ${item.quantity} units to "${product.name}". New stock: ${product.stock}`);


              await manager.save(Product, product);


              const adminn = await manager.findOneByOrFail(User, {
    id: currentUser.id,
  });

          const movement = manager.create(StockMovement, {
            product : product,
            change : item.quantity,
            reason : `stock restored for cancelled order ${order.id} `,
            referenceType : 'ORDER',
            referenceId : order.id,
            user : adminn

          });

          await manager.save(StockMovement,movement)
            }
          }

          

          order.status = newStatus;

          this.logger.log(`[DATABASE] Updating Order status to ${newStatus}`);
          const savedOrder = await manager.save(Order, order);

const history = manager.create(OrderStatusHistory, {
  order: savedOrder,
  fromStatus: oldStatus,
  toStatus: newStatus,
  reason: `Order status changed from ${oldStatus} to ${newStatus}`,
  changedBy: admin,
});

await manager.save(OrderStatusHistory, history);

// Return the old status from the same transaction.
      return {
        oldStatus,
      };
    });

      this.logger.log(`[SERVICE] OrdersService.updateStatus - Order status updated successfully`);
      const updatedOrder = await this.dataSource
  .getRepository(Order)
  .findOne({
    where: { id },
    relations: {
      user: true,
      items: {
        product: true,
      },
    },
  });

if (!updatedOrder) {
  throw new NotFoundException('Order not found after update');
}


// Convert the entity into the response DTO
return {
  order : this.toOrderResponse(updatedOrder),
oldStatus : result.oldStatus
} 

}
catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[TRANSACTION] ROLLBACK - Reason: ${errorMessage}`);
      throw error;
    }
  }

  async getOrderHistory(
    id:string,
    currentUser : TokenUser
  ) :Promise <OrderStatusHistoryResponseDto[]>{

    const order = await this.dataSource
    .getRepository(Order)
    .findOne({
      where : {id},
      relations : {
        user : true
      }
    });

    if(!order){
      throw new NotFoundException('Order not found')
    }

    const isAdmin = currentUser.role === UserRole.Admin;
    const isOwner = order.user.id === currentUser.id;

    if(!isAdmin && !isOwner) {
      throw new ForbiddenException('You are not allowed to view this order history')
    }

    const history = await this.dataSource
    .getRepository(OrderStatusHistory)
    .find({
      where : {
        order : {id : order.id},
      },
      relations : {
        changedBy : true
      },
      order : {
        createdAt : 'ASC'
      }
    })
    // 4. Return only the required fields
  return history.map((item) => ({
    id: item.id,
    fromStatus: item.fromStatus,
    toStatus: item.toStatus,

    changedBy: item.changedBy
      ? {
          id: item.changedBy.id,
          name: item.changedBy.name,
          role: item.changedBy.role,
        }
      : null,

    reason: item.reason,
    createdAt: item.createdAt,
  }));
}

  async UpdateOrderItems(
    id:string,
    updateOrderItemsDto: UpdateOrderItemsDto,
    currentUser : TokenUser
  ){

    const addItems = updateOrderItemsDto.addItems ?? [];
    const removeItemIds = updateOrderItemsDto.removeItemIds ?? [];

    if(addItems.length === 0 && removeItemIds.length === 0) {
      throw new BadRequestException(
        'Provide at least one item to add or remove '
      )
    }

    if(new Set(removeItemIds).size !== removeItemIds.length){
      throw new BadRequestException(
        'Duplicate order-item IDs are not allowed'
      )
    }

    await this.dataSource.transaction(async(manager) => {

      const order = await manager.findOne(Order, {
        where : {id},
        relations : {user : true},
        lock : { mode : 'pessimistic_write'}
      })

      if(!order){
        throw new NotFoundException('Order not found')
      }

      const isAdmin = currentUser.role === UserRole.Admin;
      const isOwner = order.user.id === currentUser.id;

      if(!isAdmin && !isOwner) {
        throw new ForbiddenException('You are not allowed to edit this order')
      }

      if(order.status !== OrderStatus.PENDING){
        throw new BadRequestException('Only PENDING orders can be edited')
      }

      const existingItems = await manager.find(OrderItem,{
        where : {order : {id : order.id}},
        relations : {product : true}
      });

      const itemsToRemove = existingItems.filter((item)=> removeItemIds.includes(item.id));

      if(itemsToRemove.length !== removeItemIds.length) {
        throw new BadRequestException('One or more order-item IDs do not belong to this order');
      }

      const productIds = [
        ...new Set([
          ...addItems.map((item) => item.productId),
          ...itemsToRemove.map((item) => item.product.id)
        ]),
      ].sort();

      const products = new Map<string ,Product>();

      for(const productId of productIds) {
        const product  = await manager.findOne(Product,{
          where : {id : productId},
          withDeleted :true,
          lock : {mode : 'pessimistic_write'}
        });

        if(!product){
          throw new NotFoundException(
            `Product ${productId} not found`
          )
        }

        products.set(productId,product)
      }

      const actor = await manager.findOneByOrFail(User, {
        id : currentUser.id,
      });

      const quantitiesToAdd = new Map<string , number>();

      for(const item of addItems){
        quantitiesToAdd.set(
          item.productId,
          (quantitiesToAdd.get(item.productId) ?? 0) + item.quantity,
        )
      }

      for(const [productId, quantity] of quantitiesToAdd) {
        const product = products.get(productId)!;

        if(product.deletedAt || String(product.status) !== 'ACTIVE') {
          throw new BadRequestException(`Product ${productId} is not active`)
        }

        if(product.stock < quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${productId}`
          )
        }

        product.stock -= quantity;
        await manager.save(Product,product);

        const movement = manager.create(StockMovement,{
          product,
          change : -quantity,
          reason : `Stock deducted for edited order ${order.id}`,
          referenceType : 'ORDER',
          referenceId : order.id,
          user : actor
        });

        await manager.save(StockMovement,movement);

        const existingItem = existingItems.find(
          (item) => item.product.id === productId && !removeItemIds.includes(item.id),
        );

        if(existingItem) {
          existingItem.quantity += quantity;
          existingItem.lineTotal = (
            Number(existingItem.unitPrice) * existingItem.quantity
          ).toFixed(2);

          await manager.save(OrderItem, existingItem);
        } else {
          const newItem = manager.create(OrderItem, {
            order,
            product,
            quantity,
            unitPrice : String(product.price),
            lineTotal : (
              Number(product.price) * quantity
            ).toFixed(2)
          });

          await manager.save(OrderItem,newItem)
        }
      }
 // 6. Remove requested items and restore their stock.
    for (const item of itemsToRemove) {
      const product = products.get(item.product.id)!;

      product.stock += item.quantity;
      await manager.save(Product, product);

      const movement = manager.create(StockMovement, {
        product,
        change: item.quantity,
        reason: `Stock restored for edited order ${order.id}`,
        referenceType: 'ORDER',
        referenceId: order.id,
        user: actor,
      });

      await manager.save(StockMovement, movement);
      await manager.remove(OrderItem, item);
    }

    // 7. Recalculate the order total from the remaining items.
    const remainingItems = await manager.find(OrderItem, {
      where: { order: { id: order.id } },
    });

    if (remainingItems.length === 0) {
      throw new BadRequestException(
        'An order must contain at least one item',
      );
    }

    const total = remainingItems.reduce(
      (sum, item) => sum + Number(item.lineTotal),
      0,
    );

    order.totalAmount = total.toFixed(2);
    await manager.save(Order, order);
  });

  // 8. Return the updated order with its relations.
  const updatedOrder = await this.dataSource
    .getRepository(Order)
    .findOne({
      where: { id },
      relations: {
        user: true,
        items: { product: true },
      },
    });

  if (!updatedOrder) {
    throw new NotFoundException('Order not found after update');
  }

  return this.toOrderResponse(updatedOrder);
}


  private toOrderResponse(order: Order): OrderResponseDto {
  return {
    id: order.id,
    order_number: order.order_number,

    user: {
      id: order.user.id,
      name: order.user.name,
      email: order.user.email,
      role: order.user.role,
      status: order.user.status,
    },

    totalAmount: order.totalAmount,
    status: order.status,

    items: order.items.map((item) => ({
      id: item.id,

      product: {
        id: item.product.id,
        sku: item.product.sku,
        name: item.product.name,
        categoryId: item.product.categoryId,
        price: item.product.price,
        stock: item.product.stock,
        status: item.product.status,
      },

      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),

    notes: order.notes,
    createdAt: order.createdAt,
  };


  
}




}
