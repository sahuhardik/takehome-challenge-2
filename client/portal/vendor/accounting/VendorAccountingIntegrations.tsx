import { useState } from '@hookstate/core';
import NavigationButton from 'client/global/components/button/NavigationButton';
import ErrorBoundary from 'client/global/components/ErrorBoundary';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Card from 'client/global/components/tailwind/Card';
import VendorAccountingQuickbooks from 'client/portal/vendor/accounting/VendorAccountingQuickbooks';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  VendorAccountingDisconnectQuickbooksDocument,
  VendorAccountingDisconnectQuickbooksPaymentsDocument,
  VendorAccountingDisconnectStripeDocument,
  VendorAccountingIntegrationsDocument,
} from 'shared/generated';
import { useQueryHook, useQueryPromise } from 'shared/Graph';
import QuickbooksIcon from 'shared/icons/QuickbooksIcon';
import StripeIcon from 'shared/icons/StripeIcon';
import { ValidationAttach } from 'shared/utilities/Validation';

export default function VendorAccountingIntegrations() {
  const { vendorId } = useParams();

  const { vendor } = useQueryHook(VendorAccountingIntegrationsDocument, { vendorMemberId: vendorId });

  const disconnectQuickbooks = useQueryPromise(VendorAccountingDisconnectQuickbooksDocument);
  const disconnectQuickbooksPayments = useQueryPromise(VendorAccountingDisconnectQuickbooksPaymentsDocument);
  const disconnectStripe = useQueryPromise(VendorAccountingDisconnectStripeDocument);

  const state = useState({
    location: null as string,
    classes: false,
    credit: null as string,
    single: null as string,
    multi: null as string,
    sync: null as string,
    one: null as string,
    two: null as string,
    three: null as string,
    four: null as string,
  });

  ValidationAttach(state, () => {
    // TODO: validation
  });

  return (
    <div className="space-y">
      <Card>
        {!vendor.stripeAccountId ? (
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="icon-lg">
                <StripeIcon />
              </div>
              <div className="text-lg">Stripe</div>
              <Badge type={BadgeType.NEGATIVE}>Disconnected</Badge>
            </div>
            <NavigationButton link={`/api/stripe/connect?memberId=${vendorId}`}>Connect</NavigationButton>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="icon-lg">
                <StripeIcon />
              </div>
              <div className="text-lg">Stripe</div>
              <Badge type={BadgeType.POSITIVE}>Connected</Badge>
            </div>
            <ConfirmationButton
              title="Are you sure you want to disconnect Stripe?"
              description="You will be responsible for collecting payment on any in-progress orders."
              style={ButtonStyle.DANGER}
              confirmText="Disconnect Stripe"
              onClick={async () => {
                await disconnectStripe({ vendorMemberId: vendorId });
              }}
            >
              Disconnect
            </ConfirmationButton>
          </div>
        )}
      </Card>

      <Card>
        {!vendor.quickbooksIntegrated ? (
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="icon-lg">
                <QuickbooksIcon />
              </div>
              <div className="text-lg">Quickbooks (Accounting)</div>
              <Badge type={BadgeType.NEGATIVE}>Disconnected</Badge>
            </div>
            <NavigationButton
              link={`/api/quickbooks/connect?memberId=${vendorId}&test=true&redirect=${encodeURIComponent(
                window.location.href
              )}`}
            >
              Connect (Test)
            </NavigationButton>
            <NavigationButton
              link={`/api/quickbooks/connect?memberId=${vendorId}&redirect=${encodeURIComponent(window.location.href)}`}
            >
              Connect (Production)
            </NavigationButton>
          </div>
        ) : (
          <div className="space-y">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="icon-lg">
                  <QuickbooksIcon />
                </div>
                <div className="text-lg">QuickBooks (Accounting)</div>
                <Badge type={BadgeType.POSITIVE}>Connected</Badge>
              </div>
              <ConfirmationButton
                title="Are you sure you want to disconnect QuickBooks Accounting?"
                description="You will be responsible for updating invoices for any orders in progress and creating bills for payouts."
                style={ButtonStyle.DANGER}
                confirmText="Disconnect QuickBooks"
                onClick={async () => {
                  await disconnectQuickbooks({ vendorMemberId: vendorId });
                }}
              >
                Disconnect
              </ConfirmationButton>
            </div>
            <div>
              <ErrorBoundary round>
                <VendorAccountingQuickbooks />
              </ErrorBoundary>
            </div>
          </div>
        )}
      </Card>

      <Card>
        {!vendor.quickbooksPaymentsIntegrated ? (
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="icon-lg">
                <QuickbooksIcon />
              </div>
              <div className="text-lg">QuickBooks (Payments)</div>
              <Badge type={BadgeType.NEGATIVE}>Disconnected</Badge>
            </div>
            <NavigationButton
              link={`/api/quickbooks/connect?memberId=${vendorId}&test=true&payment=true&redirect=${encodeURIComponent(
                window.location.href
              )}`}
            >
              Connect (Test)
            </NavigationButton>
            <NavigationButton
              link={`/api/quickbooks/connect?memberId=${vendorId}&payment=true&redirect=${encodeURIComponent(
                window.location.href
              )}&payment=true`}
            >
              Connect (Production)
            </NavigationButton>
          </div>
        ) : (
          <div className="space-y">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="icon-lg">
                  <QuickbooksIcon />
                </div>
                <div className="text-lg">Quickbooks (Payments)</div>
                <Badge type={BadgeType.POSITIVE}>Connected</Badge>
              </div>
              <ConfirmationButton
                title="Are you sure you want to disconnect QuickBooks Payments?"
                description="Any orders with outstanding payments will not be able to be processed."
                style={ButtonStyle.DANGER}
                confirmText="Disconnect QuickBooks Payments"
                onClick={async () => {
                  await disconnectQuickbooksPayments({ vendorMemberId: vendorId });
                }}
              >
                Disconnect
              </ConfirmationButton>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
