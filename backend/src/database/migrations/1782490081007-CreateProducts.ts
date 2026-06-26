import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1782490081007 implements MigrationInterface {
  name = 'CreateProducts1782490081007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`products\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(200) NOT NULL, \`description\` text NULL, \`price\` decimal(10,2) NOT NULL, \`stock_quantity\` int NOT NULL DEFAULT '0', \`category_id\` int NOT NULL, INDEX \`IDX_product_price\` (\`price\`), INDEX \`IDX_product_category\` (\`category_id\`), FULLTEXT INDEX \`IDX_product_fulltext\` (\`name\`, \`description\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD CONSTRAINT \`FK_9a5f6868c96e0069e699f33e124\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_9a5f6868c96e0069e699f33e124\``,
    );
    await queryRunner.query(`DROP INDEX \`IDX_product_fulltext\` ON \`products\``);
    await queryRunner.query(`DROP INDEX \`IDX_product_category\` ON \`products\``);
    await queryRunner.query(`DROP INDEX \`IDX_product_price\` ON \`products\``);
    await queryRunner.query(`DROP TABLE \`products\``);
  }
}
