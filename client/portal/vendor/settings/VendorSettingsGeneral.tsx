import { useState } from '@hookstate/core';
import { FORM_TIMEZONE_OPTIONS } from 'client/const';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import Center from 'client/global/components/tailwind/Center';
import { BusinessHours } from 'client/portal/vendor/settings/provider/VendorSettingProviderForm';
import { defaultBusinessHours } from 'client/portal/vendor/settings/provider/VendorSettingProviderRouter';
import { VendorSettingsContext } from 'client/portal/vendor/settings/VendorSettingsData';
import * as React from 'react';
import { useContext } from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';

export default function VendorSettingsGeneral() {
  const { settings } = useContext(VendorSettingsContext);
  const state = useState(settings);

  useRegisterBreadcrumb('General');

  return (
    <Center padding>
      <FormGroup>
        <FormHorizontal state={state.timezone}>
          <FormSelect state={state.timezone} options={FORM_TIMEZONE_OPTIONS} />
        </FormHorizontal>
        <FormHorizontal state={state.loginBoxInfo} name="Login Box Info Text">
          <FormText state={state.loginBoxInfo} />
        </FormHorizontal>
        <FormHorizontal state={state.payLaterDefault} name="Pay Later Default">
          <FormSwitch state={state.payLaterDefault} />
        </FormHorizontal>
        <FormHorizontal state={state.businessHours} name="Business Hours">
          <BusinessHours state={state.businessHours} showDefault={defaultBusinessHours()} />
        </FormHorizontal>
        <FormHorizontal state={state.reviewOrder}>
          <FormSwitch state={state.reviewOrder} />
        </FormHorizontal>
        <FormHorizontal state={state.showCalendarTitles}>
          <FormSwitch state={state.showCalendarTitles} />
        </FormHorizontal>
      </FormGroup>
    </Center>
  );
}
