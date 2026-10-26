
# Entity :
> let's say we have user,employee,student entities all those entities have few things in common --> firstName , lastName properties 

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    isActive: boolean
}

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Employee {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    salary: string
}

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Student {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    faculty: string
}

> to reduce the duplication of firstName and lastName creating a class with those columns

import { Column } from "typeorm"

export class Name {
    @Column()
    first: string

    @Column()
    last: string
}

> and here we can connect those columns in our entity 

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"
import { Name } from "./Name"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: string

    @Column(() => Name)
    name: Name

    @Column()
    isActive: boolean
}

## Entity Inheritance :
> reduce the duplication of code by using entity inheritance pattern 

> suppose we have entities 
@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column()
    size: string
}

@Entity()
export class Question {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column()
    answersCount: number
}

> all those entities have common columns id,totle,description 

> to reduce duplication and produce a better abstraction 

> and here we can create a base class content

export abstract class Content {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string
}

> extends 
@Entity()
export class Photo extends Content {
    @Column()
    size: string
}

@Entity()
export class Question extends Content {
    @Column()
    answersCount: number
}

### Schema :
> A schema is a blueprint or structure that defines how data is organized and stored in a database 
> it outlines the tables,fields,relationships,views and other elements within the database 

Database: order_management
│
├── public
│   ├── users
│   ├── products
│   ├── orders
│   └── order_items
│
└── reporting
    ├── sales_summary
    └── user_order_summary

> here public is schema
> reproting is an another schea 
> users,orders,products tables inside a schema 

## purpose of schema :
# organization : 
> seperate related database objects

# Permission :
> permissions can be managed at the schema level

# seperation:
> for example transactional tables , reporting tables 

# avoid naming conflicts:
> different schemas can contain tables with the same name 

# eg :

PostgreSQL Server
│
└── Database: order_management
    │
    ├── Schema: public
    │   ├── users
    │   ├── products
    │   └── orders
    │
    ├── Schema: inventory
    │   ├── products
    │   └── stock_movements
    │
    └── Schema: audit
        ├── login_logs
        └── order_logs

## schema for organization :

> without schema :

Database
│
├── users
├── products
├── orders
├── order_items
├── payments
├── invoices
├── stock_movements
├── warehouses
├── login_logs
├── order_logs
├── audit_logs
├── notifications
├── reports
└── ...

> here everything is under one schema 
> it can become difficult to understand which tables belongs to the which part of the application 

## with schemas :

Database
│
├── auth
│   ├── users
│   └── roles
│
├── sales
│   ├── orders
│   ├── order_items
│   └── invoices
│
├── inventory
│   ├── products
│   ├── stock_movements
│   └── warehouses
│
└── audit
    ├── login_logs
    └── order_logs

## schema as NameSpace :

    sales.products
inventory.products
> here both tables are called
products


## seperation b/w application

> intially :
public
├── users
├── products
├── orders
└── order_items

> later if i add :
payments
invoices
warehouses
stock_movements
audit_logs
notifications
reports

> now :
public
├── users
├── products
├── orders
├── order_items
├── payments
├── invoices
├── warehouses
├── stock_movements
├── audit_logs
├── notifications
└── reports

> it is harder to understand the databse structure 

instead :
auth
├── users
└── roles

sales
├── orders
├── order_items
└── invoices

inventory
├── products
├── warehouses
└── stock_movements

payment
└── transactions

audit
└── audit_logs

# in real time :
> a company with multiple teams 

             Database
                │
      ┌─────────┼──────────┐
      ↓         ↓          ↓
     Auth     Sales     Inventory
      │         │          │
     Team      Team       Team

> schema provide a clear database boundary    
auth.users
sales.orders
inventory.products

> here developers can understand 
- who owns the data
- which domain it belongs to
- where the tables are located
- what permissions may apply
- which tables belong together

