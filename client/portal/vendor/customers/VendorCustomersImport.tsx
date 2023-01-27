import { useState } from '@hookstate/core';
import Card from 'client/global/components/tailwind/Card';
import Center from 'client/global/components/tailwind/Center';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import { ImportCustomer } from 'client/portal/vendor/customers/import/common';
import ImportConflictBuyers from 'client/portal/vendor/customers/import/ImportConflictBuyers';
import ImportConflictUsers from 'client/portal/vendor/customers/import/ImportConflictUsers';
import ImportExistingBuyers from 'client/portal/vendor/customers/import/ImportExistingBuyers';
import ImportExistingUsers from 'client/portal/vendor/customers/import/ImportExistingUsers';
import ImportNewBuyers from 'client/portal/vendor/customers/import/ImportNewBuyers';
import ImportNewUsers from 'client/portal/vendor/customers/import/ImportNewUsers';
import ImportQuickbooks from 'client/portal/vendor/customers/import/ImportQuickbooks';
import ImportUploadFile from 'client/portal/vendor/customers/import/ImportUploadFile';
import * as React from 'react';
import { useRef } from 'react';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { VendorCustomersImportDocument } from 'shared/generated';
import { useQueryPromise, useQuerySuspense } from 'shared/Graph';
import { ValidationAttach } from 'shared/utilities/Validation';

export default function VendorCustomersImport() {
  const vendorId = useCurrentVendorId();
  const query = useQuerySuspense(VendorCustomersImportDocument, { vendorId }, 'network-first');
  const total = useRef(query.vendor.imports.length);
  const refresh = useQueryPromise(VendorCustomersImportDocument);

  const state = useState<ImportCustomer[]>(query.vendor.imports);

  ValidationAttach(state, (v) => {
    v.metadata.company.required();
  });

  const unresolvedBuyers = state.filter((c) => !c.metadata.resolvedBuyer.get());
  const newBuyers = unresolvedBuyers.filter((c) => c.metadata.vendorBuyerRelIds.length === 0);
  const singleBuyers = unresolvedBuyers.filter((c) => c.metadata.vendorBuyerRelIds.length === 1 && c.metadata.accurate);
  const multipleBuyers = unresolvedBuyers.filter(
    (c) => c.metadata.vendorBuyerRelIds.length > 1 || (c.metadata.vendorBuyerRelIds.length > 0 && !c.metadata.accurate)
  );

  const unresolvedUsers = state.filter((c) => !c.metadata.resolvedUser.get());
  const newUsers = unresolvedUsers.filter((c) => c.metadata.userIds.length === 0);
  const singleUsers = unresolvedUsers.filter((c) => c.metadata.userIds.length === 1 && c.metadata.accurate);
  const multipleUsers = unresolvedUsers.filter(
    (c) => c.metadata.userIds.length > 1 || (c.metadata.userIds.length > 0 && !c.metadata.accurate)
  );

  let content;

  const reload = () => {
    refresh({ vendorId }).then((resp) => {
      total.current = resp.vendor.imports.length;

      state.set(resp.vendor.imports);
    });
  };

  if (newBuyers.length) {
    content = <ImportNewBuyers state={newBuyers} />;
  } else if (singleBuyers.length) {
    content = <ImportExistingBuyers state={singleBuyers} />;
  } else if (multipleBuyers.length) {
    content = <ImportConflictBuyers state={multipleBuyers} />;
  } else if (newUsers.length) {
    content = <ImportNewUsers state={newUsers} />;
  } else if (singleUsers.length) {
    content = <ImportExistingUsers state={singleUsers} />;
  } else if (multipleUsers.length) {
    content = <ImportConflictUsers state={multipleUsers} />;
  } else if (total.current > 0) {
    content = (
      <Card title="Import Complete">
        <Message type={MessageType.SUCCESS} title="All Records Processed">
          You may now head over to the customer list page to see all of your imported data.
        </Message>
      </Card>
    );
  } else {
    content = (
      <Card title="Start Import">
        <Message type={MessageType.WARNING} title="Customer vs User" round>
          Please understand that in our system, a customer can be either a <strong>Company</strong> or an{' '}
          <strong>Individual</strong>. While general contact information may be set at the customer level,
          <strong> notifications are not sent to customers unless a user is associated with their account.</strong>
        </Message>
        <div className="flex flex-row space-x mt">
          <div className="border border-gray-300 round p flex-1 space-y-4">
            <ImportUploadFile token={query.profile.importAgentToken} onFinish={reload} />
          </div>
          <div className="border border-gray-300 round p flex-1 space-y-4">
            <ImportQuickbooks integrated={query.vendor.quickbooksIntegrated} onFinish={reload} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Center padding className="h-full">
      {content}
    </Center>
  );
}
