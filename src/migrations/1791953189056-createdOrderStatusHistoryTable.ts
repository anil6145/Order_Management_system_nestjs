import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatedOrderStatusHistoryTable1791953189056 implements MigrationInterface {
    name = 'CreatedOrderStatusHistoryTable1791953189056'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_management"."order_status_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "from_status" character varying(30), "to_status" character varying(30) NOT NULL, "reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "changed_by" uuid, CONSTRAINT "PK_e6c66d853f155531985fc4f6ec8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`COMMENT ON TABLE "order_management"."order_status_history" IS 'Stores order status change history'`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "order_number" SET DEFAULT 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_management.order_number_seq')::TEXT,6,'0')`);
        await queryRunner.query(`ALTER TABLE "order_management"."order_status_history" ADD CONSTRAINT "FK_de5bb51ff61072261b6b3419f83" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."order_status_history" DROP CONSTRAINT "FK_de5bb51ff61072261b6b3419f83"`);
        await queryRunner.query(`ALTER TABLE "order_management"."orders" ALTER COLUMN "order_number" SET DEFAULT ((('ORD-'|| to_char((CURRENT_DATE), 'YYYYMMDD')) || '-') || lpad((nextval('order_management.order_number_seq')), 6, '0'))`);
        await queryRunner.query(`COMMENT ON TABLE "order_management"."order_status_history" IS NULL`);
        await queryRunner.query(`DROP TABLE "order_management"."order_status_history"`);
    }

}
