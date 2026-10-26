
                Postman
                   ↓
            1. Middleware
                   ↓
             2. Guards
                   ↓
       3. Interceptor (before)
                   ↓
               4. Pipes
                   ↓
             5. Controller
                   ↓
              6. Service
                   ↓
              Database
                   ↓
       7. Interceptor (after)
                   ↓
          8. Exception Filter
             (only if error)
                   ↓
               Response

## middleware :
> process the request 
> middleware runs before the route handler and has access to the request , response and next()

> purpose : logging, reading/modifying requests adding request information etc..

## Guards : can this request continue 
> guards decide wheather the request is allowed to reach the controller
> they are commonly used for authentication and authorization

## interceptor  -- run logic before and after
> interceptors can execute logic before the controller and after the controller returns 

> the responseInterceptor can transform :
{
  "id": 1,
  "name": "Biryani"
}
to :

{
  "success": true,
  "message": "Product fetched successfully",
  "data": {
    "id": 1,
    "name": "Biryani"
  }
}

## pipes : validate and transform 

> pipes run before the controller handler and are commonly used for validation and transformation 

- parseIntPipe
can transform "10"  to 10

## controller -- handle the route :
> the request reaches the controller 
> the controller's job is mainly to recieve the request and delegate the business work to the service 

## service  -- Business logic
> the service performs the actual application logic

ProductsController
       ↓
ProductsService
       ↓
TypeORM Repository
       ↓
PostgreSQL

## response path :   interceptor runs again :

> after the controller/service returns data, the response travels back through the interceptor 

> interceptors are useful for :
- response formatting
- logging
- transforming returned data

## Exception filters : handles uncaught errors 
> are involved when an uncaught exception occurs 
> they handles the error response 

Product ID 100 doesn't exist
        ↓
NotFoundException
        ↓
Exception Filter
        ↓
404 response 

> HttpExceptionFilter is used for this purpose 


Postman
   ↓
1. LoggerMiddleware
   "POST /products"
   ↓
2. JwtAuthGuard
   "Is JWT valid?"
   ↓
3. RolesGuard
   "Is user ADMIN?"
   ↓
4. ResponseInterceptor (before)
   ↓
5. ValidationPipe
   "Is product data valid?"
   ↓
6. ProductsController
   ↓
7. ProductsService
   ↓
8. TypeORM
   ↓
9. PostgreSQL
   ↓
10. ResponseInterceptor (after)
   ↓
201 Created
   ↓
Postman