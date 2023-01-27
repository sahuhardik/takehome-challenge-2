import { State, useState } from '@hookstate/core';
import Center from 'client/global/components/tailwind/Center';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { ServiceCostHeading } from 'client/portal/vendor/order/create/VendorOrderCreateCommon';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import OrderRuleContext from 'shared/components/fields/OrderRuleContext';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import ServiceConfigureForm, { useServiceConfigureForm } from 'shared/components/fields/ServiceConfigureForm';
import { FormGroup, FormGroups } from 'shared/components/form/FormLayout';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  VendorOrderAddServiceDocument,
  VendorOrderAddServiceOrderDocument,
  VendorServicesDocument,
  VendorServicesQuery,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import { Validation } from 'shared/utilities/Validation';
import { v4 } from 'uuid';

type Service = VendorServicesQuery['vendor']['services'][0];

export function ConfigureService({ orderId, service }: { orderId: string; service: Service }) {
  const { order } = useQueryHook(VendorOrderAddServiceOrderDocument, { orderId });
  const state = useServiceConfigureForm(service.id, PerformableFormType.VENDOR, []);
  const add = useMutationPromise(VendorOrderAddServiceDocument);

  const navigate = useNavigate();

  const context = OrderRuleContext(order);

  return (
    <FormGroups>
      <>
        <FormGroup>
          <ServiceCostHeading
            fieldValuesState={state}
            serviceId={service.id}
            serviceName={service.internalName}
            context={context}
          />
          <ServiceConfigureForm
            context={context}
            serviceId={service.id}
            type={PerformableFormType.VENDOR}
            state={state}
          >
            <div className="text-center text-gray-500">This service is not configurable.</div>
          </ServiceConfigureForm>
        </FormGroup>
        <PromiseButton
          onClick={async () => {
            const created = await add({
              orderId,
              data: {
                services: [
                  {
                    id: v4(),
                    fields: state.get(),
                    serviceId: service.id,
                  },
                ],
                requested: [],
              },
            });

            const job = created.addJobsToOrder[0];

            if (job.onsite > 0) {
              navigate(`../inline-schedule/${created.addJobsToOrder[0].id}`);
            } else {
              navigate(`../`);
            }

            return false;
          }}
          disabled={!Validation(state).valid(true)}
        >
          Done
        </PromiseButton>
      </>
    </FormGroups>
  );
}

function ChooseService({ serviceId, services }: { services: Service[]; serviceId: State<string> }) {
  return (
    <ul>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell></TableHeadCell>
            <TableHeadCell>Name</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell>
                <Button
                  style={ButtonStyle.QUIET}
                  onClick={() => {
                    serviceId.set(service.id);
                  }}
                >
                  Select
                </Button>
              </TableCell>
              <TableCell>{service.internalName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ul>
  );
}

export default function VendorOrderAddService({ orderId, vendorId }: { vendorId: string; orderId: string }) {
  const query = useQueryHook(VendorServicesDocument, { vendorId }, 'cache-and-network');
  const serviceId = useState(null as string);

  let content;

  if (serviceId.get()) {
    content = (
      <ConfigureService orderId={orderId} service={query.vendor.services.find((s) => s.id === serviceId.get())} />
    );
  } else {
    content = <ChooseService serviceId={serviceId} services={query.vendor.services} />;
  }

  return <Center padding>{content}</Center>;
}
