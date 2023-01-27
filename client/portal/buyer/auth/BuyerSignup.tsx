import { State, useState } from '@hookstate/core';
import { isPhoneNumber } from 'class-validator';
import FormPhone from 'client/global/components/form/FormPhone';
import { useBuyerAuthUrl } from 'client/global/hooks/useBuyerUrl';
import useCurrentVendor from 'client/global/hooks/useCurrentVendor';
import BuyerAuthLayout from 'client/portal/buyer/auth/BuyerAuthLayout';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import FormAddress from 'shared/components/form/FormAddress/FormAddress';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormText from 'shared/components/form/FormText';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { BuyerSignup as Form, ShopSignupDocument } from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';
import ChevronRight from 'shared/icons/ChevronRight';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

function Save({ form }: { form: State<Form> }) {
  const scope = useState(form);
  const { vendor } = useCurrentVendor();
  const signup = useMutationPromise(ShopSignupDocument);
  const buyerUrl = useBuyerAuthUrl();
  const navigate = useNavigate();

  return (
    <PromiseButton
      snackbar={false}
      style={ButtonStyle.PRIMARY}
      className="mt w-full"
      icon={<ChevronRight />}
      right
      onClick={async () => {
        const buyer = await signup({ vendorId: vendor.id, data: scope.get() });

        await navigate(buyerUrl('/', buyer.buyerSignup.id));
      }}
      disabled={!Validation(scope).valid(true)}
    >
      Continue
    </PromiseButton>
  );
}

export default function BuyerSignup() {
  const { vendor } = useCurrentVendor();
  const form = useState({} as Form);

  ValidationAttach(form, (validator) => {
    validator.address.required();
    validator.phone.required();
    validator.first.required();
    validator.phone.validate((value) => isPhoneNumber(value, 'US'), 'Please provide a valid 10-digit US phone number.');
    validator.last.required();
  });

  return (
    <BuyerAuthLayout>
      <p className="text-content-secondary mb text-center">
        Before we continue, please provide us with some additional information.
      </p>

      <FormGroup plain>
        <FormHorizontal state={form.first} name="First Name">
          <FormText state={form.first} focus />
        </FormHorizontal>

        <FormHorizontal state={form.last} name="Last Name">
          <FormText state={form.last} />
        </FormHorizontal>

        <FormHorizontal state={form.phone} name="Phone">
          <FormPhone state={form.phone} />
        </FormHorizontal>

        <FormHorizontal state={form.address} name="Address">
          <FormAddress state={form.address} coords={vendor.address} />
        </FormHorizontal>
      </FormGroup>
      <Save form={form} />
    </BuyerAuthLayout>
  );
}
