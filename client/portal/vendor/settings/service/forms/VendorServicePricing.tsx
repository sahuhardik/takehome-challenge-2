import { useState } from '@hookstate/core';
import FormMoney from 'client/global/components/form/FormMoney';
import Card from 'client/global/components/tailwind/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import Tabs from 'client/global/components/tailwind/Tabs';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { FieldType, PropertyPricing } from 'shared/generated';

function Inner({ revenue }: { revenue: boolean }) {
  const { write } = useContext(ServiceContext);

  const scope = useState(write);

  if (!scope.variants.length) {
    return (
      <Message type={MessageType.ERROR}>You must have at least one non-quantity property marked as matrix.</Message>
    );
  }

  let quantityPropertyId: string = null;
  const uniqueQuantities = new Map<string, string>();
  const uniqueOptions = new Map<string, { name: string; values: Map<string, string> }>();

  // build rows + columns
  for (const variant of scope.variants.values()) {
    for (const vp of variant.properties.values()) {
      const property = scope.properties.find((p) => p.id.get() === vp.property.get());

      if (!property) {
        // in the process of being removed, state is behind
        continue;
      }

      const pv = property.values.find((v) => v.id.get() === vp.nested('value').get());

      if (!pv) {
        // in the process of being removed, state is behind
        continue;
      }

      if (property.quantity.get()) {
        quantityPropertyId = property.id.get();
        uniqueQuantities.set(pv.id.get(), pv.name.get());
      } else {
        if (property.fieldType.get() === FieldType.Select) {
          if (!uniqueOptions.has(property.id.get())) {
            uniqueOptions.set(property.id.get(), { name: property.name.get(), values: new Map() });
          }

          uniqueOptions.get(property.id.get()).values.set(pv.id.get(), pv.name.get());
        } else if (property.fieldType.get() === FieldType.Boolean) {
          uniqueOptions.set(property.id.get(), {
            name: property.name.get(),
            values: new Map([
              ['true', 'Selected'],
              ['false', 'Unselected'],
            ]),
          });
        } else {
          throw new Error(`Cannot matrix on field type: ${property.fieldType}`);
        }
      }
    }
  }

  // sort row and columns alphabetically
  const sortedQuantities = new Map(
    [...uniqueQuantities.entries()].sort(([, aName], [, bName]) => aName.localeCompare(bName))
  );

  const sortedOptions = new Map(
    [...uniqueOptions.entries()]
      .sort(([, { name: aName }], [, { name: bName }]) => aName.localeCompare(bName))
      .map(([optionId, option]) => [
        optionId,
        {
          name: option.name,
          values: new Map(Array.from(option.values.entries()).sort(([, a], [, b]) => a.localeCompare(b))),
        },
      ])
  );

  const sortedVariants = Array.from(scope.variants).sort((a, b) => {
    const aProperties = a.properties.get();
    const bProperties = b.properties.get();

    for (const [optionId, { values }] of sortedOptions.entries()) {
      const aOptionIndex = Array.from(values.keys()).indexOf(aProperties.find((p) => p.property === optionId)?.value);
      const bOptionIndex = Array.from(values.keys()).indexOf(bProperties.find((p) => p.property === optionId)?.value);

      if (aOptionIndex > bOptionIndex) {
        return 1;
      }

      if (aOptionIndex < bOptionIndex) {
        return -1;
      }
    }

    if (quantityPropertyId) {
      const quantityKeys = Array.from(sortedQuantities.keys());

      const aQuantityIndex = quantityKeys.indexOf(aProperties.find((p) => p.property === quantityPropertyId).value);
      const bQuantityIndex = quantityKeys.indexOf(bProperties.find((p) => p.property === quantityPropertyId).value);

      if (aQuantityIndex > bQuantityIndex) {
        return 1;
      }

      if (aQuantityIndex < bQuantityIndex) {
        return -1;
      }
    }

    return 0;
  });

  const rows = new Map<string, React.ReactNode[]>();

  for (const variant of sortedVariants) {
    const properties = variant.properties.get();

    if (properties.length !== uniqueOptions.size + 1) {
      continue;
    }

    const badVariant = properties.some((p) => {
      // this variant is no longer valid but state is still updating
      const badProperty = !uniqueOptions.has(p.property) && (!quantityPropertyId || quantityPropertyId !== p.property);

      if (badProperty) {
        return true;
      }

      if (uniqueOptions.has(p.property) && !uniqueOptions.get(p.property).values.has(p.value)) {
        return true;
      }

      return false;
    });

    if (badVariant) {
      continue;
    }

    const key = properties
      .filter((p) => p.property !== quantityPropertyId && uniqueOptions.has(p.property))
      .map((p) => `${p.property}${p.value}`)
      .sort()
      .join('-');

    const columns = rows.get(key) || [];

    if (!rows.has(key)) {
      for (const [optionId, { values }] of sortedOptions.entries()) {
        const property = properties.find((p) => p.property === optionId);

        if (property) {
          columns.push(
            <TableCell key={optionId}>
              <div style={{ width: '100px' }}>{values.get(property.value)}</div>
            </TableCell>
          );
        }
      }
    }

    const qp = quantityPropertyId && properties.find((p) => p.property === quantityPropertyId);

    const state = revenue ? variant.revenue : variant.expense;

    if (qp) {
      columns.push(
        <TableCell key={qp.value}>
          <div style={{ width: '100px' }}>
            <FormMoney state={state} />
          </div>
        </TableCell>
      );
    } else {
      columns.push(
        <TableCell key="quantity">
          <div style={{ width: '100px' }}>
            <FormMoney state={state} />
          </div>
        </TableCell>
      );
    }

    if (!rows.has(key)) {
      rows.set(key, columns);
    }
  }

  return (
    <Table card>
      <TableHead>
        <TableRow>
          {[
            ...Array.from(sortedOptions.entries()).map(([key, { name }]) => (
              <TableHeadCell key={key}>
                <div>{name}</div>
              </TableHeadCell>
            )),
            ...Array.from(sortedQuantities.entries()).map(([key, name]) => (
              <TableHeadCell key={key}>
                <div>{name}</div>
              </TableHeadCell>
            )),
          ]}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from(rows.entries()).map(([key, nodes]) => (
          <TableRow key={key}>{nodes}</TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function VendorServicePricing() {
  const { write } = useContext(ServiceContext);

  const matrix = useState(write).properties.some((p) => p.pricingType.get() === PropertyPricing.Matrix);

  if (!matrix) {
    return (
      <Card>
        You must have <strong>matrix</strong> enabled properties to use this view.
      </Card>
    );
  }

  return (
    <Tabs
      tabs={[
        {
          name: 'Revenue',
          key: 'revenue',
          useElement: <Inner revenue={true} />,
        },
        {
          name: 'Expense',
          key: 'expense',
          useElement: <Inner revenue={false} />,
        },
      ]}
    />
  );
}
