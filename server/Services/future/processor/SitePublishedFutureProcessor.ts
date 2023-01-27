import { Injectable } from '@nestjs/common';
import { HdphotohubIntegrationsType, MicrositeStatus, RelaIntegrationsType } from '@server/enums';
import Order from '@server/model/order.entity';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata, { FutureDependency } from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class SitePublishedFutureProcessor implements FutureProcessor<FutureType.CALLBACK_SITE_PUBLISHED> {
  type = FutureType.CALLBACK_SITE_PUBLISHED;

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.CALLBACK_SITE_PUBLISHED>,
    dependencies: FutureDependency<FutureType.CALLBACK_SITE_PUBLISHED>[]
  ): Promise<FutureMetadata<FutureType.CALLBACK_SITE_PUBLISHED>> {
    if (dependencies.length !== 1) {
      throw new Error('expected only one dependency.');
    }

    const dependency = dependencies[0];

    if (dependency.type === FutureType.INTEGRATION_HD_PHOTO_HUB || dependency.type === FutureType.INTEGRATION_RELA) {
      if (
        dependency.metadata.type !== HdphotohubIntegrationsType.PUBLISH_SITE &&
        dependency.metadata.type !== RelaIntegrationsType.PUBLISH_SITE
      ) {
        throw new Error(`Invalid future metadata type.`);
      }

      await em.update(Order, { id: metadata.internalOrderId }, { micrositeStatus: MicrositeStatus.PUBLISHED });
      return metadata;
    }

    throw new Error(`Invalid future dependency.`);
  }
}
