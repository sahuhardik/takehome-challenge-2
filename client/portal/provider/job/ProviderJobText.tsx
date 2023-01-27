import { useState } from '@hookstate/core';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import Stepper, { StepperStep, StepperStyle } from 'client/global/components/stepper/Stepper';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Card from 'client/global/components/tailwind/Card';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import JobConfigureForm, { useJobConfigureState } from 'shared/components/fields/JobConfigureForm';
import JobConfigureFormActions from 'shared/components/fields/JobConfigureFormActions';
import OrderRuleContext from 'shared/components/fields/OrderRuleContext';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormTextView from 'shared/components/form/FormText/FormTextView';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { ProviderCountsDocument, ProviderJobDetailGetQuery, ProviderJobSubmitDocument } from 'shared/generated';
import { useMutationPromise, useQueryPromise } from 'shared/Graph';
import useJobDeliverText from 'shared/portal/provider/useJobDeliverText';
import { Validation } from 'shared/utilities/Validation';

function TextDeliveryForm({ onDelivered, jobId }: { onDelivered: () => void; jobId: string }) {
  const { state, save, rejected } = useJobDeliverText(jobId);

  return (
    <div className="relative pt w-full">
      {rejected && (
        <div className="absolute right-0 top-0 m-1">
          <Badge type={BadgeType.NEGATIVE}>Rejected</Badge>
        </div>
      )}

      <FormGroup plain>
        <FormHorizontal state={state.text} name="Text">
          <FormTextView value={state.text.get()} onChange={(text) => state.text.set(text)} valid lines={5} />
        </FormHorizontal>
      </FormGroup>

      <Button
        style={ButtonStyle.PRIMARY}
        onClick={async () => {
          await save();

          onDelivered();
        }}
        disabled={!Validation(state).valid(true)}
        className="mt"
      >
        Continue
      </Button>
    </div>
  );
}

function CustomPropertiesForm({ job }: { job: ProviderJobDetailGetQuery['orderJob'] }) {
  const { providerMemberId } = useParams();

  const formState = useJobConfigureState(PerformableFormType.SUBMIT, job.id);

  const context = OrderRuleContext(job.order);
  const submit = useMutationPromise(ProviderJobSubmitDocument);
  const counts = useQueryPromise(ProviderCountsDocument);

  return (
    <div className="pt">
      <FormGroup plain>
        <JobConfigureForm
          type={PerformableFormType.SUBMIT}
          context={context}
          performableId={job.performable.id}
          state={formState}
        />
      </FormGroup>
      <JobConfigureFormActions
        fieldValuesState={formState}
        serviceId={job.performable.id}
        context={context}
        className="mt-6"
      >
        <PromiseButton
          onClick={async () => {
            await submit({ jobId: job.id, changes: formState.get() });

            await counts({ providerMemberId });

            return false;
          }}
        >
          Submit Job
        </PromiseButton>
      </JobConfigureFormActions>
    </div>
  );
}

export default function ProviderJobText({ job }: { job: ProviderJobDetailGetQuery['orderJob'] }) {
  const navigate = useNavigate();
  const delivered = useState(false);

  const steps: StepperStep[] = [
    {
      key: 'text',
      name: 'Text',
      complete: () => delivered.get(),
      valid: true,
      element: (
        <TextDeliveryForm
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
      complete: false,
      element: <CustomPropertiesForm job={job} />,
    },
  ];

  return (
    <Card>
      <Stepper steps={steps} style={StepperStyle.SECONDARY} />
    </Card>
  );
}
