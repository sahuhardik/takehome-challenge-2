import { useState } from '@hookstate/core';
import { Persistence } from '@hookstate/persistence';
import ErrorRoute from 'client/global/components/ErrorRoute';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import { BuyerContent } from 'client/portal/buyer/BuyerLayout';
import BuyerCreateOrderAdditional from 'client/portal/buyer/order/BuyerCreateOrderAdditional';
import BuyerCreateOrderAddress from 'client/portal/buyer/order/BuyerCreateOrderAddress';
import BuyerCreateOrderConfigure from 'client/portal/buyer/order/BuyerCreateOrderConfigure';
import BuyerCreateOrderFields from 'client/portal/buyer/order/BuyerCreateOrderFields';
import BuyerCreateOrderPackages from 'client/portal/buyer/order/BuyerCreateOrderPackages';
import BuyerCreateOrderReview from 'client/portal/buyer/order/BuyerCreateOrderReview';
import BuyerCreateOrderSchedule from 'client/portal/buyer/order/BuyerCreateOrderSchedule';
import BuyerCreateOrderSlim from 'client/portal/buyer/order/BuyerCreateOrderSlim';
import {
  BuyerCreateOrderRequested,
  BuyerCreateOrderState,
  BuyerOrderContextAccessor,
} from 'client/portal/buyer/order/BuyerCreateOrderState';
import BuyerCreateOrderWizard from 'client/portal/buyer/order/BuyerCreateOrderWizard';
import BuyerCreateOrderWizards from 'client/portal/buyer/order/BuyerCreateOrderWizards';
import { buildConditionTree, validateConditionTree } from 'common/rules/Rule';
import * as React from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { DynamicField, requireDynamicFields } from 'shared/components/fields/DynamicFieldInput';
import { PerformableFormType, performablePropertiesToFields } from 'shared/components/fields/PerformableConfigureForm';
import {
  Address,
  BuyerAddPackageToOrderDocument,
  BuyerCreateOrderVendorGetDocument,
  FieldValueWrite,
  OrderCreateService,
  OrderSource,
  ShopAddServiceDocument,
  ShopOrderCreateDocument,
  ShopUpdateServiceDocument,
  ShowUpdateOrderDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import { ArrayValidator, ValidationAttach } from 'shared/utilities/Validation';

export default function BuyerCreateOrderRouter() {
  const vendorId = useCurrentVendorId();
  const buyerId = useGetCurrentBuyerRelId();
  const { orderId } = useParams();

  const { vendor, buyer, holidays } = useQueryHook(BuyerCreateOrderVendorGetDocument, { vendorId, buyerId, orderId });

  const preselected = [];

  const state = useState<BuyerCreateOrderState>({
    orderId,
    address: (orderId ? buyer.lastOrder?.address || {} : {}) as Address,
    sawFields: !!orderId,
    services: [],
    terms: !vendor.cartTerms,
    preselected,
    requested: (orderId ? buyer.lastOrder?.requested || [] : []) as BuyerCreateOrderRequested[],
    versionId: orderId ? buyer.lastOrder?.versionId || 0 : 0,
    sources:
      !vendor.paymentType || (buyer.postPay && buyer.netTerms)
        ? []
        : buyer.sources.filter((s) => s.primary).map((s) => s.id),
    fields: vendor.fields.map((vendorField) => {
      if (orderId) {
        const assigned = buyer.lastOrder?.fields.find((o) => o.fieldId === vendorField.id);
        if (assigned) {
          return {
            default: false,
            fieldId: assigned.fieldId,
            booleanValue: assigned.booleanValue,
            textValue: assigned.textValue,
            numberValue: assigned.numberValue,
            repeatValue: assigned.repeatValue,
          };
        }
      }

      const defaultValue = buyer.orderFields.find((buyerField) => buyerField.fieldId === vendorField.id);

      if (defaultValue) {
        return {
          ...defaultValue,
          default: true,
        };
      }

      const preselected = vendorField.values.find((v) => v.preselected);

      return { fieldId: vendorField.id, default: false, textValue: preselected?.id };
    }),
  });

  if (!orderId && process.env.NODE_ENV !== 'production') {
    // TODO: consider enabling this on production and give user ability to clear on error, restart, etc
    // helps with development to prevent hot-refreshes from destroying the page
    state.attach(Persistence('buyer-order-create'));
  }

  ValidationAttach(state, (validator) => {
    requireDynamicFields(
      vendor.fields.map((f) => ({ ...f, required: f.requiredOnCreate })),
      validator.fields,
      (field: DynamicField) => {
        const fieldValidators: ArrayValidator<FieldValueWrite[]>[] = [];

        for (const rule of vendor.rules) {
          for (const action of rule.actions) {
            if (action.__typename === 'ActionFieldShow' && action.fieldShow.fieldId === field.id) {
              const tree = buildConditionTree(rule.conditions) as never;

              const conditionalValidator = validator.when((s) => {
                // make sure user "saw fields" because services may be preselected from the start
                if (!s.sawFields.get()) {
                  return false;
                }

                const accessor = new BuyerOrderContextAccessor(s, vendor, holidays, buyer);

                // make sure user "saw fields" because services may be preselected from the start
                return validateConditionTree(accessor, tree);
              });

              const fieldValidator = conditionalValidator.fields.when(
                (f) => f.fieldId.get() === action.fieldShow.fieldId
              );

              fieldValidator.textValue.required();

              fieldValidators.push(fieldValidator);
            }
          }
        }

        return fieldValidators;
      }
    );

    // TODO: figure out why this causes nested fields to be required = true on errors()
    // validator.services.required();

    for (const perf of vendor.performables) {
      const when = validator.services.when((s) => s.serviceId.get() === perf.id);

      const fields = performablePropertiesToFields(PerformableFormType.CART, perf.properties);

      requireDynamicFields(fields, when.fields);
    }
  });

  const createOrder = useMutationPromise(ShopOrderCreateDocument);
  const addServiceToOrder = useMutationPromise(ShopAddServiceDocument);
  const updateService = useMutationPromise(ShopUpdateServiceDocument);
  const updateOrder = useMutationPromise(ShowUpdateOrderDocument);
  const addPackagetoOrder = useMutationPromise(BuyerAddPackageToOrderDocument);

  const modifyOrder = async (
    service?: OrderCreateService & { versionId?: number },
    pkg?: { packageId: string; performableIds: string[] }
  ) => {
    const data = state.get();
    const services = [...data.services];

    if (service) {
      services.push(service);
    }

    const orderData = {
      metadata: data.fields,
      address: data.address,
      requested: data.requested,
    };

    if (data.orderId) {
      if (service) {
        if (typeof service.versionId !== 'undefined') {
          const resp = await updateService({
            versionId: service.versionId,
            data: {
              fields: service.fields,
            },
            jobId: service.id,
          });

          state.services.set((l) =>
            l.map((x) =>
              x.id === service.id
                ? {
                    ...x,
                    ...service,
                    versionId: resp.updateJob.versionId,
                  }
                : x
            )
          );
        } else {
          const resp = await addServiceToOrder({
            orderId: data.orderId,
            data: service,
          });

          state.services.merge([
            {
              ...service,
              ...resp.addJobsToOrder[0],
            },
          ]);
        }
      } else if (pkg) {
        const resp = await addPackagetoOrder({
          orderId: data.orderId,
          data: pkg,
        });

        state.services.merge(
          resp.addPackageToOrder.map((job) => ({
            id: job.id,
            serviceId: job.performableId,
            packagePerformableId: job.packagePerformableId,
            fields: [],
          }))
        );
      } else {
        const resp = await updateOrder({
          versionId: data.versionId,
          orderId: data.orderId,
          data: {
            ...orderData,
            contacts: [],
          },
        });

        state.versionId.set(resp.updateOrder.versionId);
      }
    } else if (services.length || pkg) {
      const { createOrder: order } = await createOrder({
        data: {
          ...orderData,
          buyer: {
            id: buyerId,
            contacts: [],
          },
          source: OrderSource.Buyer,
          services,
          package: pkg,
          wizard: true,
          vendorId,
        },
      });

      if (pkg) {
        const job = order.jobs[0];

        state.services.merge([
          {
            id: job.id,
            serviceId: job.performableId,
            packagePerformableId: job.packagePerformableId,
            fields: [],
          },
        ]);
      } else if (service) {
        state.services.merge([
          {
            ...service,
            id: order.jobs[0].id,
          },
        ]);
      } else {
        state.services.set((services) =>
          services.map((s) => ({
            ...s,
            id: order.jobs.find((j) => j.performableId === s.serviceId).id,
          }))
        );
      }

      state.merge({
        orderId: order.id,
        versionId: order.versionId,
      });
    }
  };

  return (
    <BuyerContent className="bg-white min-h-full flex-col flex">
      <SpinnerLoader>
        <Routes>
          <Route
            path="address"
            element={
              <ErrorRoute center card>
                <BuyerCreateOrderAddress state={state} updateOrder={modifyOrder} />
              </ErrorRoute>
            }
          />
          <Route
            path="schedule"
            element={
              <ErrorRoute center card>
                <BuyerCreateOrderSchedule state={state} updateOrder={modifyOrder} />
              </ErrorRoute>
            }
          />
          <Route
            path="fields"
            element={
              <ErrorRoute center card>
                <BuyerCreateOrderFields
                  state={state}
                  vendor={vendor}
                  updateOrder={modifyOrder}
                  slim={!!buyer.lastOrder}
                />
              </ErrorRoute>
            }
          />
          <Route
            path="packages"
            element={
              <ErrorRoute center card>
                <BuyerCreateOrderPackages state={state} updateOrder={modifyOrder} slim={!!buyer.lastOrder} />
              </ErrorRoute>
            }
          />
          <Route
            path="slim"
            element={
              <ErrorRoute center card>
                <BuyerCreateOrderSlim state={state} vendor={vendor} updateOrder={modifyOrder} />
              </ErrorRoute>
            }
          />
          <Route
            path="wizards"
            element={
              <ErrorRoute center card>
                <BuyerCreateOrderWizards state={state} vendor={vendor} />
              </ErrorRoute>
            }
          />
          <Route
            path="/wizard/:wizardId/*"
            element={
              <ErrorRoute center card>
                <BuyerCreateOrderWizard createOrder={modifyOrder} state={state} vendor={vendor} />
              </ErrorRoute>
            }
          />
          <Route
            path="additional"
            element={
              <ErrorRoute center card>
                <BuyerCreateOrderAdditional state={state} vendor={vendor} updateOrder={modifyOrder} />
              </ErrorRoute>
            }
          />
          <Route
            path="configure/:performableId"
            element={
              <ErrorRoute center card>
                <BuyerCreateOrderConfigure state={state} updateOrder={modifyOrder} />
              </ErrorRoute>
            }
          />
          <Route
            path="review"
            element={
              <ErrorRoute center card>
                <BuyerCreateOrderReview state={state} vendor={vendor} updateOrder={modifyOrder} />
              </ErrorRoute>
            }
          />
          <Route path="*" element={<Navigate to="address" />} />
        </Routes>
      </SpinnerLoader>
    </BuyerContent>
  );
}
