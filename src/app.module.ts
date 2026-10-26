import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { databaseConfig } from './database/database.config.js';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { ThrottlerModule } from '@nestjs/throttler';
import { CategoriesModule } from './categories/categories.module';
import { ReportsModule } from './reports/reports.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { AuditModule } from './audit/audit/audit.module.js';
import { AuditInterceptor } from './audit/audit/audit.interceptor.js';
import { HealthController } from './health/health.controller';
import { HealthModule } from './health/health.module';
import { RedisCacheModule } from './redis-cache/redis-cache.module.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal : true
    }),

    TypeOrmModule.forRoot({
      ...databaseConfig,
      autoLoadEntities : true,
      synchronize : false,
      logging : true
    }),

    ThrottlerModule.forRoot({
      throttlers : [
        {
          ttl : 60000,
          limit : 5
        }
      ]
    }),
  ScheduleModule.forRoot(),

  BullModule.forRoot({
    connection : {
      host : process.env.REDIS_HOST || 'localhost',
      port : Number(process.env.REDIS_PORT || 6379)
    }
  }),

  AuditModule,
  
  UsersModule,
    AuthModule,
  ProductsModule,
    OrdersModule,
    CategoriesModule,
    ReportsModule,
    HealthModule,
    RedisCacheModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide : APP_GUARD,
      useClass : JwtAuthGuard
    },
    {
      provide : APP_GUARD,
      useClass : RolesGuard
    },
    {
      provide: APP_INTERCEPTOR, // Wire interceptor globally across app context
      useClass: AuditInterceptor
    },
    {
      provide : APP_INTERCEPTOR,
      useClass : ResponseInterceptor
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) { 
    consumer 
      .apply(RequestIdMiddleware, LoggerMiddleware)
      .forRoutes('*');
  }
}



