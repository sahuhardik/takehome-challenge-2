import { State } from '@hookstate/core';
import { isPhoneNumber } from 'class-validator';
import { requireDynamicFields } from 'shared/components/fields/DynamicFieldInput';
import { BuyerCustomerFragment, BuyerProfileUpdate, BuyerVendorFieldFragment, MemberType } from 'shared/generated';
import { ValidationAttach } from 'shared/utilities/Validation';

export function BuyerCustomerWriteValidation(state: State<BuyerProfileUpdate>, fields: BuyerVendorFieldFragment[]) {
  ValidationAttach(state, (validator) => {
    validator.when((c) => c.type.get() === MemberType.Organization).buyerGroupTypeId.required();
    validator.company.required();
    validator.address.required();
    validator.phone.validate((p) => !p || isPhoneNumber(p, 'US'));
    requireDynamicFields(fields, validator.properties);
  });
}

export function toBuyerProfileUpdate(customer: BuyerCustomerFragment): BuyerProfileUpdate {
  return {
    type: customer.member.type,
    company: customer.member.company,
    buyerGroupTypeId: customer.member.buyerGroupTypeId,
    address: customer.member.address,
    phone: customer.member.phone,
    email: customer.member.email,
    properties: customer.fields,
  };
}
