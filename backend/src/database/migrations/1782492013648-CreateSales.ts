import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSales1782492013648 implements MigrationInterface {
  name = 'CreateSales1782492013648';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`sale_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`sale_id\` int NOT NULL, \`product_id\` int NOT NULL, \`quantity\` int NOT NULL, \`unit_price\` decimal(10,2) NOT NULL, \`line_total\` decimal(12,2) NOT NULL, INDEX \`IDX_sale_item_product\` (\`product_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`sales\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NOT NULL, \`total\` decimal(12,2) NOT NULL, INDEX \`IDX_sale_user\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sale_items\` ADD CONSTRAINT \`FK_c210a330b80232c29c2ad68462a\` FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sale_items\` ADD CONSTRAINT \`FK_4ecae62db3f9e9cc9a368d57adb\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales\` ADD CONSTRAINT \`FK_5f282f3656814ec9ca2675aef6f\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`sales\` DROP FOREIGN KEY \`FK_5f282f3656814ec9ca2675aef6f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sale_items\` DROP FOREIGN KEY \`FK_4ecae62db3f9e9cc9a368d57adb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sale_items\` DROP FOREIGN KEY \`FK_c210a330b80232c29c2ad68462a\``,
    );
    await queryRunner.query(`DROP INDEX \`IDX_sale_user\` ON \`sales\``);
    await queryRunner.query(`DROP TABLE \`sales\``);
    await queryRunner.query(`DROP INDEX \`IDX_sale_item_product\` ON \`sale_items\``);
    await queryRunner.query(`DROP TABLE \`sale_items\``);
  }
}
