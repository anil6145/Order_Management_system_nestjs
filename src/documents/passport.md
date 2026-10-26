
# Passport :
> passport is a standard authentication framework 

> the main purpose of using passport is to avoid authentication verification logic repeatedly   

Client
  ↓
GET /auth/profile
  ↓
JwtAuthGuard
  ↓
Passport
  ↓
JwtStrategy
  ↓
Validate JWT
  ↓
validate()
  ↓
req.user
  ↓
Controller

- for eg : passport + jwt

@UseGuards(AuthGuard('jwt'))
@Get('profile')
getProfile() {
  return 'Profile';
}

## without passport :
> we should write the authentication logic manually

Read Authorization header
        ↓
Extract Bearer token
        ↓
Verify JWT
        ↓
Check expiration
        ↓
Find user
        ↓
Attach user to request

## passport provides a standard structure :
Guard -> strategy -> Authentication -> User

> Passprt is a standardize authentication instead of manually extracting and validating credentials in every endpoint 

> passport jwt handles such as :
- reading the jwt from the request
- verifying the token/signature
- checking wheather the token is valid/expired
- extracting the payload
- giving the authenticated user information to NestJs 

Read Authorization header
        ↓
Extract token
        ↓
Verify token
        ↓
Check expiration
        ↓
Decode payload
        ↓
Allow 
> passport organizes this authentication process 

## Strategy :
> A strategy defines how authentication mechanism that passport should use to identify and validate a user  

## passport has strategies :
> passport main concept is a strategy
- here strategy means how should i authenticate this request 

### common passport strategies :
> jwt    --> authenticate requests using jwt token

> local strategy   --> Email/username  + password
- usually this is used during login and after successfull login generate a jwt 

> OAuth     --> login through external providers  - google

> session strategy  --> authenticate using sessions 
- instead of sending a JWT on every request 

Login
 ↓
Server creates session
 ↓
Session ID stored in cookie
 ↓
Browser sends cookie
 ↓
Server finds session

> this is common in traditional server-rendered applications 

> Custom Strategy  --> here we can create our own authentication approach when jwt,local,or OAuth doesn't fit 


### jwt Strategy :
> is a part of authentication that reads and validates the jwt 

Login → JWT generated → Client sends JWT → JwtAuthGuard → JwtStrategy → user authenticated

> after login the server gives 

{
  "access_token": "eyJhbGciOi..."
}
- the client send it on requests:

Authorization: Bearer eyJhbGciOi...

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return payload;
  }
}


## validate() :
> used to perform authentication logic after passport has obtained the authentication data 

async validate(payload) {
   return payload;
}

## super () :
> used in a passport strategy constructor 


## Jwt strategy vs jwt guard :

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

### JwtAuthGuard :
> this endpoint requires jwt authentication run the jwt authentication process 

> protect this route and invoke authentication

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

## passport :
> selects the strategy 

### jwt Strategy :
> defines how the jwt authentication should work 

> extract token
> verify token
> check expiration
> validate(payload)

Client
  │
  │  Authorization: Bearer <JWT>
  ↓
Controller
  │
  │ @UseGuards(JwtAuthGuard)
  ↓
JwtAuthGuard
  │
  │ tells Passport: use "jwt" strategy
  ↓
JwtStrategy
  │
  ├── Extract JWT from Authorization header
  ├── Verify JWT signature
  ├── Check expiration
  ├── Decode payload
  ↓
validate(payload)
  │
  ├── payload.sub → user ID
  ├── usersService.findById()
  ├── Check user exists
  ↓
return user
  ↓
Passport puts returned user into req.user
  ↓
Controller
  ↓
Protected resource



┌──────────────────────┐
│     User Interface   │
│ React / Postman      │
└──────────┬───────────┘
           │
           │ 1. Login
           │ email + password
           ↓
┌──────────────────────┐
│     AuthController   │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│      AuthService     │
│ verify password      │
│ create JWT           │
└──────────┬───────────┘
           │
           │ 2. JWT returned
           ↓
┌──────────────────────┐
│        Client        │
│ stores access token  │
└──────────┬───────────┘
           │
           │ 3. Protected request
           │ Authorization: Bearer JWT
           ↓
┌──────────────────────┐
│     AuthGuard        │
│ AuthGuard('jwt')     │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│       Passport       │
│ selects "jwt"        │
│ strategy             │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│     JwtStrategy      │
│ extract token        │
│ verify token         │
│ check expiration     │
│ validate(payload)    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│     UsersService     │
│ find user in DB      │
└──────────┬───────────┘
           ↓
       req.user
           ↓
┌──────────────────────┐
│     Controller       │
│ execute API logic    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│     Response JSON    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│     User Interface   │
│ display data         │
└──────────────────────┘



