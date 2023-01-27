import { useState } from '@hookstate/core';
import { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import CombinedLine from 'client/portal/vendor/components/CombinedLine';
import LineAmount from 'client/portal/vendor/components/LineAmount';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  OrderLineWrite,
  VendorOrderAccountingDocument,
  VendorOrderLineCreateDocument,
  VendorOrderLineDeleteDocument,
  VendorOrderLineUpdateDocument,
  VendorOrderViewDocument,
  VendorProvidersDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import DeleteIcon from 'shared/icons/DeleteIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

export default function LineItemSlidebar({ line, add = false }: { line: CombinedLine; add?: boolean }) {
  const { orderId, vendorId } = useParams();

  const updateItem = useMutationPromise(VendorOrderLineUpdateDocument);
  const addItem = useMutationPromise(VendorOrderLineCreateDocument);
  const deleteLine = useMutationPromise(VendorOrderLineDeleteDocument);

  const description = line.revenue?.description || line.expense?.description;

  const state = useState<{
    description: string;
    revenue: string;
    expense: string;
    providerId?: string;
    jobId?: string;
  }>({
    description,
    revenue: line.revenue?.amount,
    expense: line.expense?.amount,
    jobId: line.revenue?.jobId || line.expense?.jobId,
    providerId: line.expense?.providerId,
  });

  ValidationAttach(state, (validator) => {
    validator.description.required();

    if (add) {
      validator
        .when((s) => !s.expense.get())
        .revenue.validate((revenue) => !!revenue, 'You must define revenue if expense is empty.');

      validator
        .when((s) => !s.revenue.get())
        .expense.validate((expense) => !!expense, 'You must define expense if revenue is empty.');
    }

    const onExpense = validator.when((s) => !!s.expense.get());

    onExpense.providerId.required();
  });

  const { order } = useQueryHook(VendorOrderAccountingDocument, { orderId });
  const providers = useQueryHook(VendorProvidersDocument, { vendorId });
  const refresh = useQueryPromise(VendorOrderViewDocument);

  return (
    <>
      <SlidebarHeader title={`${add ? 'Add' : 'Update'} Line Item`} />
      <SlidebarContent>
        <FormGroup>
          <FormHorizontal state={state.description} name="Description">
            <FormText state={state.description} />
          </FormHorizontal>
          <LineAmount name="Revenue" line={line.revenue} state={state.revenue} add={add} />
          <LineAmount name="Expense" line={line.expense} state={state.expense} add={add} />
          {(add || line.expense?.assignable) && (
            <>
              <FormHorizontal state={state.jobId} name="Job">
                <FormSelect
                  state={state.jobId}
                  options={order.jobs
                    .filter((j) => !!j.performable && !j.parentId)
                    .map((j) => ({ label: `#${j.id}: ${j.performable.internalName}`, value: j.id }))}
                />
              </FormHorizontal>
              {!!state.expense.get() && (
                <>
                  <FormHorizontal state={state.providerId} name="Provider">
                    <FormSelect
                      state={state.providerId}
                      options={providers.vendor.providers.map((p) => ({
                        label: p.member.company,
                        value: p.member.id,
                      }))}
                    />
                  </FormHorizontal>
                </>
              )}
            </>
          )}
        </FormGroup>
        <div className="flex items-center justify-between mt-4">
          <SlidebarCloseButton
            disabled={!Validation(state).valid(true)}
            onClick={async () => {
              const revenue: OrderLineWrite = {
                description: state.description.get(),
                jobId: state.jobId.get(),
                amount: state.revenue.get(),
              };

              if (line.revenue?.id) {
                await updateItem({
                  data: revenue,
                  lineId: line.revenue.id,
                });
              } else if (revenue.amount) {
                await addItem({
                  orderId,
                  data: revenue,
                });
              }

              const expense: OrderLineWrite = {
                description: state.description.get(),
                amount: state.expense.get(),
                jobId: state.jobId.get(),
                providerId: state.providerId.get(),
              };

              if (line.expense?.id) {
                await updateItem({
                  data: expense,
                  lineId: line.expense.id,
                });
              } else if (expense.amount) {
                await addItem({
                  orderId,
                  data: expense,
                });
              }

              // TODO: better way to refresh cache?
              await refresh({ orderId, vendorId });
            }}
          >
            {add ? 'Add' : 'Update'}
          </SlidebarCloseButton>
          {(line.revenue?.removable || line.expense?.removable) && (
            <SlidebarCloseButton
              onClick={async () => {
                if (line.revenue?.removable) {
                  await deleteLine({ lineId: line.revenue.id });
                }

                if (line.expense?.removable) {
                  await deleteLine({ lineId: line.expense.id });
                }
              }}
              style={ButtonStyle.DANGER}
              icon={<DeleteIcon />}
            >
              Delete
            </SlidebarCloseButton>
          )}
        </div>
      </SlidebarContent>
    </>
  );
}
