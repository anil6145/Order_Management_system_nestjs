## Redis :
> redis is an  in memory data store used to store and retrieve data very quickly 
> it is commonly used for caching, rate limiting, session storage, queues


> redis stores data primarily in RAM(memory) which makes reading and writing data very fast compared with repeatedly querying a database such as postgres

> postgres is a permanenet record book and redis is your fast access work space for information you need frequently

## why we use Redis :

# Caching :
> suppose your Get/products endpoint recieves hundred of requests instead of running the same PostgreSQL query every time , you can temporarily store the result in Redis and return it quickly 
- benifift : reduce database load and can improve response time 

## Rate limiting :
> Redis can maintain request counters shared accross multiple application instances 
## for eg:
> a login endpoint could allow five attempts per minute per IP address

## Bakground jobs and queues :
> tasks such as order-confirmation emails or processing notifications can be queued with and processed in the background using tools such as BullMQ with redis 

## Shared state across servers:
> if your nestjs application runs on multiple instances redis can share cache entries,counters and certain coordination data between them 

> fast access, caching, shared state and stores in primiraly memory

## redis :
> redis is an in-memory data store that nestjs application can use for caching, shared, rate-limiting and background jobs processing 
> it helps improve perfomance and supports applications running accross multiple servers 

> without redis every request to GET/products may query postgreSQL

> with redis nestjs checks wheather the product list is cached
> if the data exists, nestjs returns the cached result
> otherwise nestjs queries postgres returns the result and stores it in redis for subsequent requests
> when a product changes the relevant cache must be invalidated or updated 

> here this reduces repeated database work, the actual perfomance improvement depends on the workload and caching strategy

## what happens if the database is updated but redis is not:
> redis may return stale data we should invalidate or update the affected cache after a successfull database change 
> A TTL provides an additional limit on how long cached data remains

## should we update redis first or postgres:
> update postgres first and then invalidate redis the database 

## why do we need a TTL if we invalidate the cache :
> a TTl automatically expires cached entries after a defined period. it helps recover from missed invalidations and prevents entries from remaining indefinietly but it can still allow stale data until expiration 

## does redis gurrantee the latest data immediately :
> no redis is a seperate data store when the application updates or invalidates its cache expiration settings and failure handling


## BullMQ :
> it is used to process background tasks reliable without making users wait for those tasks to finish 
> it uses redis to store and manage jobs 

> BullMQ can be used for sending order confirmation mails, generating reports, processing notifications, and handling delayed order cancellation 

## without BullMQ:
> your API might perform all these tasks before returning a response 
- save the order in postgres
- update product stock
- send an order confirmation email
- send a notification
- generate an invoice 

> if sending the mail takes five seconds the user might have to wait longer for the API response 

## with BullMQ :
> you can save order and enqueue the email task for background processing 

client
- sends a request to create an order
NestJS API
- saves order in postgres and adds a job to the queue
Redis + BullMQ
- stores and manage the background job
worker
- processes the job such as sending an email 

## BullMQ :
> Queue : accepts and manage jobs waiting to be processed
> job : represents one task, such as sending an order email
> redis : stores queue data and job state 
> worker : executes the job's actual task 
> processer : the code that defines what the worker does
> sceduler/delay : allows jobs to be processed later or after a specified delay

## here i can write the logic code for background then why should i use BullMQ:
> imagine order management system needs to send a confirmation email after an order is created

## without BullMQ:

- async createOrder() {
  const order = await this.orderRepository.save({
    status: 'PENDING',
  });

  // Run in the background
  this.emailService.sendOrderEmail(order.id);

  return order;
}
> what happens if emails fails
> how will you retry it 
> where will you store pending email tasks
> what happens if the application restarts before the task finishes
> how will multiple workers share the load

## with BullMQ:

async createOrder() {
  const order = await this.orderRepository.save({
    status: 'PENDING',
  });

  await this.emailQueue.add(
    'send-order-email',
    { orderId: order.id },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  );

  return order;
}
> here bull manages the job lifecycle, including queued jobs, retries, delay execution, and job status 

## worker :
> worker executes the code 
> configurable retries
> built in delay jobs 

## manual audit logging vs BullMQ:

User updates product
Service updates product
Insert audit log into PostgreSQL
Return API response

## advantages :
> simple to implement and understand
> no redies or queue worker required
> suitable for small applications with low request volume
## disadvantages:
> the API waits for the audit insert to finish
> if audit insertion fails you must decide wheather to fail or rollback the bussiness operation

## BullMQ:
User updates product
Service updates product and queues audit event
API can return without waiting for the audit insert
Background worker saves audit log

## advantages:
> the database insert happens outside the main request flow
> failed jobs can be retried
> workers can process a large volume of audit events 

## disadvantages:
> requires redis and worker configuration
> adds operational complexity
> a queue enqueue failure must be handled merely using BullMQ does not gurrantee that no audit event will ever be lost 

## here after successfully creating an order you can insert an audit record directly into the audit_logs we don't need BullMQ:

> if you await the audit insert the API waits for it to finish if inserts fails after order is commiteed the order exists but its audit record may be missing 

## @Cron :
> @Cron is a decorator provided by @nestjs/schedule that allows you to execute method autmatically at specific time or at regular intervals without a user having to call an API endpoint 


> for example : in project you can use @Cron to check every minute wheather any PENDING orders have been waiting for more than 30 minutes and cancel eligible orders 

> ## without @Cron() :
> you might need to call an API manually to cancel stale orders
> you could write your own timmer logic to run periodically

## with @Cron() :
> nestjs auomatically executes your method according to the schedule 
> no user request is required to trigger each execution
> you can use it for recurring tasks clean up, reports 