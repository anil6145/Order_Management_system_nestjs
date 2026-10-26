import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatedIndexs1791958245520 implements MigrationInterface {
    name = 'CreatedIndexs1791958245520'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth"."users" DROP COLUMN "created_At"`);
        await queryRunner.query(`ALTER TABLE "auth"."users" DROP COLUMN "updated_At"`);
        await queryRunner.query(`ALTER TABLE "auth"."users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "auth"."users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "order_number" SET DEFAULT 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_management.order_number_seq')::TEXT,6,'0')`);
        await queryRunner.query(`ALTER TYPE "order_management"."orders_status_enum" RENAME TO "orders_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "order_management"."order_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "status" TYPE "order_management"."order_status_enum" USING "status"::"text"::"order_management"."order_status_enum"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "order_management"."orders_status_enum_old"`);
        await queryRunner.query(`CREATE INDEX "idx_orders_status_createdAt" ON "order_management"."orders"  ("status", "created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_orders_user_created_at" ON "order_management"."orders"  ("user_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_order_items_product_id" ON "order_management"."order_items"  ("product_id") `);
        await queryRunner.query(`CREATE INDEX "idx_order_items_order_id" ON "order_management"."order_items"  ("order_id") `);
        await queryRunner.query(`CREATE INDEX "idx_products_name_trgm" ON "order_management"."products"  ("name") `);
        await queryRunner.query(`CREATE INDEX "idx_products_category_id" ON "order_management"."products"  ("category_id") `);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ADD CONSTRAINT "CHK_a9da9a8779815629ef00729cb8" CHECK ("status" IN ('PENDING', 'CONFIRMED','COMPLETED', 'CANCELLED'))`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" ADD CONSTRAINT "CHK_order_items_quantity_positive" CHECK ("quantity" >0)`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD CONSTRAINT "CHK_54ea1f95e427e98dac4a77a36f" CHECK ("stock" >=0)`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD CONSTRAINT "CHK_ba339f178553051542254ef21d" CHECK ("price" > 0)`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ADD CONSTRAINT "UQ_orders_user_idempotency" UNIQUE ("user_id", "idempotency_key")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."orders" DROP CONSTRAINT "UQ_orders_user_idempotency"`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP CONSTRAINT "CHK_ba339f178553051542254ef21d"`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP CONSTRAINT "CHK_54ea1f95e427e98dac4a77a36f"`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" DROP CONSTRAINT "CHK_order_items_quantity_positive"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" DROP CONSTRAINT "CHK_a9da9a8779815629ef00729cb8"`);
        await queryRunner.query(`DROP INDEX "order_management"."idx_products_category_id"`);
        await queryRunner.query(`DROP INDEX "order_management"."idx_products_name_trgm"`);
        await queryRunner.query(`DROP INDEX "order_management"."idx_order_items_order_id"`);
        await queryRunner.query(`DROP INDEX "order_management"."idx_order_items_product_id"`);
        await queryRunner.query(`DROP INDEX "order_management"."idx_orders_user_created_at"`);
        await queryRunner.query(`DROP INDEX "order_management"."idx_orders_status_createdAt"`);
        await queryRunner.query(`CREATE TYPE "order_management"."orders_status_enum_old" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "status" TYPE "order_management"."orders_status_enum_old" USING "status"::"text"::"order_management"."orders_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "order_management"."order_status_enum"`);
        await queryRunner.query(`ALTER TYPE "order_management"."orders_status_enum_old" RENAME TO "orders_status_enum"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "order_number" SET DEFAULT ((('ORD-'|| to_char((CURRENT_DATE), 'YYYYMMDD')) || '-') || lpad((nextval('order_management.order_number_seq')), 6, '0'))`);
        await queryRunner.query(`ALTER TABLE "auth"."users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "auth"."users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "auth"."users" ADD "updated_At" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "auth"."users" ADD "created_At" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
