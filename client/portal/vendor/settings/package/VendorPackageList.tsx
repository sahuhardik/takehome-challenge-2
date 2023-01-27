import Center from 'client/global/components/tailwind/Center';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { ListVendorPackagesDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import EditIcon from 'shared/icons/EditIcon';

export default function VendorPackageList() {
  const { vendorId } = useParams();

  const { vendor } = useQueryHook(ListVendorPackagesDocument, { vendorId }, 'cache-and-network');

  return (
    <Center padding small>
      <Table card>
        <TableHead>
          <TableRow>
            <TableHeadCell>Package Name</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <Link to="./create" style={LinkStyle.BOLD} icon={<AddIcon />}>
                Create New Package
              </Link>
            </TableCell>
          </TableRow>
          {vendor.packages.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link to={`./${p.id}`} icon={<EditIcon />}>
                  {p.name}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Center>
  );
}
