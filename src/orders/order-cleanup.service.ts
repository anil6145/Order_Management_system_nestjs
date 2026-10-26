import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { DataSource } from "typeorm";
import { Order } from "./entities/order.entity";
import { OrderStatus } from "./enums/order-status.enum";
import { User } from "../users/entities/user.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Product } from "../products/entities/product.entity";
import { StockMovement } from "../products/entities/stock-movement.entity";
import { OrderStatusHistory } from "./entities/order-status-history.entity";

@Injectable()
export class OrderCleanupService {
    private readonly logger = new Logger(OrderCleanupService.name)

    constructor(
        private readonly dataSource : DataSource,
        private readonly configService : ConfigService
    ){}

    // runs every time
    @Cron('0 * * * * *')
    async cancelSateOrders(): Promise<void> {
         this.logger.log('Stale-order cleanup job started');

        try {
            const cancelledCount = await this.dataSource.transaction(
                async(manager) => {
                    const orderRepository = manager.getRepository(Order)

                    // select old PENDING orders and lock them
                    // Another worker skips rows already locked 

                    const staleOrders = await orderRepository
                    .createQueryBuilder('order')
                    .where('order.status = :status', {
                        status : OrderStatus.PENDING,
                    })
                    .andWhere(
                        "order.createdAt <= NOW() - INTERVAL '30 minutes'"
                    )
                    .orderBy('order.createdAt', 'ASC')
                    .addOrderBy('order.id','ASC')
                    .take(50)
                    .setLock('pessimistic_write')
                    .setOnLocked('skip_locked')
                    .getMany();

                    if(staleOrders.length === 0) {
                        return 0
                    }

                    // This must be an existing dedicated system user
                    // StockMovement requires a user relationship in this project

                    const systemUserId = this.configService.getOrThrow<string>(
                        'AUTO_CANCEL_SYSTEM_USER_ID',
                    );

                    const systemUser = await manager
                    .getRepository(User)
                    .findOneBy({id : systemUserId});

                    if(!systemUser) {
                        throw new Error('Configured auto-cancel system user was not found');
                    }

                    for (const order of staleOrders) {
                        // Read all items belonging to this order

                        const items = await manager.getRepository(OrderItem)
                        .find({
                            where : {
                                order : {id : order.id}
                            },
                            relations : {
                                product : true
                            }
                        });

                        // Lock products in a consistent order to reduce 
                        // the chance of deadlocks between concurrent jobs

                        items.sort((a,b) => a.product.id.localeCompare(b.product.id));

                        for(const item of items) {
                            const product = await manager.getRepository(Product)
                            .createQueryBuilder('product')
                            .setLock('pessimistic_write')
                            .where('product.id = :id', {
                                id : item.product.id,
                            })
                            .getOne();

                            if(!product) {
                                throw new Error(
                                    `Product ${item.product.id} not found`
                                )
                            }

                            // Restore the stock reserved by this order
                            product.stock += item.quantity;

                            await manager
                            .getRepository(Product)
                            .save(product);

                            // Record the stock restoration 

                            const movement = manager
                            .getRepository(StockMovement)
                            .create({
                                product,
                                change : item.quantity,
                                reason : 'Stock restored from stale order cancellation',
                                referenceType : 'ORDER',
                                referenceId : order.id,
                                user : systemUser,
                            });

                            await manager
                            .getRepository(StockMovement)
                            .save(movement)
                        }

                        // Update the order status 
                        order.status = OrderStatus.CANCELLED;

                        await orderRepository.save(order);

                        // Record the status transition

                        const history = manager
                        .getRepository(OrderStatusHistory)
                        .create({
                            order,
                            fromStatus : OrderStatus.PENDING,
                            toStatus : OrderStatus.CANCELLED,
                            reason : 'Automatically cancelled after 30 minutes',
                            changedBy : null
                        });

                        await manager
                        .getRepository(OrderStatusHistory)
                        .save(history)
                    }

                    return staleOrders.length;
                }
            );

            
            if (cancelledCount > 0) {
                this.logger.log(
                    `Automatically cancelled ${cancelledCount} stale orders`,
                );
            }
        } catch (error) {
            this.logger.error(
                'Failed to cancel stale orders',
                error instanceof Error
                    ? error.stack
                    : String(error),
            );
        }
    }
}
