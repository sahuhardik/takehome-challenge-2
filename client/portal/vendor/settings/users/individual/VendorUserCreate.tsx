import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import { SearchUser, UserRoles } from 'client/global/components/form/FormUserRoles';
import Center from 'client/global/components/tailwind/Center';
import Toolbar from 'client/global/components/tailwind/Toolbar';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RoleType, VendorInternalUserAssignDocument, VendorInternalUserListDocument } from 'shared/generated';
import { useMutationPromise, useQueryHook } from 'shared/Graph';

export default function VendorUserCreate() {
  const { vendorId } = useParams();
  const query = useQueryHook(VendorInternalUserListDocument, { vendorId });
  const navigate = useNavigate();
  const assign = useMutationPromise(VendorInternalUserAssignDocument);

  useRegisterBreadcrumb('Add User');

  return (
    <Center padding small>
      <Toolbar title="Add User">
        <SearchUser
          ownerMemberId={vendorId}
          roles={query.vendor.roles.filter((r) => r.type === RoleType.Vendor)}
          timezone={query.vendor.timezone}
          multiSelectRole={true}
          onSelect={async (user: UserRoles) => {
            await assign({ vendorId, userId: user.userId, roleIds: user.roleIds });
            navigate('../');
          }}
        />
      </Toolbar>
    </Center>
  );
}
