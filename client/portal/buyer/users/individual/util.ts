import { BuyerUsersQuery, BuyerVendorQuery, RoleType } from 'shared/generated';

export function getSelectRoles(
  vendorRoles: BuyerVendorQuery['vendor']['roles'],
  buyerUsers: BuyerUsersQuery['buyer']['users'],
  userId?: string
) {
  const buyerRoles = vendorRoles.filter((r) => r.type === RoleType.Buyer);
  const buyerDefaultRoles = buyerRoles.filter((r) => r.default);
  const buyerNotDefaultRoles = buyerRoles.filter((r) => !r.default);
  const buyerDefaultRoleIds = new Set<string>(buyerDefaultRoles.map((r) => r.id));
  const buyerHasUserDefaultRole = buyerUsers
    .filter((u) => !userId || u.user.id !== userId)
    .some((u) => u.roles.some((ur) => buyerDefaultRoleIds.has(ur.id)));
  return buyerHasUserDefaultRole ? buyerNotDefaultRoles : buyerDefaultRoles;
}
