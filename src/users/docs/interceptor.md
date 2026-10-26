

## callHandler :
> is a nestjs object provided to an interceptor 
> its main job to provide next.handle 

> here next.handle() --> continue the request processing and execute the next part of the nest request pipeline  

intercept(context: ExecutionContext, next: CallHandler) {
  return next.handle();
}

> intercept the request before the controller method runs and next.handle() tells nest to continue to the next stage/controller 

- context : ExecutionContext
> it gives you information about the current request 

- next:CallHandler :
> the object that represents the next step in the request pipeline 

- next.handle()
> continue processing this request 