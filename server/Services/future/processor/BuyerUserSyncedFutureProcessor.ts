import { Injectable } from '@nestjs/common';
import { HdphotohubIntegrationsType, RelaIntegrationsType } from '@server/enums';
import MemberRelationship from '@server/model/member-relationship.entity';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata, { FutureDependency } from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class BuyerUserSyncedFutureProcessor implements FutureProcessor<FutureType.CALLBACK_BUYER_USER_SYNCED> {
  type = FutureType.CALLBACK_BUYER_USER_SYNCED;

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.CALLBACK_BUYER_USER_SYNCED>,
    dependencies: FutureDependency<FutureType.CALLBACK_BUYER_USER_SYNCED>[]
  ): Promise<FutureMetadata<FutureType.CALLBACK_BUYER_USER_SYNCED> | false> {
    if (dependencies.length !== 1) {
      throw new Error('expected only one dependency.');
    }

    const dependency = dependencies[0];

    if (dependency.type === FutureType.INTEGRATION_HD_PHOTO_HUB || dependency.type === FutureType.INTEGRATION_RELA) {
      if (
        dependency.metadata.type !== HdphotohubIntegrationsType.ENSURE_USER_EXISTS &&
        dependency.metadata.type !== RelaIntegrationsType.ENSURE_USER_EXISTS
      ) {
        throw new Error(`Invalid HdPhotoHub integration type.`);
      }

      const response = dependency.metadata.response;

      await em.update(
        MemberRelationship,
        { id: metadata.buyerRelId },
        { micrositeUserId: String(response.externalUserId) }
      );
      return {
        ...metadata,
        externalUserId: String(response.externalUserId),
      };
    }

    throw new Error(`Invalid future dependency.`);
  }
}
