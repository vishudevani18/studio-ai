import {
  EventSubscriber,
  EntitySubscriberInterface,
  DataSource,
} from 'typeorm';
import { GeneratedImage } from '../entities/generated-image.entity';
import { GcsStorageService } from '../../storage/services/gcs-storage.service';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
@EventSubscriber()
export class GeneratedImageCleanupSubscriber implements EntitySubscriberInterface, OnModuleInit {
  private readonly logger = new Logger(GeneratedImageCleanupSubscriber.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly gcsStorageService: GcsStorageService,
  ) {}

  onModuleInit() {
    // Register this subscriber with the data source after module initialization
    if (!this.dataSource.subscribers.includes(this as any)) {
      this.dataSource.subscribers.push(this as any);
    }
  }

  /**
   * Listen to GeneratedImage entity
   */
  listenTo(): Function {
    return GeneratedImage;
  }

  /**
   * Note: This subscriber is registered but cleanup is primarily handled
   * by ImageCleanupService.deleteExpiredImages() scheduled job.
   * This subscriber can be extended for event-based cleanup if needed.
   */
}

