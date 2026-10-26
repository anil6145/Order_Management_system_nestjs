## Guard :
> A guard is a class that decides wheather a request is allowed to reach a route handler or not  

Client Request
     ↓
   Guard
     ↓
Allowed? ── No ──→ 401 / 403
     ↓ Yes
 Controller
     ↓
 Service
     ↓
 Database

 > the guards are classes that iplements the CanActive interface 

 > the main purpose is authorization 

## without Guard :
> anyone can create a product

## with Guard :
> so guards prevents unauthorized users from accessing protected APIs

## Authentication Guard :
> the project uses JwtAuthGuard
- is this user authenticated 

@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}

> the request contains 
Authorization: Bearer <access-token>

> the jwtAuthGuard protects routes by ensuring that the request contains a valid jwt access token 
> passport handles the jwt validation through the jwtStrategy and only authenticated requests reach the controller  

### Authorization Guard :
> authentication defines who are you 

Anil → valid JWT → authenticated

> authorization : what are you allowed to do 
Anil → USER → can view products
Anil → USER → cannot delete products

Ajay → ADMIN → can view/delete products

> so here we use RolesGuard
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Delete(':id')
remove(@Param('id') id: number) {
  return this.productsService.remove(id);
}

Request
   ↓
JwtAuthGuard
   ↓
Is JWT valid?
   ↓
RolesGuard
   ↓
Is ADMIN?
   ↓
Controller

## we use Guards :

### method level :
> only one API 
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile() {}

> useful when only one endpoint needs protection 

### controller level :
> all routes in the controller
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {

> now all the product API's require authentication 
> useful when most/all routes in that controller are protected 

### Global level :
> we can register a guard globally

app.useGlobalGuards(new JwtAuthGuard());

> then the guard applies to the entire application 



### are there different methods instead of guards :

## Middleware :
> middleware runs before the route handler and it is commonly used for 
- logging
- request preprocessing
- adding request data 

Request
 ↓
Middleware
 ↓
Guard
 ↓
Interceptor
 ↓
Controller

> middleware is not the best place for route authorization , because Guards are specifically designed by NestJs for deciding wheather a request can proceed 

Request
   ↓
Middleware
   ↓
Guard       → Can I enter?
   ↓
Pipe        → Is my input valid?
   ↓
Interceptor → Before execution
   ↓
Controller
   ↓
Service
   ↓
Database
   ↓
Interceptor → Format response

> Guard is a class that implements CanActive and determines wheather a request is allowed to access a route 
> Guards are mainly used for authentication and authorization 
## in our application :
> jwtAuthGuard verifies that the user has a valid jwt 
> RolesGuard can check wheather the authenticated user has the required role such as Admin 
> guards can be applied at method , controller or global level 


### in AuthModule :

> this is a custom decorator for role-based authorization in NestJs 

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/enum/roles.enum.js';

// Custom decorator used to attach allowed roles to a route
export const Roles = (...roles: UserRole[]) =>
  SetMetadata('roles', roles);

## @Roles : 
> is a custom decorator that tells Nest this endpoint should be accessible only to these roles 

@Roles(UserRole.ADMIN)
@Get()
findAll() {
  // ...
}

> only Admin should be allowed to access this endpoint 

## in this project :

POST   /products       → ADMIN only
PATCH  /products/:id   → ADMIN only
DELETE /products/:id   → ADMIN only

GET    /products       → USER + ADMIN
GET    /products/:id   → USER + ADMIN

## setMetadata :
> nest allows to attach metadata to a class or route handler 
> adding information to the route 

Decorator
   ↓
Attach metadata
   ↓
Guard reads metadata
   ↓
Guard checks user role
   ↓
Allow / Deny

- architecture becomes 

@Roles(ADMIN)
      ↓
SetMetadata()
      ↓
roles = [ADMIN]
      ↓
RolesGuard
      ↓
Reflector reads "roles"
      ↓
Compare with req.user.role
      ↓
ALLOW / FORBIDDEN

## ...roles :

(...roles: UserRole[])

> it is the rest parameter 
> it allows you to pass one or multiple roles  

@Roles(UserRole.ADMIN)
- gives
roles = [UserRole.ADMIN]

@Roles(UserRole.ADMIN, UserRole.USER)
- gives
roles = [UserRole.ADMIN, UserRole.USER]

> so this is better (...roles: UserRole[]) than compared to (role: UserRole)

## UserRole[] :

> suppose you enum is 
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
- then 
roles: UserRole[]

> roles must be an array containing valid UserRole values 

## why 'roles' :

SetMetadata('roles', roles)
> the first argument is 'roles' is the metadata key
> the second roles is metadata value 

### JwtAuthGuard :
> JwtAuthGuard is a Guard that protects routes using your Passport jwt strategy 

- when we put 
@UseGuards(JwtAuthGuard)
> nestjs asks the guard 
- is this request authenticated with a valid jwt 

> AuthGuard() is provided by @nestjs/passport 
> it connects nest Guards with passport authentication strategies 

export class JwtAuthGuard extends AuthGuard('jwt') {}
> we create own guard the 'jwt' tells passport 
> use this passport strategy registered with the name jwt 

JwtAuthGuard
      │
      ↓
AuthGuard('jwt')
      │
      ↓
Passport JWT strategy
      │
      ↓
JwtStrategy

## what happens internally :

- suppose we call
GET /auth/profile with Authorization 

## s-1 :
> the request reaches the route 
@Get('profile')

## s-2 :
> Guard executes 
@UseGuards(JwtAuthGuard)

## s-3 :
> jwtAuthGuard invokes Passport 
AuthGuard('jwt')

## s-4 :
> passport finds your jwt strategy
JwtStrategy

## s-5 :
> jwt is extracted 

jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()

- here passport looks for :
Authorization: Bearer <token>

## s-6 :
> jwt is verified 
- passport checks things :
- secret/key
- expiration

## s-7 :
> validate() executes 
async validate(payload: JwtPayload) {
  const user = await this.usersService.findOne(payload.sub);

  return user;
}
- whatever validate() returns becomes
req.user

## s-8 :
> controller executes 
return req.user;

HTTP Request
     ↓
@UseGuards(JwtAuthGuard)
     ↓
AuthGuard('jwt')
     ↓
Passport
     ↓
JwtStrategy
     ↓
Extract JWT
     ↓
Verify JWT
     ↓
validate(payload)
     ↓
req.user
     ↓
Controller