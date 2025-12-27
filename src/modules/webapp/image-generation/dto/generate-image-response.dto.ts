import { ApiProperty } from '@nestjs/swagger';

export class GenerateImageResponseDto {
  @ApiProperty({ description: 'Whether the generation was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'GCS CDN URL of the generated image', example: 'https://storage.googleapis.com/bucket/generated-images/123/image.jpg' })
  imageUrl: string; // GCS CDN URL

  @ApiProperty({ description: 'Response message', example: 'Image generated successfully' })
  message: string;

  @ApiProperty({ description: 'ISO timestamp when image will be deleted from GCS', example: '2024-01-15T12:00:00Z', required: false })
  expiresAt?: string; // ISO timestamp when image will be deleted from GCS
}

