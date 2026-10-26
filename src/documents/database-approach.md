

## different types of databases approaches :

## Repository : 
> it is responsible for performing database operations for specific entity/table 

> it provides built-in-methods for standard CRUD operations 

- @InjectRepository(Product)
        private readonly productsRepositorty : Repository<Product>

## find() :
> finds all entities matching records 

# eg :
- const products = await this.productRepository.find();

> according to the SQL :

- SELECT * FROM products;
> mainly it is used to get all products , users,products etc..

## findOne():
> finds the one entity with complex options 

- Eg :
 const existingProduct = await this.productsRepositorty.findOne({
            where : { name }
        });

-   const product = await manager.findOne(Product, {
              where: { id: itemDto.productId },
              lock: { mode: 'pessimistic_write' },
            }); 

> in findOne method we use relations, seraching filtering , locks 
> it returns only the one entity 

## findOneBy() :
> finds the user with conditions like id, name, email 

- eg :
const user = await this.userRepository.findOneBy({
  email: 'anil@example.com',
});

## Create : 
> it creates entity object(doesn't save to database)

> it is an example for creating an entity object for product

## Eg:

- const product = this.productsRepositorty.create(createProductDto);

- const user = userRepository.create({ name: "Alice" })

## save() :
> saves the given entity to the database 
> here it inserts the entity object into the database 

> here inserted the product into the database 
- const savedProduct = await this.productsRepositorty.save(product);
- return savedProduct;

- const savedUser = await this.UsersRepository.save(user);
- return savedUser 

## update() :
> directly updates database fields

await this.productRepository.update(
  1,
  { stock: 15 },
); 

- SQl :
UPDATE products
SET stock = 15
WHERE id = 1;

> here we validates with business flow and rules validates with the DTO

- async updateProduct(id: number, updateProductDto: UpdateproductDto){
const product = await this.getProduct(id);

  Object.assign(product, updateProductDto);

  const updatedProduct = await this.productsRepositorty.save(product);

   return updatedProduct;
}

## delete():
> here we deletes an entity by id without loading the entity 

- eg :
await this.productRepository.delete(1);
- SQL :
DELETE FROM products
WHERE id = 1;

## remove() :
> removes an given entity from the database 
> it validates the business rules 
> here it follows the nest lifecycle hooks like After and before remove 

> with remove it also cascades the data 

async removeProduct(id : number){
        const product = await this.getProduct(id);

        await this.productsRepositorty.remove(product);
`
        return {
            message : 'product deleted successfully'
        };
    }

> here we load the entity 1st and then remove the entity 

> for simple crud operations we use the Repository method 


## transactions & locking another approach :

> A transaction groups multiple databases operations into one atomic unit either everything succeds or everything is rolled back 

> TypeORM handles the commit() and rollback()

> here the code complexity is lower 

>  best suited for normal business transactions

> here in it we use manager means EntityManager 
> the manager is the object TypeORm gives you to perform database operations with a particular transaction 

- eg :
await this.dataSource.transaction(async (manager) => {

  const order = manager.create(Order, {
    total: 1000,
  });

  await manager.save(order);

});

> here the manager provides TypeORM methods :

manager.find() : fetch records

manager.findOne() : fetch one record

manager.create() : creates an entity object

manager.save() : insert/ update entity into database

manager.update() : direct update

manager.delete() : direct delete

manager.remove() : remove an entity
manager.query() : execute the raw SQL 

Transaction
     │
     └── EntityManager
            │
            ├── Find product
            ├── Validate stock
            ├── Reduce stock
            └── Save product

> manager is useful when you need a perform a database operation without specifically injecting a repository

> working with multiple entities dynamically here manager provides the generic service 

> here it is the generic approach we can use with multiple entities 
async findById(
  entity: EntityTarget<any>,
  id: number,
) {
  return this.dataSource.manager.findOne(entity, {
    where: { id },
  });
}

- Eg :

- const user = await this.dataSource.manager.findOne(User, {
  where: { id: userId },
});

const orders = await this.dataSource.manager.find(Order, {
  where: {
    user: { id: userId },
  },
});

- await this.dataSource.transaction(
  async (manager) => {

    // Check product
    const product = await manager.findOne(Product, {
      where: { id: productId },
    });

    // Reduce stock
    product.stock -= quantity;

    await manager.save(product);

    // Create order
    await manager.save(order);

    // Create order item
    await manager.save(orderItem);
  },
);

> here we don't know wheather we are working with User, Product or Order 
> EntityManager is designed for kind of generic purpose 

> without a transaction :
Stock reduced ✓
Order created ✓
Order item failed ✗

DATABASE IS INCONSISTENT

> with a transaction :

Stock reduced ✓
Order created ✓
Order item failed ✗
       ↓
   ROLLBACK
       ↓
Everything is undone

> in transactions we use pessimistic_write 

## eg :

  async createOrder( 
    userId: number,
    createOrderDto: CreateOrderDto,
  ) {

    try {
      const result = await this.dataSource.transaction(
        async (manager) => {

          // 1. User Validation
          const user = await manager.findOne(User, {
            where: { id: userId },
          });

          if (!user) {
            throw new NotFoundException('User not found');
          }

          // 2. Order DTO Validation & Duplicate Checks

          const productIds = createOrderDto.items.map((item) => item.productId);
          const uniqueProductIds = new Set(productIds);

          if (uniqueProductIds.size !== productIds.length) {
            throw new BadRequestException(
              'Duplicate products are not allowed in the same order',
            );
          }

          const orderItems: OrderItem[] = [];
          let orderTotal = 0;

          // 3. Products & Stock Validation
          for (const itemDto of createOrderDto.items) {
        
            const product = await manager.findOne(Product, {
              where: { id: itemDto.productId },
              lock: { mode: 'pessimistic_write' },
            });

            if (!product) {
              throw new NotFoundException(`Product ${itemDto.productId} not found`);
            }

            if (product.status !== ProductStatus.ACTIVE) {
              throw new BadRequestException(`Product ${product.name} is currently inactive`);
            }
    
              throw new BadRequestException(
                `Insufficient stock for ${product.name}. Available stock: ${product.stock}, requested : ${itemDto.quantity}`,
              );
            }

            const price = Number(product.price);
            const itemTotal = price * itemDto.quantity;
            orderTotal += itemTotal;

            product.stock -= itemDto.quantity;


            // 4. OrderItems Validation & Instantiation

            const orderItem = manager.create(OrderItem, {
              product,
              quantity: itemDto.quantity,
              price,
            });

            orderItems.push(orderItem);
          }

          // 5. Final Order Entity Creation & PostgreSQL Persistence

          const order = manager.create(Order, {
            user,
            total: orderTotal,
            status: OrderStatus.PENDING,
            items: orderItems,
          });

          const savedOrder = await manager.save(Order, order);


          return manager.findOne(Order, {
            where: { id: savedOrder.id },
            relations: {
              user: true,
              items: { product: true },
            },
          });
        },
  }
)


## createQueryRunner() :

> when we need manual control over the transaction , connection , commits , rollbacks , locks or multiple SQL operations 

Create QueryRunner
       ↓
connect()
       ↓
startTransaction()
       ↓
perform DB operations
       ↓
   success?
   ↙      ↘
 YES       NO
 ↓         ↓
commit   rollback
 ↓         ↓
release() release()

## Eg :

const queryRunner = dataSource.createQueryRunner();

await queryRunner.connect();
await queryRunner.startTransaction();

try {
  const order = await queryRunner.manager.save(Order, orderData);

  await queryRunner.manager.save(OrderItem, itemData);

  await queryRunner.manager.decrement(
    Product,
    { id: productId },
    'stock',
    quantity,
  );

  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}

> we can use it when we need manual control over the database connection and transaction lifecycle 

## real time case : row locking / concurrency :
> this is one of the most important reasons you might reach for a queryRunner 

- imagine product has : Burger Stock = 1
> two customers places orders at almost exactly the same time 

Customer A → wants 1 Burger
Customer B → wants 1 Burger

> without appropriate concurrency control both requests might read :
- stock = 1
> and both could attempt to purchase it 

> in an advanced inventory system , you may need a transaction plus a pessimistic lock 

> we have the control over :
- when transaction starts
- whens locks required
- when transaction commits
- when it rollback
- when the connection is released 

> here the code complexity is higher 
> advanced db control


> the queryRunner has built in methods provided by TypeORm 

createQueryRunner()
       │
       ├── connect()
       ├── startTransaction()
       ├── manager
       ├── query()
       ├── commitTransaction()
       ├── rollbackTransaction()
       ├── release()
       │
       └── connection-related operations

## connect() :
> establishes the database connection 

const queryRunner = dataSource.createQueryRunner();

await queryRunner.connect(); 

## startTransaction() :
> here it starts a database transaction 

await queryRunner.startTransaction();

START TRANSACTION
       ↓
INSERT
UPDATE
DELETE
       ↓
COMMIT / ROLLBACK

## commitTranasction() :
> makes all changes in the transaction permanent 

await queryRunner.commitTransaction();

Create Order       ✓
Create OrderItem   ✓
Reduce Stock       ✓
       ↓
COMMIT
       ↓
Changes become permanent

## rollbackTransaction():
> undoes changes made during the current transaction 

await queryRunner.rollbackTransaction();

Create Order       ✓
Create OrderItem   ✓
Reduce Stock       ✗
       ↓
ROLLBACK
       ↓
Previous changes undone

## release() :
> releases the database connection back to the connection 
await queryRunner.release();

finally {
  await queryRunner.release();
}

createQueryRunner()
       ↓
connect()              ← manual
       ↓
startTransaction()     ← manual
       ↓
DB operations
       ↓
commitTransaction()    ← manual
       OR
rollbackTransaction()  ← manual
       ↓
release()              ← manual

> here we should call them manually 


## eg :

const queryRunner = dataSource.createQueryRunner();

await queryRunner.connect();
await queryRunner.startTransaction();

try {
  const product = await queryRunner.manager.findOne(Product, {
    where: { id: productId },
    lock: {
      mode: 'pessimistic_write',
    },
  });

  if (!product || product.stock < quantity) {
    throw new BadRequestException('Insufficient stock');
  }

  product.stock -= quantity;

  await queryRunner.manager.save(product);

  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}

> we can do multiple operations with one connection :

await queryRunner.startTransaction();

try {
  await queryRunner.manager.save(User, user);
  await queryRunner.manager.save(Order, order);
  await queryRunner.manager.save(OrderItem, item);

  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
} finally {
  await queryRunner.release();
}

## why should we use QuerryRunner :

> Explicit connection control 

> Explicit transaction lifecycle

> advanced locking + QueryRunner :

> suppose your product has :
Product
---------
id = 10
name = Chicken Biryani
stock = 1

> two customers send requests at almost same time 

Request A → Buy 1
Request B → Buy 1
> without proper locking , both requests could read 

stock = 1

const queryRunner = this.dataSource.createQueryRunner();

await queryRunner.connect();
await queryRunner.startTransaction();

try {
  const product = await queryRunner.manager.findOne(Product, {
    where: { id: productId },
    lock: {
      mode: 'pessimistic_write',
    },
  });

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  if (product.stock < quantity) {
    throw new BadRequestException('Insufficient stock');
  }

  product.stock -= quantity;

  await queryRunner.manager.save(product);

  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}

> RawSQL + transaction + connection control :

> here we need to postgresql specific operation that you don't want to express through repository methods 

const queryRunner = this.dataSource.createQueryRunner();

await queryRunner.connect();
await queryRunner.startTransaction();

try {
  const products = await queryRunner.query(
    `
    SELECT id, name, stock, price
    FROM products
    WHERE id = $1
    FOR UPDATE
    `,
    [productId],
  );

  if (products.length === 0) {
    throw new NotFoundException('Product not found');
  }

  const product = products[0];

  if (product.stock < quantity) {
    throw new BadRequestException('Insufficient stock');
  }

  await queryRunner.query(
    `
    UPDATE products
    SET stock = stock - $1
    WHERE id = $2
    `,
    [quantity, productId],
  );

  await queryRunner.query(
    `
    INSERT INTO orders (user_id, total, status)
    VALUES ($1, $2, $3)
    `,
    [userId, total, 'PENDING'],
  );

  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}

## query() :
> method is mainly used when you need to execute raw sql directly instead of using TypeORM repository method's or queryBuilder 

## why should we use query() :

> easier to express directly in SQL 

> an example for getting top 5 products based on total quantity sold 

const result = await this.orderItemRepository
  .createQueryBuilder('item')
  .innerJoin('item.product', 'product')
  .select('product.id', 'productId')
  .addSelect('product.name', 'productName')
  .addSelect('SUM(item.quantity)', 'totalSold')
  .groupBy('product.id')
  .addGroupBy('product.name')
  .orderBy('totalSold', 'DESC')
  .limit(5)
  .getRawMany();

> but the SQL itself is a quite straightforward 

SELECT
    p.id,
    p.name,
    SUM(oi.quantity) AS total_sold
FROM order_items oi
JOIN products p
    ON p.id = oi.product_id
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 5;

> some situations writing SQL directly is cleaner and easier 

## database features are database-specific :

> TypeORm supports different databases 

> here PostgresSQl has specific functions , CTEs, window funtions,JSON operations etc..

## complex reporting queries :

> suppose we want monthly sales , average, number of orders and total revenue 

SELECT
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS order_count,
    SUM(total) AS revenue,
    AVG(total) AS average_order_value
FROM orders
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

> here we can construct complex SQL through QueryBuilder but some times raw SQL is much easier 
