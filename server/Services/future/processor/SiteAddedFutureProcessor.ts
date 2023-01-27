import { Injectable } from '@nestjs/common';
import { HdphotohubIntegrationsType, MicrositeStatus, RelaIntegrationsType } from '@server/enums';
import Order from '@server/model/order.entity';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata, { FutureDependency } from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class SiteAddedFutureProcessor implements FutureProcessor<FutureType.CALLBACK_SITE_ADDED> {
  type = FutureType.CALLBACK_SITE_ADDED;

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.CALLBACK_SITE_ADDED>,
    dependencies: FutureDependency<FutureType.CALLBACK_SITE_ADDED>[]
  ): Promise<FutureMetadata<FutureType.CALLBACK_SITE_ADDED> | false> {
    if (dependencies.length !== 1) {
      throw new Error('expected only one dependency.');
    }

    const dependency = dependencies[0];

    const isHdph = dependency.type === FutureType.INTEGRATION_HD_PHOTO_HUB;
    const isRela = dependency.type === FutureType.INTEGRATION_RELA;

    if (isHdph || isRela) {
      if (
        dependency.metadata.type !== HdphotohubIntegrationsType.CREATE_SITE &&
        dependency.metadata.type !== RelaIntegrationsType.CREATE_SITE
      ) {
        throw new Error(`Invalid future metadata type.`);
      }

      await em.update(
        Order,
        { id: metadata.internalOrderId },
        {
          micrositeId: String(dependency.metadata.response.externalSiteId),
          micrositeStatus: MicrositeStatus.CREATED,
        }
      );

      return {
        ...metadata,
        externalSiteId: String(dependency.metadata.response.externalSiteId),
      };
    }

    throw new Error(`Invalid future dependency.`);
  }
}
