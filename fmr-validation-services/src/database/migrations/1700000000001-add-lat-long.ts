import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLatLong1700000000001 implements MigrationInterface {
  name = 'AddLatLong1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasLatitude = await queryRunner.hasColumn('projects', 'latitude');
    if (!hasLatitude) {
      await queryRunner.addColumn(
        'projects',
        new TableColumn({
          name: 'latitude',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    const hasLongitude = await queryRunner.hasColumn('projects', 'longitude');
    if (!hasLongitude) {
      await queryRunner.addColumn(
        'projects',
        new TableColumn({
          name: 'longitude',
          type: 'text',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasLatitude = await queryRunner.hasColumn('projects', 'latitude');
    if (hasLatitude) {
      await queryRunner.dropColumn('projects', 'latitude');
    }
    const hasLongitude = await queryRunner.hasColumn(
      'projects',
      'longitude',
    );
    if (hasLongitude) {
      await queryRunner.dropColumn('projects', 'longitude');
    }
  }
}
