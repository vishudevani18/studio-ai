import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateGeneratedImagesTable1736400000000 implements MigrationInterface {
  name = 'CreateGeneratedImagesTable1736400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'generated_images',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'industry_id',
            type: 'uuid',
          },
          {
            name: 'category_id',
            type: 'uuid',
          },
          {
            name: 'product_type_id',
            type: 'uuid',
          },
          {
            name: 'product_pose_id',
            type: 'uuid',
          },
          {
            name: 'product_theme_id',
            type: 'uuid',
          },
          {
            name: 'product_background_id',
            type: 'uuid',
          },
          {
            name: 'ai_face_id',
            type: 'uuid',
          },
          {
            name: 'image_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'image_path',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'generation_status',
            type: 'enum',
            enum: ['success', 'failed'],
            default: "'success'",
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'generation_time_ms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes ONLY on: createdAt, generationStatus, industryId, productTypeId, expiresAt
    await queryRunner.createIndex(
      'generated_images',
      new TableIndex({
        name: 'IDX_generated_images_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'generated_images',
      new TableIndex({
        name: 'IDX_generated_images_generation_status',
        columnNames: ['generation_status'],
      }),
    );

    await queryRunner.createIndex(
      'generated_images',
      new TableIndex({
        name: 'IDX_generated_images_industry_id',
        columnNames: ['industry_id'],
      }),
    );

    await queryRunner.createIndex(
      'generated_images',
      new TableIndex({
        name: 'IDX_generated_images_product_type_id',
        columnNames: ['product_type_id'],
      }),
    );

    await queryRunner.createIndex(
      'generated_images',
      new TableIndex({
        name: 'IDX_generated_images_expires_at',
        columnNames: ['expires_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('generated_images', 'IDX_generated_images_expires_at');
    await queryRunner.dropIndex('generated_images', 'IDX_generated_images_product_type_id');
    await queryRunner.dropIndex('generated_images', 'IDX_generated_images_industry_id');
    await queryRunner.dropIndex('generated_images', 'IDX_generated_images_generation_status');
    await queryRunner.dropIndex('generated_images', 'IDX_generated_images_created_at');
    await queryRunner.dropTable('generated_images');
  }
}

