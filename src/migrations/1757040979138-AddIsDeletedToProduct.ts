import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDeletedToProduct1757040979138 implements MigrationInterface {
    name = 'AddIsDeletedToProduct1757040979138' 
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "isDeleted"`);
    }

}
