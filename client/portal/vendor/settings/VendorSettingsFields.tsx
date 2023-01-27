import { none, State, useState } from '@hookstate/core';
import { ESTATED_FIELD_TYPE, FORM_FIELD_TYPE, HD_PHOTO_HUB_SITE_FIELD_TYPE, RELA_SITE_FIELD_TYPE } from 'client/const';
import ErrorBadge from 'client/global/components/ErrorBadge';
import FormMoney from 'client/global/components/form/FormMoney';
import FieldOptionsTab from 'client/global/components/model/FieldOptionsTab';
import Sortable from 'client/global/components/Sortable';
import Center from 'client/global/components/tailwind/Center';
import Tabs, { Tab } from 'client/global/components/tailwind/Tabs';
import SlidebarRouter from 'client/global/layout/slidebar/SlidebarRouter';
import VendorConditionsTab from 'client/portal/vendor/components/VendorConditionsTab';
import { VendorSettingsContext } from 'client/portal/vendor/settings/VendorSettingsData';
import * as React from 'react';
import { useContext } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { FieldOptionWrite, FieldRole, FieldType, FieldWrite, Visibility } from 'shared/generated';
import DeleteIcon from 'shared/icons/DeleteIcon';
import MoveIcon from 'shared/icons/MoveIcon';
import { Validation } from 'shared/utilities/Validation';
import { v4 } from 'uuid';

function OptionForm({ state }: { state: State<FieldOptionWrite> }) {
  const scoped = useState(state);

  return (
    <FormGroup>
      <FormHorizontal state={scoped.name} name="Name">
        <FormText state={scoped.name} />
      </FormHorizontal>
      <FormHorizontal state={scoped.revenue} name="Revenue">
        <FormMoney state={scoped.revenue} />
      </FormHorizontal>
      <FormHorizontal state={scoped.preselected} name="Preselected">
        <FormSwitch state={scoped.preselected} />
      </FormHorizontal>
    </FormGroup>
  );
}

function FieldForm({ state, update = false }: { state: State<FieldWrite>; update?: boolean }) {
  const form = useState(state);

  return (
    <FormGroup>
      <FormHorizontal state={form.name} lang="name">
        <FormText state={form.name} />
      </FormHorizontal>
      <FormHorizontal state={form.role} name="Role">
        <FormSelect
          state={form.role}
          options={[
            { label: 'Order', value: FieldRole.Order },
            { label: 'Customer', value: FieldRole.Buyer },
            { label: 'Deliverable', value: FieldRole.Deliverable },
          ]}
        />
      </FormHorizontal>
      <FormHorizontal state={form.fieldType} name="Type">
        <FormSelect state={form.fieldType} options={FORM_FIELD_TYPE} disabled={update} />
      </FormHorizontal>
      {form.fieldType.get() === FieldType.Boolean && (
        <FormHorizontal state={form.defaultValue} name="Default Value">
          <FormSelect
            state={form.defaultValue}
            options={[
              {
                label: 'Checked',
                value: 'false',
              },
              {
                label: 'Unchecked',
                value: 'true',
              },
            ]}
          />
        </FormHorizontal>
      )}
      {form.fieldType.get() === FieldType.Single && (
        <FormHorizontal state={form.defaultable} name="Can Default">
          <FormSwitch state={form.defaultable} />
        </FormHorizontal>
      )}
      <FormHorizontal state={form.showOnReschedule} lang="showOnReschedule">
        <FormSwitch state={form.showOnReschedule} />
      </FormHorizontal>
      <FormHorizontal state={form.visibility} name="Visibility">
        <FormSelect
          state={form.visibility}
          options={[
            { value: Visibility.External, label: 'Show to Buyer' },
            { value: Visibility.Internal, label: 'Internal Only' },
          ]}
        />
      </FormHorizontal>
      <FormHorizontal state={form.showOnScheduleHover} name="Show on Schedule Hover">
        <FormSwitch state={form.showOnScheduleHover} />
      </FormHorizontal>
      <FormHorizontal state={form.showBeforeSubmit} name="Show Before Submit">
        <FormSwitch state={form.showBeforeSubmit} />
      </FormHorizontal>
      <FormHorizontal state={form.showOnCreateOrder} name="Show on Create Order">
        <FormSwitch state={form.showOnCreateOrder} />
      </FormHorizontal>
      <FormHorizontal state={form.showOnHoldOrder} name="Show on Hold Order">
        <FormSwitch state={form.showOnHoldOrder} />
      </FormHorizontal>
      <FormHorizontal state={form.showOnRejection} name="Show on Rejection">
        <FormSwitch state={form.showOnRejection} />
      </FormHorizontal>
      <FormHorizontal state={form.requiredOnCreate} name="Require at Order Creation">
        <FormSwitch state={form.requiredOnCreate} />
      </FormHorizontal>
      <FormHorizontal state={form.showOnOrderList} name="Show on Order List">
        <FormSwitch state={form.showOnOrderList} />
      </FormHorizontal>
      <FormHorizontal
        state={form.showOnSelfEdit}
        name="Show on Self Edit"
        description="Show on buyer/provider profile edit"
      >
        <FormSwitch state={form.showOnSelfEdit} />
      </FormHorizontal>
      <FormHorizontal state={form.revenue} name="Revenue">
        <FormMoney state={form.revenue} />
      </FormHorizontal>
      <FormHorizontal state={form.group} name="Group">
        <FormText state={form.group} />
      </FormHorizontal>
      <FormHorizontal state={form.hdPhotoHub} lang="hdPhotoHub">
        <FormSelect state={form.hdPhotoHub} options={HD_PHOTO_HUB_SITE_FIELD_TYPE} />
      </FormHorizontal>
      <FormHorizontal state={form.rela} lang="rela">
        <FormSelect state={form.rela} options={RELA_SITE_FIELD_TYPE} />
      </FormHorizontal>
      <FormHorizontal state={form.estated} lang="estated">
        <FormSelect state={form.estated} options={ESTATED_FIELD_TYPE} />
      </FormHorizontal>
      <FormHorizontal state={form.apiName} lang="apiName">
        <FormText state={form.apiName} />
      </FormHorizontal>
    </FormGroup>
  );
}

function VendorSettingsFieldsEdit() {
  const { fieldId } = useParams();

  const { settings } = useContext(VendorSettingsContext);

  const allState = useState(settings.fields);

  const form = allState.find((s) => s.id.get() === fieldId);

  const isNewField = isNaN(Number(fieldId));

  const tabs: Tab[] = [
    {
      name: 'General',
      useElement: <FieldForm state={form} update={!isNewField} />,
      key: 'fgeneral',
    },
    VendorConditionsTab(form, allState),
  ];

  if (form.fieldType.get() === FieldType.Select) {
    tabs.push(
      FieldOptionsTab({
        field: form,
        form: OptionForm,
      })
    );
  }

  return (
    <Center padding>
      <Tabs tabs={tabs} />
    </Center>
  );
}

function FieldRoleList({ fields, role }: { fields: State<FieldWrite[]>; role?: FieldRole }) {
  return (
    <div className="space-y-2">
      {fields
        .filter((field) => (role ? field.role.get() === role : true))
        .map((field, index) => (
          <Sortable index={index} state={fields} key={index}>
            <div className="bg-content round shadow p-4 flex items-center cursor-pointer">
              <div className="w-4 h-4 mr-2 cursor-move">
                <MoveIcon />
              </div>
              <NavLink to={`../edit/${field.id.get()}`} className="flex-1 relative">
                {field.name.get()}
                {!Validation(field).valid(true) && <ErrorBadge />}
              </NavLink>
              <Button
                style={ButtonStyle.QUIET}
                onClick={(e) => {
                  e.preventDefault();

                  field.set(none);
                }}
                icon={<DeleteIcon />}
              />
            </div>
          </Sortable>
        ))}
    </div>
  );
}

function VendorSettingsFieldsList() {
  const { settings } = useContext(VendorSettingsContext);

  const navigate = useNavigate();

  return (
    <Center padding>
      <Tabs
        router={false}
        tabs={[
          {
            key: 'all',
            name: 'All',
            useActions: () => [
              <Button
                style={ButtonStyle.SECONDARY}
                onClick={() => {
                  const id = v4();

                  let order = -1;

                  for (const value of settings.fields.get()) {
                    if (value.order > order) {
                      order = value.order;
                    }
                  }

                  settings.fields.merge([
                    { id, defaultable: false, conditions: [], values: [], order: order + 1 } as FieldWrite,
                  ]);

                  navigate(`./edit/${id}`);
                }}
                key="add"
              >
                Add Fields
              </Button>,
            ],
            useElement: <FieldRoleList fields={settings.fields} />,
          },
          {
            key: 'order',
            name: 'Order',
            useActions: () => [
              <Button
                style={ButtonStyle.SECONDARY}
                onClick={() => {
                  const id = v4();

                  let order = -1;

                  for (const value of settings.fields.get()) {
                    if (value.order > order) {
                      order = value.order;
                    }
                  }

                  settings.fields.merge([
                    {
                      id,
                      defaultable: false,
                      conditions: [],
                      values: [],
                      order: order + 1,
                      role: FieldRole.Order,
                    } as FieldWrite,
                  ]);

                  navigate(`./edit/${id}`);
                }}
                key="add"
              >
                Add Fields
              </Button>,
            ],
            useElement: <FieldRoleList fields={settings.fields} role={FieldRole.Order} />,
          },
          {
            key: 'customer',
            name: 'Customer',
            useActions: () => [
              <Button
                style={ButtonStyle.SECONDARY}
                onClick={() => {
                  const id = v4();

                  let order = -1;

                  for (const value of settings.fields.get()) {
                    if (value.order > order) {
                      order = value.order;
                    }
                  }

                  settings.fields.merge([
                    {
                      id,
                      defaultable: false,
                      conditions: [],
                      values: [],
                      order: order + 1,
                      role: FieldRole.Buyer,
                    } as FieldWrite,
                  ]);

                  navigate(`./edit/${id}`);
                }}
                key="add"
              >
                Add Fields
              </Button>,
            ],
            useElement: <FieldRoleList fields={settings.fields} role={FieldRole.Buyer} />,
          },
          {
            key: 'deliverable',
            name: 'Deliverable',
            useActions: () => [
              <Button
                style={ButtonStyle.SECONDARY}
                onClick={() => {
                  const id = v4();

                  let order = -1;

                  for (const value of settings.fields.get()) {
                    if (value.order > order) {
                      order = value.order;
                    }
                  }

                  settings.fields.merge([
                    {
                      id,
                      defaultable: false,
                      conditions: [],
                      values: [],
                      order: order + 1,
                      role: FieldRole.Deliverable,
                    } as FieldWrite,
                  ]);

                  navigate(`./edit/${id}`);
                }}
                key="add"
              >
                Add Fields
              </Button>,
            ],
            useElement: <FieldRoleList fields={settings.fields} role={FieldRole.Deliverable} />,
          },
        ]}
      />
    </Center>
  );
}

export default function VendorSettingsFields() {
  return (
    <SlidebarRouter root={<VendorSettingsFieldsList />} paths={{ 'edit/:fieldId': <VendorSettingsFieldsEdit /> }} />
  );
}
