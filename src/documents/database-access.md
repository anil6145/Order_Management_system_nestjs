## dataSource and TypeORM database-access components :

## dataSource.getRepository() :
> it is responsible for performing database operations on this particular entity/table 

@Injectable()
export class ProductsService {

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    const productRepository =
      this.dataSource.getRepository(Product);

    return productRepository.find();
  }
}
> here we find the entity with get the Product entity and we perform TypeORM operations on it

## dataSource.transaction():
> is mainly used when multiple database operations must be treated as one unit 

await this.dataSource.transaction(
  async (manager) => {
    // database operations
  },
);

> run all the database operations together . if all succeed commit them , if any one fails rollback all of them 

## dataSource.createQueryRunner() :

createQueryRunner()
       ↓
   connect()
       ↓
startTransaction()
       ↓
 ┌───────────────────┐
 │ Reduce stock      │
 │ Create order      │
 │ Create orderItems │
 └───────────────────┘
       ↓
   Everything OK?
    /        \
  YES         NO
   ↓           ↓
COMMIT      ROLLBACK
   ↓           ↓
release()   release()

const queryRunner =
  this.dataSource.createQueryRunner();
> when you create it 
> the QueryRunner provides its own manager   
queryRunner.manager
> you must use that manager for the operations that must participate in that specific transaction 

await queryRunner.manager.save(order);
await queryRunner.manager.save(orderItem);

DataSource
    ↓
QueryRunner
    ↓
queryRunner.manager
    ↓
Database operations

## Note :

> Normal Crud --> we use repository 
await this.productRepository.save(product);

> for multiple operations --> we use dataSource.transaction() here it is the cleanner approach
await this.dataSource.transaction(async (manager) => {
  await manager.save(order);
  await manager.save(orderItem);
});

> advanced transaction control   --> we use querryRunner 
const queryRunner =
  this.dataSource.createQueryRunner();

> use it when you specifically need manual control over the transaction/connection 
- complex multi-step transactions
- multiple database operations where you need explicit transactions
- advanced connection level operations
- cases when you need to control exactly commit,rollback

## diff b/w dataSource.transaction() and createQueryRunner() :

## transaction :
> the transaction management is automatic 
> TypeOrm handles the commit() and rollback()
> TypeORM handles connection handling
> code complexity is lower
> best suited for normal business transactions 

await this.dataSource.transaction(async (manager) => {
  await manager.save(order);
  await manager.save(orderItem);
});

START
  ↓
Operations
  ↓
Success → COMMIT
Failure → ROLLBACK
  ↓
Connection cleanup

## createQueryRunner() :
> transaction management is manual
> you should call the commitTransaction() and rollbackTransaction()
> the connection handling is you should call the connect() / release()
> code complexity is higher
> more control 
> it is suitable for advanced/ manual transaction handling 

const queryRunner = this.dataSource.createQueryRunner();

await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.manager.save(order);
  await queryRunner.manager.save(orderItem);

  await queryRunner.commitTransaction();

} catch (error) {

  await queryRunner.rollbackTransaction();
  throw error;

} finally {

  await queryRunner.release();
}

createQueryRunner()
        ↓
connect()
        ↓
startTransaction()
        ↓
operations
        ↓
commitTransaction()
        OR
rollbackTransaction()
        ↓
release()

## dataSource.manager() :
> in TypeORM dataSource.manager is the default/global EntityManager provided by DataSource

- this.dataSource.manager
> it gives you an EntityManager that can directly perform database operations 
- eg :
const users = await this.dataSource.manager.find(User);

DataSource
    ↓
manager
    ↓
EntityManager
    ↓
Database operations
- we can use :
this.dataSource.manager.find()
this.dataSource.manager.findOne()
this.dataSource.manager.save()
this.dataSource.manager.update()
this.dataSource.manager.delete()

## where do we use it :
> it is useful when you need to perform a database operation without specifically injecting a repository 

@Injectable()
export class UsersService {

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async findUser(id: number) {

    return this.dataSource.manager.findOne(User, {
      where: { id },
    });

  }
}

> instead of :
this.userRepository.findOne(...)

> we can use :
this.dataSource.manager.findOne(User, ...)

> the main reason is that EntityManager provides a generic way to work with multiple entities 
- suppose one service needs to work with
User
Product
Order
OrderItem

> here we can use the same manager
const user = await this.dataSource.manager.findOne(User, ...);

const product = await this.dataSource.manager.findOne(Product, ...);

const order = await this.dataSource.manager.findOne(Order, ...);

> here we need seperate repository variables for every operation 

## dataSource.query() :
> as a way to execute raw sql directly against postgresql 

> instead of using TypeORM methods like:

- repository.find();
> we write the actual sql 

await this.dataSource.query(
  'SELECT * FROM products',
);

## where we use it :
> you need a postgreSQL specific feature 
>

### query() vs Repository :
- for eg getting products 

> Repository :
const products = await this.productRepository.find({
  where: {
    status: ProductStatus.ACTIVE,
  },
});

> Raw sql :
const products = await this.dataSource.query(`
  SELECT *
  FROM products
  WHERE status = 'ACTIVE'
`);

> dataSource.query() allows us to execute raw sql directly 
> i would use it when a query is complex , database -specific or easier to express in sql than through TypeORM's repository or QueryBuilder APIs  

### difference b/w the types of dataSource :

                    DataSource
                        │
        ┌───────────────┼────────────────┐
        ↓               ↓                ↓
 getRepository()   transaction()    createQueryRunner()
        │               │                │
     Normal CRUD    Multiple related   Manual/advanced
                    operations         transaction
        │
        ├── manager
        └── query()

## getRepository()  -- Normal Crud :
> use it when you're working with one entity and don't need multiple operations 

const productRepository =
  this.dataSource.getRepository(Product);

const products = await productRepository.find();
- or
@InjectRepository(Product)
private productRepository: Repository<Product>;

- then :
const product = await this.productRepository.findOne({
  where: { id },
});

> here Repository provides convenient entity-specific operations :

Product Repository
   ├── find()
   ├── findOne()
   ├── save()
   ├── update()
   ├── delete()
   └── remove()

## eg :

> creating a product 

const product = this.productRepository.create({
  name: 'Burger',
  price: 150,
  stock: 20,
});

await this.productRepository.save(product);

> here there is no need for a transaction it is a just independent product creation 

> here i use a Repository for normal entity-level CRUD operations because it provides a clean abstraction over the database

## real time : 
> use a Repository when your operation is primarilly CRUD for one entity and doesn't require several changes 

> create a product 
const product = this.productRepository.create({
  name: 'Burger',
  price: 150,
  stock: 20,
});

return this.productRepository.save(product);
> there is no complex multi-table business operation 

## update user profile :
await this.userRepository.update(
  userId,
  {
    name: 'Anil',
  },
);
> again simple entity-level crud 

## delete a product :
await this.productRepository.delete(productId);
> simple operation 


### transaction() :
> this is specially important in order module 
> we use it one business operation involves multiple database changes 

Create Order
   ↓
Check stock
   ↓
Reduce stock
   ↓
Create Order
   ↓  
Create Order Items

> these should behave as one unit 

await this.dataSource.transaction(
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

- why :

Reduce stock       → SUCCESS
Create order       → SUCCESS
Create order item  → FAILED
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

> i use a transaction when multiple database operations from one business operation 
> either all changes are committed or all changes are rolled back 

## real time User registration + profile :
- suppose registration creates 
users
profiles

> if the user is created but the profile fails:
users    → ROLLBACK
profiles → ROLLBACK

## cancel order + restore stock :

Order status:
CONFIRMED → CANCELLED

1. Change order status
2. Restore product stock

> a transaction gives you automicity 

START
  ↓
callback(manager)
  ↓
SUCCESS → COMMIT
ERROR   → ROLLBACK

### createQueryRunner() :
> manual transaction control over 
> query runner is useful when you need control over:
- database connection
- transaction
- commit
- rollback
- multiple database operations 

const queryRunner =
  this.dataSource.createQueryRunner();

await queryRunner.connect();

await queryRunner.startTransaction();

try {

  await queryRunner.manager.save(order);

  await queryRunner.manager.save(orderItem);

  await queryRunner.commitTransaction();

} catch (error) {

  await queryRunner.rollbackTransaction();

} finally {

  await queryRunner.release();
}

createQueryRunner()
       ↓
connect()
       ↓
startTransaction()
       ↓
DB operations
       ↓
commitTransaction()
       OR
rollbackTransaction()
       ↓
release()

> use it when you need manual control over the database connection/transaction lifecycle 

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
  
> A Query gives you explicit control :

- eg :

const queryRunner =
  this.dataSource.createQueryRunner();

await queryRunner.connect();
await queryRunner.startTransaction();

try {
  const product = await queryRunner.manager
    .getRepository(Product)
    .createQueryBuilder('product')
    .setLock('pessimistic_write')
    .where('product.id = :id', { id: productId })
    .getOne();

  // validate stock
  // update stock
  // create order

  await queryRunner.commitTransaction();

} catch (error) {
  await queryRunner.rollbackTransaction();
} finally {
  await queryRunner.release();
}

Transaction
      +
Database locking
      +
Explicit connection control
      ↓
QueryRunner can be useful

> you should not automatically use QuerryRunner for every stock update use it when the application's concurrency requirements 

##  real time case : multiple steps requiring manual control :

Create payment
      ↓
Lock account
      ↓
Debit account
      ↓
Create ledger entry
      ↓
Update transaction status
      ↓
Commit

> you may need explicit control over :
- when the transaction starts
- which connection executes the work
- when locks are required
- when the transaction commits
- when it rollsback
- when the connection is released 

> that's where QueryRunner becomes useful 

## dataSource.manager  -- generalEntityManager :
> manager lets you perform database operations without getting a specific repository 
> database manager so it can work with different entities without getting a specific repository

# working with multiple entities dynamically :
> suppose you have a generic service that works with different entities 

async findById(
  entity: EntityTarget<any>,
  id: number,
) {
  return this.dataSource.manager.findOne(entity, {
    where: { id },
  });
}
> here we don't know wheather you're working with User,Product or Order 

> so repository such as 
userRepository
productRepository
orderRepository
is less convienient 

> EntityManager is designed for this kind of generic access 

## shared / general database operations:

const user = await this.dataSource.manager.findOne(User, {
  where: { id: userId },
});

const orders = await this.dataSource.manager.find(Order, {
  where: {
    user: { id: userId },
  },
});
> an internal service that performs operations across several entities 

EntityManager
    ├── User
    ├── Order
    ├── Product
    └── OrderItem

> here we can use the same manager for entities 
> this is useful for generic infrastructure 

## the most important real - time case : Transactions 
> this is where manager becomes very important 

## generic database utility :

dataSource.manager.findOne(entity, ...)
> because the code may work with different entities dynamically

> EntityManager is a general purpose database and is useful when working across different entities or building generic database logic 

> for normal entity-specific crud i prefer Repository because it provides clearer amd more focoused API 

> for multi-step operations like order creation i use transaction specific EntityManager so all operations participate in the same transaction 

const users =
  await this.dataSource.manager.find(User);

- u can use :

await this.dataSource.manager.save(user);

await this.dataSource.manager.update(
  User,
  userId,
  { name: 'Anil' },
);

> for general entity operations when uou don't need specifically need a repository 
- use :
await manager.save(order);

- rather than 

await this.dataSource.manager.save(order);

### query() :
> database - specific SQL :
- you're using PostGreSQL and need a PostGreSQL specific feature 

const result = await this.dataSource.query(`
  SELECT *
  FROM products
  WHERE stock > 0
  FOR UPDATE
`);

> raw sql can be clearer than trying to express everything through TypeORM 

> complex reporting queries :
- if manager asks give me the total sales for every product including quantity sold and revenue 

const report = await this.dataSource.query(`
  SELECT
    p.id,
    p.name,
    SUM(oi.quantity) AS total_quantity,
    SUM(oi.quantity * oi.price) AS total_revenue
  FROM products p
  JOIN order_items oi
    ON oi.product_id = p.id
  GROUP BY p.id, p.name
  ORDER BY total_revenue DESC
`);

> this is the reporting/read query not normal CRUD 

# calling a database function / procedure :
> suppose database has a function :
calculate_product_revenue(product_id)

> here we can call it 
const result = await this.dataSource.query(
  `SELECT calculate_product_revenue($1)`,
  [productId],
);
> here we can use the database it already contains important logic in functions/procedures 


