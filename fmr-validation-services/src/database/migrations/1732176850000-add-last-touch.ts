import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastTouch1732176850000 implements MigrationInterface {
  name = 'AddLastTouch1732176850000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add lastTouch column with default to current timestamp
    await queryRunner.query(
      `ALTER TABLE "form_records" ADD COLUMN IF NOT EXISTS "lastTouch" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL`,
    );

    // Update existing records to set lastTouch = updatedAt
    await queryRunner.query(
      `UPDATE "form_records" SET "lastTouch" = "updatedAt" WHERE "lastTouch" IS NULL`,
    );

    // Create index on lastTouch for faster conflict resolution queries
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_form_records_last_touch" ON "form_records" ("lastTouch")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_form_records_last_touch"`,
    );
    await queryRunner.query(
      `ALTER TABLE "form_records" DROP COLUMN IF EXISTS "lastTouch"`,
    );
  }
}
