import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { ImageGenerationService } from './image-generation.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { GenerateImageResponseDto } from './dto/generate-image-response.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('WebApp - Image Generation')
@Controller('webapp')
export class ImageGenerationController {
  constructor(private readonly imageGenerationService: ImageGenerationService) {}

  @Public()
  @Post('generate-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate composite image using AI (Public)',
    description:
      'Generates a composite image using Google Gemini API. Accepts product catalog IDs (industry, category, product type, pose, theme, background, AI face) and a user-uploaded product image. The generated image is stored in GCS with public CDN access and automatically deleted after 6 hours. All generations are logged in the database for analytics.',
  })
  @ApiBody({ type: GenerateImageDto })
  @ApiResponse({
    status: 200,
    description: 'Image generated successfully',
    type: GenerateImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or missing reference images',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more reference IDs not found',
  })
  async generateImage(@Body() dto: GenerateImageDto) {
    const { imageUrl, expiresAt } = await this.imageGenerationService.generateImage(dto);

    const response: GenerateImageResponseDto = {
      success: true,
      imageUrl,
      message: 'Image generated successfully',
      expiresAt: expiresAt.toISOString(),
    };

    return ResponseUtil.success(response, 'Image generated successfully');
  }
}

