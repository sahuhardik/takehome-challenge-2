import { none, State, useState } from '@hookstate/core';
import { FORM_FIELD_TYPE } from 'client/const';
import { SlidebarOpenLink } from 'client/global/components/button/SlidebarOpenButton';
import Center from 'client/global/components/tailwind/Center';
import { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { SlidebarContent } from 'client/global/layout/slidebar/Slidebar';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  FieldLifecycle,
  FieldRole,
  PerformablePropertyWrite,
  PropertyPricing,
  RuleAdjustment,
  ServiceWrite,
  Visibility,
} from 'shared/generated';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import { v4 } from 'uuid';

function AddProperty({ state }: { state: State<ServiceWrite> }) {
  const scoped = useState(state.properties[state.properties.length - 1]);

  return (
    <FormGroup>
      <FormHorizontal state={scoped.name} name="Name">
        <FormText state={scoped.name} />
      </FormHorizontal>
      <FormHorizontal state={scoped.fieldType} name="Field Type">
        <FormSelect state={scoped.fieldType} options={FORM_FIELD_TYPE} />
      </FormHorizontal>
    </FormGroup>
  );
}

export default function VendorServicePropertyList() {
  const { write } = useContext(ServiceContext);

  return (
    <Center padding>
      <Table card>
        <TableHead>
          <TableRow>
            <TableHeadCell>Properties</TableHeadCell>
            <TableHeadCell></TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <SlidebarOpenLink
                icon={<AddIcon />}
                style={LinkStyle.BOLD}
                text="Add Property"
                onClick={() => {
                  write.properties.merge([
                    {
                      id: v4(),
                      conditions: [],
                      values: [],
                      tiers: [],
                      pricingType: PropertyPricing.Simple,
                      revenueType: RuleAdjustment.AdjustFlat,
                      visibility: Visibility.Internal,
                      lifecycle: FieldLifecycle.Save,
                      role: FieldRole.Job,
                      marketing: {
                        images: [],
                        links: [],
                        videos: [],
                      },
                    } as PerformablePropertyWrite,
                  ]);
                }}
              >
                <SlidebarContent>
                  <AddProperty state={write} />
                </SlidebarContent>
              </SlidebarOpenLink>
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
          {write.properties.map((p) => {
            return (
              <TableRow key={p.id.get()}>
                <TableCell>
                  <NavLink to={`${p.id.get()}`}>{p.name.get()}</NavLink>
                </TableCell>
                <TableCell>
                  <Button style={ButtonStyle.QUIET} icon={<DeleteIcon />} onClick={() => p.set(none)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Center>
  );
}
