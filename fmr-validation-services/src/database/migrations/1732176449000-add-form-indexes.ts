import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormIndexes1732176449000 implements MigrationInterface {
  name = 'AddFormIndexes1732176449000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add index on project_id for faster joins and lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_form_records_project_id" ON "form_records" ("project_id")`,
    );

    // Add index on updatedAt for incremental sync queries
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_form_records_updated_at" ON "form_records" ("updatedAt")`,
    );

    // Add index on status for filtering
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_form_records_status" ON "form_records" ("status")`,
    );

    // Add index on abemisId for attachment lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_form_records_abemis_id" ON "form_records" ("abemisId") WHERE "abemisId" IS NOT NULL`,
    );

    // Add index on qrReference for QR code lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_form_records_qr_reference" ON "form_records" ("qrReference") WHERE "qrReference" IS NOT NULL`,
    );

    // Add composite index for standalone drafts query (forms without project)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_form_records_standalone" ON "form_records" ("project_id") WHERE "project_id" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_form_records_standalone"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_form_records_qr_reference"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_form_records_abemis_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_form_records_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_form_records_updated_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_form_records_project_id"`,
    );
  }
}
