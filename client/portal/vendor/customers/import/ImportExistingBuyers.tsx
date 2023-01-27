import { State, useState } from '@hookstate/core';
import Card from 'client/global/components/tailwind/Card';
import { ImportCustomer, MutationProgress } from 'client/portal/vendor/customers/import/common';
import ImportCustomerList from 'client/portal/vendor/customers/import/ImportCustomerList';
import * as React from 'react';
import Button from 'shared/components/tailwind/Button';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { VendorCustomersImportIgnoreBuyerDocument, VendorCustomersImportMergeBuyerDocument } from 'shared/generated';

export default function ImportExistingBuyers({ state }: { state: State<ImportCustomer>[] }) {
  const start = useState(false);

  if (start.get()) {
    return (
      <Card title="Existing Customers">
        <MutationProgress
          customers={state}
          query={VendorCustomersImportMergeBuyerDocument}
          resolved="resolvedBuyer"
          resp="mergeImportCustomerMember"
        >
          Merge in progress, do not leave this screen...
        </MutationProgress>
      </Card>
    );
  }

  return (
    <Card title="Existing Customers" stretch>
      <div className="flex items-center space-x">
        <p>
          We detected a total of <strong>{state.length}</strong> existing customers in our database. Review the list
          below if you wish to make modifications or exclude records from being merged.
        </p>
        <Message type={MessageType.INFO} round>
          We will <strong>ONLY</strong> save information that is currently missing (no data is overwritten). However, if
          you manually edit a record it <strong>WILL</strong> replace the existing data.
        </Message>
        <div>
          <Button onClick={() => start.set(true)}>Merge All</Button>
        </div>
      </div>
      <ImportCustomerList
        remove={VendorCustomersImportIgnoreBuyerDocument}
        resp="ignoreImportCustomerBuyer"
        resolved="resolvedBuyer"
        customers={state}
      />
    </Card>
  );
}
