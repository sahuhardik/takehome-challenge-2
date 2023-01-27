import { State, useState } from '@hookstate/core';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import OrderFieldsForm from 'client/global/components/fields/OrderFieldsForm';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Card from 'client/global/components/tailwind/Card';
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
import Toolbar from 'client/global/components/tailwind/Toolbar';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import VendorSettingsWizardEdit from 'client/portal/vendor/settings/wizard/VendorSettingsWizardEdit';
import * as React from 'react';
import { useCallback } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  OrderFieldsDocument,
  VendorWizardCreateDocument,
  VendorWizardDeleteDocument,
  VendorWizardGetDocument,
  VendorWizardListDocument,
  VendorWizardUpdateDocument,
  WizardWrite,
} from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';
import TagIcon from 'shared/icons/TagIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

export function Form({ title, write, button }: { title: string; button: React.ReactNode; write: State<WizardWrite> }) {
  const vendorId = useCurrentVendorId();
  const state = useState(write);

  return (
    <Toolbar title={title} actions={button}>
      <Tabs
        tabs={[
          {
            name: 'General',
            key: 'general',
            useElement: (
              <FormGroup>
                <FormHorizontal state={state.name} name="Name">
                  <FormText state={state.name} />
                </FormHorizontal>
                <FormHorizontal
                  state={state.default}
                  name="Default"
                  description="When enabled, this wizard will be presented to the buyer if visiting the homepage of your shop."
                >
                  <FormSwitch state={state.default} />
                </FormHorizontal>
              </FormGroup>
            ),
          },
          VendorSettingsWizardEdit(state.pages),
          {
            name: 'Fields',
            key: 'fields',
            useElement: (
              <OrderFieldsForm
                vendorId={vendorId}
                wrapper={({ children }) => <Card>{children}</Card>}
                state={state.fields}
              />
            ),
          },
        ]}
      />
    </Toolbar>
  );
}

function validation(state: State<WizardWrite>) {
  ValidationAttach(state, (validator) => {
    validator.name.required();
    validator.pages.required();
    validator.pages.performableId.required();
    validator.pages.conditions.performableId.required();
    validator.pages.conditions.comparator.required();
  });
}

export function WizardEdit() {
  const vendorId = useCurrentVendorId();
  const { wizardId } = useParams();
  const wizard = useQueryHook(VendorWizardGetDocument, { wizardId });
  const { vendor } = useQueryHook(OrderFieldsDocument, { vendorId });

  const { id, fields, ...write } = wizard.wizard;

  const state = useState<WizardWrite>({
    ...write,
    fields: vendor.fields.map((field) => {
      const existing = fields.find((f) => f.fieldId === field.id) || {};

      return {
        fieldId: field.id,
        ...existing,
      };
    }),
  });

  validation(state);

  const updateWizard = useMutationPromise(VendorWizardUpdateDocument);

  useRegisterBreadcrumb(wizard.wizard.name);

  const SaveButton = () => (
    <PromiseButton
      key="save"
      disabled={!Validation(useState(state)).valid(true)}
      onClick={async () => {
        await updateWizard({ wizardId, data: state.get() });
      }}
    >
      Save
    </PromiseButton>
  );

  return <Form button={<SaveButton />} write={state} title="Edit Wizard" />;
}

export function WizardCreate() {
  const { vendorId } = useParams();
  const { vendor } = useQueryHook(OrderFieldsDocument, { vendorId });
  const state = useState({ pages: [], fields: vendor.fields.map((f) => ({ fieldId: f.id })) } as WizardWrite);

  validation(state);

  useRegisterBreadcrumb('Create');

  const createWizard = useMutationPromise(VendorWizardCreateDocument);

  const navigate = useNavigate();
  const SaveButton = () => (
    <PromiseButton
      key="save"
      disabled={!Validation(useState(state)).valid(true)}
      onClick={async () => {
        await createWizard({ vendorId, data: state.get() });

        navigate('../');
      }}
    >
      Save
    </PromiseButton>
  );

  return <Form button={<SaveButton />} write={state} title="Create Wizard" />;
}

export function List() {
  const { vendorId } = useParams();

  const data = useQueryHook(VendorWizardListDocument, { vendorId }, 'cache-and-network');
  const deleteWizard = useMutationPromise(VendorWizardDeleteDocument);
  const list = useQueryPromise(VendorWizardListDocument);

  const refresh = useCallback(async () => {
    await list({ vendorId });
  }, [vendorId, list]);

  return (
    <Table card>
      <TableHead>
        <TableRow>
          <TableHeadCell>Wizard Name</TableHeadCell>
          <TableHeadCell />
          <TableHeadCell />
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>
            <Link to="./create" style={LinkStyle.BOLD} icon={<AddIcon />}>
              Create New Wizard
            </Link>
          </TableCell>
        </TableRow>
        {data.vendor.wizards.map((wizard) => (
          <TableRow key={wizard.id}>
            <TableCell>
              <Link to={`./${wizard.id}`} icon={<EditIcon />}>
                {wizard.name}
              </Link>
            </TableCell>
            <TableCell>
              <Link to={`/shop/${vendorId}/${wizard.id}`}>Preview</Link>
            </TableCell>
            <TableCell className="text-center">
              {wizard.default ? (
                <Badge type={BadgeType.NEUTRAL} icon={<TagIcon />}>
                  default
                </Badge>
              ) : (
                <ConfirmationButton
                  title="Delete Wizard"
                  confirmText="Delete"
                  disabled={wizard.default}
                  icon={<DeleteIcon />}
                  description="Are you sure you want to delete this wizard?"
                  onClick={async (e) => {
                    e.preventDefault();
                    await deleteWizard({ wizardId: wizard.id });
                    await refresh();
                  }}
                  style={ButtonStyle.DANGER}
                >
                  Delete
                </ConfirmationButton>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function VendorSettingsWizardRouter() {
  return (
    <Center small>
      <Routes>
        <Route path="/create/*" element={<WizardCreate />} />
        <Route path="/:wizardId/*" element={<WizardEdit />} />
        <Route path="/*" element={<List />} />
      </Routes>
    </Center>
  );
}
