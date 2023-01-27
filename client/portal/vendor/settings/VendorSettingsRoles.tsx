import { useState } from '@hookstate/core';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import FormArrayCheckbox from 'client/global/components/form/FormArrayCheckbox';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
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
import { useIntl } from 'react-intl';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import {
  AcknowledgeAssignment,
  Permission,
  RoleCreate,
  RoleType,
  VendorRoleCreateDocument,
  VendorRolesDocument,
  VendorRoleUpdateDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import EditIcon from 'shared/icons/EditIcon';
import TagIcon from 'shared/icons/TagIcon';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

function VendorSettingsRolesEdit() {
  const { role: roleId, vendorId } = useParams();
  const intl = useIntl();

  const query = useQueryHook(VendorRolesDocument, { vendorId });

  const role = query.vendor.roles.find((r) => r.id === roleId);

  const form = useState(role);

  ValidationAttach(form, (validator) => {
    validator.name.required();
  });

  const navigate = useNavigate();

  useRegisterBreadcrumb(role.name);

  const update = useMutationPromise(VendorRoleUpdateDocument);

  const button = (
    <PromiseButton
      key="save"
      disabled={!Validation(form).valid(true)}
      onClick={async () => {
        await update({
          data: {
            calendar: form.calendar.get(),
            name: form.name.get(),
            default: form.default.get(),
            required: form.required.get(),
            acknowledgeAssignment: form.acknowledgeAssignment.get(),
            permissions: form.permissions.get() || [],
          },
          roleId,
        });

        navigate('../');
      }}
    >
      Save
    </PromiseButton>
  );

  return (
    <Center small>
      <Toolbar title="Update Role" actions={[button]}>
        <FormGroup>
          <FormHorizontal state={form.name} lang="name">
            <FormText state={form.name} />
          </FormHorizontal>
          <FormHorizontal state={form.default} name="Default">
            <FormSwitch state={form.default} />
          </FormHorizontal>
          <FormHorizontal state={form.required} lang="roles.required">
            <FormSwitch state={form.required} />
          </FormHorizontal>
          <FormHorizontal state={form.calendar} lang="roles.calendar">
            <FormSwitch state={form.calendar} />
          </FormHorizontal>
          {role.type === RoleType.Provider && (
            <FormHorizontal state={form.acknowledgeAssignment} name="Acknowledge Assignment">
              <FormSelect
                state={form.acknowledgeAssignment}
                options={[AcknowledgeAssignment.Default, AcknowledgeAssignment.Force, AcknowledgeAssignment.Ignore].map(
                  (f) => ({ value: f, label: f })
                )}
              ></FormSelect>
            </FormHorizontal>
          )}
          <FormHorizontal state={form.permissions} name="Permissions">
            <Table card>
              <TableHead>
                <TableRow>
                  <TableHeadCell slim>Permission</TableHeadCell>
                  <TableHeadCell slim />
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(Permission).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell slim>{intl.formatMessage({ id: `${value}.name` })}</TableCell>
                    <TableCell slim>
                      <FormArrayCheckbox state={form.permissions} value={value} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </FormHorizontal>
        </FormGroup>
      </Toolbar>
    </Center>
  );
}

function VendorSettingsRolesCreate() {
  const { vendorId } = useParams();
  const form = useState({ permissions: [] } as RoleCreate);
  const intl = useIntl();

  ValidationAttach(form, (validator) => {
    validator.type.required();
    validator.name.required();
  });

  const navigate = useNavigate();

  const create = useMutationPromise(VendorRoleCreateDocument);

  useRegisterBreadcrumb('Create');

  const button = (
    <PromiseButton
      key="update"
      disabled={!Validation(form).valid(true)}
      onClick={async () => {
        await create({
          data: {
            calendar: !!form.calendar.get(),
            name: form.name.get(),
            default: form.default.get(),
            type: form.type.get(),
            required: !!form.required.get(),
            permissions: form.permissions.get() || [],
          },
          vendorId,
        });

        navigate('../');
      }}
    >
      Create
    </PromiseButton>
  );

  return (
    <Center small>
      <Toolbar title="Create Role" actions={[button]}>
        <FormGroup>
          <FormHorizontal state={form.type} lang="roles.type">
            <FormSelect
              state={form.type}
              options={[
                { label: 'Buyer', value: RoleType.Buyer },
                { label: 'Provider', value: RoleType.Provider },
                { label: 'Vendor', value: RoleType.Vendor },
              ]}
            />
          </FormHorizontal>
          <FormHorizontal state={form.name} lang="name">
            <FormText state={form.name} />
          </FormHorizontal>
          <FormHorizontal
            state={form.default}
            name="Default"
            description="Assign this role to a user if they signup through the shop."
          >
            <FormSwitch state={form.default} />
          </FormHorizontal>
          <FormHorizontal state={form.required} lang="roles.required">
            <FormSwitch state={form.required} />
          </FormHorizontal>
          <FormHorizontal state={form.calendar} lang="roles.calendar">
            <FormSwitch state={form.calendar} />
          </FormHorizontal>
          <FormHorizontal state={form.permissions} name="Permissions">
            <Table card>
              <TableHead>
                <TableRow>
                  <TableHeadCell slim>Permission</TableHeadCell>
                  <TableHeadCell slim />
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(Permission).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell slim>{intl.formatMessage({ id: `${value}.name` })}</TableCell>
                    <TableCell slim>
                      <FormArrayCheckbox state={form.permissions} value={value} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </FormHorizontal>
        </FormGroup>
      </Toolbar>
    </Center>
  );
}

function VendorSettingsRolesList() {
  const { vendorId } = useParams();

  const query = useQueryHook(VendorRolesDocument, { vendorId }, 'cache-and-network');

  const roles = query.vendor.roles.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Center small>
      <Table card>
        <TableHead>
          <TableRow>
            <TableHeadCell>Role Name</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <Link icon={<AddIcon />} to="./create" style={LinkStyle.BOLD}>
                Create Role
              </Link>
            </TableCell>
          </TableRow>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>
                <Link icon={<EditIcon />} to={`./${role.id}`}>
                  <span className="pr-1.5">
                    <Badge type={BadgeType.NEUTRAL} icon={<TagIcon />}>
                      {role.type.toLowerCase()}
                    </Badge>
                  </span>
                  {role.name}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Center>
  );
}

export default function VendorSettingsRoles() {
  return (
    <Routes>
      <Route path="/" element={<VendorSettingsRolesList />} />
      <Route path="/create" element={<VendorSettingsRolesCreate />} />
      <Route path="/:role" element={<VendorSettingsRolesEdit />} />
    </Routes>
  );
}
