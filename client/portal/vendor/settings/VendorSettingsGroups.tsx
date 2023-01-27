import { State, useState } from '@hookstate/core';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
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
import Toolbar from 'client/global/components/tailwind/Toolbar';
import * as React from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import {
  BuyerGroupTypeWrite,
  VendorBuyerGroupTypesDocument,
  VendorCreateBuyerGroupTypeDocument,
  VendorGetBuyerGroupTypeDocument,
  VendorUpdateBuyerGroupTypeDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

export function Form({
  title,
  write,
  button,
}: {
  title: string;
  button: React.ReactNode;
  write: State<BuyerGroupTypeWrite>;
}) {
  const state = useState(write);

  return (
    <Toolbar title={title} actions={button}>
      <FormGroup>
        <FormHorizontal state={state.name} name="Name">
          <FormText state={state.name} />
        </FormHorizontal>
      </FormGroup>
    </Toolbar>
  );
}

function validation(state: State<BuyerGroupTypeWrite>) {
  ValidationAttach(state, (validator) => {
    validator.name.required();
  });
}

export function BuyerGroupTypeEdit() {
  const { buyerGroupTypeId } = useParams();
  const buyerGroupType = useQueryHook(VendorGetBuyerGroupTypeDocument, { buyerGroupTypeId });

  const state = useState<BuyerGroupTypeWrite>(buyerGroupType.buyerGroupType);

  validation(state);

  const updateBuyerGroupType = useMutationPromise(VendorUpdateBuyerGroupTypeDocument);

  useRegisterBreadcrumb(buyerGroupType.buyerGroupType.name);

  const SaveButton = () => (
    <PromiseButton
      key="save"
      disabled={!Validation(useState(state)).valid(true)}
      onClick={async () => {
        await updateBuyerGroupType({ buyerGroupTypeId, data: state.get() });
      }}
    >
      Save
    </PromiseButton>
  );

  return <Form button={<SaveButton />} write={state} title="Edit Customer Group Type" />;
}

export function BuyerGroupTypeCreate() {
  const { vendorId } = useParams();
  const state = useState({} as BuyerGroupTypeWrite);

  validation(state);

  useRegisterBreadcrumb('Create');

  const createBuyerGroupType = useMutationPromise(VendorCreateBuyerGroupTypeDocument);

  const navigate = useNavigate();
  const SaveButton = () => (
    <PromiseButton
      key="save"
      disabled={!Validation(useState(state)).valid(true)}
      onClick={async () => {
        await createBuyerGroupType({ vendorId, data: state.get() });

        navigate('../');
      }}
    >
      Save
    </PromiseButton>
  );

  return <Form button={<SaveButton />} write={state} title="Create Customer Group Type" />;
}

export function List() {
  const { vendorId } = useParams();

  const data = useQueryHook(VendorBuyerGroupTypesDocument, { vendorId }, 'cache-and-network');

  return (
    <Table card>
      <TableHead>
        <TableRow>
          <TableHeadCell>Customer Group Type Name</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>
            <Link to="./create" style={LinkStyle.BOLD} icon={<AddIcon />}>
              Create New Customer Group Type
            </Link>
          </TableCell>
        </TableRow>
        {data.vendor.buyerGroupTypes.map((buyerGroupType) => (
          <TableRow key={buyerGroupType.id}>
            <TableCell>
              <Link to={`./${buyerGroupType.id}`}>{buyerGroupType.name}</Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function VendorSettingsBuyerGroupType() {
  return (
    <Center small>
      <Routes>
        <Route path="/create/*" element={<BuyerGroupTypeCreate />} />
        <Route path="/:buyerGroupTypeId/*" element={<BuyerGroupTypeEdit />} />
        <Route path="/*" element={<List />} />
      </Routes>
    </Center>
  );
}
