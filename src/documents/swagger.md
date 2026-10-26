# Swagger :
> NestJs provides official Swagger/OpenAPI integration through @nestjs/swagger

> swagger generates an OpenAPI document from your NestJs application and provides a UI where developers can see and test APIs

> instead of telling your frontend developer 

- POSt/products requires name,price,stock 

> the swagger can display 

POST /products

Request Body:
{
  "name": "Biryani",
  "price": 250,
  "stock": 20
}

Response:
201 Created
> and the developer can click try it out and call the API directly 

## Why we do we use Swagger :
# it tells developers :

> what are the APIs are available
> http method
> URL/Path
> Request body
> parameters
> Response
> authentication requirement 

POST   /auth/register
POST   /auth/login
GET    /auth/profile

POST   /products
GET    /products
GET    /products/:id
PATCH  /products/:id
DELETE /products/:id

POST   /orders
GET    /orders
GET    /orders/:id
PATCH  /orders/:id/status

> swagger presents these in a readable UI



## swagger :
> swagger is a toolset for describing documenting and testing Rest API's 

> it generates an OpenAPI specification and it provides an interactive UI for developers can 
- see available API's
- see http methods
- see request parameters
- see request bodies
- see response structures
- authorize using JWT 
- execute Api directly from the browser 

## why we use this :
> without swagger a frontend developer may ask 
- what is url , which fields , do i need jwt , what response do i get 
what does status accept 

## without swagger :

Backend developer
       ↓
writes API
       ↓
explains API manually
       ↓
Frontend developer asks questions
       ↓
changes API
       ↓
documentation becomes outdated

## with swagger :

NestJS Controllers + DTOs + Decorators
                 ↓
             OpenAPI
                 ↓
          Swagger UI
                 ↓
Frontend / Backend / QA

> the swagger setup in main.ts 

## controller - level swagger :

> orders controller 

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {

# ApiTags('orders')
> here groups APIs under orders 

## @ApiBearerAuth()
> @ApiBearerAuth('JWT-auth')

> this tells swagger this controller's endpoints require the jwt authentication 

> the swagger shows that authentication is required for that endpoint 

- @UseGuards(JwtAuthGuard)

@ApiBearerAuth()
       ↓
Swagger documentation

@UseGuards(JwtAuthGuard)
       ↓
Actual security

## @ApiOperation() :

@ApiOperation({
  summary: 'Get all orders',
})
@Get()
findAll() {
}

> swagger displays something like 
GET /orders

Get all orders

## @ApiResponse() :

@ApiResponse({
  status: 200,
  description: 'Orders retrieved successfully',
})
> this creates a clearer API contract 