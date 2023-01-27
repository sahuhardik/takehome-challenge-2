import * as Sentry from '@sentry/react';
import AdminLayout from 'client/global/layout/AdminLayout';
import ProviderJobRouter from 'client/portal/provider/job/ProviderJobRouter';
import ProviderSettings from 'client/portal/provider/ProviderSettings';
import ProviderSchedulePage from 'client/portal/provider/schedule/ProviderSchedulePage';
import * as React from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import { ProviderAccountDocument } from 'shared/generated';
import { useQuerySuspense } from 'shared/Graph';
import useProviderCounts from 'shared/state/useProviderCounts';

export default function ProviderPortal() {
  const { providerMemberId } = useParams();

  const { provider } = useQuerySuspense(ProviderAccountDocument, { providerMemberId });

  if (!provider) {
    return <>Invalid Account</>;
  }

  document.title = provider.company;

  const Links = () => {
    const counts = useProviderCounts(provider.id, true, (error) => {
      Sentry.captureException(error);
    });

    return [
      { label: 'Schedule', link: '/schedule', badge: counts.unclaimedAppointments },
      { label: 'Jobs', link: '/job', badge: counts.jobsAwaiting },
      { label: 'Settings', link: '/settings' },
    ];
  };

  return (
    <AdminLayout links={Links} base={`/ui/provider/${providerMemberId}`} type={PerformableFormType.PROVIDER}>
      <Routes>
        <Route path="/job/*" element={<ProviderJobRouter />} />
        <Route path="/schedule" element={<ProviderSchedulePage />} />
        <Route path="/settings" element={<ProviderSettings />} />
        <Route path="*" element={<Navigate to="./schedule" replace />} />
      </Routes>
    </AdminLayout>
  );
}
