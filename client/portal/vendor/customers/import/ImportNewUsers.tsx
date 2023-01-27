import { State, useState } from '@hookstate/core';
import Card from 'client/global/components/tailwind/Card';
import { ImportCustomer, MutationProgress } from 'client/portal/vendor/customers/import/common';
import * as React from 'react';
import Button from 'shared/components/tailwind/Button';
import { VendorCustomersImportApproveUserDocument } from 'shared/generated';

export default function ImportNewUsers({ state }: { state: State<ImportCustomer>[] }) {
  const start = useState(false);

  let content = (
    <div className="flex flex-col space-y items-center">
      <p>
        We detected a total of <strong>{state.length}</strong> new users from your previous import.
      </p>
      <div className="space-x">
        <Button onClick={() => start.set(true)}>Approve All</Button>
      </div>
    </div>
  );

  if (start.get()) {
    content = (
      <MutationProgress
        customers={state}
        query={VendorCustomersImportApproveUserDocument}
        resolved="resolvedUser"
        resp="approveImportCustomerUser"
      >
        Import in progress, do not leave this screen...
      </MutationProgress>
    );
  }

  return <Card title="New Users">{content}</Card>;
}
