import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormMeta1729550000000 implements MigrationInterface {
  name = 'AddFormMeta1729550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "form_records" ADD COLUMN IF NOT EXISTS "createdBy" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_records" ADD COLUMN IF NOT EXISTS "region" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "form_records" DROP COLUMN IF EXISTS "createdBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_records" DROP COLUMN IF EXISTS "region"`,
    );
  }
}
