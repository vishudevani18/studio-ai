import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum GenerationStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('generated_images')
export class GeneratedImage extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string; // Optional, for future user tracking

  @Index('IDX_generated_images_industry_id')
  @Column({ name: 'industry_id', type: 'uuid' })
  industryId: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Index('IDX_generated_images_product_type_id')
  @Column({ name: 'product_type_id', type: 'uuid' })
  productTypeId: string;

  @Column({ name: 'product_pose_id', type: 'uuid' })
  productPoseId: string;

  @Column({ name: 'product_theme_id', type: 'uuid' })
  productThemeId: string;

  @Column({ name: 'product_background_id', type: 'uuid' })
  productBackgroundId: string;

  @Column({ name: 'ai_face_id', type: 'uuid' })
  aiFaceId: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string; // GCS CDN URL (may be null after deletion)

  @Column({ name: 'image_path', type: 'text', nullable: true })
  imagePath?: string; // GCS path for deletion

  @Index('IDX_generated_images_generation_status')
  @Column({
    name: 'generation_status',
    type: 'enum',
    enum: GenerationStatus,
    default: GenerationStatus.SUCCESS,
  })
  generationStatus: GenerationStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string; // For failed generations

  @Column({ name: 'generation_time_ms', type: 'integer', nullable: true })
  generationTimeMs?: number; // Performance tracking

  @Index('IDX_generated_images_expires_at')
  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date; // 6 hours from creation
}

