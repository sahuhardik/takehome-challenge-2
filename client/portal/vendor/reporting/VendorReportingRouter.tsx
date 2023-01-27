import cubejs from '@cubejs-client/core';
import { CubeProvider } from '@cubejs-client/react';
import VendorReportPage from 'client/portal/vendor/reporting/VendorReportPage';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { VendorAccountDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export default function VendorReportingRouter() {
  const { vendorId } = useParams();
  const { vendor } = useQueryHook(VendorAccountDocument, { vendorId });

  const cubejsApi = cubejs(vendor.cube, {
    apiUrl: '/cubejs-api/v1',
  });

  return (
    <CubeProvider cubejsApi={cubejsApi}>
      <VendorReportPage />
    </CubeProvider>
  );
}
