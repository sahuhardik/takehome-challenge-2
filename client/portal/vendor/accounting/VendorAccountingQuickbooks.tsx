import { useState } from '@hookstate/core';
import { ButtonGroup } from 'client/global/components/button/ButtonGroup';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormSwitch from 'shared/components/form/FormSwitch';
import {
  AccountingBillLineFormat,
  QuickbooksAccountType,
  VendorAccountingQuickbooksDocument,
  VendorAccountingQuickbooksSaveDocument,
  VendorQuickbooksWrite,
} from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';
import { ValidationAttach } from 'shared/utilities/Validation';

export default function VendorAccountingQuickbooks() {
  const { vendorId } = useParams();

  const { vendor } = useQueryHook(VendorAccountingQuickbooksDocument, { vendorMemberId: vendorId });

  const save = useMutationPromise(VendorAccountingQuickbooksSaveDocument);

  const state = useState<VendorQuickbooksWrite>(vendor.quickbooksConfig || {});

  ValidationAttach(state, (validator) => {
    validator.billLineFormat.required();
    validator.vendorAccountId.required();
  });

  return (
    <>
      <FormGroup plain>
        {/*<FormHorizontal name="Location">*/}
        {/*  <FormSelect*/}
        {/*    state={state.location}*/}
        {/*    options={[*/}
        {/*      {*/}
        {/*        label: 'Atlanta',*/}
        {/*        value: 'onr', //AccountingInvoiceTerms.OnReceipt,*/}
        {/*      },*/}
        {/*      {*/}
        {/*        label: 'Denver',*/}
        {/*        value: 'net', //AccountingInvoiceTerms.Net,*/}
        {/*      },*/}
        {/*    ]}*/}
        {/*  />*/}
        {/*</FormHorizontal>*/}
        {/*<FormHorizontal name="Classes">*/}
        {/*  <FormSwitch state={state.classes} />*/}
        {/*</FormHorizontal>*/}
        {/*<FormHorizontal name="Credit Strategy">*/}
        {/*  <FormSelect*/}
        {/*    state={state.location}*/}
        {/*    options={[*/}
        {/*      {*/}
        {/*        label: 'Credit Memo',*/}
        {/*        value: 'or', //AccountingInvoiceTerms.OnReceipt,*/}
        {/*      },*/}
        {/*      {*/}
        {/*        label: 'Delayed Credit',*/}
        {/*        value: 'net', //AccountingInvoiceTerms.Net,*/}
        {/*      },*/}
        {/*    ]}*/}
        {/*  />*/}
        {/*</FormHorizontal>*/}
        <FormHorizontal name="Bill Account" state={state.vendorAccountId}>
          <FormSelect
            state={state.vendorAccountId}
            options={vendor.quickbooksAccounts
              .filter((a) => a.type === QuickbooksAccountType.Expense)
              .map((a) => ({ label: a.name, value: a.id }))}
          />
        </FormHorizontal>
        <FormHorizontal name="Bill Line Format" state={state.billLineFormat}>
          <FormSelect
            state={state.billLineFormat}
            options={[
              {
                label: 'Line per Job',
                value: AccountingBillLineFormat.Job,
              },
              {
                label: 'Line per Order',
                value: AccountingBillLineFormat.Order,
              },
              {
                label: 'Payout Range (Single Line)',
                value: AccountingBillLineFormat.PayoutRange,
              },
              {
                label: 'Line per Service',
                value: AccountingBillLineFormat.Service,
              },
            ]}
          />
        </FormHorizontal>
        <FormHorizontal name="Disable Invoice Email" state={state.invoiceEmailDisable}>
          <FormSwitch state={state.invoiceEmailDisable} />
        </FormHorizontal>
        {/*<FormHorizontal name="Multi Order">*/}
        {/*  <FormSelect*/}
        {/*    state={state.multi}*/}
        {/*    options={[*/}
        {/*      {*/}
        {/*        label: 'Estimate Per Order > Single Invoice',*/}
        {/*        value: 'or', //AccountingInvoiceTerms.OnReceipt,*/}
        {/*      },*/}
        {/*      {*/}
        {/*        label: 'Invoice Only',*/}
        {/*        value: 'net', //AccountingInvoiceTerms.Net,*/}
        {/*      },*/}
        {/*    ]}*/}
        {/*  />*/}
        {/*</FormHorizontal>*/}
        {/*<FormHorizontal name="Customer Sync Direction">*/}
        {/*  <FormSelect*/}
        {/*    state={state.sync}*/}
        {/*    options={[*/}
        {/*      {*/}
        {/*        label: 'Photog > Quickbooks',*/}
        {/*        value: 'or', //AccountingInvoiceTerms.OnReceipt,*/}
        {/*      },*/}
        {/*      {*/}
        {/*        label: 'Quickbooks < Photog',*/}
        {/*        value: 'net', //AccountingInvoiceTerms.Net,*/}
        {/*      },*/}
        {/*    ]}*/}
        {/*  />*/}
        {/*</FormHorizontal>*/}
        {/*<FormHorizontal name="Service Mapping">*/}
        {/*  <Table card>*/}
        {/*    <TableHead>*/}
        {/*      <TableRow>*/}
        {/*        <TableHeadCell>Photog</TableHeadCell>*/}
        {/*        <TableHeadCell>Quickbooks</TableHeadCell>*/}
        {/*      </TableRow>*/}
        {/*    </TableHead>*/}
        {/*    <TableBody>*/}
        {/*      <TableRow>*/}
        {/*        <TableCell>Unlimited Pro Photos</TableCell>*/}
        {/*        <TableCell>*/}
        {/*          <FormSelect*/}
        {/*            state={state.one}*/}
        {/*            options={[*/}
        {/*              {*/}
        {/*                label: 'Service A',*/}
        {/*                value: 'or', //AccountingInvoiceTerms.OnReceipt,*/}
        {/*              },*/}
        {/*              {*/}
        {/*                label: 'Service B',*/}
        {/*                value: 'net', //AccountingInvoiceTerms.Net,*/}
        {/*              },*/}
        {/*            ]}*/}
        {/*          />*/}
        {/*        </TableCell>*/}
        {/*      </TableRow>*/}
        {/*      <TableRow>*/}
        {/*        <TableCell>Zillow 3D</TableCell>*/}
        {/*        <TableCell>*/}
        {/*          <FormSelect*/}
        {/*            state={state.two}*/}
        {/*            options={[*/}
        {/*              {*/}
        {/*                label: 'Service A',*/}
        {/*                value: 'or', //AccountingInvoiceTerms.OnReceipt,*/}
        {/*              },*/}
        {/*              {*/}
        {/*                label: 'Service B',*/}
        {/*                value: 'net', //AccountingInvoiceTerms.Net,*/}
        {/*              },*/}
        {/*            ]}*/}
        {/*          />*/}
        {/*        </TableCell>*/}
        {/*      </TableRow>*/}
        {/*    </TableBody>*/}
        {/*  </Table>*/}
        {/*</FormHorizontal>*/}
        {/*<FormHorizontal name="Group Mapping">*/}
        {/*  <Table card>*/}
        {/*    <TableHead>*/}
        {/*      <TableRow>*/}
        {/*        <TableHeadCell>Photog</TableHeadCell>*/}
        {/*        <TableHeadCell>Quickbooks</TableHeadCell>*/}
        {/*      </TableRow>*/}
        {/*    </TableHead>*/}
        {/*    <TableBody>*/}
        {/*      <TableRow>*/}
        {/*        <TableCell>Agent</TableCell>*/}
        {/*        <TableCell>*/}
        {/*          <FormSelect*/}
        {/*            state={state.one}*/}
        {/*            options={[*/}
        {/*              {*/}
        {/*                label: 'Customer Type: A',*/}
        {/*                value: 'or', //AccountingInvoiceTerms.OnReceipt,*/}
        {/*              },*/}
        {/*              {*/}
        {/*                label: 'Customer Type: B',*/}
        {/*                value: 'net', //AccountingInvoiceTerms.Net,*/}
        {/*              },*/}
        {/*            ]}*/}
        {/*          />*/}
        {/*        </TableCell>*/}
        {/*      </TableRow>*/}
        {/*      <TableRow>*/}
        {/*        <TableCell>Brokerage</TableCell>*/}
        {/*        <TableCell>*/}
        {/*          <FormSelect*/}
        {/*            state={state.one}*/}
        {/*            options={[*/}
        {/*              {*/}
        {/*                label: 'Customer Type: A',*/}
        {/*                value: 'or', //AccountingInvoiceTerms.OnReceipt,*/}
        {/*              },*/}
        {/*              {*/}
        {/*                label: 'Customer Type: B',*/}
        {/*                value: 'net', //AccountingInvoiceTerms.Net,*/}
        {/*              },*/}
        {/*            ]}*/}
        {/*          />*/}
        {/*        </TableCell>*/}
        {/*      </TableRow>*/}
        {/*    </TableBody>*/}
        {/*  </Table>*/}
        {/*</FormHorizontal>*/}
      </FormGroup>
      <ButtonGroup className="mt">
        <PromiseButton
          onClick={async () => {
            await save({ vendorMemberId: vendorId, config: state.get() });
          }}
          disabled={state}
        >
          Save
        </PromiseButton>
      </ButtonGroup>
    </>
  );
}
