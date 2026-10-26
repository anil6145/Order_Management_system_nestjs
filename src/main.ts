import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingValidationPipe } from './common/pipes/validationPipe.logger.js';



async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  

  app.enableShutdownHooks()

  // applies dto validation to every incoming request with lifecycle logging
  app.useGlobalPipes(
    new LoggingValidationPipe({
      whitelist : true,
      forbidNonWhitelisted : true,
      transform : true,
    })
  )


  // Global Exception Filter
  // handles exceptions in one cental place so error responses also follow a consistent structure 
  app.useGlobalFilters(
    new HttpExceptionFilter()
  )


    // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Order Management System API')
    .setDescription(
      'REST API for Authentication, Users, Products, Categories, Orders, and Reports',
    )
    .setVersion('1.0')

    // adds JWT/Bearer authentication support to Swagger
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT-auth',
    )
    .build();

  // generate the swagger document from controllers and DTOs
  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  // Swagger UI available at /api/docs
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
 bootstrap();
