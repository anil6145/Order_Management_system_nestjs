## PGBouncer :
> pgBouncer is a connection pooler for PostgreSQL 
> it sits between the nestjs application and postgreSQL database and manages database connections efficiently 

> in OMS nestjs application connects to PostgreSQL using TypeORM PgBouncer will sit between them 

## why we use PgBouncer :
> imagine 100 users send request to a application at the same time 
> without PgBouncer the application may need many database connections postgres has limited capacity for handling connections, and creating too many can consume memory and reduce perfomance

## with PgBouncer :
> connection reuse : multiple application can reuse a smaller poll of database connections 
> better resource management : reduces the overhead of creating and closing database connections 

> Scalability : helps the application support more requests without requiring a seperate postgresql connection for every request 

## without pg bouncer :
> nestjs application may get 500 incoming requests the postgres database many connections compete for resources
> opening and maintaining too many database connections consumes memory and other database resources 
> postgres may reach its connection limit 

## with pgBouncer :
> pgBouncer might have 20Postgres connections available and reuse them as request need access 
> the exact number depends on configuration and workload

## real time:
> suppose 100 customers place orders at the same time 
> nest recieves the order requests 
> pgbouncer manages access to the postgres connections
> when transaction finishes, its connection becomes available for another transaction 