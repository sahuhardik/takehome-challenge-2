import { State, useState } from '@hookstate/core';
import Card from 'client/global/components/tailwind/Card';
import { ImportCustomer, MutationProgress } from 'client/portal/vendor/customers/import/common';
import * as React from 'react';
import Button from 'shared/components/tailwind/Button';
import { VendorCustomersImportMergeUserDocument } from 'shared/generated';

export default function ImportExistingUsers({ state }: { state: State<ImportCustomer>[] }) {
  const start = useState(false);

  let content = (
    <div className="flex flex-col space-y items-center">
      <p>
        We detected a total of <strong>{state.length}</strong> users which already exist in our database. By merging, we
        will <strong>ONLY</strong> save information that is currently missing (no data is overwritten). However, if you
        manually edit a record it <strong>WILL</strong> replace the existing data.
      </p>
      <div className="space-x">
        <Button onClick={() => start.set(true)}>Merge All</Button>
      </div>
    </div>
  );

  if (start.get()) {
    content = (
      <MutationProgress
        customers={state}
        query={VendorCustomersImportMergeUserDocument}
        resolved="resolvedBuyer"
        resp="mergeImportCustomerUser"
      >
        Merge in progress, do not leave this screen...
      </MutationProgress>
    );
  }

  return (
    <Card title="Existing Users" stretch>
      {content}
    </Card>
  );
}
