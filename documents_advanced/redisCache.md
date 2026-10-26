## RedisCacheService :
> which provides reusable methods to write, read and invalidated cache data in redis 

>this service can support for get/products and get/categories with default TTL(time to live) of 60 seconds 

## redis connection configuration :
> connects nestjs to redis using environment variables

## get<T>() :
> reads cached data and converts the json string back into an object

## set() :
> stores data in redis with a configurable expiry time, defaulting to 60 seconds

## deleteByPattern() :
> finds and deletes matching cache keys when data changes 

## Error handling and logging :
> logs redis and cache errors without allowing cache failures to break normal cache redis or writes

## OnModuleDestroy() :
> Disconects the redis client when the nestjs module shut downs 

## Redis :
> redis is an in-memory data store it keeps data in RAM 
> retrieve frequently requested information without querying postgres every time 

## in my project :
> postgres stores the actual application data such as products, categories and orders
> redis temporarily stores frequently accessed API responses 
> RedisCacheServive manages reading , writing and deleting cached data 
> redisHttpCacheInterceptor automatically checks and caches responses for configurated Http endpoints 

## redisCacheService :
> connects to Redis and provides get(), set() and deleteByPattern()

## RedisHttpCacheInterceptor :
> cheks the cache before processing GET requests and save responses after cache misses

## ttlSeconds :
> sets the default cache lifetime to 60 seconds

## clearProductsCache() :
> deletes matching cached product responses when product data changes 

## why redis useful :
> faster responses : redis serves cached data from memory
> reduce database load : repeated requests do not always need to query postgres
> better scalability : postgres has more capacity available operations that require actual database access
> automatic expiry : cached entries after their TTL
> cache invalidation : cached responses can be deleted after relevant changes 