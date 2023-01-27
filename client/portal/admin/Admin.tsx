import AdminContext from 'client/global/components/AdminContext';
import AdminLayout, { AdminLayoutLink } from 'client/global/layout/AdminLayout';
import Auth from 'client/portal/Auth';
import * as React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import AdminVendors from './vendor/AdminVendors';

const links: AdminLayoutLink[] = [{ label: 'Vendors', link: '/vendor' }];

export default function Admin() {
  return (
    <AdminContext>
      <Auth>
        <AdminLayout links={() => links} base={`/ui/admin`} type={PerformableFormType.VENDOR}>
          <Routes>
            <Route path="/vendor/*" element={<AdminVendors />} />
            <Route path="/" element={<Navigate to="./vendor" replace />} />
          </Routes>
        </AdminLayout>
      </Auth>
    </AdminContext>
  );
}
