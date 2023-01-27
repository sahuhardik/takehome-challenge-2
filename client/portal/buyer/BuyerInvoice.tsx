import DescriptionColumns, { DescriptionColumnsItem } from 'client/global/components/tailwind/DescriptionColumns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { OrderBorder, OrderContent, OrderHeading, OrderSection } from 'client/portal/buyer/BuyerLayout';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { ShopInvoiceDocument, ShopVendorFragment } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import Money from 'shared/utilities/Money';

export default function BuyerInvoice({ vendor }: { vendor: ShopVendorFragment }) {
  const { orderId } = useParams();

  const { order } = useQueryHook(ShopInvoiceDocument, { orderId });

  return (
    <OrderBorder>
      <OrderContent>
        <img src={vendor.themeLogo.image} className="mb-12" />

        <OrderHeading title={`Order #${orderId}`} />

        <OrderSection name="Address Details">
          <DescriptionColumns>
            <DescriptionColumnsItem name="Address">
              {order.address.addressFirst} <br />
              {order.address.addressSecond}
            </DescriptionColumnsItem>

            {order.metadata.map((p) => (
              <DescriptionColumnsItem name={p.title} key={p.propertyId}>
                {p.display}
              </DescriptionColumnsItem>
            ))}
          </DescriptionColumns>
        </OrderSection>

        <OrderSection name="Requested Services">
          <Table round border>
            <TableHead>
              <TableRow>
                <TableHeadCell>Service</TableHeadCell>
                <TableHeadCell>Configuration</TableHeadCell>
                <TableHeadCell>Cost</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.performable.marketing.name}</TableCell>

                  <TableCell>
                    {job.properties.length ? (
                      job.properties.map((p) => (
                        <div key={p.propertyId}>
                          <strong>{p.property.marketing.name}</strong>: {p.display}
                        </div>
                      ))
                    ) : (
                      <div>N/A</div>
                    )}
                  </TableCell>

                  <TableCell>
                    <Money>{job.revenue}</Money>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="pt">
            <strong>Total:</strong> <Money>{order.revenue}</Money>
          </div>
        </OrderSection>
      </OrderContent>
    </OrderBorder>
  );
}
