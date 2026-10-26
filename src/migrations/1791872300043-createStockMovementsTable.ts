import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStockMovementsTable1791872300043 implements MigrationInterface {
    name = 'CreateStockMovementsTable1791872300043'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_management"."stock_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity_change" integer NOT NULL, "reason" character varying(250) NOT NULL, "reference_type" character varying(50), "reference_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "product_id" uuid NOT NULL, "created_by" uuid NOT NULL, CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order_management"."stock_movements" ADD CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6" FOREIGN KEY ("product_id") REFERENCES "order_management"."products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_management"."stock_movements" ADD CONSTRAINT "FK_0d3747894dc26f5f5c34f640d23" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."stock_movements" DROP CONSTRAINT "FK_0d3747894dc26f5f5c34f640d23"`);
        await queryRunner.query(`ALTER TABLE "order_management"."stock_movements" DROP CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6"`);
        await queryRunner.query(`DROP TABLE "order_management"."stock_movements"`);
    }

}
