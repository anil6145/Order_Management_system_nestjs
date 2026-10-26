# typeORM :
> it is an object relational mapper available for typescript 

npm install --save @nestjs/typeorm typeorm (database) pg / mysql2

> once installation is completed we should import TprORM into the rppt AppModule

TypeOrmModule.forRoot({
      type : 'postgres',
      host : 'localhost',
      port : 5432,
      username : 'postgres',
      password : '@6145',
      database : 'passport_authentication',
      autoLoadEntities : true,
      synchronize : true
})

> autoLoadEntities : if true auto loaded the entities automatically

> once this is done the TypeORM objects will be available to inject across the entire project 

### typeOrm supports repository dessign pattern 

> so here each entity has its own repository 
> these repositories can be obtained from the database 

@Module({
  imports : [
    TypeOrmModule.forFeature([User])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports : [UsersService]
})
export class UsersModule {}

> here this module uses forFeature() method to define which repositories are registrated in the current scope 

> with that in place we can inject usersRepository into UsersService using the @InjectRepository() decorator 

> the TypeORM creates a repository specially for this entity 

Repository<User>

> here repository methods to perform database operations :

# find() :
> used when we want the list of records 

const users = await this.userRepository.find()

> similar to 
- select * from users;


## findOne() :
used when we need one specific record , usually with conditions or relations

const user = await this.userRepository.findOne({
  where: {
    email: 'anil@gmail.com',
  },
});

> similar to :
- select * from users
where email = 'anil@gmail.com';

const user = await this.userRepository.findOne({
  where: { id: 1 },
  relations: ['orders'],
});
> findOne() is useful when you need more control over the query options 

## findOneBy() :
> this is simpler when you want to find one record using conditions 

const user = await this.userRepository.findOneBy({
  id: 1,
});

const user = await this.userRepository.findOneBy({
  email: 'anil@gmail.com',
});


# create() :
> this doesn not insert into datbase 
> here it creates an entity object in memory 
create()
   ↓
Entity object in application memory

# save() :
> this insert into the database 

const user = this.userRepository.create({
  name: 'Anil',
  email: 'anil@gmail.com',
});

const savedUser = await this.userRepository.save(user);

> if the entity already has an existing primary key 

user.name = 'Anil Kumar';

await this.userRepository.save(user);
> here save can be used for both insert or update depends on the entity's state/identity

# update() :
> it is used when you want to update a record directly 

await this.userRepository.update(
  { id: 1 },
  { name: 'Anil Kumar' },
);

UPDATE users
SET name = 'Anil Kumar'
WHERE id = 1;

# delete() : 
> delets records directly from the database 

await this.userRepository.delete(1);

await this.userRepository.delete({
  email: 'anil@gmail.com',
});

DELETE FROM users
WHERE id = 1;

> delete() delets directly using a condition/id



# remove() :
> it is used to remove an entity

const user = await this.userRepository.findOneBy({
  id: 1,
});

if (!user) {
  throw new NotFoundException('User not found');
}

await this.userRepository.remove(user);

## diff b/w delete() and remove()
### delete()
> delete() deletes directly using a condition / id 
> remove() deletes an entity object that you have already loaded 

await this.userRepository.delete(1);
ID = 1
  ↓
DELETE directly from database

DELETE FROM users WHERE id = 1;

### remove() :
> first you get the entity 

const user = await this.userRepository.findOneBy({ id: 1 });

if (!user) {
  throw new NotFoundException('User not found');
}

await this.userRepository.remove(user);

find user
   ↓
User entity object
   ↓
remove(user)
   ↓
DELETE from database

## diff b/w findOne() and findOneBy() :

# findOne() :
> simple condition like simple where condition in sql

# findOneBy() :
> more control 

const user = await this.userRepository.findOne({
  where: {
    id: 1,
  },
  relations: ['orders'],
});

> find this user and also load their orders 

> here also we can use other options such as ordering , selected fields , relations etc..

// Simple
findOneBy({ id: 1 });

// More configurable
findOne({
  where: { id: 1 },
  relations: ['orders'],
});

## diff b/w create() and save() :


> creates an entity object in memory
> save() persists that entity to the database  

> here Repository provides an abstraction for accessing and modifying database records 

> here main thing that we can use only save() without using or calling create()

async createUser(dto: CreateUserDto) {
  return this.userRepository.save(dto);
}
> here typeOrm can accept an object and save it 

## when should we use update() instead of save():
> use update() when you already know what record to update and only want to change specific fields directly in the database 

await this.productRepository.update(
  { id: 10 },
  { stock: 25 },
);

UPDATE products
SET stock = 25
WHERE id = 10;

> use save() when you are working with an entity object and want TypeOrm to persist it 

const product = await this.productRepository.findOneBy({ id: 10 });

if (!product) {
  throw new NotFoundException('Product not found');
}

if (product.stock < 5) {
  throw new BadRequestException('Insufficient stock');
}

product.stock -= 5;

await this.productRepository.save(product);

constructor(
  @InjectRepository(User)
  private readonly userRepository: Repository<User>,
) {}

> forFeature([User])
- User repository becomes available to this module 

> @InjectRepository(User)
- UserService gets Repository<User>

## Entity : 
>defines the structure/model of the table

## Repository :
> is used to perform database operations

this.userRepository.find();

this.userRepository.findOneBy({ id });

this.userRepository.save(user);

this.userRepository.delete(id);



### relations :

> relations are associated established b/w two or more tables 
> relations are based on common fields from each table involving primary and foreign keys 

### @ManyToOne : 
> many orders belong to one user 

Anil → Order 101
Anil → Order 102
Anil → Order 103

> one User can create many Orders

## Entity :

### User :
@OneToMany(()=> Order , (order)=> order.user)
orders : Order[];

## Order :
@ManyToOne(()=> User , (user) => user.orders )

## in database :

> the orders table will have the foreign key :

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

users
----------------
id | name
1  | Anil
2  | Ravi

orders
---------------------
id  | user_id
101 | 1
102 | 1
103 | 2

> here ManyToOne means many records are associated with one record 
> in the above project many orders can belong to one user 
> the foreign key user_id is stored in the orders table 

## @OneToMany() :
> one user has many orders 

User
 ↓
Order 101
Order 102
Order 103

- Entity :
@OneToMany(()=> Order , (order) => order.user)
orders : Order[];

# TL flow :
> OneToMany represents the reverse relationship 
> One user can have many orders , while each order belongs to one user
> the actual foreign key is maintained on the ManyToOne side 

## @OneToOne()
> one user has one profile 

User
  ↓
Profile
> an individual user has one profile and that profile belongs to one user

User 1 ───── Profile 1
User 2 ───── Profile 2

## Entity :
@OneToOne(()=>Profile)
profile : Profile;

> usually designate the owing side with @JoinColumn()

// User
@OneToOne(() => Profile)
@JoinColumn()
profile: Profile;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

### @ManyToMany : orders and products

> An order can contain multiple products 

Order 101
 ├── Biryani
 ├── Pizza
 └── Coke

> but the same product can appear in many orders 

Biryani
 ├── Order 101
 ├── Order 102
 └── Order 105

 Orders >──────< Products
> Many-to-Many  

## Entity :
Order :
@ManyToMany(()=> Product)
@JoinTable()
products : Product[]

Product :
@ManyToMany(()=> Order , (order) => order.products)
orders : Order[];
> @JoinTable() is normally placed on the owning side  

### in database :

> we have two tables :
- orders
- products
> but you also need a third table
order_products

orders
----------------
id
101
102

products
----------------
id | name
1  | Biryani
2  | Pizza
3  | Coke

order_products
---------------------
order_id | product_id
101      | 1
101      | 2
101      | 3
102      | 1

> ManyToMany means multiple records on both sides can be related.
> one order can contain multiple products and one product can belong to multiple orders 
> TypeOrm uses a junction table such as order_products to store those relationships  

## TL asks :
> where is the foreign key in oneToMany or ManyToOne :
- the foreign key is normally on the ManyToOne side 

- for eg :
orders.user_id references users.id 

## why do we need a junction table for ManyToMany :

> 






