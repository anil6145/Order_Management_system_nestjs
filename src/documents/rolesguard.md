import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

# canActive : 
>this is an interface that tells nest this class is going to work as a guard 

export class RolesGuard implements CanActivate

## ExecutionContext :
> gives information about the current request and being executed

## for eg:
> which controller
> which method

## Reflector :
> is used to read metadata that you put on controllers or routes using decorators 
- eg :
@Roles(UserRole.ADMIN)

> the reflector used for read metadata as RolesGuard


canActivate(context: ExecutionContext): boolean | Promise<boolean> {
> nest call this method when a request reaches a route protected by RolesGuard   

canActivate()
     ↓
Check required roles
     ↓
Get logged-in user
     ↓
Compare roles
     ↓
true / false

const requiredRoles = 
this.reflector.getAllAndOverride<UserRole[]>(
    'roles',
    [
        context.getHandler(),
        context.getClass()
    ]
);

- 'roles' is the metadata key 
> the @Roles() decorator stores something like roles --> [Admin]

> the guards reads the metadata using 
this.reflector.getAllAndOverride()

# context.getHandler() :
> gets the specific controller method being called 

@Roles(UserRole.ADMIN)
@Delete(':id')
deleteProduct() {
}
> here context.getHandler() is refers to deleteProduct()

# context.getClass():
> gets the controller class 

@Controller('products')
export class ProductsController {

> here the difference is getHandler()  --> for method level

> getClass()  --> is for class level

## getAllAndOverride():
> checks the metadata sources in order

## getAllAndOverride<UserRole[]> :
> expect the metadata to be an array of roles 
@Roles(UserRole.ADMIN, UserRole.USER)

> if there is no roles are specified 
if(!requiredRoles){
    return true;
}
> if this route doesn't have any role requirement allow the request 

@Get()
getProducts() {
}

- no roles 
@Roles(...)

- then 

requiredRoles
      ↓
undefined
      ↓
!requiredRoles = true
      ↓
return true
      ↓
Allow request

const request = context.switchToHttp().getRequest(); 
> nest can handles different types of applications such as http, websockets 

> so here nest says thet 
- this is an http request give me the http request object 

- now you can access
request.headers
request.body
request.params
request.user

const user = request.user;
- it gives you the object 

Request
   ↓
JwtAuthGuard
   ↓
JWT validated
   ↓
JwtStrategy.validate()
   ↓
user returned
   ↓
request.user

request.user = {
    id: 1,
    name: "Anil",
    email: "anil@gmail.com",
    role: "ADMIN"
}

return requiredRoles.includes(user.role)
> this is the actual authorization check 
requiredRoles = ['ADMIN']

## Rolesguard needs JwtAuthGuard :

@UseGuards(JwtAuthGuard, RolesGuard)

JwtAuthGuard
     ↓
"Who are you?"
     ↓
request.user
     ↓
RolesGuard
     ↓
"What are you allowed to do?"

> JwtAuthGuard authenticates the user and puts the authenticated user on request.user
> RolesGuard reads that user and compares their role with the roles required by the route 

@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)

> in this it checks the authentications and then goes to auhorization 


## different approaches :

## permission - based authorization :

> permission based authorization means we give users specific permissions for actions instead of checking only their role

USER
 ├── product:read
 ├── order:create
 └── order:read

ADMIN
 ├── product:create
 ├── product:update
 ├── product:delete
 ├── product:read
 └── order:read

> the endpoint checks  
- Does this user have "product:update" permission?

## RolesGuard :
> current RolesGuard work like 

@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
updateProduct()

> is this user is an Admin 

> here permission-based authorization asks 
- does this user have the permission product:update 

## diff b/w RolesGuard and Permission-based :

## RolesGuard :
> check the roles
> simple to implement
> good for small applications
> role is directly connected to access

## Permission - based :
> checks specific permissions like product:update
> more flexible
> better for complex applications
> permissions can be assigned independently 

## why permissions instead of only Rolesguard :
- if we have 
ADMIN
MANAGER
TEAM_LEAD
EMPLOYEE

> with only roles we may put lots of rules into the RolesGuard 

ADMIN → everything
MANAGER → some things
TEAM_LEAD → other things
EMPLOYEE → limited things

> as the application grows the number of roles and rules can difficult to manage

# with permissions : 
product:create
product:read
product:update
product:delete

order:create
order:read
order:update
order:cancel

> here we can assign permissions to roles :

ADMIN
 → product:create
 → product:update
 → product:delete

MANAGER
 → product:read
 → product:update

EMPLOYEE
 → product:read
 → order:create

> now here authorization logic is based on what the user is allowed to do 

> RolesGuard provides authorization by checking wheather a user has a particular role

> permission based authorization provides a fine authorization by checking wheather user has permission to perform a specific action 

> roles are useful for simple RBAC while permissions are more flexible when an application

## we use it :

> we use it on protected API endpoint where different users should have access to different access

GET    /products       → product:read
POST   /products       → product:create
PATCH  /products/:id   → product:update
DELETE /products/:id   → product:delete

POST   /orders         → order:create
GET    /orders         → order:read
PATCH  /orders/:id/status → order:update

> the permission guard checks wheather the logged-in user has the required permission 

## we use it for :

ADMIN       → create, read, update, delete products
MANAGER     → read, update products
EMPLOYEE    → read products

> instead of writing many role checks define permissions 

export enum Permission {
  PRODUCT_READ = 'product:read',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
}
> then specify the permission required by an endpoint

> create @Permission decorator 

import { SetMetadata } from '@nestjs/common';
import { Permission } from '../enums/permission.enum.js';

export const Permissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);

> permission guard 

@Injectable()
export class PermissionsGuard implements CanActivate {

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {

    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[]>(
        'permissions',
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredPermissions.every(permission =>
      user.permissions?.includes(permission),
    );
  }
}

Request
   ↓
JwtAuthGuard
   ↓
Identify user
   ↓
PermissionsGuard
   ↓
Check user's permissions
   ↓
Allow / 403 Forbidden

- controller : 

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {

  @Permissions(Permission.PRODUCT_READ)
  @Get()
  findAll() {
    // ...
  }

  @Permissions(Permission.PRODUCT_CREATE)
  @Post()
  create() {
    // ...
  }

  @Permissions(Permission.PRODUCT_DELETE)
  @Delete(':id')
  remove() {
    // ...
  }
}

RolesGuard
→ "Does this user have the ADMIN role?"

PermissionGuard
→ "Does this user have product:delete permission?"

> with RolesGuard
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
removeProduct() {}

> with permissions
@Permissions(Permission.PRODUCT_DELETE)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Delete(':id')
removeProduct() {}
> this approach is enough for authorization check

Request
   ↓
JwtAuthGuard
   ↓
Authenticate user
   ↓
PermissionsGuard
   ↓
Check product:delete
   ↓
Controller

> but here we can use the both methods :

@Roles(UserRole.ADMIN)
@Permissions(Permission.PRODUCT_DELETE)
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Delete(':id')
removeProduct() {}

> here User must be an ADMIN and have permission to product:delete 
