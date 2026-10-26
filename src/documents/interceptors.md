
# Interceptors : 
> is a nestJs class that can execute logic before and after a controller method and can also modify the response 

> is a way to add logic before/after method execution,transform responses , transform exceptions

- structure :

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    console.log('Before controller');

    return next.handle().pipe(
      tap(() => console.log('After controller')),
    );
  }
}

> next.handle()
- this mean Continue and execute the actual controller method 

## suppose you have :
@Get()
getProducts() {
  return this.productsService.findAll();
}

## without interceptor :

Request
   ↓
Controller
   ↓
Service
   ↓
Response

## with interceptor :

Request
   ↓
Interceptor
   ↓
Controller
   ↓
Service
   ↓
Interceptor
   ↓
Response

> so the interceptor can do somethong before and after the controller 

## why we use interceptors :
> the main reason is to handle common logic without repeating it in every controller  

## where we use interceptors :

# logging :
Request started
Request completed in 25ms
> useful for monitoring API's

## responsive transformation :

> for example , controller returns 
{
  "id": 1,
  "name": "Biryani"
}
> the interceptor can convert it to:

{
  "success": true,
  "message": "Data fetched successfully",
  "data": {
    "id": 1,
    "name": "Biryani"
  }
}

## execution time :

GET /products → 32ms
POST /orders → 57ms


## Timeout handling :

API taking more than 5 seconds
        ↓
Interceptor
        ↓
TimeoutException

## where we can apply an interceptor :

## method level :

@UseInterceptors(LoggingInterceptor)
@Get()
findAll() {
  return this.service.findAll();
}
> for only one API
> use this when only one endpoint needs the behaviour

## Controller level :

@UseInterceptors(LoggingInterceptor)
@Controller('products')
export class ProductsController {
}
> now all routes inside ProductController use the interceptor 

GET /products
POST /products
PATCH /products/:id
DELETE /products/:id

## Global level :

app.useGlobalInterceptors(new LoggingInterceptor());

> now the interceptor applies to the entire application 

Request
   ↓
Middleware
   ↓
Guard       → "Can this request continue?"
   ↓
Interceptor → "What should happen around controller execution?"
   ↓
Pipe        → "Is/transform this input?"
   ↓
Controller
   ↓
Service
   ↓
Interceptor → modify/log response
   ↓
Response
