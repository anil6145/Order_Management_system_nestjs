> when we run 
npm run start:dev

> the flow is :
main.ts
   ↓
bootstrap()
   ↓
NestFactory.create(AppModule)
   ↓
Configure validation
   ↓
Configure interceptor
   ↓
Configure exception filter
   ↓
Configure Swagger
   ↓
Start server
   ↓
localhost:5000

## const app = await NestFactory.create(AppModule);
> here it creates nestJs Application 
> AppModule is root module containing like :
- AuthModule
- Usersmodule
- ProductsModule
- OrdersModule

## global validationPipe :

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
> we use DTO's , class-validator and ValidationPipe 

app.useGlobalInterceptors(
  new ResponseInterceptor(),
);
> the consistent successfull responses 

{
  "success": true,
  "message": "Order created successfully",
  "data": {}
}
> the interceptor allows you to apply this structure centrally

> here instead of writing this repeatedly :
{
  "success": true,
  "message": "Order created successfully",
  "data": {}
}
> in every controller , your interceptor can transform 

## global Exception Filter :

app.useGlobalFilters(
  new HttpExceptionFilter(),
);
> the filter provides centralized error handling 
> without a global filter , you may end up handling errors differently in every controller 

Users
Products
Orders
Auth
   ↓
one centralized error handler
> the global exception filter centalizes error formatting and prevents duplicated exception response logic across controllers 



### appModule :

ConfigModule.forRoot({
  isGlobal: true,
})
> it loads configuration / environment variables from .env 

## isGlobal: true :
> here Configuration module becomes available throughout your application 

## why should we use .env instead of directly writing database 

> i keep environment specific configuration outside the source code so credentials are deployment specific settings aren't hardcoded and the same application can run across different environments 

## TypeOrmModule.forRoot() :
> this establishes the global TypeORM database connection for your NestJs application 

## autoLoadEntities: true :

- suppose UserModule has 
TypeOrmModule.forFeature([User])
- ProductModule has 
TypeOrmModule.forFeature([User])
- OrdersModule has 
TypeOrmModule.forFeature([
  Order,
  OrderItem,
])

## with autoLoadEntities : true
> the nestjs can automatically add those entities to the TypeOrm connection 
> so feature module can register their own entities through forFeature , rather than maintaining a large centralized entity list in the root module 

## synchronize : false :
> the TypeORM will not automatically modify your database schema based on entity changes 
> use migrations to control schema changes

Entity changed
      ↓
Create migration
      ↓
Review migration
      ↓
Run migration
      ↓
Database schema updated

### if synchronize : true
> suppose an entity has 
- name
- email 
> later we added
- phone 
> here with synchronize : true TypeORM may automatically alter the database schema 


### why we use .env file :
> .env file stores configuration values that can change b/w environments such as database credentials , jwt secrets , API keys and ports 

### why it is useful :

### security :
> we avoid passwords and secrets directly in source code 
### different environments :
> development,testing,production can use different values without changing the application code
Development → localhost database
Production  → production database
