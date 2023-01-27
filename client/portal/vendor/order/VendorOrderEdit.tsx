import { none } from '@hookstate/core';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import OrderFieldsForm, { useOrderUpdateState } from 'client/global/components/fields/OrderFieldsForm';
import OrderRequestedSlidebar from 'client/global/components/model/OrderRequestedSlidebar';
import Requested from 'client/global/components/Requested';
import Center from 'client/global/components/tailwind/Center';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import useCurrentVendor from 'client/global/hooks/useCurrentVendor';
import { ContactTableBody } from 'client/portal/vendor/customers/VendorCustomerContactForm';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import FormAddress from 'shared/components/form/FormAddress/FormAddress';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { VendorOrderViewQuery } from 'shared/generated';
import DeleteIcon from 'shared/icons/DeleteIcon';

export function VendorOrderEdit({ order }: { order: VendorOrderViewQuery['order'] }) {
  const { vendor } = useCurrentVendor();
  const [state, update] = useOrderUpdateState(order);

  const navigate = useNavigate();

  useRegisterBreadcrumb('Edit');

  // TODO: make this type safe
  // eslint-disable-next-line
  const requested = state.requested as any;

  return (
    <Center small>
      <div className="space-y">
        <FormGroup>
          <FormHorizontal name="Address" state={state.address}>
            <FormAddress state={state.address} coords={vendor.address} />
          </FormHorizontal>
        </FormGroup>
        <Table card>
          <TableHead>
            <TableRow>
              <TableHeadCell>Requested Times</TableHeadCell>
              <TableHeadCell />
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={2}>
                <OrderRequestedSlidebar state={requested} />
              </TableCell>
            </TableRow>
            {state.requested.map((requested) => (
              <TableRow key={`${requested.start.get()}${requested.end.get()}`}>
                <TableCell>
                  <Requested
                    start={requested.start.get() ? new Date(requested.start.get()) : null}
                    end={requested.end.get() ? new Date(requested.end.get()) : null}
                  />
                </TableCell>
                <TableCell>
                  <Button style={ButtonStyle.DANGER} slim icon={<DeleteIcon />} onClick={() => requested.set(none)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Table card>
          <TableHead>
            <TableRow>
              <TableHeadCell>CC To</TableHeadCell>
              <TableHeadCell />
              <TableHeadCell />
              <TableHeadCell />
            </TableRow>
          </TableHead>
          <ContactTableBody state={state.contacts} isCustomerForm />
        </Table>
        <OrderFieldsForm vendorId={order.vendorId} wrapper={FormGroup} state={state.metadata} />
        <PromiseButton
          onClick={async () => {
            await update();

            navigate('../');
          }}
        >
          Save
        </PromiseButton>
      </div>
    </Center>
  );
}
