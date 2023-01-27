import { none, State, useState } from '@hookstate/core';
import NavigationButton from 'client/global/components/button/NavigationButton';
import Center from 'client/global/components/tailwind/Center';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import {
  OrderCreateState,
  ServiceCostHeading,
  useOrderCreateStateContext,
} from 'client/portal/vendor/order/create/VendorOrderCreateCommon';
import * as React from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import { dynamicFieldValueGet } from 'shared/components/fields/DynamicFieldInput';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import ServiceConfigureForm from 'shared/components/fields/ServiceConfigureForm';
import { FormGroup, FormGroups } from 'shared/components/form/FormLayout';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  AddressInput,
  FieldType,
  FieldValueWrite,
  OrderCreateService,
  VendorJobUpdateDocument,
  VendorOrderAddServiceDocument,
  VendorOrderCreateServicesDocument,
  VendorOrderCreateServicesQuery,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import CtrlRightIcon from 'shared/icons/CtrlRightIcon';
import EditIcon from 'shared/icons/EditIcon';
import { Validation } from 'shared/utilities/Validation';
import uuid from 'uuid';

type Service = VendorOrderCreateServicesQuery['vendor']['services'][0];

interface LocalState {
  add: boolean;
  edit: boolean;
  adding?: number;
}

function ServiceList({
  order,
  local,
  services,
}: {
  order: State<OrderCreateState>;
  local: State<LocalState>;
  services: Service[];
}) {
  const orderState = useState(order);
  const localState = useState(local);
  const validation = Validation(orderState);

  return (
    <>
      <div className="pb-5 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-2xl leading-6 font-medium text-gray-900">Services</h3>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Button onClick={() => localState.add.set(true)} style={ButtonStyle.SECONDARY}>
            Add Service
          </Button>
        </div>
      </div>
      <div className="space-y-6">
        {orderState.services.map((state, index) => {
          const service = services.find((s) => s.id === state.serviceId.get());

          return (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg" key={state.serviceId.get()}>
              <div className="px-4 py-5 sm:px-6 group-scope">
                <div className="flex justify-between items-center">
                  <div
                    className="text-lg leading-6 cursor-pointer font-medium text-gray-600 group-scope-hover:text-gray-900 flex items-center"
                    onClick={() => localState.merge({ adding: index, edit: true })}
                  >
                    <div className="w-4 h-4 mr-2">
                      <EditIcon />
                    </div>

                    {!Validation(state).valid(true) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 mr-2 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Error
                      </span>
                    ) : null}
                    {service.internalName}
                  </div>
                  <Button
                    style={ButtonStyle.QUIET}
                    onClick={() => {
                      order.services[index].set(none);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="border-t border-gray-200">
                <dl className="sm:divide-y sm:divide-gray-200">
                  {state.fields
                    .get()
                    .filter((sp) => {
                      const property = service.properties.find((p) => p.id === sp.fieldId);

                      return !!dynamicFieldValueGet(property.fieldType, sp);
                    })
                    .map((sp) => {
                      const property = service.properties.find((p) => p.id === sp.fieldId);

                      let display: React.ReactNode = sp.textValue;

                      switch (property.fieldType) {
                        case FieldType.Select:
                          display = property.values.find((v) => v.id === sp.textValue).name;
                          break;
                        case FieldType.Boolean:
                          display = 'Yes';
                          break;
                        case FieldType.Repeat: {
                          const labels = property.values.map((v) => v.name);

                          display = (
                            <div className="bg-white p-2 border-gray-200 border">
                              <Table>
                                <TableHead>
                                  <TableRow>
                                    {labels.map((label) => (
                                      <TableHeadCell key={label} slim>
                                        {label}
                                      </TableHeadCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sp.repeatValue.map((row) => (
                                    <TableRow key={JSON.stringify(row)}>
                                      {labels.map((label) => (
                                        <TableCell slim key={label}>
                                          {row.find((v) => v.name === label)?.value}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          );

                          break;
                        }
                      }

                      return (
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" key={sp.fieldId}>
                          <dt className="text-sm font-medium text-gray-500">{property.name}</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{display}</dd>
                        </div>
                      );
                    })}
                </dl>
              </div>
            </div>
          );
        })}
      </div>
      {validation.valid(true, ['services']) ? (
        <div className="pt-4">
          <NavigationButton
            link="../schedule"
            icon={<CtrlRightIcon />}
            disabled={orderState.services.length === 0}
            style={ButtonStyle.PRIMARY}
          >
            Continue
          </NavigationButton>
        </div>
      ) : null}
    </>
  );
}

function ConfigureService({
  order,
  orderFields,
  local,
  services,
}: {
  services: Service[];
  order: State<OrderCreateState>;
  orderFields: State<FieldValueWrite[]>;
  local: State<LocalState>;
}) {
  const orderState = useState(order);
  const localState = useState(local);
  const add = useMutationPromise(VendorOrderAddServiceDocument);
  const update = useMutationPromise(VendorJobUpdateDocument);

  const context = useOrderCreateStateContext(order, orderFields);

  if (localState.adding.get() > -1) {
    const serviceState = orderState.services[localState.adding.get()];
    const service = services.find((s) => s.id === serviceState.serviceId.get());

    return (
      <FormGroups>
        <>
          <FormGroup>
            <ServiceCostHeading
              fieldValuesState={serviceState.fields}
              serviceId={service.id}
              serviceName={service.internalName}
              context={context}
            />
            <ServiceConfigureForm
              context={context}
              serviceId={service.id}
              type={PerformableFormType.VENDOR}
              state={serviceState.fields}
            />
          </FormGroup>
          <PromiseButton
            onClick={async () => {
              if (localState.edit.get()) {
                const resp = await update({
                  jobId: serviceState.id.get(),
                  versionId: serviceState.versionId.get(),
                  data: {
                    fields: serviceState.fields.get(),
                  },
                });

                serviceState.versionId.set(resp.updateJob.versionId);
              } else {
                const added = await add({
                  orderId: orderState.orderId.get(),
                  data: {
                    services: [serviceState.get()],
                    requested: [],
                  },
                });

                serviceState.merge({
                  id: added.addJobsToOrder[0].id,
                  versionId: added.addJobsToOrder[0].versionId,
                });
              }

              localState.merge({ add: false, adding: -1 });

              return false;
            }}
            disabled={!Validation(serviceState).valid(true)}
          >
            Done
          </PromiseButton>
        </>
      </FormGroups>
    );
  }

  return <></>;
}

function ChooseService({
  order,
  local,
  services,
}: {
  services: Service[];
  order: State<OrderCreateState>;
  local: State<LocalState>;
}) {
  const orderState = useState(order);
  const localState = useState(local);
  const search = useState('');

  return (
    <ul>
      <input
        type="text"
        required={true}
        autoFocus={true}
        value={search.get()}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb"
        placeholder={'Service name...'}
        onChange={(e) => search.set(e.target.value)}
      />
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell></TableHeadCell>
            <TableHeadCell>Name</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {services
            .filter(({ internalName }) =>
              internalName.toLocaleLowerCase().includes(search.get().trim().toLocaleLowerCase())
            )
            .map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <Button
                    style={ButtonStyle.QUIET}
                    onClick={() => {
                      const added: OrderCreateService = {
                        serviceId: service.id,
                        fields: service.properties.map((p) => ({
                          fieldId: p.id,
                        })),
                        id: uuid.v4(),
                        group: uuid.v4(),
                      };

                      orderState.services.merge([added]);

                      localState.adding.set(orderState.services.length - 1);
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
      <div className="mt-4">
        <Button style={ButtonStyle.PRIMARY} onClick={() => localState.add.set(false)}>
          Cancel
        </Button>
      </div>
    </ul>
  );
}

export default function VendorOrderCreateServices({
  state,
  address,
  orderFields,
}: {
  orderFields: State<FieldValueWrite[]>;
  address: State<AddressInput>;
  state: State<OrderCreateState>;
}) {
  const { vendor } = useQueryHook(VendorOrderCreateServicesDocument, { vendorId: state.vendorId.get() });

  const local = useState<LocalState>({ add: false, edit: false });

  let content;

  if (local.adding.get() > -1) {
    content = <ConfigureService order={state} local={local} services={vendor.services} orderFields={orderFields} />;
  } else if (local.add.get()) {
    content = <ChooseService order={state} local={local} services={vendor.services} />;
  } else {
    content = <ServiceList order={state} local={local} services={vendor.services} />;
  }

  return (
    <Center padding>
      <div className="mb">
        <strong>Address:</strong> {address.get().line1}, {address.get().city}, {address.get().state}{' '}
        {address.get().postalCode}
      </div>
      {content}
    </Center>
  );
}
