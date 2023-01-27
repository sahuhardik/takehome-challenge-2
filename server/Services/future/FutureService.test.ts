import FutureEntity from '@server/model/FutureEntity';
import { FutureStatus, FutureType } from '@server/services/future/Future';
import FutureMetadata from '@server/services/future/FutureMetadata';
import FutureService from '@server/services/future/FutureService';
import { ServiceModule } from '@server/services/module';
import { createTestLog, nestDatabaseTest } from '@server/testing';

const describe = nestDatabaseTest({
  imports: [ServiceModule],
});

const metadata = {
  name: 'name',
  buyerRelId: '1',
  setDefault: false,
};

const parentMetadata = {
  ...metadata,
  name: 'parent',
};

const childMetadata = {
  ...metadata,
  name: 'child',
};

describe('FutureService', (it) => {
  describe('createFuture', () => {
    it('should error if existing future has different metadata', async (manager) => {
      const service = new FutureService(createTestLog(), []);

      await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, {
        name: 'name',
        buyerRelId: '1',
        setDefault: false,
      });

      try {
        await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, {
          name: 'name2',
          buyerRelId: '1',
          setDefault: false,
        });
        fail();
      } catch (ex) {
        // should error
      }
    });

    it('should return existing future if it exists', async (manager) => {
      const service = new FutureService(createTestLog(), []);

      const future = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, metadata);
      const future2 = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, metadata);

      expect(future.id).toBe(future2.id);
    });

    it('should create future with no dependency', async (manager) => {
      const service = new FutureService(createTestLog(), []);

      const future = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, metadata);

      const refreshed = await service.getFuture(manager, future.id);

      expect(refreshed).toMatchObject({
        type: FutureType.CALLBACK_ADD_SOURCE,
        unique: '1',
        metadata: metadata,
        dependencies: false,
      });
    });

    it('should create future with dependency', async (manager) => {
      const service = new FutureService(createTestLog(), []);

      const childMeta = { lineIds: [] };

      const parent = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, metadata);
      const child = await service.createFuture(manager, '2', FutureType.CALLBACK_LINES_PAID, childMeta, parent);

      const refreshed = await service.getFuture(manager, child.id);

      expect(refreshed).toMatchObject({
        type: FutureType.CALLBACK_LINES_PAID,
        unique: '2',
        metadata: childMeta,
        dependencies: true,
        dependsOn: [
          {
            type: FutureType.CALLBACK_ADD_SOURCE,
            unique: '1',
            metadata: metadata,
            dependencies: false,
          },
        ],
      });
    });
  });

  describe('invokeFuture', () => {
    it('should error if no processor is registered', async (manager) => {
      const service = new FutureService(createTestLog(), []);

      const future = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, {
        name: 'name',
        buyerRelId: '1',
        setDefault: false,
      });

      const response = await service.invokeFuture(manager, future.id);

      expect(response).toBe(false);
    });

    it('should not invoke parent if already completed', async (manager) => {
      const service = new FutureService(createTestLog(), [
        {
          type: FutureType.CALLBACK_ADD_SOURCE,
          async handle(log, em, metadata: FutureMetadata<FutureType.CALLBACK_ADD_SOURCE>) {
            if (metadata.name === 'parent') {
              return parentMetadata;
            }

            return childMetadata;
          },
        },
      ]);

      const parent = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, parentMetadata);

      await manager.update(FutureEntity, { id: parent.id }, { status: FutureStatus.COMPLETED });

      const child = await service.createFuture(manager, '2', FutureType.CALLBACK_ADD_SOURCE, childMetadata, parent);

      const response = await service.invokeFuture(manager, child.id);

      expect(response).toStrictEqual(childMetadata);

      const parentRefresh = await service.getFuture(manager, parent.id);

      expect(parentRefresh).toMatchObject({
        status: FutureStatus.COMPLETED,
        invocations: 0,
      });

      const childRefresh = await service.getFuture(manager, child.id);

      expect(childRefresh).toMatchObject({
        status: FutureStatus.COMPLETED,
        invocations: 1,
      });
    });

    it('should invoke parent first if child is invoked', async (manager) => {
      const service = new FutureService(createTestLog(), [
        {
          type: FutureType.CALLBACK_ADD_SOURCE,
          async handle(log, em, metadata: FutureMetadata<FutureType.CALLBACK_ADD_SOURCE>) {
            if (metadata.name === 'parent') {
              return parentMetadata;
            }

            return childMetadata;
          },
        },
      ]);

      const parent = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, parentMetadata);

      const child = await service.createFuture(manager, '2', FutureType.CALLBACK_ADD_SOURCE, childMetadata, parent);

      const response = await service.invokeFuture(manager, child.id);

      expect(response).toStrictEqual(childMetadata);

      const parentRefresh = await service.getFuture(manager, parent.id);

      expect(parentRefresh).toMatchObject({
        status: FutureStatus.COMPLETED,
        invocations: 1,
      });

      const childRefresh = await service.getFuture(manager, child.id);

      expect(childRefresh).toMatchObject({
        status: FutureStatus.COMPLETED,
        invocations: 1,
      });
    });

    it('should not invoke child if parent fails (invoke parent)', async (manager) => {
      const service = new FutureService(createTestLog(), [
        {
          type: FutureType.CALLBACK_ADD_SOURCE,
          async handle(log, em, metadata: FutureMetadata<FutureType.CALLBACK_ADD_SOURCE>) {
            if (metadata.name === 'parent') {
              return false;
            }

            return childMetadata;
          },
        },
      ]);

      const parent = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, parentMetadata);

      const child = await service.createFuture(manager, '2', FutureType.CALLBACK_ADD_SOURCE, childMetadata, parent);

      const response = await service.invokeFuture(manager, parent.id);

      expect(response).toBe(false);

      const parentRefresh = await service.getFuture(manager, parent.id);

      expect(parentRefresh).toMatchObject({
        status: FutureStatus.CREATED,
        invocations: 1,
      });

      const childRefresh = await service.getFuture(manager, child.id);

      expect(childRefresh).toMatchObject({
        status: FutureStatus.CREATED,
        invocations: 0,
      });
    });

    it('should not invoke child if parent fails (invoke child)', async (manager) => {
      const service = new FutureService(createTestLog(), [
        {
          type: FutureType.CALLBACK_ADD_SOURCE,
          async handle(log, em, metadata: FutureMetadata<FutureType.CALLBACK_ADD_SOURCE>) {
            if (metadata.name === 'parent') {
              return false;
            }

            return childMetadata;
          },
        },
      ]);

      const parent = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, parentMetadata);

      const child = await service.createFuture(manager, '2', FutureType.CALLBACK_ADD_SOURCE, childMetadata, parent);

      const response = await service.invokeFuture(manager, child.id);

      expect(response).toBe(false);

      const parentRefresh = await service.getFuture(manager, parent.id);

      expect(parentRefresh).toMatchObject({
        status: FutureStatus.CREATED,
        invocations: 1,
      });

      const childRefresh = await service.getFuture(manager, child.id);

      expect(childRefresh).toMatchObject({
        status: FutureStatus.CREATED,
        invocations: 0,
      });
    });

    it('should not invoke completed future twice', async (manager) => {
      const service = new FutureService(createTestLog(), [
        {
          type: FutureType.CALLBACK_ADD_SOURCE,
          async handle(log, em, metadata) {
            return metadata;
          },
        },
      ]);

      const future = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, metadata);

      const date = new Date();

      await service.invokeFuture(manager, future.id, () => date);

      await service.invokeFuture(manager, future.id);

      const refresh = await service.getFuture(manager, future.id);

      expect(refresh).toMatchObject({
        status: FutureStatus.COMPLETED,
        invocations: 1,
        invoked: date,
        processed: date,
        completed: date,
      });
    });

    it('should mark future as failed', async (manager) => {
      const err = new Error('I failed yo');

      const service = new FutureService(createTestLog(), [
        {
          type: FutureType.CALLBACK_ADD_SOURCE,
          async handle() {
            throw err;
          },
        },
      ]);

      const future = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, metadata);

      const date = new Date();

      const response = await service.invokeFuture(manager, future.id, () => date);

      expect(response).toStrictEqual(err);

      const refresh = await service.getFuture(manager, future.id);

      expect(refresh).toMatchObject({
        status: FutureStatus.FAILED,
        invocations: 1,
        invoked: date,
        processed: null,
        completed: null,
      });
    });

    it('should mark future as completed', async (manager) => {
      const service = new FutureService(createTestLog(), [
        {
          type: FutureType.CALLBACK_ADD_SOURCE,
          async handle(log, em, metadata) {
            return metadata;
          },
        },
      ]);

      const future = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, metadata);

      const date = new Date();

      const response = await service.invokeFuture(manager, future.id, () => date);

      expect(response).toStrictEqual(metadata);

      const refresh = await service.getFuture(manager, future.id);

      expect(refresh).toMatchObject({
        status: FutureStatus.COMPLETED,
        invocations: 1,
        invoked: date,
        processed: date,
        completed: date,
      });
    });

    it('should support retrying a failed future', async (manager) => {
      let invocations = 0;

      const service = new FutureService(createTestLog(), [
        {
          type: FutureType.CALLBACK_ADD_SOURCE,
          async handle(log, em, metadata) {
            invocations += 1;

            return invocations == 2 ? metadata : false;
          },
        },
      ]);

      const future = await service.createFuture(manager, '1', FutureType.CALLBACK_ADD_SOURCE, metadata);

      const date = new Date();

      let response = await service.invokeFuture(manager, future.id, () => date);

      expect(response).toBe(false);

      let refresh = await service.getFuture(manager, future.id);

      expect(refresh).toMatchObject({
        status: FutureStatus.CREATED,
        invocations: 1,
        invoked: date,
        processed: null,
        completed: null,
      });

      response = await service.invokeFuture(manager, future.id, () => date);

      expect(response).toStrictEqual(metadata);

      refresh = await service.getFuture(manager, future.id);

      expect(refresh).toMatchObject({
        status: FutureStatus.COMPLETED,
        invocations: 2,
        invoked: date,
        processed: date,
        completed: date,
      });
    });
  });
});
