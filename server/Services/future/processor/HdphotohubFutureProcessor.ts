import { Injectable } from '@nestjs/common';
import { HdphotohubIntegrationsType } from '@server/enums';
import { VendorBuyerRelationshipEntity } from '@server/model/member-relationship.entity';
import MemberEntity from '@server/model/member.entity';
import { FutureType } from '@server/services/future/Future';
import FutureMetadata, { FutureDependency } from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { HdphotohubApi } from '@server/services/hd-photo-hub/HdphotohubApi';
import { HdphotohubContext } from '@server/services/hd-photo-hub/HdphotohubContext';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

@Injectable()
export class HdphotohubFutureProcessor implements FutureProcessor<FutureType.INTEGRATION_HD_PHOTO_HUB> {
  type = FutureType.INTEGRATION_HD_PHOTO_HUB;

  constructor(private readonly api: HdphotohubApi) {}

  async handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<FutureType.INTEGRATION_HD_PHOTO_HUB>,
    dependencies: FutureDependency<FutureType.INTEGRATION_HD_PHOTO_HUB>[]
  ): Promise<FutureMetadata<FutureType.INTEGRATION_HD_PHOTO_HUB>> {
    const context = await HdphotohubFutureProcessor.getContext(em, metadata.buyerRelId);
    let agentUserId: string;
    let siteId: string;
    const deliverableToMediaIdMap = new Map<string, string>();

    dependencies.forEach((d) => {
      if (d.type === FutureType.CALLBACK_BUYER_USER_SYNCED) {
        agentUserId = d.metadata.externalUserId;
      } else if (d.type === FutureType.CALLBACK_SITE_ADDED) {
        siteId = d.metadata.externalSiteId;
      } else if (d.type === FutureType.CALLBACK_DELIVERABLE_ADDED) {
        deliverableToMediaIdMap.set(d.metadata.internalDeliverableId, d.metadata.externalMediaId);
      }
    });

    switch (metadata.type) {
      case HdphotohubIntegrationsType.ENSURE_USER_EXISTS:
        return {
          ...metadata,
          response: await this.api.ensureUserExists(context, metadata.payload),
        };
      case HdphotohubIntegrationsType.CREATE_SITE: {
        const externalAgentUserId = metadata.payload?.externalAgentUserId || agentUserId;

        return {
          ...metadata,
          response: await this.api.createSite(context, {
            ...metadata.payload,
            externalAgentUserId,
          }),
        };
      }
      case HdphotohubIntegrationsType.ADD_DELIVERABLE_TO_SITE: {
        const externalSiteId = metadata.payload?.externalSiteId || siteId;
        return {
          ...metadata,
          response: await this.api.addDeliverableToSite(context, {
            ...metadata.payload,
            externalSiteId,
          }),
        };
      }
      case HdphotohubIntegrationsType.SORT_SITE_DELIVERABLES: {
        const externalSiteId = metadata.payload?.externalSiteId || siteId;
        await this.api.sortSiteDeliverables(context, {
          ...metadata.payload,
          externalSiteId,
          deliverableIds: (metadata.payload?.deliverableIds || []).map(
            deliverableToMediaIdMap.get.bind(deliverableToMediaIdMap)
          ),
        });
        return metadata;
      }
      case HdphotohubIntegrationsType.PUBLISH_SITE: {
        const externalSiteId = metadata.payload?.externalSiteId || siteId;
        await this.api.publishSite(context, {
          ...metadata.payload,
          externalSiteId,
        });
        return metadata;
      }
    }

    throw new Error(`HdPhotoHubIntegrationsType not implemented.`);
  }

  private static async getContext(em: EntityManager, buyerRelId: string) {
    const buyerRel = await em.findOne(VendorBuyerRelationshipEntity, buyerRelId);
    const vendor = await em.findOne(MemberEntity, buyerRel.vendorId);
    return new HdphotohubContext(buyerRel, vendor);
  }
}
