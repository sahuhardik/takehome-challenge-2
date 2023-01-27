import { useState } from '@hookstate/core';
import Big from 'big.js';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import NavigationButton from 'client/global/components/button/NavigationButton';
import SlidebarOpenButton, { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import ErrorRoute from 'client/global/components/ErrorRoute';
import OrderFieldsForm, { useOrderUpdateState } from 'client/global/components/fields/OrderFieldsForm';
import ActivityLog from 'client/global/components/model/ActivityLog';
import Card from 'client/global/components/tailwind/Card';
import { Table, TableBody, TableHead, TableHeadCell, TableRow } from 'client/global/components/tailwind/Table';
import Tabs, { Tab } from 'client/global/components/tailwind/Tabs';
import AddressLayout from 'client/global/layout/AddressLayout';
import OrderLayout from 'client/global/layout/OrderLayout';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import AddLineItem from 'client/portal/vendor/components/AddLineItem';
import JobAccountingFragment from 'client/portal/vendor/components/JobAccountingFragment';
import { VendorAttachments } from 'client/portal/vendor/components/VendorAttachments';
import VendorOrderJobs from 'client/portal/vendor/components/VendorOrderJobs';
import VendorOrderJob from 'client/portal/vendor/order/job/VendorOrderJob';
import VendorOrderAddService from 'client/portal/vendor/order/VendorOrderAddService';
import { VendorOrderEdit } from 'client/portal/vendor/order/VendorOrderEdit';
import * as React from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { MessageProps, MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  OrderStatus,
  Permission,
  VendorCancelOrderDocument,
  VendorOrderAccountingDocument,
  VendorOrderAccountingJobFragment,
  VendorOrderActivityDocument,
  VendorOrderAddTodoDocument,
  VendorOrderAttachmentsDocument,
  VendorOrderCompleteDocument,
  VendorOrderConfirmDocument,
  VendorOrderDeleteDocument,
  VendorOrderHoldDocument,
  VendorOrderRemoveHoldDocument,
  VendorOrderSaveAttachmentDocument,
  VendorOrderViewDocument,
  VendorOrderViewQuery,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import CtrlLeftIcon from 'shared/icons/CtrlLeftIcon';
import HoldIcon from 'shared/icons/HoldIcon';
import { UnholdIcon } from 'shared/icons/UnholdIcon';
import { useHasPermission } from 'shared/UserState';
import { ValidationAttach } from 'shared/utilities/Validation';

function AddTodo({ order }: { order: VendorOrderViewQuery['order'] }) {
  const add = useMutationPromise(VendorOrderAddTodoDocument);

  const state = useState(null as string);

  ValidationAttach(state, (validator) => {
    validator.required();
  });

  return (
    <>
      <SlidebarHeader title="Add Todo" />
      <SlidebarContent>
        <FormGroup>
          <FormHorizontal state={state} name="Name">
            <FormText state={state} />
          </FormHorizontal>
        </FormGroup>
        <SlidebarCloseButton style={ButtonStyle.QUIET}>Cancel</SlidebarCloseButton>
        <SlidebarCloseButton
          onClick={async () => {
            await add({ name: state.get(), orderId: order.id });
          }}
        >
          Save
        </SlidebarCloseButton>
      </SlidebarContent>
    </>
  );
}

function OrderTabs({ order }: { order: VendorOrderViewQuery['order'] }) {
  const { vendorId } = useParams();
  const saveAttachments = useMutationPromise(VendorOrderSaveAttachmentDocument);

  const tabs: Tab[] = [
    {
      useElement: <VendorOrderJobs orderId={order.id} vendorId={vendorId} />,
      key: 'jobs',
      name: 'Jobs',
      useActions:
        order.status === OrderStatus.Canceled
          ? []
          : [
              <NavigationButton link="../add" key="service" icon={<AddIcon />}>
                Service
              </NavigationButton>,
              <SlidebarOpenButton key="todo" button="Todo" icon={<AddIcon />}>
                <AddTodo order={order} />
              </SlidebarOpenButton>,
              <AddLineItem key="add" />,
            ],
    },
    {
      key: 'activity',
      name: 'Activity',
      useElement() {
        const query = useQueryHook(VendorOrderActivityDocument, { orderId: order.id }, 'cache-and-network');

        return (
          <div className="pt">
            <ActivityLog orderUrlPrefix="../../" activities={query.order.activity} job={true} />
          </div>
        );
      },
    },
    {
      useElement() {
        const fetchAttachments = useQueryPromise(VendorOrderAttachmentsDocument);

        return (
          <VendorAttachments
            meta={{ vendorId: order.vendorId, orderId: order.id }}
            attachments={order.attachments}
            onUpload={({ mime, name, s3 }) =>
              Promise.all([
                saveAttachments({ orderId: order.id, mime, name, s3 }),
                fetchAttachments({ orderId: order.id }),
              ])
            }
          />
        );
      },
      key: 'attachments',
      name: 'Attachments',
    },
  ];

  // TODO: extra dropdown menu?
  //actions.push(<Button key='delete'>Delete</Button>);

  return (
    <div className="bg-white round shadow p">
      <Tabs tabs={tabs} padding={false} errorCard={false} />
    </div>
  );
}

function Wrapper({
  order,
  sidebar,
  children,
}: {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  order: VendorOrderViewQuery['order'];
}) {
  const { vendorId } = useParams();
  const {
    order: { unpaidBalance, invoiceable },
  } = useQueryHook(VendorOrderAccountingDocument, { orderId: order.id });

  let message: MessageProps;

  const cancelOrder = useMutationPromise(VendorCancelOrderDocument);
  const markComplete = useMutationPromise(VendorOrderCompleteDocument);
  const confirmed = useMutationPromise(VendorOrderConfirmDocument);

  const cancelable = () => {
    if (new Big(unpaidBalance || '0').gt(0)) {
      message = {
        type: MessageType.WARNING,
        title: 'Cannot Cancel Order',
        children: 'The order has an outstanding balance that must be paid first.',
      };
    } else if (new Big(unpaidBalance || '0').lt(0)) {
      message = {
        type: MessageType.WARNING,
        title: 'Cancel Order',
        children:
          'Do you wish to cancel the entire order? The owed balance will be returned to the credit cards on file.',
        actions: [
          {
            label: 'Cancel',
            onClick: async () => {
              await cancelOrder({ orderId: order.id });
            },
          },
        ],
      };
    } else {
      message = {
        type: MessageType.WARNING,
        title: 'Cancel Order',
        children: 'Do you wish to cancel the entire order?',
        actions: [
          {
            label: 'Cancel',
            onClick: async () => {
              await cancelOrder({ orderId: order.id });
            },
          },
        ],
      };
    }
  };

  if (order.status === OrderStatus.Canceled) {
    message = { type: MessageType.WARNING, children: 'This order has been canceled.' };
  } else if (order.status === OrderStatus.Completed) {
    message = { type: MessageType.SUCCESS, children: 'This order has been completed.' };
  } else if (
    order.status === OrderStatus.BuyerAccepted ||
    (order.status === OrderStatus.Confirmed && order.eligibleToCompleteJobs)
  ) {
    if (invoiceable && new Big(unpaidBalance || '0').abs().gt(0)) {
      message = {
        type: MessageType.ERROR,
        title: 'Invoice Unpaid',
        children: 'The invoice sent through your accounting system must be marked as paid first.',
      };
    } else if (!order.eligibleToCompleteJobs) {
      message = {
        type: MessageType.ERROR,
        title: 'Uncompleted Jobs Remain',
        children: 'All jobs must be completed before order can be completed.',
      };
    } else if (order.fullyPaid) {
      message = {
        type: MessageType.WARNING,
        title: 'Complete Order',
        children: 'The order balance has been taken care of, you may now complete the order.',
        actions: [
          {
            label: 'Complete',
            onClick: async () => {
              await markComplete({ orderId: order.id });
            },
          },
        ],
      };
    } else if (order.cancelable) {
      cancelable();
    } else {
      message = {
        type: MessageType.ERROR,
        title: 'Cannot Continue',
        children: 'The order has an outstanding balance that must be paid first.',
      };
    }
  } else if (order.status === OrderStatus.VendorReview) {
    if (!order.fullyPaid && !invoiceable && new Big(unpaidBalance || '0').gt(0)) {
      message = {
        type: MessageType.ERROR,
        title: 'Cannot Continue',
        children: 'The order has an outstanding balance that must be paid first.',
      };
    } else if (order.eligibleToCompleteJobs) {
      message = {
        type: MessageType.WARNING,
        title: 'Review Order',
        children: 'Please review the order and mark it complete to close it out.',
        actions: [
          {
            label: 'Complete',
            onClick: async () => {
              await markComplete({ orderId: order.id });
            },
          },
        ],
      };
    } else {
      message = {
        type: MessageType.ERROR,
        title: 'Uncompleted Jobs Remain',
        children: 'All jobs must be completed before order can be completed.',
      };
    }
  } else if (order.cancelable) {
    cancelable();
  } else if (order.status === OrderStatus.Created) {
    if (!order.buyer.member.uniqueRoleType) {
      message = {
        type: MessageType.ERROR,
        title: 'Cannot Continue',
        actions: [
          {
            label: 'Fix Customer Users',
            onClick: () => navigate(`/ui/vendor/${vendorId}/customers/${order.buyer.id}`),
          },
        ],
        children: `There is more than one user with default role in customer, can not continue until this has been fixed.`,
      };
    } else if (order.quote) {
      message = {
        type: MessageType.WARNING,
        title: 'Pending Confirmation',
        children: 'The customer was sent this order as a quote and has yet to confirm it.',
        actions: [
          {
            label: 'Force Confirm',
            onClick: async () => {
              await confirmed({ orderId: order.id });
            },
          },
        ],
      };
    } else {
      message = {
        type: MessageType.WARNING,
        title: 'Pending Confirmation',
        children: 'You will not be able to assign or schedule jobs until this order has been confirmed.',
        actions: [
          {
            label: 'Confirm',
            onClick: async () => {
              await confirmed({ orderId: order.id });
            },
          },
        ],
      };
    }
  }

  const deleteOrder = useMutationPromise(VendorOrderDeleteDocument);
  const navigate = useNavigate();

  return (
    <OrderLayout
      orderId={order.id}
      editLink={`/ui/vendor/${vendorId}/order/view/${order.id}/edit`}
      onDelete={
        order.removable
          ? async () => {
              await deleteOrder({ orderId: order.id });

              navigate(`/ui/vendor/${vendorId}/order`);
            }
          : undefined
      }
      message={message}
      sidebar={sidebar}
    >
      {children}
    </OrderLayout>
  );
}

function VendorOrderViewSidebar() {
  // TODO: refactor with VendorOrderJobs to avoid duplication
  const { orderId, vendorId, jobId } = useParams();

  const hasPermission = useHasPermission();
  const {
    order: { jobs },
  } = useQueryHook(VendorOrderAccountingDocument, { orderId });

  return (
    <>
      <Card>
        <NavigationButton link="../" icon={<CtrlLeftIcon />}>
          Back to Order
        </NavigationButton>
      </Card>
      <Table card className="mb mt">
        <TableHead>
          <TableRow>
            <TableHeadCell className="w-full">Description</TableHeadCell>
            <TableHeadCell className="text-right">Revenue</TableHeadCell>
            {hasPermission(Permission.ViewExpenses) && <TableHeadCell className="text-right">Expense</TableHeadCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs
            .filter((j) => j.id === jobId)
            .map((job: VendorOrderAccountingJobFragment, index) => (
              <JobAccountingFragment job={job} key={index} vendorId={vendorId} orderId={orderId} simple />
            ))}
        </TableBody>
      </Table>
    </>
  );
}

export default function VendorOrderView() {
  const { orderId, vendorId } = useParams();

  const { order, vendor } = useQueryHook(VendorOrderViewDocument, { orderId, vendorId }, 'cache-and-network');
  const [state, update] = useOrderUpdateState(order);

  const hasOnHoldOrderFields = vendor.fields.some((field) => field.showOnHoldOrder);

  useRegisterBreadcrumb(`Order #${order.id}`);

  const hold = useMutationPromise(VendorOrderHoldDocument);
  const unhold = useMutationPromise(VendorOrderRemoveHoldDocument);
  const holdActions = (
    <>
      {!order.hold && !hasOnHoldOrderFields && (
        <PromiseButton
          style={ButtonStyle.INVERSE}
          onClick={async () => {
            await hold({ orderId });
          }}
          key="hold"
          icon={<HoldIcon />}
        >
          Hold
        </PromiseButton>
      )}

      {!order.hold && hasOnHoldOrderFields && (
        <SlidebarOpenButton style={ButtonStyle.INVERSE} icon={<HoldIcon />} button="Hold" key="hold">
          <SlidebarHeader title={`Hold order #${order.id}`} />
          <SlidebarContent>
            <OrderFieldsForm
              vendorId={order.vendorId}
              wrapper={FormGroup}
              state={state.metadata}
              onlyOnHoldFields={true}
            />
            <div className="flex items-center justify-between mt-4">
              <SlidebarCloseButton
                onClick={async () => {
                  await update();
                  await hold({ orderId });
                }}
                disabled={!order.canHold && 'This order cannot be placed on hold.'}
                key="hold"
                icon={<HoldIcon />}
              >
                Hold
              </SlidebarCloseButton>
            </div>
          </SlidebarContent>
        </SlidebarOpenButton>
      )}

      {order.hold && (
        <PromiseButton
          style={ButtonStyle.INVERSE}
          onClick={async () => {
            await unhold({ orderId });
          }}
          key="unhold"
          icon={<UnholdIcon />}
        >
          Unhold
        </PromiseButton>
      )}
    </>
  );

  return (
    <AddressLayout
      address={order.address}
      actions={order.canHold ? holdActions : undefined}
      mapBgClassName={order.hold ? 'bg-red-600' : 'bg-theme-primary'}
    >
      <Routes>
        <Route
          path="edit"
          element={
            <ErrorRoute card back>
              <VendorOrderEdit order={order} />
            </ErrorRoute>
          }
        />
        <Route
          path="add"
          element={
            <ErrorRoute card back>
              <VendorOrderAddService orderId={order.id} vendorId={order.vendorId} />
            </ErrorRoute>
          }
        />
        <Route
          path="jobs/:jobId/*"
          element={
            <ErrorRoute card back>
              <Wrapper order={order} sidebar={<VendorOrderViewSidebar />}>
                <VendorOrderJob />
              </Wrapper>
            </ErrorRoute>
          }
        />
        <Route
          path="*"
          element={
            <ErrorRoute card back>
              <Wrapper order={order}>
                <OrderTabs order={order} />
              </Wrapper>
            </ErrorRoute>
          }
        />
      </Routes>
    </AddressLayout>
  );
}
