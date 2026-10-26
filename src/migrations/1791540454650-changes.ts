import { MigrationInterface, QueryRunner } from "typeorm";

export class Changes1791540454650 implements MigrationInterface {
    name = 'Changes1791540454650'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth"."users" ALTER COLUMN "role" SET DEFAULT 'USER'`);
        await queryRunner.query(`ALTER TABLE "auth"."refresh_tokens" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "auth"."refresh_tokens" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth"."refresh_tokens" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "auth"."refresh_tokens" ADD "created_at" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "auth"."users" ALTER COLUMN "role" DROP DEFAULT`);
    }

}
