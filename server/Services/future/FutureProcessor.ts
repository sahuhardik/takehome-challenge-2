import { FutureType } from '@server/services/future/Future';
import FutureMetadata, { FutureDependency } from '@server/services/future/FutureMetadata';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

export default interface FutureProcessor<T extends FutureType> {
  type: FutureType;

  handle(
    log: Logger,
    em: EntityManager,
    metadata: FutureMetadata<T>,
    dependency: FutureDependency<T>[]
  ): Promise<FutureMetadata<T> | false>;
}
