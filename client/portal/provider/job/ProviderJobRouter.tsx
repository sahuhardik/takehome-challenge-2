import ProviderJobList from 'client/portal/provider/job/ProviderJobList';
import ProviderJobPage from 'client/portal/provider/job/ProviderJobPage';
import * as React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

export default function ProviderJobRouter() {
  return (
    <Routes>
      <Route path="/:jobId/*" element={<ProviderJobPage />} />
      <Route path="/" element={<ProviderJobList />} />
      <Route path="*" element={<Navigate to="./" replace />} />
    </Routes>
  );
}
