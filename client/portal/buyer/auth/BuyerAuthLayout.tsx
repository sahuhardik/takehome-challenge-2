import useCurrentVendor from 'client/global/hooks/useCurrentVendor';
import * as React from 'react';
import { BuyerVendorDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export default function BuyerAuthLayout({ children }: { children: React.ReactNode }) {
  const currentVendor = useCurrentVendor();

  const { vendor } = useQueryHook(BuyerVendorDocument, { vendorId: currentVendor.vendor.id }, 'cache-first');

  return (
    <div className="flex-1 w-full h-full flex items-center justify-center bg-theme-body">
      <div className="bg-content border-t-8 border-theme-primary p max-w-2xl shadow flex flex-col items-center round">
        {vendor.themeLogo && <img src={vendor.themeLogo.image} className="w-48" />}

        <div className="mt">{children}</div>
      </div>
    </div>
  );
}
