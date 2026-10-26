import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderProductOrderItemsTables1791458552854 implements MigrationInterface {
    name = 'CreateOrderProductOrderItemsTables1791458552854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_management"."order_items" ("id" SERIAL NOT NULL, "quantity" integer NOT NULL, "price" numeric(10,2) NOT NULL, "order_id" integer NOT NULL, "product_id" integer NOT NULL, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`COMMENT ON TABLE "order_management"."order_items" IS 'stores the order_items'`);
        await queryRunner.query(`CREATE TYPE "order_management"."products_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
        await queryRunner.query(`CREATE TABLE "order_management"."products" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "stock" integer NOT NULL, "status" "order_management"."products_status_enum" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`COMMENT ON TABLE "order_management"."products" IS 'it stores products'`);
        await queryRunner.query(`CREATE TYPE "order_management"."orders_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "order_management"."orders" ("id" SERIAL NOT NULL, "total" numeric(10,2) NOT NULL, "status" "order_management"."orders_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`COMMENT ON TABLE "order_management"."orders" IS 'it stores the orders'`);
        await queryRunner.query(`CREATE TABLE "auth"."refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "token_hash" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`COMMENT ON TABLE "auth"."refresh_tokens" IS 'it stores the refresh tokens'`);
        await queryRunner.query(`CREATE TYPE "auth"."users_status_enum" AS ENUM('ACTIVE', 'DEACTIVATED')`);
        await queryRunner.query(`ALTER TABLE "auth"."users" ADD "status" "auth"."users_status_enum" NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "order_management"."products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "auth"."users" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "auth"."users_status_enum"`);
        await queryRunner.query(`COMMENT ON TABLE "auth"."refresh_tokens" IS NULL`);
        await queryRunner.query(`DROP TABLE "auth"."refresh_tokens"`);
        await queryRunner.query(`COMMENT ON TABLE "order_management"."orders" IS NULL`);
        await queryRunner.query(`DROP TABLE "order_management"."orders"`);
        await queryRunner.query(`DROP TYPE "order_management"."orders_status_enum"`);
        await queryRunner.query(`COMMENT ON TABLE "order_management"."products" IS NULL`);
        await queryRunner.query(`DROP TABLE "order_management"."products"`);
        await queryRunner.query(`DROP TYPE "order_management"."products_status_enum"`);
        await queryRunner.query(`COMMENT ON TABLE "order_management"."order_items" IS NULL`);
        await queryRunner.query(`DROP TABLE "order_management"."order_items"`);
    }

}
