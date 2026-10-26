
# middleware :

> Middleware is code that runs before the request reaches the route handler/controller 
> it has access to the request , response and next() function 

## we use middleware :
> logging - log POST/auth/login

[Request] POST /auth/login/
[Response] 200 POST /auth/login/

> request processing   -- modify/read request information 
- middleware can read information from the incoming request or modify it before it reaches the controller 

> adding information to the request :
- middleware can add custom information to req 

## next() :
> middleware has finished its work continue processing this request 


> runs before the controller
> general request processing
> logger middleware   ---> who called which API


