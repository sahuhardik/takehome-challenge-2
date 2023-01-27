import { State } from '@hookstate/core';
import { isPhoneNumber } from 'class-validator';
import { requireDynamicFields } from 'shared/components/fields/DynamicFieldInput';
import { BuyerWrite, MemberType, Role, VendorCustomerFragment, VendorFieldFragment } from 'shared/generated';
import { ValidationAttach } from 'shared/utilities/Validation';

export function CustomerCreateValidation(
  state: State<BuyerWrite>,
  fields: VendorFieldFragment[],
  defaultRoles: Array<Pick<Role, 'id'>> = []
) {
  ValidationAttach(state, (validator) => {
    const defaultRolesSet = new Set<string>(defaultRoles.map((r) => r.id));
    const ifPerson = validator.when((c) => c.type.get() === MemberType.Person);
    const ifOrg = validator.when((c) => c.type.get() === MemberType.Organization);

    ifPerson.person.first.required();
    ifPerson.person.last.required();
    ifPerson.person.email.required();
    ifPerson.person.phone.required();

    ifOrg.buyerGroupTypeId.required();
    ifOrg.company.required();
    ifOrg.address.required();
    ifOrg.phone.validate((p) => !p || isPhoneNumber(p, 'US'));

    // if user array is populated
    ifOrg.users.userId.required();
    ifOrg.users.roleIds.required(); // require at least one role
    ifOrg.users.validate(
      (b) => !Array.isArray(b) || b.filter((x) => x.roleIds.some((r) => defaultRolesSet.has(r))).length === 1
    );

    const required = fields.filter((p) => p.requiredOnCreate);

    requireDynamicFields(required, validator.properties);
  });
}

export function CustomerEditValidation(
  state: State<BuyerWrite>,
  fields: VendorFieldFragment[],
  defaultRoles: Array<Pick<Role, 'id'>> = []
) {
  ValidationAttach(state, (validator) => {
    const defaultRolesSet = new Set<string>(defaultRoles.map((r) => r.id));
    validator.buyerGroupTypeId.required();
    validator.company.required();
    validator.address.required();
    validator.phone.validate((p) => !p || isPhoneNumber(p, 'US'));
    validator.users.userId.required();
    validator.users.roleIds.required(); // require at least one role
    validator.users.validate(
      (b) => !Array.isArray(b) || b.filter((x) => x.roleIds.some((r) => defaultRolesSet.has(r))).length === 1
    );
    const required = fields.filter((p) => p.requiredOnCreate);
    requireDynamicFields(required, validator.properties);
  });
}

export function toBuyerWrite(customer: VendorCustomerFragment): BuyerWrite {
  return {
    address: customer.member.address,
    phone: customer.member.phone,
    email: customer.member.email,
    type: customer.member.type,
    company: customer.member.company,
    netTerms: customer.netTerms,
    postPay: customer.postPay,
    interval: customer.interval,
    micrositeType: customer.micrositeType,
    performables: [],
    exclusiveProvider: customer.exclusiveProviders[0]?.id,
    blockedProviders: customer.blockedProviders.map((b) => b.id),
    properties: customer.fields,
    users: customer.users
      .filter((u) => u.roles.length)
      .map((u) => ({
        userId: u.userId,
        roleIds: u.roles.map((r) => r.id),
      })),
    parentId: customer.member.parentId,
    buyerGroupTypeId: customer.member.buyerGroupTypeId,
    /*
    group: {
      isGroup: customer.group.isGroup,
      typeId: customer.group.typeId,
      buyerIds: customer.group.buyers.map(b => b.id)
    }
     */
  };
}
