import { none, State, useState } from '@hookstate/core';
import SlidebarOpenButton, {
  SlidebarCloseButton,
  SlidebarOpenLink,
} from 'client/global/components/button/SlidebarOpenButton';
import Sortable from 'client/global/components/Sortable';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import { VendorConditions } from 'client/portal/vendor/components/VendorConditionsTab';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormSwitch from 'shared/components/form/FormSwitch';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  ServiceStepConditionWrite,
  ServiceStepWrite,
  VendorDeliveriesDocument,
  VendorServicesDocument,
  VendorTasksDocument,
  VendorTasksQuery,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';
import MoveIcon from 'shared/icons/MoveIcon';

function Form({ state, tasks }: { state: State<ServiceStepWrite>; tasks: VendorTasksQuery['vendor']['tasks'] }) {
  const { write } = useContext(ServiceContext);
  const writeScope = useState(write);
  const stepScope = useState(state);

  return (
    <>
      <FormGroup>
        <FormHorizontal state={stepScope.performableId} name="Task">
          <FormSelect state={stepScope.performableId} options={tasks.map((t) => ({ label: t.name, value: t.id }))} />
        </FormHorizontal>
        <FormHorizontal
          state={stepScope.buyerSelect}
          name="Buyer Selection"
          description="When enabled, the buyer will be required to choose which deliverables to use as inputs to this step."
        >
          <FormSwitch state={stepScope.buyerSelect} />
        </FormHorizontal>
        <FormHorizontal
          state={stepScope.assignOnScheduled}
          name="Assign on Scheduled"
          description="When enabled, allows providers to forecast future work by assigning the step as soon as the service job (step #1) has been scheduled."
        >
          <FormSwitch state={stepScope.assignOnScheduled} />
        </FormHorizontal>
        <FormHorizontal
          state={stepScope.buyerReview}
          name="Buyer Review"
          description="Requires that a the customer approve the job (and any applicable deliverables) before moving on to the next step."
        >
          <FormSwitch state={stepScope.buyerReview} />
        </FormHorizontal>
        <FormHorizontal
          state={stepScope.internalReview}
          name="Internal Review"
          description="Requires that a member of your team approve the job (and any applicable deliverables) before moving on to the next step."
        >
          <FormSwitch state={stepScope.internalReview} />
        </FormHorizontal>
        <FormHorizontal
          state={stepScope.sort}
          name="Sort Deliverables"
          description="When enabled, the provider will have to organize deliverables in a certain order during review."
        >
          <FormSwitch state={stepScope.sort} />
        </FormHorizontal>
        <FormHorizontal
          state={stepScope.rootReview}
          name="Service Provider Review"
          description="When enabled, the provider who was assigned to the first service job must review the deliverables of this task."
        >
          <FormSwitch state={stepScope.rootReview} />
        </FormHorizontal>
        <FormHorizontal
          state={stepScope.rootSelect}
          name="Service Provider Selection"
          description="When enabled, the provider who was assigned to the first service job must select inputs to this task."
        >
          <FormSwitch state={stepScope.rootSelect} />
        </FormHorizontal>
        <FormHorizontal
          state={stepScope.deliverToBuyer}
          name="Buyer Delivery"
          description="When enabled, any deliverable added to this task (work completed), will be accessible to the buyer."
        >
          <FormSwitch state={stepScope.deliverToBuyer} />
        </FormHorizontal>
        <FormHorizontal
          state={stepScope.deliverToBuyerNotification}
          name="Buyer Delivery Notification"
          description="When enabled, the buyer will be notified that the job has been delivered."
        >
          <FormSwitch state={stepScope.deliverToBuyerNotification} />
        </FormHorizontal>
        <FormHorizontal
          state={stepScope.ignoreChangeRequest}
          name="Continue when change request"
          description="When enabled, the step will continue even if there is a change request."
        >
          <FormSwitch state={stepScope.ignoreChangeRequest} />
        </FormHorizontal>
      </FormGroup>

      <div className="pt">
        <div className="flex w-full justify-between items-center">
          <div className="text-lg font-semibold">Conditions</div>

          <Button
            style={ButtonStyle.SECONDARY}
            onClick={() => {
              stepScope.conditions.merge([{} as ServiceStepConditionWrite]);
            }}
          >
            Add Condition
          </Button>
        </div>
      </div>

      <VendorConditions field={stepScope} all={writeScope.properties} compare />
    </>
  );
}

export default function VendorServiceSteps() {
  const { vendorId } = useParams();
  const { write } = useContext(ServiceContext);
  const state = useState(write);
  const tasks = useQueryHook(VendorTasksDocument, { vendorId }, 'cache-and-network');
  const deliveries = useQueryHook(VendorDeliveriesDocument, { vendorId }, 'cache-and-network');
  const services = useQueryHook(VendorServicesDocument, { vendorId });
  const navigate = useNavigate();

  const performables = [...tasks.vendor.tasks, ...deliveries.vendor.deliveries];

  return (
    <Center padding>
      <div className="space-y-2">
        {services.vendor.services.length > 1 && (
          <SlidebarOpenButton button="Add Dependency">
            <SlidebarHeader title="Add Dependency" />
            <SlidebarContent>
              <Table card>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Service Name</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.vendor.services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>
                        <SlidebarCloseButton
                          snackbar={false}
                          onClick={() => {
                            state.dependencies.merge([s.id]);
                          }}
                        >
                          Select
                        </SlidebarCloseButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SlidebarContent>
          </SlidebarOpenButton>
        )}
        {state.dependencies.map((dependency) => (
          <Card onRemove={() => dependency.set(none)} key={dependency.get()}>
            {services.vendor.services.find((s) => s.id === dependency.get())?.name}
          </Card>
        ))}
        <div className="bg-content round shadow p-4 flex items-center cursor-pointer">
          <div className="w-4 h-4 mr-2 cursor-move"></div>
          <div className="flex-1">#1: {state.name.get()}</div>
        </div>
        {performables.length === 0 && (
          <Message
            type={MessageType.WARNING}
            title="No Tasks Exists"
            actions={[{ label: 'Add Task', onClick: () => navigate('../../../tasks') }]}
          >
            You will be unable to add additional steps until your first task is created.
          </Message>
        )}
        {state.steps.map((step, index) => (
          <Sortable index={index} state={state.steps} key={index}>
            <div className="bg-content round shadow p-4 flex items-center cursor-pointer">
              <div className="w-4 h-4 mr-2 cursor-move">
                <MoveIcon />
              </div>
              <div className="flex-1">
                <SlidebarOpenLink
                  text={performables.find((t) => t.id === step.performableId.get())?.name}
                  icon={<EditIcon />}
                >
                  <SlidebarHeader title="Edit Step" />
                  <SlidebarContent>
                    <Form state={step} tasks={performables} />
                    <SlidebarCloseButton>Close</SlidebarCloseButton>
                  </SlidebarContent>
                </SlidebarOpenLink>
              </div>
              <Button
                style={ButtonStyle.DANGER}
                onClick={(e) => {
                  e.preventDefault();

                  step.set(none);
                }}
                icon={<DeleteIcon />}
              />
            </div>
          </Sortable>
        ))}
        {tasks.vendor.tasks.length > 0 && (
          <SlidebarOpenButton
            button="Add Step"
            onClick={() => {
              let order = -1;

              for (const value of state.steps.get()) {
                if (value.order > order) {
                  order = value.order;
                }
              }

              state.steps.merge([{ conditions: [], order: order + 1 } as ServiceStepWrite]);
            }}
          >
            <SlidebarHeader title="Add Step" />
            <SlidebarContent>
              <Form state={state.steps[state.steps.length - 1]} tasks={performables} />
              <div className="pt-3">
                <SlidebarCloseButton>Close</SlidebarCloseButton>
              </div>
            </SlidebarContent>
          </SlidebarOpenButton>
        )}
      </div>
    </Center>
  );
}
