import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateIdentityAndAuthorizationTables1793923200000 implements MigrationInterface {
  name = 'CreateIdentityAndAuthorizationTables1793923200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'customer_users',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'email', type: 'varchar', length: '320', isNullable: false },
        { name: 'password_hash', type: 'varchar', length: '255', isNullable: false },
        { name: 'status', type: 'enum', enum: ['active', 'disabled'], default: "'active'" },
        { name: 'created_at', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
        { name: 'updated_at', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' },
      ],
      indices: [new TableIndex({ name: 'uq_customer_users_email', columnNames: ['email'], isUnique: true })],
    }), true);

    await queryRunner.createTable(new Table({
      name: 'admin_users',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'email', type: 'varchar', length: '320', isNullable: false },
        { name: 'password_hash', type: 'varchar', length: '255', isNullable: false },
        { name: 'status', type: 'enum', enum: ['active', 'disabled'], default: "'active'" },
        { name: 'created_at', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
        { name: 'updated_at', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' },
      ],
      indices: [new TableIndex({ name: 'uq_admin_users_email', columnNames: ['email'], isUnique: true })],
    }), true);

    await queryRunner.createTable(new Table({
      name: 'roles',
      columns: [
        { name: 'id', type: 'char', length: '36', isPrimary: true },
        { name: 'code', type: 'varchar', length: '64', isUnique: true },
        { name: 'name', type: 'varchar', length: '120' },
        { name: 'description', type: 'varchar', length: '255', isNullable: true },
        { name: 'is_system', type: 'boolean', default: false },
        { name: 'created_at', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
        { name: 'updated_at', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' },
      ],
    }), true);

    await queryRunner.createTable(new Table({
      name: 'casbin_rule',
      columns: [
        { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'ptype', type: 'varchar', length: '255', isNullable: false },
        ...['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6'].map((name) => ({ name, type: 'varchar', length: '255', isNullable: true })),
      ],
      indices: [new TableIndex({ name: 'idx_casbin_rule_ptype', columnNames: ['ptype'] })],
    }), true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['casbin_rule', 'roles', 'admin_users', 'customer_users']) {
      await queryRunner.dropTable(table, true, true, true);
    }
  }
}
