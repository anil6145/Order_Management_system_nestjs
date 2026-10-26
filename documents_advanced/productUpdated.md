
- @PrimaryGeneratedColumn('uuid')
id: string;
> id automatically generated UUID that uniquely identifies each product 

- @Column({ type: 'varchar', length: 50, unique: true })
sku: string;
> Stock keeping Unit a unique business identifier used to identify a track a product in inventory 

> here UUID is the database identifier used for relationships the SKU is a meaningful inventory identifier used in the business operations 

@Column({ type: 'uuid', name: 'category_id' })
categoryId: string;

@ManyToMany(() => Category, (category) => category.products, {
  nullable: false,
  onDelete: 'RESTRICT',
})
@JoinColumn({ name: 'category_id' })
category: Category;
> categoryId : stores a category UUID
> @ManyToMany() : defines many-to-many relationship
> @JoinColumn() : specifies a join column for a relationship 

## SKU : Stock Keeping unit 
> it is a unique code assigned to each product to identify and track it in inventory 

- example :
Chicken Biryani → BIR-CHICKEN-001
Mutton Biryani → BIR-MUTTON-001
Paneer Tikka → STA-PANEER-001

## why we use SKU :
## product identification :
> identify product quickly without relying only on their names or UUIDs
## inventory management :
> track stock movements , low-stock alerts and product availability 

> here a product id (UUID) is a database primary key where SKU identifies a product for business and inventory operations 

> with the SKU the admin can identify the product as BIR-CHICKEN-001 more easily in inventory screens,reports, or barcode systems 

> SKU is a human readable code used for inventory operations, stock tracking, reports and barcode integration 

## why we use the category_id in product table :
> establish relationships connect products to their categories through a foreign key 
> avoid duplicate data : store the category name once in categories instead of repeating it in every product 

> filter products : retrieve all products in a category such all biryani products 
> simplify maintanance : renaming a category doesn't require updating the category name in every product 

## low_stock_threshold :
> low-stock alerts : notify admins when stock falls below the configured level
> inventory planning : help staff decide when to purchase or prepare more products
> prevent stockouts : reduce the risk of product becomming unavailable 
> product specific rules : different products can have different thresholds 