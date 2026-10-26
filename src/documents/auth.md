# Auth Module :

# UserModule :
> auth needs user data    ---> find/create/validate users 
> here authentication system needs to communicate with the users 
> so here usersModule gives access UsersServices to AuthService 
> for authentication neds user information 

## passportModule :
> provides passport integration 
> handles authentication through strategies 

> passport is an authentication framework 
> use JWT as the default passport authentication strategy

Passport
   ↓
Authentication framework
   ↓
JwtStrategy
   ↓
JWT authentication

> here passport can support different :
- jwt 
- google OAuth
etc...

## defaultStrategy : 'jwt' :
> tells password which strategy to use by default 
> use jwt authentication

Request
   ↓
JwtAuthGuard
   ↓
Passport
   ↓
JwtStrategy
   ↓
Verify JWT
   ↓
validate()
   ↓
req.user
   ↓
Controller

> Guard -> Passport -> Strategy -> validate()

## JwtAuthGuard :
- the guard looks like 
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
> jwtAuthGuard acts as the authorization checkpoint for protected routes
> it delegates jwt authentication to passport jwt strategy before allowing the request to reach the controllers 

## jwtModule :
> provides jwtService 
> create/sign jwt tokens
 

## secret : 
> used to sign/verify jwt
> prevent token forgery

## expiresIn : 
> limits token lifetime   -- security

## authController :
> recieves /auth/login/    -- http/API layer
> here handles authentication endpoints 

POST /auth/register
POST /auth/login
GET  /auth/profile

## AuthService :
> contains authentication logic
> valid user + generate token

Client
  │
  │ email + password
  ▼
AuthController
  │
  ▼
AuthService
  │
  ├── UsersService → PostgreSQL
  │
  ├── bcrypt → verify password
  │
  └── JwtService → create JWT
  │
  ▼
Client receives JWT

## JwtStrategy :
> defines how incoming jwt is validated 
> extract token --> verify --> identify user 

> a request contains a jwt , how should i validate it and identify the user 

GET /users
Authorization: Bearer eyJ...
             ↓
          AuthGuard('jwt')
             ↓
        JwtStrategy
             ↓
       Verify JWT
             ↓
        Extract payload
             ↓
      Find/identify user
             ↓
       request.user
             ↓
       Controller


## Auth Service :

> here it is responsible for find user , create jwt payload , generate jwt access token 

constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
) {}
> UsersService --> talks to the users table/repository

> JwtService : creates and signs JWT tokens 

> private readOnly --> nestJs dependency injection gives you these objects , you dont create them manually 

const user =
    await this.usersService.findByEmail(loginUserDto.email);

> searches the database using email 

> if there is no email exist in database it returns invalid email or password 

## compare password :
const passwordMatches = await bcrypt.compare(
    loginUserDto.password,
    user.password
);

> the db contains :
email: user@gmail.com
password: $2b$10$xxxxxxxxxxxxxxxxxxxx
> the user sends : 123456

Plain password
      ↓
bcrypt.compare()
      ↓
Compare with stored bcrypt hash
      ↓
true / false

throw new UnauthorizedException(
    'Invalid email or password'
);
> if the db password and hashed password are compared 


const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
};
> it is the information you want to put inside the jwt 

> the payload is useful later for authorization 


const accessToken =
    await this.jwtService.signAsync(payload);

> here jwtService takes the payload and signs it using configurated jwt secret/private key

payload
   +
JWT secret
   ↓
signed JWT

- result look like :
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....

return {
    access_token: accessToken
};

> the frontend/postman recieves :
{
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
}

POST /auth/login
       ↓
LoginUserDto
       ↓
Find user by email
       ↓
User exists?
   ↓          ↓
 No          Yes
 ↓             ↓
401       bcrypt.compare()
              ↓
          Password correct?
           ↓          ↓
          No          Yes
          ↓            ↓
         401      Create payload
                       ↓
                  Sign JWT
                       ↓
                Return access token

> authService contains authentication business logic 
> it verifies the user's credentials and generate authentication tokens            

## approach - 1:
### Custom Jwt authentication:
> here we should do manually 

Authorization header
        ↓
Extract token
        ↓
jwt.verify()
        ↓
Find user
        ↓
request.user


## Passport + jwt :

JwtAuthGuard
      ↓
Passport
      ↓
JwtStrategy
      ↓
JWT validation
      ↓
validate()
      ↓
req.user

> then architecture becomes 

Login
 ↓
AuthService
 ↓
Validate credentials
 ↓
JWT generated
 ↓
Client sends JWT
 ↓
JwtAuthGuard
 ↓
JwtStrategy
 ↓
validate()
 ↓
request.user

## the better approach is :

AuthService
   +
Passport
   +
JWT Strategy
   +
JwtAuthGuard
   +
RolesGuard

> here my assignment requires :
- jwt authentication 
- hashed passwords
- user / admin roles
- guards


### the main difference b/w custom jwt and passport + jwt :

#### custom jwt :
> we should write the authentication logic
> we should manage token extraction/verification 
> jwt generation  :  ---> jwtService.signAsync()
> password verification  :  bcrypt.compare()
> jwt verification : we should write it 
> Gaurd : we create our own
> roles  : custom RolesGuard
> more control

### passport + jwt :
> passport handles the authentication flow
> easy to add strategies 
> strategy handles it
> jwt generation  : jwtService.signAsync()
> password verification : bcrypt.compare()
> jwt verification : jwtStrategy handles it
> guard  : AuthGuard('jwt')
> roles  : custom RolesGuard
> control   : more standard / less code


## Auth controller :

POST /auth/login
        ↓
AuthController
        ↓
AuthService.login()
        ↓
Validate email/password
        ↓
Generate JWT
        ↓
Return access token


GET /auth/profile
        ↓
JwtAuthGuard
        ↓
JWT valid?
   ↓           ↓
 Yes           No
 ↓             ↓
JwtStrategy   401 Unauthorized
 ↓
req.user


> the controller's job is to :
- recieves http request  --> call service  --> return response 

> the service job is to :
validate credentials   --> generate jwt --> perform authentication logic 

@Post('login')
login(@Body() loginUserDto: LoginUserDto) {
  return this.authService.login(loginUserDto);
}
> @Body() gets the json sent by postman
- here the dto validates the incoming data 

this.authService.login(loginUserDto)
> passes the data to your service 

> the service typically :
- finds the user
- compares password with hashed password
- if correct , creates jwt
- returns something 

access_token 

@UseGuards(JwtAuthGuard)
@Get('profile')
> before allowing /auth/profile/ to execute check wheather the request contains a valid jwt 

GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

> here the guard runs before getProfile()

Request
   ↓
JwtAuthGuard
   ↓
JWT validation
   ↓
JwtStrategy
   ↓
valid?
 ┌───────┴───────┐
Yes              No
 ↓                ↓
req.user          401
 ↓
getProfile()

getProfile(@Request() req: any) {
  return req.user;
}
> after jwt is successfully validated , passport/jwt strategy puts the authenticated user's information 

req.user

{
  "id": 1,
  "email": "anil@gmail.com",
  "role": "USER"
}

> here the current guard handles authentication 
- who are you ? is your jwt valid 

## different approaches :
### 1. passport + jwt guard (recommended)
@UseGuards(JwtAuthGuard)

Passport
   +
JWT Strategy
   +
JWT Auth Guard

### 2. custom jwt guard :
> here we should create our own guard 

@Injectable()
export class CustomAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    // get Authorization header
    // extract token
    // verify JWT
    // allow/deny request
  }
}

> jwtAuthGuard protects the endpoint by authenticating the request before the controllermethod executes 
> it uses passport's jwt strategy to validate the bearer token
> if the token is valid , passport attaches the authenticated user to req.user 
> otherwise the request is rejected with 401 unauthorized  


### AuthService :
> is responsible for the authentication business logic 
- find the user
- checking the password
- creates jwt access token
- creates jwt refresh token
- verifying refresh token
- creating a new access token


### Auth Controller :
> auth controller depends on AuthService so NestJs dependency injection provides the AuthService instance to the controller 

@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req: any) {
  return req.user;
}
> @UseGuards(JwtAuthGuard)
- the request is

GET /auth/profile
Authorization: Bearer <access_token>

> goes through the guard
> here the passport jwt strategy extracts and validates the token 

- then :
validate(payload)
> returns the authenticated user and passport places that result into 
- req.user 