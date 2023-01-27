import { useState } from '@hookstate/core';
import { FORM_TIMEZONE_OPTIONS } from 'client/const';
import NavigationButton from 'client/global/components/button/NavigationButton';
import FormUser from 'client/global/components/form/FormUser';
import Center from 'client/global/components/tailwind/Center';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import Tabs from 'client/global/components/tailwind/Tabs';
import * as React from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import FormAddress from 'shared/components/form/FormAddress/FormAddress';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import {
  AdminVendorCreateDocument,
  AdminVendorGetDocument,
  AdminVendorsDocument,
  AdminVendorUpdateDocument,
  TimeZone,
  VendorAdminWrite,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import EditIcon from 'shared/icons/EditIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

function AdminVendorList() {
  const { vendors } = useQueryHook(AdminVendorsDocument, {}, 'cache-and-network');

  return (
    <Table card>
      <TableHead>
        <TableRow>
          <TableHeadCell>Vendor</TableHeadCell>
          <TableHeadCell></TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>
            <Link to="./create" style={LinkStyle.BOLD}>
              Create New Vendor
            </Link>
          </TableCell>
          <TableCell> </TableCell>
        </TableRow>
        {vendors.map((vendor) => (
          <TableRow key={vendor.id}>
            <TableCell>
              <Link to={`./${vendor.id}`} icon={<EditIcon />}>
                {vendor.company}
              </Link>
            </TableCell>
            <TableCell>
              <NavigationButton link={`/ui/vendor/${vendor.id}`}>Impersonate</NavigationButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface AdminVendorFormProps {
  button: string;
  title: string;
  memberId?: string;
  data: VendorAdminWrite;
  save: (data: VendorAdminWrite) => Promise<void>;
}

function AdminVendorForm({ data, save, button, memberId }: AdminVendorFormProps) {
  const state = useState<VendorAdminWrite>(data);

  ValidationAttach(state, (validator) => {
    validator.company.required();
    validator.timezone.required();
    validator.address.required();
  });

  return (
    <>
      <FormGroup>
        <FormHorizontal state={state.company} name="Vendor Name">
          <FormText state={state.company} />
        </FormHorizontal>
        <FormHorizontal state={state.timezone} name="Timezone">
          <FormSelect state={state.timezone} options={FORM_TIMEZONE_OPTIONS} />
        </FormHorizontal>
        <FormHorizontal state={state.address} name="Address">
          <FormAddress state={state.address} />
        </FormHorizontal>
        <FormHorizontal state={state.applicationFee} name="Transaction Fee">
          <FormText type="number" state={state.applicationFee} />
        </FormHorizontal>
        <FormHorizontal state={state.owners} name="Owners">
          <FormUser state={state.owners} memberId={memberId} checkMemberIds={[]} />
        </FormHorizontal>
      </FormGroup>
      <PromiseButton onClick={() => save(state.get())} disabled={!Validation(state).valid(true)}>
        {button}
      </PromiseButton>
    </>
  );
}

export function AdminVendorEdit() {
  const { vendorId } = useParams();

  const { vendor: resp } = useQueryHook(AdminVendorGetDocument, { vendorId });

  const { users, id, ...vendor } = resp;

  const data: VendorAdminWrite = {
    ...vendor,
    owners: users.filter((u) => u.owner).map((u) => u.userId),
  };

  const save = useMutationPromise(AdminVendorUpdateDocument);

  return (
    <Tabs
      tabs={[
        {
          name: 'General',
          key: 'general',
          useElement: (
            <AdminVendorForm
              data={data}
              title="Edit Vendor"
              button="Update"
              memberId={vendorId}
              save={async (data) => {
                await save({ data, vendorId });
              }}
            />
          ),
        },
      ]}
    />
  );
}

export function AdminVendorCreate() {
  const navigate = useNavigate();

  const data = {
    timezone: TimeZone.UsEastern,
    owners: [],
  } as VendorAdminWrite;

  const create = useMutationPromise(AdminVendorCreateDocument);

  const save = async (write: VendorAdminWrite) => {
    await create({ data: write });

    navigate('../');
  };

  return <AdminVendorForm data={data} title="Create Vendor" button="Create" save={save} />;
}

export default function AdminVendors() {
  return (
    <Center padding small>
      <Routes>
        <Route path="/" element={<AdminVendorList />} />
        <Route path="/create" element={<AdminVendorCreate />} />
        <Route path="/:vendorId/*" element={<AdminVendorEdit />} />
      </Routes>
    </Center>
  );
}
