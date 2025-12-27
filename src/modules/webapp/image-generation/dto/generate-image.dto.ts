import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateImageDto {
  @ApiProperty({ description: 'Industry ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  industryId: string;

  @ApiProperty({ description: 'Category ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'Product Type ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsString()
  @IsNotEmpty()
  productTypeId: string;

  @ApiProperty({ description: 'Product Pose ID', example: '123e4567-e89b-12d3-a456-426614174003' })
  @IsString()
  @IsNotEmpty()
  productPoseId: string;

  @ApiProperty({ description: 'Product Theme ID', example: '123e4567-e89b-12d3-a456-426614174004' })
  @IsString()
  @IsNotEmpty()
  productThemeId: string;

  @ApiProperty({ description: 'Product Background ID', example: '123e4567-e89b-12d3-a456-426614174005' })
  @IsString()
  @IsNotEmpty()
  productBackgroundId: string;

  @ApiProperty({ description: 'AI Face ID', example: '123e4567-e89b-12d3-a456-426614174006' })
  @IsString()
  @IsNotEmpty()
  aiFaceId: string;

  @ApiProperty({ description: 'Base64 encoded product image', example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...' })
  @IsString()
  @IsNotEmpty()
  productImage: string; // Base64 encoded image

  @ApiProperty({ description: 'MIME type of the product image', example: 'image/jpeg', enum: ['image/jpeg', 'image/png', 'image/webp'] })
  @IsString()
  @IsNotEmpty()
  productImageMimeType: string; // e.g., 'image/jpeg'
}

