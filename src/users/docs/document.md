
## ExecutionContext :
> it provides information about the current request execution 

## @Injectable() : 
> this class is NestJs provider and it can participate in the dependency injection 

## logger : 
>it is an built-in logging here we use instead of console.log()

> we use this.logger.log() : normal application information 

> it is useful for important application flow 

- this.logger.log(`Order ${order.id} created successfully`);

> we use the this.logger.warn() : something suspicous or potentially problametic it is not the error 
- WARN [ProductsService] Product 10 has low stock: 3

> we use the this.logger.error() : errors and exceptions

> used when something actually fails 

- this.logger.error('Failed to create order');

> database failures, external API failures, authentication failures , application problems 



> debug : detailed information useful when investigating behaviour 

- DEBUG [UsersService] Searching for user with ID: 15 

- DEBUG [OrdersService] Order calculation: quantity=2, price=500, total=1000

> optional :  makes a dependency optional 


//  OrdersService
//      ↓
// needs UsersService
//      ↓
// Is UsersService registered?
//      ↓
// YES → create OrdersService
// NO  → application startup error

> but with optional nest behaves like 

// OrdersService
//      ↓
// needs UsersService
//      ↓
// Is UsersService registered?
//      ↓
// YES → inject it
// NO  → inject undefined
//        ↓
//      continue creating OrdersService

> here the value can be undefined


> Unauthorized : this request is not authenticated/authorized to access the resource 

## AuthGuard :
> auth guard is a guard provided by @nestjs/passport that connects nestjs with a passport authentication strategy 

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

> here the passport strategy registered with the name jwt to authenticate this request 

> here we use on routes that require authentication 

@Controller('users')
export class UsersController {

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }
}

- flow 

Client
  ↓
GET /users/profile
  ↓
JwtAuthGuard
  ↓
JWT Strategy
  ↓
Is token valid?
  ↓
Yes ─────────→ Controller
                  ↓
              Service
                  ↓
               Database

No
 ↓
401 Unauthorized

## without guard :
> without guard we might have to write authentication logic inside every controller 

## AuthGuard :
> it is an authentication guard 
> instead of writing 

canActivate(context) {
  // get request
  // extract token
  // verify token
  // handle authentication errors
  // attach user
}


- export class JwtAuthGuard extends AuthGuard('jwt')
> here jwtAuthGuard inherits the authentication behaviour provided by passport AuthGuard('jwt')


- private readonly logger = new Logger('JwtAuthGuard');
> here it tells which component generated the log 

[Nest] ... LOG [JwtAuthGuard] JWT authentication started
[Nest] ... LOG [JwtAuthGuard] JWT authentication completed


## canActive() :
> is the main method used by Guard to decide wheather a request is allowed to continue to the controller or should be blocked 

Client Request
      ↓
    Guard
      ↓
 canActivate()
   ↙       ↘
true       false
 ↓           ↓
Controller  Request blocked

- override canActivate(context: ExecutionContext) {

> here context is an object that gives the Guard information about the current request and where / how the request is executed   


### jwt.strategy :

## PassportStrategy :
> it is a nestjs with passport authentication library 
> it provides authentication strategies such as

- jwt
- google OAuth
- session 

## Strategy :
> it is a passport provided class it knows how to get :
- get the jwt from the request
- verify the jwt signature
- check expiration

- export class JwtStrategy extends PassportStrategy(
    Strategy,
) {


## JwtModule :
> it provides nestjs jwt functionality 
- creating access token
- creating refresh tokens
- verify tokens
- verifying jwt payloads 

## jwtStrategy :
> this is our application specific authentication logic 

## JwtService :
> it is used for creating and verifying the jwt tokens 

> here it provides methods such as :
jwtService.sign()
jwtService.signAsync()

jwtService.verify()
jwtService.verifyAsync()

jwtService.decode()
