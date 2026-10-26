
## ArgumentsHost :
> nestjs object that gives you access to the current request/response execution context 

> it gives you access to the current HTTP request 
> like request.method
> request.url 

> if something failed get me access to the request/response where it is failed 

> here nestjs supports different communication types :
- http
- websockets
- microservices 


## @Catch :
> this class is an exception filter it handles the all exceptions 
- @Catch(HttpException)

## HttpException :
> it is a subclass it has all the exceptions 
- badrequest
- unauthorized
- forbidden
- notFound
- conflict etc..

## httpExceptionFilter :
> it is responsible for handling exceptions that occur during request processing 

- catch(exception: HttpException, host: ArgumentsHost)
> when exception occures nest calls this method and gives exception + information about the request/response context 

                 catch()
                /      \
               /        \
       exception        host
          ↓              ↓
   What went wrong?   Where did it happen?

- eg :

async findOne(id: number) {

  const product = await this.productRepository.findOne({
    where: { id },
  });

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  return product;
}
> when client send 
- GET /products/999

> the service executes 
- throw new NotFoundException('Product not found');

> here i have exception filter :

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {

  catch(exception: HttpException, host: ArgumentsHost) {

  }
}

> here nest calls the method

catch(
  exception,  // NotFoundException
  host         // information about current request
);


  
- const ctx = host.switchToHttp();
> i know this exception happend inside an http request and give me the http specific context 

- const response = ctx.getResponse<Response>();

> gets the request 

- const request = ctx.getRequest<Request>();

> gets the response  