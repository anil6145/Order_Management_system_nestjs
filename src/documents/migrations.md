# Migration : 
> it is a version controlled change to the database structure (schema)


## if a entity has :
- id
- name
- email
- password

> later you want to add :
- phone 

> instead of manually changing PostgreSQL table , here we can create a migration that says

- "Add the Phone column to the users table"

## Why do we use migrations :
> the main reason is controlled and repeatable database changes 

> imagine you are working in a team:

Developer A → creates users table
Developer B → adds phone column
Developer C → adds role column

> migrations allow everyone to apply the same databse changes in the same order

## without migraions :

> we might manually do :

- ALTER TABLE users ADD COLUMN phone VARCHAR(15);

## with migrations :

migrations/
 ├── 1710000000000-CreateUsers.ts
 ├── 1710000001000-AddPhoneToUsers.ts
 └── 1710000002000-AddRoleToUsers.ts

> so the database structure changes become part of project 

## synchronize : true
> TypeORm automatically tries to make the database schema matches your entities 

@Entity()
export class User {
  @Column()
  phone: string;
}

> later added 
- @Column()
State : string 

> the TypeOrm automatically add the column 


## synchronize : false + migrations :

> TypeORm does not automatically change our database structure 

### migrations are mainly for :
- creating tables
- adding columns
- removing columns
- changing columns
- creating indexes
- creating constraints
- creating relationships/foreign keys
- renaming database structures 


### how migrations  work :

Entity change
      ↓
Generate/Create migration
      ↓
Review migration
      ↓
Run migration
      ↓
PostgreSQL schema changes

- for example :

User entity
    ↓
Add role property
    ↓
Migration generated
    ↓
migration:run
    ↓
users table gets role column

## Generate :
> here we can change the entity 

@Column()
phone: string;

> the TypeORM can compare the current database schema eith your entities and generate a migration 

typeorm migration:generate ...

> it produces 

export class AddPhoneToUsers... {
  async up(queryRunner: QueryRunner) {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'phone',
        type: 'varchar',
      }),
    );
  }
}

> generating the file doesnot change the database

- npm run migration:run 
> tht actually applies the migration to postgresql 

## up() :
> defines the change you want to apply 

async up(queryRunner: QueryRunner) {
   // add column
}

- eg :
up()
↓
Add phone column

## down() :
> defines how to undo that change 

async down(queryRunner: QueryRunner) {
   // remove column
}
- eg :
down()
↓
Remove phone column

migration
   │
   ├── up()   → apply change
   │
   └── down() → revert change

## migration : revert :
> suppose i have run 
- npm run migration:run
> and the latest migration added
- phone    

> here we can revert the latest migration using :
npm run migration:revert
- this executes that migration's down() method

migration:run
      ↓
up()
      ↓
phone added

migration:revert
      ↓
down()
      ↓
phone removed

### mainly 4 commands :

### migration : create :
> create an empty migration 

npx typeorm migration:create src/migrations/AddPhoneToUsers
- it creates something like

src/migrations/
└── 1760000000000-AddPhoneToUsers.ts

> when you want to write the database changes 

async up(queryRunner: QueryRunner) {
  await queryRunner.query(
    `ALTER TABLE "users" ADD "phone" varchar(15)`
  );
}

### migration : generate 
> generate migration automatically 
> TypeORM compares your entities with the current database and generates the required migration 
> generate migration from entity changes

npx typeorm migration:generate src/migrations/AddPhoneToUsers -d src/data-source.ts

- if your entity changes from :
User
 ├── id
 ├── name
 └── email

- to :
User
 ├── id
 ├── name
 ├── email
 └── phone

> TypeOrm can generate a migration containing the ADD Column operation 
> this is the command we mostly use while developing

### migration: run 
> apply migrations 
> actually execute pending migrations against PostgreSQL 

npx typeorm migration:run -d src/data-source.ts

npm run migration:run
- eg:
Migration file
      ↓
migration:run
      ↓
PostgreSQL
      ↓
phone column created

> migration : generate create the file and migration : run changes the database

### migration : revert :
> undo the last migration
> rollback the most recently executed migration 

npx typeorm migration:revert -d src/data-source.ts

- eg :
migration:run
      ↓
phone column added

migration:revert
      ↓
phone column removed
> it uses the migration's down() method

### migration : show :

npx typeorm migration:show -d src/data-source.ts

> it shows which migrations have already run and which are pending 
> here we can see the migration status

- eg :
[X] 1760000000000-CreateUsers
[X] 1760000001000-CreateProducts
[ ] 1760000002000-AddPhoneToUsers

[X] --> already executed
[ ] --> pending 


### practical order_management system :

> in package.json i have added the scripts 

    "migration:generate": "npm run build && typeorm migration:generate -d ./dist/data-source.js",
    "migration:run": "npm run build && typeorm migration:run -d ./dist/data-source.js",
    "migration:revert": "npm run build && typeorm migration:revert -d ./dist/data-source.js",
    "migration:show": "npm run build && typeorm migration:show -d ./dist/data-source.js"

> and then i run the commands for :

PS A:\NestJS\passport_authentication\passport-app> npm run migration:generate -- ./src/migrations/CreateUsers  

> npm run migration:generate : denotes this path "npm run build && typeorm migration:generate -d ./dist/data-source.js"

- ./src/migrations/CreateUsers > here is the path for creating output source
- ./src/migrations/  --> here it tells where should i create a migration the name of migration 


## here
> -d --> dataSource 
> -- mainly we use for describing the path 

## difference b/w initial schema migration and individual migrations for each table :

## Initial Schema migration :
> we create one migration containing the whole intial database structure 

- eg :

001-InitialSchema
    ├── users table
    ├── products table
    ├── orders table
    └── order_items table

> this is useful when you are strating a completely new project and want to create the entire database from scratch in one migration

> one migration for everything
> less migration files
> harder to find the individual changes

- npm run migration:generate -- ./src/migrations/InitialSchema

## Individual migrations for each table :

> creates seperate migrations for
001-CreateUsers
002-CreateProducts
003-CreateOrders
004-CreateOrderItems
005-AddRelations

> each migration represents one logical database change
> good for incremental development
> more migration files
> easier to track changes  