import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import * as React from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { VendorCustomersImportQuickbooksDocument } from 'shared/generated';
import { useQueryPromise } from 'shared/Graph';

export default function ImportQuickbooks({ integrated, onFinish }: { integrated: boolean; onFinish: () => void }) {
  const vendorId = useCurrentVendorId();
  const download = useQueryPromise(VendorCustomersImportQuickbooksDocument);

  return (
    <>
      <div className="text-xl">Import From QuickBooks</div>

      <p className="text-sm text-content">
        By selecting this option, we will download all customers from your QuickBooks account and create temporary
        import records for you to review.
      </p>

      <Message type={MessageType.WARNING} title="Connecting QuickBooks">
        Once we have linked to your account, it is important that you do not manually update data in QuickBooks directly
        (such as customer information, invoices, etc), as our system may overwrite it.
      </Message>

      <div className="space-y-2">
        <p className="space-x-1">
          <strong>Company Name</strong>
          <em className="text-quiet text-xs">required</em>
        </p>

        <p className="text-content text-sm">
          If a QuickBooks customer does not have the <strong>Company</strong> field filled out, we will use the{' '}
          <strong>Display name as</strong> field instead.
        </p>
      </div>

      <div className="space-y-2">
        <p className="space-x-1">
          <strong>First and Last Name</strong>
          <em className="text-quiet text-xs">optional</em>
        </p>

        <p className="text-content text-sm">
          The name of the user to associate with the customer. If not provided, a customer will be created without any
          associated users.
        </p>
      </div>

      <div className="space-y-2">
        <p className="space-x-1">
          <strong>Email Address</strong>
          <em className="text-quiet text-xs">optional</em>
        </p>

        <p className="text-sm text-content">
          If a QuickBooks customer has <strong>first name</strong>, <strong>last name</strong> and{' '}
          <strong>email</strong> filled out, the email address will be associated with <strong>both</strong> the user
          and the customer.
        </p>
      </div>

      <div className="space-y-2">
        <p className="space-x-1">
          <strong>Phone Numbers</strong>
          <em className="text-quiet text-xs">optional</em>
        </p>

        <div className="text-content text-sm space-y-2">
          <p>
            If a QuickBooks customer has the <strong>Phone</strong> field filled out, we will use it at the customer
            level.
          </p>
          <p>
            If a QuickBooks customer has the <strong>Mobile</strong> field filled out, we will associate it with the
            user.
          </p>

          <Message type={MessageType.INFO} title="Mobile Phone Detection">
            If the <strong>Mobile</strong> field is empty but we determine that the <strong>Phone</strong> field has a
            number eligible to receive text messages, we will associate the number with the user as well.
          </Message>
        </div>
      </div>

      {integrated ? (
        <PromiseButton
          onClick={async () => {
            await download({ vendorId });

            await onFinish();
          }}
        >
          Start Import
        </PromiseButton>
      ) : (
        <Message
          type={MessageType.WARNING}
          round
          title="No QuickBooks Account Connected"
          actions={[
            {
              label: 'Authorize',
              onClick: () => {
                window.location.href = `/api/quickbooks/connect?memberId=${vendorId}&redirect=${encodeURIComponent(
                  window.location.href
                )}`;
              },
            },
          ]}
        >
          In order to proceed, you will need to authorize Photog to access your QuickBooks account.
        </Message>
      )}
    </>
  );
}
