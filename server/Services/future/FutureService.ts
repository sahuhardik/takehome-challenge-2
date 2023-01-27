import { Inject } from '@nestjs/common';
import FutureEntity from '@server/model/FutureEntity';
import Future, { FutureStatus, FutureType } from '@server/services/future/Future';
import FutureMetadata from '@server/services/future/FutureMetadata';
import FutureProcessor from '@server/services/future/FutureProcessor';
import { includes, isArray, isEqualWith, isObject, omitBy } from 'lodash';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

export default class FutureService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private log: Logger,
    @Inject('processors') private processors: FutureProcessor<FutureType>[]
  ) {}

  async reaper(em: EntityManager): Promise<void> {
    const futures = await em
      .createQueryBuilder()
      .select('future.id', 'id')
      .from(FutureEntity, 'future')
      .where('status not in (:...status) and dependencies = false and type not in (:...type)', {
        status: [FutureStatus.COMPLETED, FutureStatus.FAILED],
        type: [FutureType.QUEUE_NOTIFICATION],
      })
      .orderBy('created', 'ASC')
      .getRawMany<{ id: string }>();

    for (const future of futures) {
      try {
        await em.transaction((tx) => this.invokeFuture(tx, future.id));
      } catch (ex) {
        this.log.error(ex);
      }
    }
  }

  async getFuture<T extends FutureType>(em: EntityManager, futureId: string): Promise<Future<T>> {
    // dependsOn doesn't recursively populate
    return em.findOne(FutureEntity, futureId, { relations: ['dependsOn'] }) as unknown as Future<T>;
  }

  async createFuture<T extends FutureType>(
    em: EntityManager,
    unique: string,
    type: T,
    metadata: FutureMetadata<T>,
    dependency?: Future<FutureType> | Future<FutureType>[],
    safe = false
  ): Promise<Future<T>> {
    const existing = await em
      .createQueryBuilder()
      .from(FutureEntity, 'future')
      .select('future')
      .leftJoinAndSelect('future.dependsOn', 'dependsOn')
      .where('future.type = :type and future.unique = :unique', {
        type,
        unique,
      })
      .getOne();

    if (existing) {
      const comparisonFunc = (a, b) => {
        // For arrays use the default comparison
        if (isArray(a) || isArray(b)) return;
        // If only one is an object use the default comparison
        if (!isObject(a) || !isObject(b)) return;

        // Now we are comparing two objects...
        // If none of them have null or undefined property values use the default comparison
        if (!includes(a, undefined) && !includes(b, undefined) && !includes(a, null) && !includes(b, null)) return;

        // Call recursively, after filtering all undefined or null properties
        return isEqualWith(
          omitBy(a, (value) => value === undefined || value === null),
          omitBy(b, (value) => value === undefined || value === null),
          comparisonFunc
        );
      };

      // TODO: perhaps we should store responses in own column
      const clean = { ...existing.metadata };
      delete clean['response'];

      if (!safe && !isEqualWith(clean, metadata, comparisonFunc)) {
        throw new Error(`A future with the unique key already exists AND has different metadata.`);
      }

      return existing as unknown as Future<T>;
    }

    const future = new FutureEntity<T>();
    future.type = type;
    future.unique = unique;
    future.metadata = metadata;
    future.dependsOn = [];

    const dependencies = Array.isArray(dependency) ? dependency : dependency ? [dependency] : [];

    future.dependencies = dependencies.filter((d) => d.status === FutureStatus.CREATED).length > 0;

    for (const dependency of dependencies) {
      if (dependency instanceof FutureEntity) {
        future.dependsOn.push(dependency);
      } else {
        throw new Error('All dependencies must be of type FutureEntity.');
      }
    }

    await em.save(future);

    return future;
  }

  async invokeFuture<T extends FutureType>(
    em: EntityManager,
    futureId: string,
    now = () => new Date(),
    subtype?: FutureMetadata<T> extends { type: infer ST } ? ST : never
  ): Promise<FutureMetadata<T> | false | Error> {
    const future = (await this.getFuture(em, futureId)) as FutureEntity<T>;

    if (subtype && future.metadata['type'] !== subtype) {
      throw new Error(`Expected future to have subtype: ${subtype}`);
    }

    const futureLog = this.log.child({ futureId: future.id });

    if (future.status !== FutureStatus.COMPLETED) {
      for (const dependency of future.dependsOn) {
        if (dependency.status === FutureStatus.CREATED) {
          futureLog.info('Invoking dependency first since it has not started.');

          const success = await this.invokeFuture(em, dependency.id);

          // invoking a parent will include this child, so we can exit early
          const self = (await this.getFuture(em, future.id)) as FutureEntity<T>;

          if (success instanceof Error) {
            // if parent failed, we should fail this as well
            self.status = FutureStatus.FAILED;
            self.error = `Parent future (${dependency.id}) has failed.`;

            await em.save(self);

            return success;
          }

          if (success === false) {
            // if parent is going to retry later, this should retry later as well
            return false;
          }

          // invoking the parent should have reinvoked this futurue
          if ([FutureStatus.COMPLETED, FutureStatus.PROCESSED].includes(self.status)) {
            return self.metadata;
          }

          throw new Error(`Expected future (${future.id}) to be in a processed status.`);
        }

        if (dependency.status === FutureStatus.FAILED) {
          futureLog.info('Dependency has failed, ignoring invocation');

          future.status = FutureStatus.FAILED;
          future.error = `Parent future (${dependency.id}) has failed: ${dependency.error}`;

          await em.save(future);

          return false;
        }
      }

      if (future.status === FutureStatus.CREATED) {
        const processor = this.processors.find((c) => future.type === c.type);

        if (!processor) {
          futureLog.error(`No processor was registered for ${future.constructor.name}.`);

          return false;
        }

        futureLog.info('Placing lock on future.');

        await this.lock(em, future, now());

        futureLog.info('Running processor for future.');

        let result;

        try {
          result = await processor.handle(futureLog, em, future.metadata, future.dependsOn);

          if (result === false) {
            futureLog.info('Processor will try again in future, leaving in created state.');

            return false;
          }
        } catch (ex) {
          futureLog.error(ex);

          future.status = FutureStatus.FAILED;
          future.error = ex instanceof Error ? ex.stack || ex.message : `${ex}`;

          await em.save(future);

          const children = await future.dependants;

          for (const child of children) {
            child.status = FutureStatus.FAILED;
            child.error = `Dependency (${future.id}) failed.`;

            await em.save(child);
          }

          if (ex instanceof Error) {
            return ex;
          }

          return false;
        }

        futureLog.info('Processor handled the future successfully, moving to processed state.');

        future.metadata = result;
        future.status = FutureStatus.PROCESSED;
        future.processed = now();

        await em.save(future);
      } else {
        futureLog.info('Future already processed, skipping to children.');
      }

      const children = await future.dependants;

      if (children.length > 0) {
        futureLog.info('Processing children.', { children: children.length });

        for (const child of children) {
          const childLog = this.log.child({ futureId: child.id });

          if (child.status === FutureStatus.COMPLETED) {
            childLog.info('Child already completed.');
          } else {
            childLog.info('Invoking child.');

            const response = await this.invokeFuture(em, child.id);

            if (response === false || response instanceof Error) {
              childLog.info('Child future failed.');

              future.status = FutureStatus.FAILED;
              future.error = `Child future (${child.id}) has failed`;

              await em.save(future);

              return response;
            }
          }
        }

        futureLog.info('All children processed successfully.');
      } else {
        futureLog.info('There are no children to process.');
      }

      futureLog.info('Marking future as complete.');

      future.completed = now();
      future.status = FutureStatus.COMPLETED;

      await em.save(future);
    } else {
      futureLog.info('Future already completed.');
    }

    for (const dependency of future.dependsOn) {
      if (dependency.status === FutureStatus.PROCESSED) {
        futureLog.info('Attempting to mark dependency as complete.');

        await this.invokeFuture(em, dependency.id);
      }
    }

    return future.metadata;
  }

  async lock(em: EntityManager, lockable: FutureEntity<FutureType>, now = new Date()): Promise<void> {
    await em
      .getRepository(lockable.constructor)
      .createQueryBuilder('lockable')
      .setLock('pessimistic_write')
      .where('lockable.id = :id', { id: lockable.id })
      .getOne();

    const updated = await em.update(
      FutureEntity,
      { id: lockable.id, invocations: lockable.invocations },
      { invocations: lockable.invocations + 1, invoked: now }
    );

    if (updated.affected !== 1) {
      throw new Error(`The ${lockable.constructor.name} (${lockable.id}) has been locked/invoked by another process.`);
    }

    lockable.invocations += 1;
    lockable.invoked = now;
  }
}
