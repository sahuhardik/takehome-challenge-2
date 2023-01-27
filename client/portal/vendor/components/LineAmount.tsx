import { State, useState } from '@hookstate/core';
import FormMoney from 'client/global/components/form/FormMoney';
import * as React from 'react';
import { FormHorizontal } from 'shared/components/form/FormLayout';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { InvoiceLineEditStatus, VendorOrderAccountingLineFragment } from 'shared/generated';

export default function LineAmount({
  name,
  line,
  state,
  add,
}: {
  name: string;
  add: boolean;
  line?: VendorOrderAccountingLineFragment;
  state: State<string>;
}) {
  const scope = useState(state);

  if (!line && !add) {
    return <></>;
  }

  let message;

  switch (line?.editable) {
    case InvoiceLineEditStatus.Closed:
      message = 'This order has been closed (eg: accepted by accounting) and cannot be changed.';
      break;
    case InvoiceLineEditStatus.Job:
      message =
        'To update this value you must change the job field responsible for it or wait for the job to complete.';
      break;
    case InvoiceLineEditStatus.Order:
      message =
        'To update this value you must change the order field responsible for it or wait for the order to complete.';
      break;
    case InvoiceLineEditStatus.Locked:
      message = 'This value has been locked (eg: accepted by accounting or marked as paid) and cannot be changed.';
      break;
    case InvoiceLineEditStatus.Progress:
      message = 'Until the job is complete you cannot override as the system may recalculate this value at any time.';
      break;
    case InvoiceLineEditStatus.Rule:
      message = 'The values for this line item is controlled by a rule and cannot be changed.';
      break;
  }

  return (
    <FormHorizontal state={scope} name={name}>
      <FormMoney state={scope} disabled={!!message} />
      {!!message && (
        <Message type={MessageType.INFO} className="mt-2">
          {message}
        </Message>
      )}
    </FormHorizontal>
  );
}
