import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { none, State, useState } from '@hookstate/core';
import SlidebarOpenButton, { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import FormPhone from 'client/global/components/form/FormPhone';
import Phone from 'client/global/components/format/Phone';
import Paginator from 'client/global/components/tailwind/Paginator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { SlidebarContent, SlidebarFooter, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import { ImportCustomer } from 'client/portal/vendor/customers/import/common';
import * as React from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { VendorCustomersImportUpdateDocument } from 'shared/generated';
import { useQueryPromise } from 'shared/Graph';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';
import EmailIcon from 'shared/icons/EmailIcon';
import PhoneIcon from 'shared/icons/PhoneIcon';
import { ValidationAttach } from 'shared/utilities/Validation';

function Form({ customer, reevaluate }: { customer: State<ImportCustomer>; reevaluate: boolean }) {
  const update = useQueryPromise(VendorCustomersImportUpdateDocument);

  const state = useState({
    companyEmail: customer.metadata.companyEmail.get(),
    companyPhone: customer.metadata.companyPhone.get(),
    first: customer.metadata.first.get(),
    last: customer.metadata.last.get(),
    userPhone: customer.metadata.userPhone.get(),
    userEmail: customer.metadata.userEmail.get(),
    company: customer.metadata.company.get(),
  });

  ValidationAttach(state, (v) => {
    v.company.required();
  });

  return (
    <>
      <SlidebarHeader title="Modify Import Data" />
      <SlidebarContent>
        <FormGroup>
          <FormHorizontal name="Company Name" state={state.company}>
            <FormText state={state.company} />
          </FormHorizontal>
          <FormHorizontal name="Company Email" state={state.companyEmail}>
            <FormText type="email" state={state.companyEmail} />
          </FormHorizontal>
          <FormHorizontal name="Company Phone" state={state.companyPhone}>
            <FormPhone state={state.companyPhone} />
          </FormHorizontal>
          <FormHorizontal name="User First Name" state={state.first}>
            <FormText state={state.first} />
          </FormHorizontal>
          <FormHorizontal name="User Last Name" state={state.last}>
            <FormText type="email" state={state.last} />
          </FormHorizontal>
          <FormHorizontal name="User Phone" state={state.userPhone}>
            <FormPhone state={state.userPhone} />
          </FormHorizontal>
          <FormHorizontal name="User Email" state={state.userEmail}>
            <FormText type="email" state={state.userEmail} />
          </FormHorizontal>
        </FormGroup>
      </SlidebarContent>
      <SlidebarFooter>
        <SlidebarCloseButton
          onClick={async () => {
            const resp = await update({
              importId: customer.id.get(),
              reevaluate,
              data: state.get(),
            });

            customer.metadata.merge(resp.updateImportCustomer.metadata);
          }}
        >
          Save
        </SlidebarCloseButton>
      </SlidebarFooter>
    </>
  );
}

function ImportCustomerItem({
  customer,
  reevaluate,
  onRemove,
}: {
  customer: State<ImportCustomer>;
  reevaluate: boolean;
  onRemove: () => Promise<void>;
}) {
  const user = `${customer.metadata.first.get() || ''} ${customer.metadata.last.get() || ''}`.trim();

  return (
    <TableRow key={customer.id.get()}>
      <TableCell>
        <div className="space-y-1">
          <strong>{customer.metadata.company.get()}</strong>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 inline-block text-quiet">
              <EmailIcon />
            </span>
            <div>{customer.metadata.companyEmail.get() || <em className="text-sm text-quiet">N/A</em>}</div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 inline-block text-quiet">
              <PhoneIcon />
            </span>
            <div>
              {customer.metadata.companyPhone.get() ? (
                <Phone number={customer.metadata.companyPhone.get()} />
              ) : (
                <em className="text-sm text-quiet">N/A</em>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {user ? (
          <div className="space-y-1">
            <strong>{user}</strong>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 inline-block text-quiet">
                <EmailIcon />
              </span>
              <div>{customer.metadata.userEmail.get() || <em className="text-sm text-quiet">N/A</em>}</div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 inline-block text-quiet">
                <PhoneIcon />
              </span>
              <div>
                {customer.metadata.userPhone.get() ? (
                  <Phone number={customer.metadata.userPhone.get()} />
                ) : (
                  <em className="text-sm text-quiet">N/A</em>
                )}
              </div>
            </div>
          </div>
        ) : (
          <em className="text-sm text-quiet">No user information provided</em>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <SlidebarOpenButton style={ButtonStyle.SECONDARY} icon={<EditIcon />} button="Edit">
          <Form customer={customer} reevaluate={reevaluate} />
        </SlidebarOpenButton>
        <PromiseButton icon={<DeleteIcon />} style={ButtonStyle.DANGER} onClick={onRemove}>
          Exclude
        </PromiseButton>
      </TableCell>
    </TableRow>
  );
}

export default function ImportCustomerList<D, R extends keyof ImportCustomer['metadata']>({
  customers,
  remove,
  resolved,
  reevaluate,
  resp,
}: {
  reevaluate?: boolean;
  customers: State<ImportCustomer>[];
  remove: TypedDocumentNode<D, { importId: string }>;
  resolved: ImportCustomer['metadata'][R] extends boolean ? R : never;
  resp: keyof D;
}) {
  const ignore = useQueryPromise(remove);
  const page = useState(1);
  const per = 25;

  return (
    <div className="flex-1 flex flex-col pt">
      <div className="flex-1 pb">
        <Table border round fixed>
          <TableHead>
            <TableRow>
              <TableHeadCell className="w-1/2">Company</TableHeadCell>
              <TableHeadCell className="w-1/2">User</TableHeadCell>
              <TableHeadCell></TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.slice((page.get() - 1) * per, page.get() * per).map((customer) => (
              <ImportCustomerItem
                key={customer.id.get()}
                customer={customer}
                reevaluate={!!reevaluate}
                onRemove={async () => {
                  const result = await ignore({ importId: customer.id.get() });

                  if (result[resp]) {
                    customer.set(none);
                  } else {
                    (customer.metadata[resolved] as State<boolean>).set(true);
                  }
                }}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <Paginator total={customers.length} per={per} onPage={page.set} />
    </div>
  );
}
