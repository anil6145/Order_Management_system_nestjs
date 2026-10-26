import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTheTables1791865279415 implements MigrationInterface {
    name = 'UpdateTheTables1791865279415'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "order_management"."categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`);
        await queryRunner.query(`ALTER TABLE "order_management"."products" DROP COLUMN "deleted_at"`);
    }

}
