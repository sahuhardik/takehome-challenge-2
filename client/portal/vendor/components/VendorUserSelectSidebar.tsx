import { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import * as React from 'react';
import { VendorInternalUserListDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import { useUser } from 'shared/UserState';

export interface VendorUserSelectSidebarProps {
  vendorId: string;
  title?: string;
  onSelect: (userId: string) => Promise<void>;
}

export function VendorUserSelectSidebar({ vendorId, onSelect, title = 'Select User' }: VendorUserSelectSidebarProps) {
  const currentUser = useUser();
  const query = useQueryHook(VendorInternalUserListDocument, { vendorId }, 'cache-and-network');

  return (
    <>
      <SlidebarHeader title={title} />
      <SlidebarContent>
        <div className="text-center mb">
          <SlidebarCloseButton onClick={() => onSelect(currentUser.id)}>Assign to Myself</SlidebarCloseButton>
        </div>
        <Table card>
          <TableHead>
            <TableRow>
              <TableHeadCell />
              <TableHeadCell>User</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {query.vendor.users
              .filter((x) => currentUser.id !== x.user.id)
              .map((memberUser) => (
                <TableRow key={memberUser.user.id}>
                  <TableCell>
                    <SlidebarCloseButton onClick={() => onSelect(memberUser.user.id)}>Assign</SlidebarCloseButton>
                  </TableCell>
                  <TableCell>
                    {memberUser.user.first} {memberUser.user.last}
                  </TableCell>
                  <TableCell>{memberUser.user.email}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </SlidebarContent>
    </>
  );
}
