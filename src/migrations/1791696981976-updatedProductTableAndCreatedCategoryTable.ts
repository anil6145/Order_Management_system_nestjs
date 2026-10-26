import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedProductTableAndCreatedCategoryTable1791696981976 implements MigrationInterface {
    name = 'UpdatedProductTableAndCreatedCategoryTable1791696981976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_management"."categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD "sku" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku")`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD "category_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD "low_stock_threshold" integer NOT NULL DEFAULT '5'`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD "version" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ALTER COLUMN "price" TYPE numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ALTER COLUMN "stock" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ALTER COLUMN "stock" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ALTER COLUMN "price" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP COLUMN "version"`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP COLUMN "low_stock_threshold"`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP COLUMN "category_id"`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327"`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP COLUMN "sku"`);
        await queryRunner.query(`DROP TABLE "order_management"."categories"`);
    }

}
