import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedOrderOrderItemCreatedOrderStatusHistoryTables1791953053377 implements MigrationInterface {
    name = 'UpdatedOrderOrderItemCreatedOrderStatusHistoryTables1791953053377'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."orders" DROP COLUMN "total"`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ADD "order_number" character varying(50) NOT NULL DEFAULT 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_management.order_number_seq')::TEXT,6,'0')`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ADD CONSTRAINT "UQ_75eba1c6b1a66b09f2a97e6927b" UNIQUE ("order_number")`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ADD "total_amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ADD "idempotency_key" character varying`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ADD CONSTRAINT "UQ_59d6b7756aeb6cbb43a093d15a1" UNIQUE ("idempotency_key")`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" ADD "unit_price" numeric(12,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" ADD "line_total" numeric(12,2) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" DROP COLUMN "line_total"`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" DROP COLUMN "unit_price"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" DROP CONSTRAINT "UQ_59d6b7756aeb6cbb43a093d15a1"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" DROP COLUMN "idempotency_key"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" DROP COLUMN "total_amount"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" DROP CONSTRAINT "UQ_75eba1c6b1a66b09f2a97e6927b"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" DROP COLUMN "order_number"`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_items" ADD "price" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ADD "total" numeric(10,2) NOT NULL`);
    }

}
