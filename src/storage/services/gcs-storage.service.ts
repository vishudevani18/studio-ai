import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcsStorageService {
  private readonly logger = new Logger(GcsStorageService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly cdnBaseUrl: string;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('app.storage.gcs.projectId');
    this.bucketName = this.configService.get<string>('app.storage.gcs.bucketName');
    this.cdnBaseUrl = this.configService.get<string>('app.storage.gcs.cdnBaseUrl');
console.log('GcsStorageService constructor', projectId, this.bucketName, this.cdnBaseUrl);
    try {
      this.storage = new Storage({
        projectId,
      });
    } catch (error) {
      this.logger.error('Failed to initialize GCS client', error);
      throw new Error('GCS initialization failed');
    }
  }

  /**
   * Upload a file to GCS as public (permanent CDN URL)
   * @param buffer File buffer
   * @param path GCS path (e.g., 'product-backgrounds/{id}/image.jpg')
   * @param mimetype MIME type of the file (required)
   * @returns Public CDN URL: https://storage.googleapis.com/{bucket}/{path}
   */
  async uploadPublicFile(buffer: Buffer, path: string, mimetype: string): Promise<string> {
    if (!mimetype) {
      throw new BadRequestException('Content type (mimetype) is required for file upload');
    }
    console.log('uploadPublicFile', buffer, path, mimetype);

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(path);

      // Upload file with metadata (overwrites if exists)
      await file.save(buffer, {
        metadata: {
          contentType: mimetype,
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
      });

      // Make file publicly readable
      await file.makePublic();

      this.logger.log(`Public file uploaded successfully: ${path}`);

      // Return public CDN URL
      return this.getPublicUrl(path);
    } catch (error) {
      this.logger.error(`Failed to upload public file to GCS: ${path}`, error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Get public CDN URL from GCS path
   * @param path GCS path
   * @returns Public CDN URL: https://storage.googleapis.com/{bucket}/{path}
   */
  getPublicUrl(path: string): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `https://storage.googleapis.com/${this.bucketName}/${cleanPath}`;
  }

  /**
   * Upload a file to GCS (private, not public) - DEPRECATED: Use uploadPublicFile() instead
   * @param buffer File buffer
   * @param path GCS path (e.g., 'product-backgrounds/{id}/image.jpg')
   * @param mimetype MIME type of the file
   * @returns Signed URL (expires in 1 hour) - file is stored privately
   * @deprecated Use uploadPublicFile() for permanent public images
   */
  async uploadFile(buffer: Buffer, path: string, mimetype: string): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(path);

      await file.save(buffer, {
        metadata: {
          contentType: mimetype,
        },
        // File is private by default - use signed URLs for access
      });

      this.logger.log(`File uploaded successfully: ${path}`);
      
      // Generate and return a signed URL (expires in 1 hour)
      // Note: This URL will expire. Use getSignedUrl() to regenerate if needed
      const signedUrl = await this.getSignedUrl(path, 3600000); // 1 hour
      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file to GCS: ${path}`, error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete a file from GCS
   * @param path GCS path to delete
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(path);
      await file.delete();
      this.logger.log(`File deleted successfully: ${path}`);
    } catch (error) {
      // If file doesn't exist, that's okay
      if (error.code === 404) {
        this.logger.warn(`File not found for deletion: ${path}`);
        return;
      }
      this.logger.error(`Failed to delete file from GCS: ${path}`, error);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for a file (expires in 1 hour by default)
   * @param path GCS path
   * @param expiresIn Expiration time in milliseconds (default: 1 hour)
   * @returns Signed URL that provides temporary access to the file
   */
  async getSignedUrl(path: string, expiresIn: number = 3600000): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(path);

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn,
      });

      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for: ${path}`, error);
      throw new BadRequestException(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for a file path (convenience method that accepts full URL or path)
   * @param pathOrUrl GCS path or previously generated URL
   * @param expiresIn Expiration time in milliseconds (default: 1 hour)
   * @returns Signed URL
   */
  async getFileUrl(pathOrUrl: string, expiresIn: number = 3600000): Promise<string> {
    // Extract path if it's a URL
    const path = this.extractPathFromUrl(pathOrUrl);
    return this.getSignedUrl(path, expiresIn);
  }

  /**
   * Download a file from GCS and return as Buffer
   * @param path GCS path or public URL
   * @returns File buffer
   */
  async downloadFile(pathOrUrl: string): Promise<Buffer> {
    try {
      const path = this.extractPathFromUrl(pathOrUrl);
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(path);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new BadRequestException(`File not found: ${path}`);
      }

      // Download file as buffer
      const [buffer] = await file.download();
      this.logger.log(`File downloaded successfully: ${path}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download file from GCS: ${pathOrUrl}`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Extract GCS path from URL (handles public URLs, signed URLs, and old CDN URLs)
   * @param url URL (public GCS URL, signed URL, or old CDN URL format)
   * @returns GCS path
   */
  extractPathFromUrl(url: string): string {
    // Handle public GCS URLs: https://storage.googleapis.com/{bucket}/{path}
    const publicUrlPattern = new RegExp(`https://storage\\.googleapis\\.com/${this.bucketName}/(.+?)(\\?|$)`);
    const publicMatch = url.match(publicUrlPattern);
    if (publicMatch && publicMatch[1]) {
      return decodeURIComponent(publicMatch[1]);
    }

    // Handle signed URLs (they contain the path in query params or path)
    if (url.includes('storage.googleapis.com')) {
      const urlObj = new URL(url);
      // Extract path from signed URL or regular GCS URL
      const pathMatch = url.match(/\/[^\/]+\/(.+?)(\?|$)/);
      if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1]);
      }
    }

    // Handle old CDN URL format
    const baseUrl = `${this.cdnBaseUrl}/${this.bucketName}/`;
    if (url.startsWith(baseUrl)) {
      return url.replace(baseUrl, '');
    }

    // If it's already a path, return as-is
    return url;
  }
}

