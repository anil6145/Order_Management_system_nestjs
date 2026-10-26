import { MigrationInterface, QueryRunner } from "typeorm";

export class AnyChanges1791969345163 implements MigrationInterface {
    name = 'AnyChanges1791969345163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "order_number" SET DEFAULT 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_management.order_number_seq')::TEXT,6,'0')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "order_number" SET DEFAULT ((('ORD-'|| to_char((CURRENT_DATE), 'YYYYMMDD')) || '-') || lpad((nextval('order_management.order_number_seq')), 6, '0'))`);
    }

}
