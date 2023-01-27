import DescriptionColumns, { DescriptionColumnsItem } from 'client/global/components/tailwind/DescriptionColumns';
import * as React from 'react';
import { VendorOrderAccordianDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export default function VendorOrderMetadata({ orderId }: { orderId: string }) {
  const { order } = useQueryHook(VendorOrderAccordianDocument, { orderId }, 'cache-and-network');

  return (
    <DescriptionColumns wide>
      {order.metadata.map((p) => (
        <DescriptionColumnsItem name={p.title} key={p.title}>
          {p.display}
        </DescriptionColumnsItem>
      ))}
    </DescriptionColumns>
  );
}
