
- @ManyToOne('User', (user: User) => user.orders, {
    nullable: false,
  })

> here many orders can belong to one user 

- eg :

User: Ajay

Order 1
Order 2
Order 3
> here all the orders belong to ajay

- nullable: false
> an order cannot exist without a user 
orders

id | user_id
---|--------
1  | 5       ✅
2  | 7       ✅
3  | NULL    ❌

## @JoinColumn() :

- @JoinColumn({ name: 'user_id' })
this tells the TypeORM that the foreign-key column should be called as user_id

orders
--------------------------------
id
user_id
total
status
created_at
updated_at
> so here user_id is the foreign key 

- user!: User;
> it is the entity relationship property 
> here ! it is an definite assignment assertion 
> here it says don't complain about initialization i know this property will be assigned later 

- @ManyToOne('User', (user: User) => user.orders, {
  nullable: false,
})
@JoinColumn({ name: 'user_id' })
user!: User;
> 'User' the entity name is string 

- (user: User) => user.orders
> this approach is useful when to avoid a runtime import of User , particularly with circular dependency concern 

## another approach :

- @ManyToOne(() => User, (user) => user.orders, {
  nullable: false,
})
@JoinColumn({ name: 'user_id' })
user!: User;

- () => User 
> here it is a function that returns the actual User class  
> here it provides a direct reference to the User entity class and it is a standard TypeORM relation pattern

> 'User' here it is used when i want to avoid runtime entity import 

- @OneToMany(
  () => OrderItem,
  (orderItem) => orderItem.order,
  {
    cascade: true,
  },
)
items: OrderItem[];
> One order can contain multiple order items 
Order #10

items:               
 ├── Biryani × 2
 ├── Pizza × 1
 └── Coke × 3

 Order
  │
  ├── OrderItem
  ├── OrderItem
  └── OrderItem

- cascade: true
> tells TypeORM to automatically apply certain operations on a related entity when the parent is saved or removed 

> here Order is the parent and OrderItem is the related entity 

> if here we use cascade : true 
> when we save the Order 
await orderRepository.save(order);
> TypeORM can automatically save the related OrderItem record too 

Save Order
   ↓
TypeORM sees OrderItems
   ↓
Save OrderItems automatically

- here we don't necessarily need :
await orderRepository.save(orderItem1);
await orderRepository.save(orderItem2);
await orderRepository.save(order);

## scenarios :

- cascade : true

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items: OrderItem[];
}
- if i want to create 

const item = new OrderItem();
item.quantity = 2;

const order = new Order();
order.items = [item];

await orderRepository.save(order);
- 
save(order)
    ↓
Order is saved
    ↓
OrderItem is also saved automatically
> here we don't need to seperatelly call the 
await orderItemRepository.save(item);

- cascade : false :

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: false,
  })
  items: OrderItem[];
}

const item = new OrderItem();
item.quantity = 2;

const order = new Order();
order.items = [item];

await orderRepository.save(order);

- the only order is saved :

save(order)
    ↓
Order is saved
    ↓
OrderItem is NOT automatically saved

> here we have to save the item 

save(order)
    ↓
Order is saved
    ↓
OrderItem is NOT automatically saved

cascade: true
Parent saved → Child can be saved automatically

cascade: false
Parent saved → Child must be saved manually


orderRepository.save(order)
        ↓
TypeORM saves Order
        ↓
TypeORM sees order.items
        ↓
cascade: true
        ↓
TypeORM saves OrderItem
        ↓
OrderItem is inserted into PostgreSQL

## when should we use in different situations :

- cascade : true
> use cascade when the child entity belongs to the completely to the parent and normally should be created/ updated together with it 

- cascade : false :
> when the related entity has its own lifecycle or you want explicit control over database changes 

@ManyToOne(() => Product, (product) => product.orderItems, {
  cascade: false,
})
product: Product;

> A product exists independendently of an OrderItem 

Product
   ↑
   │
OrderItem
   ↑
Order

## OrderItem entity :

- @ManyToOne('Order', (order: Order) => order.items, {
    nullable: false,
> every OrderItem must belong to an order
    onDelete: 'CASCADE',
> if order is deleted its orderItems are automtically deletd by database 
  })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  One Order
   │
   ├── OrderItem 1
   ├── OrderItem 2
   └── OrderItem 3

> Many OrderItems -> One Order  

Order #101
   │
   ├── OrderItem #1 → Chicken Biryani × 2
   ├── OrderItem #2 → Burger × 1
   └── OrderItem #3 → Coke × 2
> here all three OrderItem records belong to Order 101

> here this entity has a many-to-one relationships with the Order entity 

- (order: Order) => order.items
> The order entity has items property that represents the OrderItems belonging to that Order 

Order entity
    │
    │ items
    ▼
OrderItem[]

OrderItem entity
    │
    │ order
    ▼
Order

- OnDelete : 'CASCADE'
> the database handles deletion of dependent OrderItems 

Order #101
   │
   ├── OrderItem #1
   ├── OrderItem #2
   └── OrderItem #3
> here if we want to delete 102  
- onDelete: 'CASCADE'
> the postgres automatically deletes 

OrderItem #1
OrderItem #2
OrderItem #3

DELETE Order #101
       ↓
Database sees CASCADE
       ↓
Delete OrderItems belonging to #101

> OrderItems are dependent records of Order 
> they dont have a meaningful existence without their parent Order 
> deleting an Order automatically removes its associated OrderItems 

- @JoinColumn({ name: 'order_id' })
> the relationship becomes a foreign key column in the database

order_items
--------------------------------
id
order_id       ← Foreign Key
product_id
quantity
price

> here order_id is the foreign key referencing the Orders table it establishes the database relationship 

order!: Order;
> the order property should contaion an Order object 

## difference b/w onDelete : 'CASCADE' and cascade : true :

### onDelete : 'CASCADE' :
> it is controlled by database
> if the parent Order is deleted , automatically delete the related OrderItems 

orders
----------------
id
101


order_items
-------------------------
id | order_id
1  | 101
2  | 101
3  | 101

await orderRepository.delete(101);
- database sees 

Order 101 deleted
       ↓
ON DELETE CASCADE
       ↓
OrderItem 1 deleted
OrderItem 2 deleted
OrderItem 3 deleted

> PostgreSQL performs the cascading deletion 

## cascade : true :

> when i apply certaion operations on the parent entity automatically apply those operations to its related entities  

const order = orderRepository.create({
  items: [
    {
      quantity: 2,
      price: 250,
    },
  ],
});

await orderRepository.save(order);

Order
  ↓
OrderItem

> without cascade we may need to explicitly save the child entities 

## cascade and its types :
- 'insert'   --> cascade when inserting related entities
- 'update'   --> cascade when updating related entities
- 'remove'   --> cascade when removing related entities
- 'soft - remove'  --> cascade soft-removal
- 'recover'   --> cascade recovery
- true   --> enables all supported cascade operations 

cascade: true
     ↓
insert
update
remove
soft-remove
recover


## onDelete and its types :

- onDelete : 'Cascade'
> if we delete the parent it automatically deletes childrens
Delete parent
     ↓
Database
     ↓
Delete children
- eg :
Delete Order
     ↓
Delete OrderItems

- onDelete : 'Restrict'
> when we want to delete the parent database checks the children if children exist it don't allow deletion 

Product
   ↓
OrderItem

- onDelete : 'Set null'
Delete parent
     ↓
Foreign key becomes NULL

product_id = 10
       ↓
Product 10 deleted
       ↓
product_id = NULL

- onDelete : 'No Action'


>  Many OrderItems can refer to the same product 
  @ManyToOne('Product', (product: Product) => product.orderItems, {
    nullable: false,
> every OrderItem must reference an existing product 
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

> it defines to many-to-one relationship 
> Many OrderItem records can belong to one product 

Product
Chicken Biryani
id = 1
     ▲
     │
     ├──────── OrderItem #1
     │
     ├──────── OrderItem #5
     │
     └──────── OrderItem #10

Many OrderItems ──────> One Product

> here many orderItems

Order #101
   └── OrderItem → Chicken Biryani

Order #102
   └── OrderItem → Chicken Biryani

Order #103
   └── OrderItem → Chicken Biryani

> there is only one product 
products
--------------------------------
id | name            | price
--------------------------------
1  | Chicken Biryani | 250

- (product: Product) => product.orderItems
> on the Product entity the property that represents its order items is orderItems 

> so Product entity has like 

@OneToMany(
  'OrderItem',
  (orderItem: OrderItem) => orderItem.product,
)
orderItems: OrderItem[];

OrderItem
    │
    │ product
    ▼
 Product
    │
    │ orderItems
    ▼
OrderItem[]

- nullable: false 
> an order item must have an product 
> at the database level , the product_id foreign key cannot be null 

id | order_id | product_id | quantity | price
------------------------------------------------
1  |    10    |     NULL   |    2     | 250

- onDelete: 'RESTRICT'
> dont allow a product to be deleted if an OrderItem is still referencing it 

Product #1
Chicken Biryani
      ▲
      │
      │ product_id = 1
      │
OrderItem #10
      │
      ▼
Order #100


DELETE Product #1
       ↓
Is it referenced?
       ↓
      YES
       ↓
RESTRICT
       ↓
❌ Delete rejected

> order management system is using this relationships 
                 ┌───────────┐
                 │   User    │
                 └─────┬─────┘
                       │
                     1 │
                       │ N
                 ┌─────▼─────┐
                 │   Order   │
                 └─────┬─────┘
                       │
                     1 │
                       │ N
                 ┌─────▼─────┐
                 │ OrderItem │
                 └─────┬─────┘
                       │
                     N │
                       │ 1
                 ┌─────▼─────┐
                 │  Product  │
                 └───────────┘

## Create-orderItem.dto :

> the dto defines what data the client is allowed to send when adding a product ti an order 

{
  "productId": 1,  -- it ensures integer values
  "quantity": 2    -- quantity atleast greater than 1
}
> the dto doesn't create an order it is used to define and validate the structure of incomming request data 

### create-orderItem.dto :

{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ]
}
> the dto's job is request validation and describing the expected input structure 

> @IsArray()
> this verifies that items is actually an array 
{
  "items": []
}

@ArrayMinSize(1)
> the order must contain at leat one item 
> creating an order with zero products doesn't make business sense 

IsArray()
     ↓
Is it an array?

ArrayMinSize(1)
     ↓
Does it contain at least one item?

- @ValidateNested({ each: true }) :
> the items property contains objects 

{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ]
}
> here we want validate each object inside the array

items
 │
 ├── item 1 → validate CreateOrderItemDto
 │
 ├── item 2 → validate CreateOrderItemDto
 │
 └── item 3 → validate CreateOrderItemDto

# without nestd validation :
> without nested validation you could validate that items is an array without properly applying the child DTO's validation rules 

items: CreateOrderItemDto[];
> validates every element in this array 

- @Type(() => CreateOrderItemDto)
> this comes from class-transformer
> when converting the incomming plain JSON objects into DTO objects treat each item as a CreateOrderItemDto

### ordersService :

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

PENDING
   ├──→ CONFIRMED
   └──→ CANCELLED

CONFIRMED
   ├──→ COMPLETED
   └──→ CANCELLED

CANCELLED
   └──→ No transition

COMPLETED
   └──→ No transition

- Record<OrderStatus, OrderStatus[]>
> here it creates an object where key is OrderStatus and its value is an array of OrderStatus 
Record<
   Current Status,
   Allowed Next Statuses

if (
  currentStatus === OrderStatus.PENDING &&
  newStatus !== OrderStatus.CONFIRMED &&
  newStatus !== OrderStatus.CANCELLED
) {
  throw new BadRequestException();
}

if (
  currentStatus === OrderStatus.CONFIRMED &&
  newStatus !== OrderStatus.COMPLETED &&
  newStatus !== OrderStatus.CANCELLED
) {
  throw new BadRequestException();
}

> this approach is works but as the number of status increases , the method becomes difficult to maintain 

## with map :
const allowed =
  this.allowedTransitions[currentStatus];

if (!allowed.includes(newStatus)) {
  throw new BadRequestException(
    'Invalid status transition',
  );
}
> the validation logic stays simple
> instead of hard-coding every rule inside if statements , here we represent the rules as data

## alternative approach :

switch (currentStatus) {
  case OrderStatus.PENDING:
    if (
      newStatus !== OrderStatus.CONFIRMED &&
      newStatus !== OrderStatus.CANCELLED
    ) {
      throw new BadRequestException();
    }
    break;

  case OrderStatus.CONFIRMED:
    if (
      newStatus !== OrderStatus.COMPLETED &&
      newStatus !== OrderStatus.CANCELLED
    ) {
      throw new BadRequestException();
    }
    break;

  case OrderStatus.CANCELLED:
  case OrderStatus.COMPLETED:
    throw new BadRequestException();
}

> here each transaction has different bussiness logic 

PENDING → CONFIRMED
       → perform payment validation

CONFIRMED → COMPLETED
          → send delivery notification

CONFIRMED → CANCELLED
          → restore stock + refund

> a switch can make sense when each case does different work 

## approach 2 :
if (currentStatus === OrderStatus.PENDING) {
  // allow CONFIRMED or CANCELLED
} else if (currentStatus === OrderStatus.CONFIRMED) {
  // allow COMPLETED or CANCELLED
}

> as business rules grows it becomes huge so its less maintainable 

## approach 3 :
> for larger production application we could use a state machine 

PENDING
   ↓
CONFIRMED
   ↓
COMPLETED

> a state machine approach becomes useful when you have many status and complex rules such as 

PENDING
CONFIRMED
PROCESSING
PACKED
SHIPPED
DELIVERED
RETURN_REQUESTED
RETURNED
CANCELLED
REFUNDED
> each transition has conditions , permissions 

> is used a transition map to centralize the order lifecycle rules
> this avoids large conditional statements makes rules easy to maintain and prevents invalid state transitions 

## createOrder() :

Client
  ↓
CreateOrderDto validation
  ↓
createOrder()
  ↓
Start Transaction
  ↓
Validate User
  ↓
Check Duplicate Products
  ↓
For each Product
  ├─ Lock product
  ├─ Check product exists
  ├─ Check ACTIVE
  ├─ Check stock
  ├─ Calculate price
  ├─ Reduce stock
  └─ Create OrderItem
  ↓
Create Order
  ↓
Save Order + OrderItems
  ↓
Commit Transaction
  ↓
Return Order

- return this.dataSource.transaction(
  async (manager) => {

> an order involves multiple database operations
- dataSource :
> represents your connection/configuration to the database 
> here it is the main entry point for communicating with database 
> here dataSource knows things like :
- which database to connect to
- postgresql host/port
- entities
- database configuration
- how to start transactions
- how to create / query repositories 

# transaction()
> start a database transactions and execute these operations together 

Start
  ↓
Operation 1
  ↓
Operation 2
  ↓
Operation 3
  ↓
All successful?
  ↓
YES → COMMIT
NO  → ROLLBACK

