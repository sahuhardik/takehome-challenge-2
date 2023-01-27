import { useState } from '@hookstate/core';
import Stepper, { StepperStep, StepperStyle } from 'client/global/components/stepper/Stepper';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Card from 'client/global/components/tailwind/Card';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import JobConfigureForm, { useJobConfigureState } from 'shared/components/fields/JobConfigureForm';
import OrderRuleContext from 'shared/components/fields/OrderRuleContext';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import { ProviderCountsDocument, ProviderJobDetailGetQuery, ProviderJobSubmitDocument } from 'shared/generated';
import { useMutationPromise, useQueryPromise } from 'shared/Graph';
import useJobDeliverLink from 'shared/portal/provider/useJobDeliverLink';

interface IProviderJobLinkProps {
  job: ProviderJobDetailGetQuery['orderJob'];
}

export default function ProviderJobLink({ job }: IProviderJobLinkProps) {
  const delivered = useState(false);
  const navigate = useNavigate();
  const steps: StepperStep[] = [
    {
      key: 'link',
      name: 'Link delivery',
      complete: () => delivered.get(),
      valid: true,
      element: (
        <LinkDeliveryForm
          jobId={job.id}
          onDelivered={() => {
            delivered.set(true);

            navigate('./submit');
          }}
        />
      ),
    },
    {
      key: 'submit',
      name: 'Submit',
      valid: true,
      complete: true,
      element: <PropertiesForm job={job} />,
    },
  ];

  return (
    <Card>
      <Stepper steps={steps} style={StepperStyle.SECONDARY} />
    </Card>
  );
}

function LinkDeliveryForm({ onDelivered, jobId }: { onDelivered: () => void; jobId: string }) {
  const { state, save, rejected } = useJobDeliverLink(jobId);

  return (
    <div className="relative pt w-full">
      {rejected && (
        <div className="absolute right-0 top-0 m-1">
          <Badge type={BadgeType.NEGATIVE}>Rejected</Badge>
        </div>
      )}
      <FormGroup plain>
        <FormHorizontal state={state.link} name="URL">
          <FormText state={state.link} placeholder={'https://www.example.com'} />
        </FormHorizontal>
      </FormGroup>
      <PromiseButton
        className="mt-6"
        disabled={state}
        onClick={async () => {
          await save();

          onDelivered();
        }}
      >
        Continue
      </PromiseButton>
    </div>
  );
}

function PropertiesForm({ job }: { job: ProviderJobDetailGetQuery['orderJob'] }) {
  const { providerMemberId } = useParams();
  const formState = useJobConfigureState(PerformableFormType.SUBMIT, job.id);
  const context = OrderRuleContext(job.order);
  const submit = useMutationPromise(ProviderJobSubmitDocument);
  const counts = useQueryPromise(ProviderCountsDocument);

  return (
    <div className="pt w-full">
      <FormGroup plain>
        <JobConfigureForm
          type={PerformableFormType.SUBMIT}
          context={context}
          performableId={job.performable.id}
          state={formState}
        />
      </FormGroup>
      <PromiseButton
        onClick={async () => {
          await submit({ jobId: job.id, changes: formState.get() });
          await counts({ providerMemberId });
        }}
      >
        Submit Job
      </PromiseButton>
    </div>
  );
}
