import ErrorRoute from 'client/global/components/ErrorRoute';
import Center from 'client/global/components/tailwind/Center';
import Tabs from 'client/global/components/tailwind/Tabs';
import Loaded from 'client/global/Loaded';
import VendorAccountingIntegrations from 'client/portal/vendor/accounting/VendorAccountingIntegrations';
import VendorAccountingInvoice from 'client/portal/vendor/accounting/VendorAccountingInvoice';
import VendorAccountingInvoices from 'client/portal/vendor/accounting/VendorAccountingInvoices';
import VendorAccountingLedger from 'client/portal/vendor/accounting/VendorAccountingLedger';
import VendorAccountingPayouts from 'client/portal/vendor/accounting/VendorAccountingPayouts';
import * as React from 'react';
import { Route, Routes } from 'react-router-dom';

function Dashboard() {
  return (
    <Center padding>
      <Tabs
        breadcrumbs
        tabs={[
          {
            name: 'Invoices',
            key: 'invoices',
            useElement: <VendorAccountingInvoices />,
          },
          {
            name: 'Payouts',
            key: 'payouts',
            useElement: <VendorAccountingPayouts />,
          },
          {
            name: 'Ledger',
            key: 'ledger',
            useElement: <VendorAccountingLedger />,
          },
          {
            name: 'Integrations',
            key: 'integrations',
            useElement: <VendorAccountingIntegrations />,
          },
          // {
          //   name: 'Settings',
          //   key: 'settings',
          //   useElement: <VendorAccountingSettings />,
          // },
        ]}
      />
    </Center>
  );
}

export default function VendorAccountingRouter() {
  return (
    <Routes>
      <Route
        path="invoice/:invoiceId"
        element={
          <ErrorRoute center card>
            <Loaded>
              <VendorAccountingInvoice />
            </Loaded>
          </ErrorRoute>
        }
      />
      <Route
        path="*"
        element={
          <ErrorRoute center card>
            <Dashboard />
          </ErrorRoute>
        }
      />
    </Routes>
  );
}
