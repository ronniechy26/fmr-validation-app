import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class Init1700000000000 implements MigrationInterface {
  name = 'Init1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasProjects = await queryRunner.hasTable('projects');
    if (!hasProjects) {
      await queryRunner.createTable(
        new Table({
          name: 'projects',
          columns: [
            { name: 'id', type: 'text', isPrimary: true },
            { name: 'projectCode', type: 'text', isUnique: true },
            { name: 'title', type: 'text' },
            { name: 'operatingUnit', type: 'text', isNullable: true },
            { name: 'bannerProgram', type: 'text', isNullable: true },
            { name: 'yearFunded', type: 'int', isNullable: true },
            { name: 'projectType', type: 'text', isNullable: true },
            { name: 'region', type: 'text', isNullable: true },
            { name: 'province', type: 'text', isNullable: true },
            { name: 'district', type: 'text', isNullable: true },
            { name: 'municipality', type: 'text', isNullable: true },
            { name: 'barangay', type: 'text', isNullable: true },
            { name: 'stage', type: 'text', isNullable: true },
            { name: 'status', type: 'text', isNullable: true },
            { name: 'author', type: 'text', isNullable: true },
            { name: 'quantity', type: 'text', isNullable: true },
            { name: 'quantityUnit', type: 'text', isNullable: true },
            {
              name: 'allocatedAmount',
              type: 'numeric',
              precision: 18,
              scale: 2,
              isNullable: true,
            },
            { name: 'beneficiary', type: 'text', isNullable: true },
            { name: 'prexcProgram', type: 'text', isNullable: true },
            { name: 'subProgram', type: 'text', isNullable: true },
            { name: 'indicatorLevel1', type: 'text', isNullable: true },
            { name: 'indicatorLevel3', type: 'text', isNullable: true },
            { name: 'recipientType', type: 'text', isNullable: true },
            { name: 'budgetProcess', type: 'text', isNullable: true },
            { name: 'latitude', type: 'text', isNullable: true },
            { name: 'longitude', type: 'text', isNullable: true },
            { name: 'abemisId', type: 'text', isNullable: true },
            { name: 'qrReference', type: 'text', isNullable: true },
            { name: 'zone', type: 'text', isNullable: true },
            {
              name: 'geotags',
              type: 'jsonb',
              default: `'[]'::jsonb`,
            },
            {
              name: 'proposalDocuments',
              type: 'jsonb',
              default: `'[]'::jsonb`,
            },
            {
              name: 'createdAt',
              type: 'timestamp with time zone',
              default: 'now()',
            },
            {
              name: 'updatedAt',
              type: 'timestamp with time zone',
              default: 'now()',
            },
          ],
        }),
        true,
      );
    }

    const hasForms = await queryRunner.hasTable('form_records');
    if (!hasForms) {
      await queryRunner.createTable(
        new Table({
          name: 'form_records',
          columns: [
            { name: 'id', type: 'text', isPrimary: true },
            { name: 'annexTitle', type: 'text' },
            { name: 'status', type: 'text' },
            { name: 'abemisId', type: 'text', isNullable: true },
            { name: 'qrReference', type: 'text', isNullable: true },
            { name: 'project_id', type: 'text', isNullable: true },
            { name: 'data', type: 'jsonb' },
            {
              name: 'createdAt',
              type: 'timestamp with time zone',
              default: 'now()',
            },
            {
              name: 'updatedAt',
              type: 'timestamp with time zone',
              default: 'now()',
            },
          ],
        }),
        true,
      );
    }

    const formsTable = await queryRunner.getTable('form_records');
    const hasFk =
      formsTable?.foreignKeys.some((fk) =>
        fk.columnNames.includes('project_id'),
      ) ?? false;
    if (!hasFk) {
      await queryRunner.createForeignKey(
        'form_records',
        new TableForeignKey({
          columnNames: ['project_id'],
          referencedTableName: 'projects',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const formsTable = await queryRunner.getTable('form_records');
    const fk = formsTable?.foreignKeys.find((key) =>
      key.columnNames.includes('project_id'),
    );
    if (fk) {
      await queryRunner.dropForeignKey('form_records', fk);
    }
    const hasForms = await queryRunner.hasTable('form_records');
    if (hasForms) {
      await queryRunner.dropTable('form_records');
    }
    const hasProjects = await queryRunner.hasTable('projects');
    if (hasProjects) {
      await queryRunner.dropTable('projects');
    }
  }
}
