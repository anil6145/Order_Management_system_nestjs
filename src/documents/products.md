## ProductsService :

const existingProduct = await this.productsRepository.findOne({
  where: { name },
});

if (existingProduct) {
  throw new ConflictException('Product already exists');
}

const product = this.productsRepository.create(dto);

return this.productsRepository.save(product);

> here i check and create entity and then save

> here i can direct save() without the create()

return this.productsRepository.save(dto);
> here we validates with the dto and save 

- create() is useful when you want to prepare or modify the entity before saving 

## update()  directly :

await this.productsRepository.update(
  id,
  updateProductDto,
);

return this.getProduct(id);

> instead of loading the entity 
PATCH
 ↓
UPDATE directly in DB
 ↓
GET updated product

# disadvantage :
> we should think carefully that 
- wheather record exist 
- duplicate name handling
- validation/business rules 

## Use delete() instead of remove() :

## delete() :
> it is deleted based on id or conditions
> here delete performs a direct database delete using the given ID or conditions 
> direct SQL delete operation 

## remove() :
> works with an entity instance so TypeORm needs the entity object and it can trigger entity lifecycle operation 
> we use when we have the entity data already 
> entity life cycle behaviour applies
> 

ID
 ↓
findOne()
 ↓
Product entity
 ↓
remove(entity)
 ↓
DELETE from database

> ENtity lifecycle behavior applies means TypeOrm can execute certain entity lifecycle hooks/listners 
> when you use entity - based operations such as remove()

> imagine when we have some cleanup/business related behaviour associated with removing an entity 
@BeforeRemove()
prepareForDeletion() {
  // cleanup-related logic
}
> here application depends on entity lifecycle hooks 

> TypeOrm provides hooks such as @BeforeRemove() and @AfterRemove() around entity operations 

remove() → Entity → lifecycle hooks can participate → DELETE

delete()  → ID/condition → direct DELETE


async getAllProducts(queryProductDto: QueryProductDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = queryProductDto;

> here we are destructuring the DTO

> here i have done pagination calculation
    // it skips the last 10 records 
    const skip = (page - 1) * limit;

page = 1, limit = 10
skip = (1 - 1) × 10 = 0

page = 2, limit = 10
skip = (2 - 1) × 10 = 10

page = 3, limit = 10
skip = (3 - 1) × 10 = 20

> Query builder is useful for when we need multiple query features like dynamically
> search , sorting , pagination , record count 
    const queryBuilder =
      this.productsRepositorty.createQueryBuilder('product');

- GET /products?search=biryani&sortBy=price&page=2  

> here i choose QueryBuilder because listing endpoint has dynamic filtering,sorting,pagination,counting

> repository methods be simpler for basic queries 

      // search
> lower() makes the search the case - insensitive
    if (search) {
      queryBuilder.andWhere(
        'LOWER(product.name) LIKE LOWER(:search)',
        {
          search: `%${search}%`,
        },
      );
    }
> here ':search' is a parameterized query value 

> sorting here we use database columns
    const allowedSortFields = [
      'name',
      'price',
      'stock',
      'created_at',
    ];

    // here we use terinary operator 
    // if the client sends invalid sort by value is fall back to created_at
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'created_at';

      // sortOrder is normally validated by QueryProductDTo

    queryBuilder
      .orderBy(`product.${safeSortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

> here orderBy()  --> it returns to sorting()
> skip()   --> offset
> take()   --> number of records 

ORDER BY price ASC
OFFSET 10
LIMIT 10
   
> products = records for the current page
> total = total matching records 
    const [products, total] =
      await queryBuilder.getManyAndCount();

      // here it returns data and pagination information 
    return {
      items: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


## QueryBuilder vs findAndCount() :

## FindAndCount() :
> basic get method
> paginaion,fixed sorting , dynamic sorting , simple filtering , multiple dynamic conditions , 




### ProductsController :

> another approach is method level

@Controller('products')
export class ProductsController {

  @Get()
  @UseGuards(JwtAuthGuard)
  getAllProducts() {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  createProduct() {}

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  updateProduct() {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  removeProduct() {}
}
> here it repeats a lot of code 

## another approach :
> in larger application we can make authentication global 
app.useGlobalGuards(jwtAuthGuard)

- then 

Every API
   ↓
JWT authentication

> global authentication is useful when authentication is the default behaviour accross the application 

## permission based authorization :
- instead of @Roles(UserRole.Admin)
> here we can use 
@Permissions('product:create')

@Post()
@Permissions(Permission.PRODUCT_CREATE)
createProduct() {}


### product.entity :

@OneToMany(()=> OrderItem , (orderItem) => orderItem.product)
    orderItems :OrderItem[];

> one product can have many OrderItems     

Product
Biryani
id = 1

> it can appear in multiple orders :

OrderItem #1 → Biryani × 2
OrderItem #5 → Biryani × 1
OrderItem #10 → Biryani × 3

> the relationship is 
Product
   │
   ├── OrderItem 1
   ├── OrderItem 5
   └── OrderItem 10

@OneToMany(() => OrderItem, ...) 
>here it tells another entity involved in this relationship    

(orderItem) => orderItem.product 
> the product property inside OrderItem is the other side of this relationships 

> the orderItem should have something like 
@ManyToOne(
  () => Product,
  (product) => product.orderItems,
)
product: Product;

> now you have two-way relationships 
Product
  │
  │ orderItems
  ↓
OrderItem
  │
  │ product
  ↓
Product

> so these two properties point to each other 
Product.orderItems
        ↕
OrderItem.product

## orderItems: OrderItem[];
> here [] means array

> here one product can have multiple orderitems 

- for eg :

product.orderItems
- here it contains 

[
  orderItem1,
  orderItem2,
  orderItem3,
]

- conceptually :

Product
id: 1
name: "Biryani"

orderItems:
[
   OrderItem 1,
   OrderItem 2,
   OrderItem 3
]