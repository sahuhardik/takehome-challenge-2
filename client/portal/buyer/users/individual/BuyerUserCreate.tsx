import { SearchUser, UserRoles } from 'client/global/components/form/FormUserRoles';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import { BuyerToolbar } from 'client/portal/buyer/BuyerToolbar';
import { getSelectRoles } from 'client/portal/buyer/users/individual/util';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { BuyerUserAssignDocument, BuyerUsersDocument, BuyerVendorDocument } from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';

export default function BuyerUserCreate() {
  const buyerRelId = useGetCurrentBuyerRelId();
  const query = useQueryHook(BuyerUsersDocument, { buyerRelId });
  const buyerId = query.buyer.buyerId;
  const vendorId = useCurrentVendorId();
  const { vendor } = useQueryHook(BuyerVendorDocument, { vendorId }, 'cache-first');

  const navigate = useNavigate();

  const assign = useMutationPromise(BuyerUserAssignDocument);

  return (
    <BuyerToolbar title="Create New User">
      <SearchUser
        ownerMemberId={buyerId}
        timezone={vendor.timezone}
        roles={getSelectRoles(vendor.roles, query.buyer.users)}
        onSelect={async (user: UserRoles) => {
          await assign({ buyerId, userId: user.userId, roleIds: user.roleIds });
          navigate('../');
        }}
      />
    </BuyerToolbar>
  );
}
