import { useState } from '@hookstate/core';
import FormMoney from 'client/global/components/form/FormMoney';
import Center from 'client/global/components/tailwind/Center';
import { ServiceContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import * as React from 'react';
import { useContext } from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import { PerformableInputType } from 'shared/generated';

/*
const performableFields = [

vendorApproval

  if (services.length) {
    fields.push({
      key: 'dependencies',
      type: 'select',
      defaultValue: [],
      templateOptions: {
        label: 'Dependencies',
        multiple: true,
        options: services.map(s => ({ value: s.id, label: s.name })),
      },
    });

    fields.push({
      type: 'select',
      key: 'dependencyMode',
      defaultValue: false,
      hideExpression($viewValue, $modelValue, scope) {
        return !(scope.parent.model.dependencies || []).length;
      },
      templateOptions: {
        label: 'Dependency Mode',
        required: true,
        options: [
          { value: PerformableDependencyMode.ALL, label: 'Require All Dependencies To Order' },
          { value: PerformableDependencyMode.SOME, label: 'Require At-Least One Dependency To Order' },
          { value: PerformableDependencyMode.ANY, label: 'Require At-Least One Dependency If They Exist' },
          { value: PerformableDependencyMode.NOTIFY, label: 'Notify When Dependencies Are Ready (But Not Required)' },
        ],
      },
    });
  }

  {
    type: 'toggle',
    key: 'assignOnScheduled',
    defaultValue: false,
    templateOptions: {
      label: 'Assign on Schedule',
      description: 'When enabled, allows providers to forecast future work by assigning the task as soon as the service job has been scheduled.',
    },
  },
  {
    type: 'toggle',
    key: 'buyerSelect',
    defaultValue: false,
    templateOptions: {
      label: 'Buyer Selection',
      description: 'When enabled, the buyer will be required to choose which deliverables to use as inputs to this task.',
    },
    hideExpression($viewValue, $modelValue, scope) {
      return scope.parent.model.rootSelect;
    },
  },
  {
    type: 'toggle',
    key: 'rootReview',
    defaultValue: false,
    templateOptions: {
      label: 'Service Provider Review',
      description: 'When enabled, the provider who was assigned to the first service job must review the deliverables of this task.',
    },
  },
  {
    type: 'toggle',
    key: 'sort',
    defaultValue: false,
    templateOptions: {
      label: 'Sort Deliverables',
      description: 'When enabled, the provider will have to organize deliverables in a certain order during review.',
    },
    hideExpression($viewValue, $modelValue, scope) {
      return !scope.parent.model.rootReview;
    },
  },
  {
    type: 'toggle',
    key: 'rootSelect',
    defaultValue: false,
    templateOptions: {
      label: 'Service Provider Selection',
      description: 'When enabled, the provider who was assigned to the first service job must select inputs to this task.',
    },
    hideExpression($viewValue, $modelValue, scope) {
      return scope.parent.model.buyerSelect;
    },
  },
  {
    type: 'toggle',
    key: 'deliverToBuyer',
    defaultValue: false,
    templateOptions: {
      label: 'Buyer Delivery',
      description: 'When enabled, any deliverable added to this task (work completed), will be accessible to the buyer.',
    },
    hideExpression($viewValue, $modelValue, scope) {
      return !scope.parent.model.outputType;
    },
  },
  {
    type: 'toggle',
    key: 'deliverToBuyerNotification',
    defaultValue: false,
    templateOptions: {
      label: 'Buyer Delivery Notification',
      description: 'When enabled, the buyer will be notified that the job has been delivered.',
    },
    hideExpression($viewValue, $modelValue, scope) {
      return !scope.parent.model.outputType;
    },
  }
]

 */

/*
  const fields: FormlyFieldConfig[] = [
    {
      key: 'assetType',
      type: 'select',
      defaultValue: PerformableInputType.IMAGE,
      templateOptions: {
        label: 'Input Type',
        required: false,
        options: [
          { value: null, label: 'None' },
          { value: PerformableInputType.IMAGE, label: 'Images' },
          { value: PerformableInputType.LINK, label: 'Link' },
        ],
      },
    },
    {
      type: 'input',
      key: 'expense',
      templateOptions: {
        type: 'number',
        label: 'Expense',
        description: 'The amount you pay a provider if they are assigned this task.',
      },
    },
    {
      key: 'expenseType',
      type: 'select',
      defaultValue: PerformablePricingType.FLAT,
      hideExpression($viewValue, $modelValue, scope) {
        return !scope.model.expense;
      },
      templateOptions: {
        label: 'Expense Type',
        required: true,
        options: [
          { value: PerformablePricingType.FLAT, label: 'Flat' },
          { value: PerformablePricingType.INPUT, label: 'Per Input' },
        ],
      },
    },
    {
      key: 'payoutTrigger',
      type: 'select',
      defaultValue: WalletTrigger.JOB_DELIVERED,
      hideExpression($viewValue, $modelValue, scope) {
        return !scope.model.expense;
      },
      expressionProperties: {
        'templateOptions.options'($viewValue, $modelValue, scope) {
          const options = [
            { value: WalletTrigger.JOB_DELIVERED, label: 'Job Delivered (After Submitted & Reviewed)' },
            { value: WalletTrigger.JOB_ACCEPTED, label: 'Buyer Approved (After Delivered)' },
            { value: WalletTrigger.JOB_COMPLETED, label: 'Job Completion' },
          ];

          if (scope.model.expenseType === PerformablePricingType.FLAT) {
            options.push({ value: WalletTrigger.JOB_READY, label: 'Job Ready' });
          }

          return options;
        },
        'model.payoutTrigger': `this.field.templateOptions.options.find(o => o.value === model.payoutTrigger) ? model.payoutTrigger:null`,
      },
      templateOptions: {
        label: 'Payout Trigger',
        required: true,
        options: [],
      },
    },
    {
      key: 'outputType',
      type: 'select',
      hideExpression($viewValue, $modelValue, scope) {
        return ![
          PerformableInputType.IMAGE,
          PerformableInputType.LINK,
          PerformableInputType.TEXT,
        ].includes(scope.model.assetType);
      },
      expressionProperties: {
        'templateOptions.options'($viewValue, $modelValue, scope) {
          if ([PerformableInputType.IMAGE, PerformableInputType.MIXED, PerformableInputType.VIDEO].includes(scope.model.assetType)) {
            return [
              { value: null, label: 'None' },
              { value: PerformableOutputType.DOWNLOAD, label: 'Download' },
              { value: PerformableOutputType.HDPHOTOHUB, label: 'HDPhotoHub (Photos)' },
              { value: PerformableOutputType.HDPHOTOHUB_FLOORPLAN, label: 'HDPhotoHub (Floorplan)' },
            ];
          }

          if (scope.model.assetType === PerformableInputType.LINK) {
            return [
              { value: null, label: 'None' },
              { value: PerformableOutputType.LINK, label: 'Link' },
            ];
          }

          return [];
        },
        'model.outputType': `this.field.templateOptions.options.find(o => o.value === model.outputType) ? model.outputType:null`,
      },
      templateOptions: {
        label: 'Output Type',
        description: 'If this task is intended to pass deliverables down to another task or to the buyer, you must select the output type.',
        required: false,
      },
    },
  ];
 */

export default function VendorServiceGeneral({ qb }: { qb: { id: string; name: string }[] }) {
  const { write } = useContext(ServiceContext);
  const state = useState(write);

  return (
    <Center padding>
      <FormGroup>
        <FormHorizontal state={state.name} name="Marketing Name">
          <FormText state={state.name} />
        </FormHorizontal>
        <FormHorizontal state={state.shortName} name="Short Name">
          <FormText state={state.shortName} />
        </FormHorizontal>
        <FormHorizontal
          state={state.grouping}
          name="Grouping"
          description="When in the cart, services can be grouped together for an easier to follow layout."
        >
          <FormText state={state.grouping} />
        </FormHorizontal>
        {qb.length > 0 && (
          <FormHorizontal state={state.quickbooksProductId} name="Quickbooks Product">
            <FormSelect state={state.quickbooksProductId} options={qb.map((q) => ({ label: q.name, value: q.id }))} />
          </FormHorizontal>
        )}
        <FormHorizontal state={state.inputType} name="Input Type">
          <FormSelect
            state={state.inputType}
            options={[
              { label: 'Video', value: PerformableInputType.Video },
              { label: 'Text', value: PerformableInputType.Text },
              { label: 'Images', value: PerformableInputType.Image },
              { label: 'Link', value: PerformableInputType.Link },
              { label: 'Matterport', value: PerformableInputType.Matterport },
              { label: 'Microsite', value: PerformableInputType.Microsite },
              { label: 'Pdf', value: PerformableInputType.Pdf },
            ]}
          />
        </FormHorizontal>
        <FormHorizontal state={state.internalName} name="Internal Name">
          <FormText state={state.internalName} />
        </FormHorizontal>
        <FormHorizontal
          state={state.vendorApproval}
          name="Internal Review"
          description="Requires that a member of your team approve the job (and any applicable deliverables) before moving on to the next step."
        >
          <FormSwitch state={state.vendorApproval} />
        </FormHorizontal>
        <FormHorizontal state={state.revenue} name="Revenue">
          <FormMoney state={state.revenue} />
        </FormHorizontal>
        <FormHorizontal state={state.expense} lang="expense">
          <FormMoney state={state.expense} />
        </FormHorizontal>
        <FormHorizontal state={state.payOnDelivery} name="Pay On Delivery">
          <FormSwitch state={state.payOnDelivery} />
        </FormHorizontal>
        <FormHorizontal state={state.deliverToBuyer} name="Buyer Delivery">
          <FormSwitch state={state.deliverToBuyer} />
        </FormHorizontal>
      </FormGroup>
    </Center>
  );
}
