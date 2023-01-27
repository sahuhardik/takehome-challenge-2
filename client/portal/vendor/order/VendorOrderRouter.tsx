import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import ErrorRoute from 'client/global/components/ErrorRoute';
import VendorOrderCreate from 'client/portal/vendor/order/VendorOrderCreate';
import VendorOrderList from 'client/portal/vendor/order/VendorOrderList';
import VendorOrderSchedule from 'client/portal/vendor/order/VendorOrderSchedule';
import VendorOrderView from 'client/portal/vendor/order/VendorOrderView';
import * as React from 'react';
import { Route, Routes } from 'react-router-dom';

export default function VendorOrderRouter() {
  useRegisterBreadcrumb(`Orders`);

  return (
    <Routes>
      <Route
        path=":orderId/inline-schedule/:jobId"
        element={
          <ErrorRoute card back>
            <VendorOrderSchedule />
          </ErrorRoute>
        }
      />
      <Route
        path="create/*"
        element={
          <ErrorRoute card center>
            <VendorOrderCreate />
          </ErrorRoute>
        }
      />
      <Route
        path="view/:orderId/*"
        element={
          <ErrorRoute card center>
            <VendorOrderView />
          </ErrorRoute>
        }
      />
      <Route
        path="*"
        element={
          <ErrorRoute card center>
            <VendorOrderList />
          </ErrorRoute>
        }
      />
    </Routes>
  );
}
