import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuditTable1792651957226 implements MigrationInterface {
    name = 'CreateAuditTable1792651957226'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_management"."audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "entity_type" character varying(30) NOT NULL, "entity_id" uuid NOT NULL, "action" character varying(30) NOT NULL, "old_values" jsonb, "new_values" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2f68e345c05e8166ff9deea1ab" ON "order_management"."audit_logs"  ("user_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_7421efc125d95e413657efa3c6" ON "order_management"."audit_logs"  ("entity_type", "entity_id") `);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "order_number" SET DEFAULT 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_management.order_number_seq')::TEXT,6,'0')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "order_number" SET DEFAULT ((('ORD-'|| to_char((CURRENT_DATE), 'YYYYMMDD')) || '-') || lpad((nextval('order_management.order_number_seq')), 6, '0'))`);
        await queryRunner.query(`DROP INDEX "order_management"."IDX_7421efc125d95e413657efa3c6"`);
        await queryRunner.query(`DROP INDEX "order_management"."IDX_2f68e345c05e8166ff9deea1ab"`);
        await queryRunner.query(`DROP TABLE "order_management"."audit_logs"`);
    }

}
