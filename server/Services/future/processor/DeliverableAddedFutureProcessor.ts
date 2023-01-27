import { Injectable } from '@nestjs/common';
import { HdphotohubIntegrationsType, MicrositeDeliverableStatus, RelaIntegrationsType } from '@server/enums';
import Deliverable from '@server/model/deliverable.entity';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata, { FutureDependency } from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class DeliverableAddedFutureProcessor implements FutureProcessor<FutureType.CALLBACK_DELIVERABLE_ADDED> {
  type = FutureType.CALLBACK_DELIVERABLE_ADDED;

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.CALLBACK_DELIVERABLE_ADDED>,
    dependencies: FutureDependency<FutureType.CALLBACK_DELIVERABLE_ADDED>[]
  ): Promise<FutureMetadata<FutureType.CALLBACK_DELIVERABLE_ADDED> | false> {
    if (dependencies.length !== 1) {
      throw new Error('expected only one dependency.');
    }

    const dependency = dependencies[0];

    if (dependency.type === FutureType.INTEGRATION_HD_PHOTO_HUB || dependency.type === FutureType.INTEGRATION_RELA) {
      if (
        dependency.metadata.type !== HdphotohubIntegrationsType.ADD_DELIVERABLE_TO_SITE &&
        dependency.metadata.type !== RelaIntegrationsType.ADD_DELIVERABLE_TO_SITE
      ) {
        throw new Error(`Invalid future metadata type.`);
      }

      await em.update(
        Deliverable,
        { id: metadata.internalDeliverableId },
        {
          micrositeMediaId: String(dependency.metadata.response.externalDeliverableId),
          micrositeStatus: MicrositeDeliverableStatus.SYNCED,
        }
      );
      return {
        ...metadata,
        externalMediaId: String(dependency.metadata.response.externalDeliverableId),
      };
    }

    throw new Error(`Invalid future dependency.`);
  }
}
