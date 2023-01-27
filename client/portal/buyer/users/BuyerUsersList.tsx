import Link from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import { useBuyerAuthUrl } from 'client/global/hooks/useBuyerUrl';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import { BuyerToolbar } from 'client/portal/buyer/BuyerToolbar';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import PromiseButton from 'shared/components/button/PromiseButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { BuyerUserDeleteDocument, BuyerUsersDocument, BuyerVendorDocument, RoleType } from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';
import EditIcon from 'shared/icons/EditIcon';
import { useUser } from 'shared/UserState';

/**
 * *** Add roles too
 * implement owner logic for user info
 * not able to delete myself, not deleting the last user in the list.
 */
export function BuyerUsersList() {
  const currentUser = useUser();
  const buyerRelId = useGetCurrentBuyerRelId();
  const navigate = useNavigate();
  const buyerUrl = useBuyerAuthUrl();

  const query = useQueryHook(BuyerUsersDocument, { buyerRelId }, 'cache-and-network');
  const refresh = useQueryPromise(BuyerUsersDocument);
  const remove = useMutationPromise(BuyerUserDeleteDocument);

  const vendorId = useCurrentVendorId();
  const { vendor } = useQueryHook(BuyerVendorDocument, { vendorId }, 'cache-first');

  const defaultRoleIds = new Set<string>(
    vendor.roles.filter((r) => r.default && r.type === RoleType.Buyer).map((r) => r.id)
  );

  const createButton = (
    <PromiseButton
      snackbar={false}
      icon={<AddIcon />}
      onClick={() => {
        navigate(buyerUrl('/users/create'));
      }}
    >
      Create User
    </PromiseButton>
  );

  return (
    <BuyerToolbar title="Users" actions={createButton}>
      <Table card>
        <TableHead>
          <TableRow>
            <TableHeadCell />
            <TableHeadCell className="w-1/3">User</TableHeadCell>
            <TableHeadCell className="w-1/3">Email</TableHeadCell>
            <TableHeadCell className="w-1/3">Role</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {query.buyer.users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <ConfirmationButton
                  key="delete"
                  disabled={
                    user.user.id === currentUser.id ||
                    query.buyer.users.length === 1 ||
                    user.roles.some((ur) => defaultRoleIds.has(ur.id))
                  }
                  style={ButtonStyle.DANGER}
                  icon={<DeleteIcon />}
                  title={`Delete user ${user.user.first} ${user.user.last}?`}
                  description="This action cannot be undone."
                  confirmText="Delete"
                  onClick={async () => {
                    await remove({ buyerId: query.buyer.buyerId, userId: user.user.id });
                    await refresh({ buyerRelId });
                  }}
                >
                  Delete
                </ConfirmationButton>
              </TableCell>
              <TableCell>
                <Link icon={<EditIcon />} to={user.user.id}>
                  {user.user.first} {user.user.last}
                </Link>
              </TableCell>
              <TableCell>{user.user.email}</TableCell>
              <TableCell>{user.roles.map((r) => r.name).join(', ')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </BuyerToolbar>
  );
}
