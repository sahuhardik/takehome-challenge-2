import { none, useState } from '@hookstate/core';
import FormColor from 'client/global/components/form/FormColor';
import FormImage from 'client/global/components/form/FormImage';
import Center from 'client/global/components/tailwind/Center';
import { VendorSettingsContext } from 'client/portal/vendor/settings/VendorSettingsData';
import * as React from 'react';
import { lazy, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSwitch from 'shared/components/form/FormSwitch';
import FormText from 'shared/components/form/FormText';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import DeleteIcon from 'shared/icons/DeleteIcon';

const FormEditor = lazy(() => import(/* webpackChunkName: "editor" */ 'client/portal/vendor/settings/FormEditor'));

export default function VendorSettingsShop() {
  const { settings } = useContext(VendorSettingsContext);
  const state = useState(settings);
  const { vendorId } = useParams();

  return (
    <Center padding>
      <FormGroup>
        <FormHorizontal state={state.stripeTest} name="Test Mode">
          <FormSwitch state={state.stripeTest} />
        </FormHorizontal>
        <FormHorizontal state={state.cartDomain} name="Domain">
          <FormText state={state.cartDomain} />
        </FormHorizontal>
        <FormHorizontal state={state.cartDomain} name="Thank You Message">
          <FormText state={state.cartThanks} lines={8} />
        </FormHorizontal>
        <FormHorizontal state={state.cartTerms} name="Terms">
          <FormEditor state={state.cartTerms} />
        </FormHorizontal>
        <FormHorizontal state={state.themePrimary} name="Primary Color">
          <FormColor state={state.themePrimary} />
        </FormHorizontal>
        <FormHorizontal state={state.themeSecondary} name="Secondary Color">
          <FormColor state={state.themeSecondary} />
        </FormHorizontal>
        <FormHorizontal state={state.themeBackground} name="Background Color">
          <FormColor state={state.themeBackground} />
        </FormHorizontal>
        <FormHorizontal state={state.themeLogo} name="Logo">
          <FormImage state={state.themeLogo} meta={{ vendorId }} />
          {state.themeLogo.get() && (
            <div>
              <Button style={ButtonStyle.DANGER} onClick={() => state.themeLogo.set(none)} icon={<DeleteIcon />}>
                Clear Logo
              </Button>
            </div>
          )}
        </FormHorizontal>
      </FormGroup>
    </Center>
  );
}
