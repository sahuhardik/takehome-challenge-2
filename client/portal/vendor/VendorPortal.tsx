import { useState } from '@hookstate/core';
import * as Sentry from '@sentry/react';
import { captureException } from '@sentry/react';
import ErrorRoute from 'client/global/components/ErrorRoute';
import { CurrentVendorContext } from 'client/global/hooks/useCurrentVendor';
import AdminLayout from 'client/global/layout/AdminLayout';
import VendorAccountingRouter from 'client/portal/vendor/accounting/VendorAccountingRouter';
import VendorTodoCreate from 'client/portal/vendor/components/todo/VendorTodoCreate';
import VendorCustomers from 'client/portal/vendor/customers/VendorCustomers';
import VendorOrderRouter from 'client/portal/vendor/order/VendorOrderRouter';
import VendorReportingRouter from 'client/portal/vendor/reporting/VendorReportingRouter';
import VendorScheduleRouter from 'client/portal/vendor/schedule/VendorScheduleRouter';
import VendorSettings from 'client/portal/vendor/settings/VendorSettings';
import VendorDashboard from 'client/portal/vendor/VendorDashboard';
import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import {
  Permission,
  PermissionsDocument,
  VendorAccountDocument,
  VendorAddTodoDocument,
  VendorCountsDocument,
  VendorCustomerAddTodoDocument,
  VendorUnclaimedJobsDocument,
} from 'shared/generated';
import { useMutationPromise, useQueryPromise } from 'shared/Graph';
import useInterval from 'shared/hooks/useInterval';
import OrdersIcon from 'shared/icons/OrdersIcon';
import { setTimezone } from 'shared/state/TimezoneState';
import { useHasPermission, useSetPermissions, useUser } from 'shared/UserState';

function CreateTodo() {
  const { vendorId } = useParams();

  const addGlobal = useMutationPromise(VendorAddTodoDocument);
  const addCustomer = useMutationPromise(VendorCustomerAddTodoDocument);
  const unclaimedJobsRefresh = useQueryPromise(VendorUnclaimedJobsDocument, 'network-only');

  return (
    <VendorTodoCreate
      showCustomer
      onSave={async (name, buyerRelId) => {
        if (buyerRelId) {
          await addCustomer({ name, buyerRelId });
        } else {
          await addGlobal({ name, vendorId });
        }

        await unclaimedJobsRefresh({ vendorId });
      }}
    />
  );
}

function Inner({ vendorId }: { vendorId: string }) {
  const user = useUser();
  const setPermissions = useSetPermissions();
  const hasPermission = useHasPermission();
  const lookup = useQueryPromise(VendorAccountDocument);
  const permissionsQuery = useQueryPromise(PermissionsDocument);

  useEffect(() => {
    if (permissionsQuery && vendorId && user?.id) {
      permissionsQuery({
        memberId: vendorId,
        userId: user?.id,
      })
        .then((query) => {
          if (query?.permissions) {
            setPermissions(query?.permissions || []);
          }
        })
        .catch(captureException);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, user?.id]);

  useEffect(() => {
    lookup({ vendorId })
      .then(({ vendor }) => {
        document.title = vendor.company;

        setTimezone(vendor.timezoneDisplay);
      })
      .catch(captureException);
  }, [lookup, vendorId]);

  const Links = () => {
    const state = useState({ orders: 0, schedule: 0 });

    const counts = useQueryPromise(VendorCountsDocument, 'no-cache');

    useInterval((mounted) => {
      counts({ vendorId })
        .then(({ vendor }) => {
          if (!mounted()) {
            return;
          }

          state.set({
            orders: vendor.jobsSubmittedCount + vendor.jobsChangedCount + vendor.jobsReadyCount + vendor.ordersNew,
            schedule: vendor.jobsUnscheduledCount,
          });
        })
        .catch((ex) => {
          Sentry.captureException(ex);
        });
    });

    return [
      { label: 'Dashboard', link: '/dashboard' },
      { label: 'Schedule', link: '/schedule', badge: state.schedule },
      {
        label: 'Orders',
        link: '/order',
        icon: OrdersIcon,
        badge: state.orders,
      },
      { label: 'Customers', link: '/customers' },
      ...(hasPermission(Permission.AccessAccounting) ? [{ label: 'Accounting', link: '/accounting' }] : []),
      ...(hasPermission(Permission.AccessReporting) ? [{ label: 'Reporting', link: '/reporting' }] : []),
      ...(hasPermission(Permission.AccessSettings) ? [{ label: 'Settings', link: '/settings' }] : []),
    ];
  };

  const actions = [
    { label: 'Create Order', link: '/order/create' },
    { label: 'Create Customer', link: '/customers/create' },
    {
      label: 'Create Todo',
      component: <CreateTodo />,
    },
  ];

  return (
    <AdminLayout links={Links} base={`/ui/vendor/${vendorId}`} actions={actions} type={PerformableFormType.VENDOR}>
      <Routes>
        <Route
          path="schedule"
          element={
            <ErrorRoute card center>
              <VendorScheduleRouter />
            </ErrorRoute>
          }
        />
        <Route
          path="order/*"
          element={
            <ErrorRoute card center>
              <VendorOrderRouter />
            </ErrorRoute>
          }
        />
        <Route
          path="customers/*"
          element={
            <ErrorRoute card center>
              <VendorCustomers />
            </ErrorRoute>
          }
        />

        {hasPermission(Permission.AccessAccounting) && (
          <Route path="accounting/*" element={<VendorAccountingRouter />} />
        )}
        {hasPermission(Permission.AccessSettings) && (
          <Route path="settings/*" element={<VendorSettings vendorId={vendorId} />} />
        )}
        {hasPermission(Permission.AccessReporting) && (
          <Route
            path="reporting/*"
            element={
              <ErrorRoute card center>
                <VendorReportingRouter />
              </ErrorRoute>
            }
          />
        )}
        <Route
          path="dashboard"
          element={
            <ErrorRoute card center>
              <VendorDashboard />
            </ErrorRoute>
          }
        />
        <Route path="*" element={<Navigate to="dashboard" />} />
      </Routes>
    </AdminLayout>
  );
}

export default function VendorPortal() {
  const { vendorId } = useParams();

  return useMemo(
    () => (
      <CurrentVendorContext.Provider value={vendorId}>
        <Inner vendorId={vendorId} />
      </CurrentVendorContext.Provider>
    ),
    [vendorId]
  );
}
