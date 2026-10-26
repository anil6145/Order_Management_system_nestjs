import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1791440503053 implements MigrationInterface {
    name = 'CreateUsersTable1791440503053'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "auth"."users_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "auth"."users" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "email" character varying NOT NULL, "password" character varying(255) NOT NULL, "role" "auth"."users_role_enum" NOT NULL, "created_At" TIMESTAMP NOT NULL DEFAULT now(), "updated_At" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`COMMENT ON TABLE "auth"."users" IS 'stores user information'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON TABLE "auth"."users" IS NULL`);
        await queryRunner.query(`DROP TABLE "auth"."users"`);
        await queryRunner.query(`DROP TYPE "auth"."users_role_enum"`);
    }

}
