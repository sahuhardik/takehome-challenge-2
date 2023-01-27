import { State, useState } from '@hookstate/core';
import Card from 'client/global/components/tailwind/Card';
import { ImportCustomer, MutationProgress } from 'client/portal/vendor/customers/import/common';
import ImportCustomerList from 'client/portal/vendor/customers/import/ImportCustomerList';
import * as React from 'react';
import Button from 'shared/components/tailwind/Button';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { VendorCustomersImportApproveBuyerDocument, VendorCustomersImportIgnoreBuyerDocument } from 'shared/generated';

export default function ImportNewBuyers({ state }: { state: State<ImportCustomer>[] }) {
  const start = useState(false);

  if (start.get()) {
    return (
      <Card title="New Customers">
        <MutationProgress
          customers={state}
          query={VendorCustomersImportApproveBuyerDocument}
          resolved="resolvedBuyer"
          resp="approveImportCustomerBuyer"
        >
          Import in progress, do not leave this screen...
        </MutationProgress>
      </Card>
    );
  }

  return (
    <Card title="New Customers" stretch>
      <div className="flex items-center space-x">
        <p>
          We detected a total of <strong>{state.length}</strong> new customers from your imported data. Review the list
          below if you wish to make modifications or exclude records from being created.
        </p>
        <Message type={MessageType.INFO} round>
          Do note that the user information below is just shown as a reference, users will be created later on in the
          import process.
        </Message>
        <div>
          <Button onClick={() => start.set(true)}>Create All</Button>
        </div>
      </div>
      <ImportCustomerList
        remove={VendorCustomersImportIgnoreBuyerDocument}
        resp="ignoreImportCustomerBuyer"
        resolved="resolvedBuyer"
        reevaluate
        customers={state}
      />
    </Card>
  );
}
