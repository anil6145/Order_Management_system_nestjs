import { MigrationInterface, QueryRunner } from "typeorm";

export class AnyChanges1791969011065 implements MigrationInterface {
    name = 'AnyChanges1791969011065'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."order_status_history" ADD "order_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "order_number" SET DEFAULT 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_management.order_number_seq')::TEXT,6,'0')`);
        await queryRunner.query(`CREATE INDEX "idx_order_status_history_order_id" ON "order_management"."order_status_history"  ("order_id") `);
        await queryRunner.query(`ALTER TABLE "order_management"."order_status_history" ADD CONSTRAINT "FK_1ca7d5228cf9dc589b60243933c" FOREIGN KEY ("order_id") REFERENCES "order_management"."orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."order_status_history" DROP CONSTRAINT "FK_1ca7d5228cf9dc589b60243933c"`);
        await queryRunner.query(`DROP INDEX "order_management"."idx_order_status_history_order_id"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "order_number" SET DEFAULT ((('ORD-'|| to_char((CURRENT_DATE), 'YYYYMMDD')) || '-') || lpad((nextval('order_management.order_number_seq')), 6, '0'))`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_status_history" DROP COLUMN "order_id"`);
    }

}
