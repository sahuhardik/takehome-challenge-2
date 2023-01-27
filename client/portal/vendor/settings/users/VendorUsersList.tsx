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
import { VendorInternalUserListDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import EditIcon from 'shared/icons/EditIcon';

export function VendorUsersList() {
  const { vendorId } = useParams();

  const query = useQueryHook(VendorInternalUserListDocument, { vendorId }, 'cache-and-network');

  return (
    <Center padding>
      <Table card>
        <TableHead>
          <TableRow>
            <TableHeadCell>User</TableHeadCell>
            <TableHeadCell>Email</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <Link icon={<AddIcon />} to="./create" style={LinkStyle.BOLD}>
                Add User
              </Link>
            </TableCell>
            <TableCell />
          </TableRow>
          {query.vendor.users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Link icon={<EditIcon />} to={user.user.id}>
                  {user.user.first} {user.user.last}
                </Link>
              </TableCell>
              <TableCell>{user.user.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Center>
  );
}
