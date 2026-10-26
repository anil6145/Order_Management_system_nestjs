### QueryBuilder : 
> is a TypeORM API that lets you build SQL queries programmatically 

> instead of writing raw SQL :
SELECT *
FROM products
WHERE price > 500
ORDER BY price DESC;

> we can write :
const products = await this.productRepository
  .createQueryBuilder('product')
  .where('product.price > :price', { price: 500 })
  .orderBy('product.price', 'DESC')
  .getMany();

 > QueryBuilder is a way to construct complex SQL queries using TypeORM 

## where do we use it :
> Dynamic filtering
> searching
> Sorting
> Pagination
> Joins
> Aggregations
> Group by 
> having
> Complex conditions
> conditional queries   

## real time example from your project :
> suppose you API is

GET /products?search=biryani&page=1&limit=10&sortBy=price&sortOrder=DESC

> here you need to dynamically build :
Search
   +
Pagination
   +
Sorting
   +
Filtering

> QueryBuilder is a good fit :
const query = this.productRepository
  .createQueryBuilder('product');

if (search) {
  query.andWhere(
    'product.name ILIKE :search',
    { search: `%${search}%` },
  );
}

query
  .orderBy(`product.${sortBy}`, sortOrder)
  .skip((page - 1) * limit)
  .take(limit);

const [products, total] =
  await query.getManyAndCount();


createQueryBuilder()
        ↓
Start building query
        ↓
andWhere()
        ↓
Add search condition
        ↓
orderBy()
        ↓
Add sorting
        ↓
skip() + take()
        ↓
Add pagination
        ↓
getManyAndCount()
        ↓
Execute SQL

> this is much easier than creating seperate hardcoded SQL queries for every possible combination 

## why not use find():

const products = await this.productRepository.find({
  where: {
    status: ProductStatus.ACTIVE,
  },
  order: {
    price: 'DESC',
  },
  skip: 0,
  take: 10,
});

> this is perfectly good for simple queries

> but if your requirements become :

Search by name
        +
Search description
        +
Filter status
        +
Price range
        +
Stock range
        +
Dynamic sorting
        +
Pagination
        +
Join order items

> the repository find() options can become difficult to manage 
> that's why QueryBuilder becomes useful 

## another real-time example : JOIN :

> suppose you want get orders with their user and orderitems/products 

> you could use relations with find():

const orders = await this.orderRepository.find({
  relations: {
    user: true,
    items: {
      product: true,
    },
  },
});

> with QueryBuilder :

const orders = await this.orderRepository
  .createQueryBuilder('order')
  .leftJoinAndSelect('order.user', 'user')
  .leftJoinAndSelect('order.items', 'item')
  .leftJoinAndSelect('item.product', 'product')
  .getMany();

> this gives you more control over the SQL and joins 

## another real-time example : Aggregation :

> suppose manager asks show me how many items of each product have been sold 

> then the aggregation query :

const result = await this.orderItemRepository
  .createQueryBuilder('item')
  .select('item.productId', 'productId')
  .addSelect('SUM(item.quantity)', 'totalSold')
  .groupBy('item.productId')
  .getRawMany();

> conceptually : 

SELECT
    product_id,
    SUM(quantity) AS totalSold
FROM order_items
GROUP BY product_id;

> this is situation where QueryBuilder is very useful 

### another approaches :

## repository.find()  --> simple data retrieval

const products = await this.productRepository.find();

> use when 
- you simply want records
- conditions are simple
- no complicated joins or calculations 

const product = await this.productRepository.findOne({
  where: { id: 10 },
});
> for straightforward CRUD and simple retrival i prefer repository methods 

## find() options   --> simple-to- moderate filtering :

const products = await this.productRepository.find({
  where: {
    status: ProductStatus.ACTIVE,
  },
  order: {
    price: 'DESC',
  },
  skip: 0,
  take: 10,
});

> used when :
- filtering
- sorting
- basic pagination
- loading known relations

GET /products?status=ACTIVE&page=1&limit=10
> the typeorm already provides these features through find() options 


## QueryBuilder -  complex or dynamic queries  :

const query = this.productRepository
  .createQueryBuilder('product');

if (search) {
  query.andWhere(
    'product.name ILIKE :search',
    { search: `%${search}%` },
  );

if (minPrice) {
  query.andWhere(
    'product.price >= :minPrice',
    { minPrice },
  );
}

query
  .orderBy('product.price', 'DESC')
  .skip(0)
  .take(10);

const products = await query.getMany();

> used when :
- many optional filters
- dynamic conditions
- complex joins
- group by
- aggregations
- complex sorting
- complex pagination
- queries that become difficult with find()

> real time example 

GET /products
    ?search=biryani
    &status=ACTIVE
    &minPrice=200
    &maxPrice=500
    &sortBy=price
    &sortOrder=DESC
    &page=1
    &limit=10

> this is a good QueryBuilder use case because the query changes based on which parameters the user sends 

## dataSource.query()  :

const result = await this.dataSource.query(
  `
  SELECT product_id, SUM(quantity) AS total_sold
  FROM order_items
  GROUP BY product_id
  `,
);

> used when :
- you specifically need raw SQL 
> PostgreSQL specific features are required
- A very specialized SQL query is easier to write directly
- you need database - specific optimization/control 

await this.dataSource.query(
  `SELECT * FROM products WHERE price > $1`,
  [500],
);

> i use raw SQL only when TypeORM repository or QueryBuilder doesn't provide a clean solution or when a database specific query is required 


### QueryBuilder and its types :

## createQueryBuilder()  -- 
> start building the query 

const query = this.productRepository
  .createQueryBuilder('product');

> 'product' is an alias for the products table 
> the alias is mainly used to give a short,clear name to a table/entity inside a query 

 # to refernce the table easily :
> without an alias , a query can become harder to read 

> with an alias :
const products = await this.productRepository
  .createQueryBuilder('product')
  .where('product.price > :price', { price: 500 })
  .orderBy('product.price', 'DESC')
  .getMany();

> we can say clearly :
  product.price
product.name
product.stock
product.status

products table
      ↓
 alias: product
      ↓
product.price
product.name
product.stock

> alias become very important with joins :
const orders = await this.orderRepository
  .createQueryBuilder('order')
  .leftJoinAndSelect('order.user', 'user')
  .leftJoinAndSelect('order.items', 'item')
  .leftJoinAndSelect('item.product', 'product')
  .getMany();

> here we have multiple aliases :

order   → orders
user    → users
item    → order_items
product → products

> so here we can write 

.where('order.status = :status', ...)
.andWhere('user.name = :name', ...)
.andWhere('product.price > :price', ...)  
> here this makes which table each colum belongs to 

## imagine :
> imagine both users and orders have a column called id 

- if we write where id = 10
> the database may not know which id you mean 

- instead 
.where('order.id = :id', { id: 10 })
> here we can say clearly the id belongs to the orders table 

user.id
product.id
item.id

## alias doesn't rename your database table :

.createQueryBuilder('product')
> here it doesnt mean your database table has renamed from products to product 

> here it says for this query i'll refer to this table/entity as product 

- conceptually :
FROM products product

## where() 
> is used to specify the filtering condition for the records you want to retrieve,update or delete 
> where is used to filter the rows 

- const users = await this.userRepository
  .createQueryBuilder('user')
  .where('user.role = :role', { role: 'USER' })
  .getMany();

- .where('user.role = :role', { role: 'USER' })
> it is prefferd over the result is 

- .where(`user.role = 'USER'`)

> :role is a parameter placeholder 
> TypeOrm safely binds the value 

{ role: 'USER' }
> this helps prevent SQL injection and makes the query reusable 

## here we have some of types of where :

## .andWhere()  --> adds AND condition 
- .where('order.user_id = :userId', { userId })
.andWhere('order.status = :status', { status })
> it means 
- user_id = 2 AND status = PENDING

- const products = await this.productRepository
  .createQueryBuilder('product')
  .where('product.price > :minPrice', {
    minPrice: 200,
  })
  .andWhere('product.stock > :stock', {
    stock: 0,
  })
  .getMany();

- WHERE price > 200
AND stock > 0  
> here give me the products costing more than 200 and currently in stock 

## .orWhere()   --> adds OR condition :
- .where('order.status = :pending', { pending: 'PENDING' })
.orWhere('order.status = :confirmed', { confirmed: 'CONFIRMED' })
> it means :
status = PENDING OR status = CONFIRMED


## left join() :
> joins another table , but does not automatically return the joined entity's columns 

- const orders = await this.orderRepository
  .createQueryBuilder('order')
  .leftJoin('order.user', 'user')
  .where('user.id = :userId', { userId })
  .getMany();

- here :

  Order
  |
  | LEFT JOIN
  ↓
User

SELECT order.*
FROM orders order
LEFT JOIN users user
    ON user.id = order.user_id
WHERE user.id = 2;

> here the result primarily contains Order entities not the complete User entity 

## leftJoinSelect() :
> here this does two things 
- performs the left join
- selects the joined data 

- const orders = await this.orderRepository
  .createQueryBuilder('order')
  .leftJoinAndSelect('order.user', 'user')
  .getMany();

- now the result look like :

[
  {
    "id": 10,
    "status": "PENDING",
    "total": 500,
    "user": {
      "id": 2,
      "name": "Ajay",
      "email": "ajay@example.com"
    }
  }
]

# why left join :
> left join keeps the records from the left table even when there is no matching record on the right table 

## for example :

Orders

id    user_id
1     2
2     3
3     NULL

Users

id    name
2     Ajay
3     Sunil

- .leftJoinAndSelect('order.user', 'user')
> you will get the data 

Order 1 → Ajay
Order 2 → Sunil
Order 3 → null


> get all orders with the user information and ordered products 

- Order
 ├── User
 └── OrderItems
       └── Product

- const orders = await this.orderRepository
  .createQueryBuilder('order')
  .leftJoinAndSelect('order.user', 'user')
  .leftJoinAndSelect('order.items', 'item')
  .leftJoinAndSelect('item.product', 'product')
  .getMany();  
     
- the result is :

[
  {
    "id": 1,
    "status": "PENDING",
    "user": {
      "id": 2,
      "name": "Ajay"
    },
    "items": [
      {
        "id": 1,
        "quantity": 2,
        "product": {
          "id": 1,
          "name": "Chicken Biryani",
          "price": 250
        }
      }
    ]
  }
]   

> if you need to filter orders by the user 
.leftJoin('order.user', 'user')
.where('user.id = :userId', { userId })
- .leftJoin() is enough

> if you need to return the user information 

.leftJoinAndSelect('order.user', 'user')
- use leftJoinAndSelect()

Need relation only for filtering?
        ↓
   leftJoin()

Need relation data in response?
        ↓
   leftJoinAndSelect()

## diff b/w leftjoin() and leftjoinselect() :

## leftJoin() :
> when you need the relationship for querying, filtering,sorting or apply conditions but you don't need the joined entity in the returned result 

- filtering 
.leftJoin('order.user', 'user')
.where('user.id = :userId', { userId })

- sorting 
.leftJoin('order.user', 'user')
.orderBy('user.name', 'ASC')

- checkind conditions
.leftJoin('order.items', 'item')
.where('item.product_id = :productId', { productId })

## select :
> is used to choose exactly which columns you want to retrieve from the database 

- a User table contains :
id | name | email | password | role

const users = await this.userRepository
  .createQueryBuilder('user')
  .select([
    'user.id',
    'user.name',
    'user.email',
  ])
  .getMany();

> should not return sensitive fields such as passwords 
> a table contains many columns only what you need reduces unnecessary data retrieval 

- select with leftjoin :

const users = await this.userRepository
  .createQueryBuilder('user')
  .leftJoin('user.orders', 'order')
  .select([
    'user.id',
    'user.name',
    'user.email',
  ])
  .getMany();

> here leftJoin()  --> connects users with orders
> select()  --> controls which columns returned
> getMany()  --> executes the query   

## addSelect() :
> i already have a query but i want to add add one or more specific columns to the select part of that query 

> it is mainly used with QueryBuilder when you need more control over what data is returned 

- eg :
const users = await this.userRepository
  .createQueryBuilder('user')
  .select(['user.id', 'user.name'])
  .addSelect('user.email')
  .getMany();

- the generated SQL is 
SELECT
    user.id,
    user.name,
    user.email
FROM users user;

# where we use it :
> suppose you want products and their discounted prices 

const products = await this.productRepository
  .createQueryBuilder('product')
  .select([
    'product.id',
    'product.name',
    'product.price',
  ])
  .addSelect('product.price * 0.9', 'discountedPrice')
  .getRawMany();

SELECT
    product.id,
    product.name,
    product.price,
    product.price * 0.9 AS discountedPrice
FROM products product;

## OrderBy() :
> used with QueryBuilder to control the sorting order of records returned from the database   

queryBuilder
  .orderBy('product.price', 'ASC')
  .getMany();

> in what order should the database return these records   

- eg :

const query = this.productRepository
  .createQueryBuilder('product')
  .where('product.name ILIKE :search', {
    search: `%${search}%`,
  })
  .orderBy(`product.${sortBy}`, sortOrder)
  .skip((page - 1) * limit)
  .take(limit);

const products = await query.getMany();

GET /products?page=1&limit=10&sortBy=price&sortOrder=DESC

SELECT *
FROM products
WHERE name ILIKE '%biryani%'
ORDER BY price DESC
LIMIT 10
OFFSET 0;

## skip() and take() :

> skip(n)  --> skips the first n records
> take(n)  --> returns the next n records 

> skip is similar like offset
> take is similar like limit 

const products = await this.productRepository
  .createQueryBuilder('product')
  .skip(10)
  .take(5)
  .getMany();

- SQL becomes :

SELECT *
FROM products
OFFSET 10
LIMIT 5;

Records:
1  2  3  4  5  6  7  8  9  10  11  12  13  14  15

skip(10)
↓
Skip: 1-10

take(5)
↓
Return: 11-15

## real pagination :
> suppose API supports 

- GET /products?page=3&limit=10

Page 1 → records 1-10
Page 2 → records 11-20
Page 3 → records 21-30

- the formula is 
const skip = (page - 1) * limit;
- then :

const products = await this.productRepository
  .createQueryBuilder('product')
  .skip(skip)
  .take(limit)
  .getMany();

- here for page 3 :

page = 3
limit = 10

skip = (3 - 1) * 10
     = 20

- so :
.skip(20)
.take(10)

- it returns :
21 -> 30

async findAll(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [orders, total] = await this.orderRepository
    .createQueryBuilder('order')
    .leftJoinAndSelect('order.user', 'user')
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  return {
    data: orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

- total = 47;   --> total orders in database
- limit = 10;   --> 10 orders per page 

> Math.ceil() is js built in functions that rounds a number up to the next whole number 

Math.ceil(4.1);  // 5
Math.ceil(4.5);  // 5
Math.ceil(4.9);  // 5
Math.ceil(5);    // 5

## getMany() :
> is used with QueryBuilder when you want to execute a select query and get multiple records as entity objects 

- example :
const products = await this.productRepository
  .createQueryBuilder('product')
  .where('product.stock > :stock', { stock: 0 })
  .getMany();

- SQL :
  SELECT *
FROM products product
WHERE product.stock > 0;

> getMany() executes the query and returns all matching products 


## getOne() :
> when you want to fetch one entity record 
- eg :
const product = await this.productRepository
  .createQueryBuilder('product')
  .where('product.id = :id', { id: 1 })
  .getOne();

 - if id=1 exists we get :

{
  id: 1,
  name: 'Chicken Biryani',
  price: 250,
  stock: 18
}
> if no product matches it returns 
- null

## getManyAndCount() :
> it is mainly used for pagination because it gives you both the records and the total number of matching records in one call 

- eg :
const [orders, total] = await queryBuilder.getManyAndCount();

- it returns :
[
  orders, // actual records for the current page
  total   // total matching records
]
- eg:
orders = [Order 1, Order 2, Order 3]
total  = 25

# real time example :
- GET /orders?page=1&limit=10

const [orders, total] = await this.orderRepository
  .createQueryBuilder('order')
  .leftJoinAndSelect('order.items', 'item')
  .skip((page - 1) * limit)
  .take(limit)
  .getManyAndCount();

 - if here the database has 47 orders

- orders.length = 10
total = 47

> the API returns :

{
  "data": [
    "...10 orders..."
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47,
    "totalPages": 5
  }
}

### her comparison :

> geOne()   --> get One record   --> it returns entity/undefined
> getMany()  --> get multiple records  --> entity[]
> getCount() --> get only count  --> number
> getManyAndCount()  --> get records + total count --[entity[],number]

## i can use getMany() and getCount() seperately :
> getManyAndCount() is mainly used for pagination because it gives you both records and the total number of matching records in one call

## using getMany() + getCount() :

- const orders = await queryBuilder
  .skip(skip)
  .take(limit)
  .getMany();

const total = await queryBuilder.getCount();

- here we would get :
orders --> current page records
total --> total matcjing records 

- actually :
orders = 10 orders
total  = 47

## here but the difference is :
> with seperate calls to execute two operations :

1. getMany()
      ↓
   Fetch records

2. getCount()
      ↓
   Count matching records


## groupBy() :
> is mainly used when you want to combine rows into groups and calculate aggregate values such as count(), sum(), avg(),min() and max()

- the typeorm QueryBuilder :
const result = await this.orderRepository
  .createQueryBuilder('order')
  .select('order.user_id', 'userId')
  .addSelect('COUNT(order.id)', 'orderCount')
  .groupBy('order.user_id')
  .getRawMany();

- the raw sql :
SELECT user_id, COUNT(*) AS order_count
FROM orders
GROUP BY user_id;

- then the result is :  
[
  {
    "userId": 101,
    "orderCount": "2"
  },
  {
    "userId": 102,
    "orderCount": "2"
  },
  {
    "userId": 103,
    "orderCount": "1"
  }
]

## another example :
> show me how much each user has spent 

- the TypeORM :
const result = await this.orderRepository
  .createQueryBuilder('order')
  .select('order.user_id', 'userId')
  .addSelect('SUM(order.total)', 'totalSpent')
  .groupBy('order.user_id')
  .getRawMany();

- the SQL :

SELECT
    user_id,
    SUM(total) AS total_spent
FROM orders
GROUP BY user_id;

- result :
user 101 → 800
user 102 → 900
user 103 → 400

## having() :
> it is used to filter grouped/aggregated results after group by 

- where is used filter individual rows before grouping
- having is used ti filter groups after grouping
- group by > creates geoups 

SELECT
    user_id,
    SUM(amount) AS total_amount
FROM orders
GROUP BY user_id
HAVING SUM(amount) > 1000;

## setParameter() :
> it is used to safely pass dynamic values into a SQL query 

const products = await this.productRepository
  .createQueryBuilder('product')
  .where('product.price > :minPrice')
  .setParameter('minPrice', 500)
  .getMany();

- minPrice : is a placeholder
- .setParameter('minPrice',100)  --> is provides the actual value 

## why we use :

> Dynamic values :
.setParameter('status', 'ACTIVE')
> here the value can come from DTO, query paramter etc..

## setParameter() :
> for multiple values 
- instead of
.setParameter('status', 'PENDING')
.setParameter('userId', 2)

- you can write :
.setParameters({
  status: 'PENDING',
  userId: 2,
})

- example :
const orders = await this.orderRepository
  .createQueryBuilder('order')
  .where('order.status = :status')
  .andWhere('order.user_id = :userId')
  .setParameters({
    status: 'PENDING',
    userId: 2,
  })
  .getMany();

## delete() & update() :
> are the direct database operations 

## delete() :
> delete removes records directly from the database based on the condition 

- await this.productRepository.delete(5);

- the sql is :
DELETE FROM products
WHERE id = 5;

> here we can also use conditions :
- await this.productRepository.delete({
  status: ProductStatus.ACTIVE,
});
> this deletes all active products 

## update() :
> directly changes specific columns in the database 

await this.productRepository.update(
  5,
  {
    price: 300,
    stock: 20,
  },
);

- the sql is :
UPDATE products
SET price = 300,
    stock = 20
WHERE id = 5;

> here we can use also in the conditions :
- await this.productRepository.update(
  { status: ProductStatus.ACTIVE },
  { stock: 50 },
);
> this updates the stock of all active products 

## pessimistic_write :

lock: {
  mode: 'pessimistic_write',
}
> this is especially when multiple users can place orders at the same time 

> without a lock :

User A                    User B
  │                         │
  ├── Read stock = 1        │
  │                         ├── Read stock = 1
  │                         │
  ├── Buy 1                 │
  │                         ├── Buy 1
  │                         │
  ├── Stock = 0             │
  │                         ├── Stock = 0

> here both requests can see stock = 1
> here accidententally create two orders for one available item 

## with lock :

const product = await manager.findOne(Product, {
  where: { id: productId },
  lock: {
    mode: 'pessimistic_write',
  },
});

> here we can lock the product row while processing the order

- the flow becomes :
User A
  │
  ├── Lock Product Row
  │
  ├── Read stock = 1
  │
  ├── Reduce stock
  │
  ├── Save
  │
  └── COMMIT
          │
          ↓
      Lock released
          │
          ↓
User B can access row
          │
          └── sees stock = 0


## the different lock modes :
> pessimistic_write :

lock: {
  mode: 'pessimistic_write',
}

> lock the selected rows so another transaction cannot modify them until you transactions 

Transaction A
    ↓
Lock row
    ↓
Read + modify
    ↓
Commit
    ↓
Unlock

## pessimistic_read :

lock: {
  mode: 'pessimistic_read',
}
> i need to read this row consistently while another transaction should not modify it in a conflicting way

