import { useState } from '@hookstate/core';
import { MICROSITE_TYPE } from 'client/const';
import Center from 'client/global/components/tailwind/Center';
import { VendorSettingsContext } from 'client/portal/vendor/settings/VendorSettingsData';
import * as React from 'react';
import { useContext } from 'react';
import { FormGroup, FormHorizontal } from 'shared/components/form/FormLayout';
import FormSelect from 'shared/components/form/FormSelect';
import FormText from 'shared/components/form/FormText';

export default function VendorSettingsAdvanced() {
  const { settings } = useContext(VendorSettingsContext);
  const scopedSettings = useState(settings);

  return (
    <Center padding>
      <FormGroup>
        <FormHorizontal state={scopedSettings.micrositeConfig.defaultType} lang="micrositeDefaultType">
          <FormSelect state={scopedSettings.micrositeConfig.defaultType} options={MICROSITE_TYPE} />
        </FormHorizontal>
        <FormHorizontal state={scopedSettings.micrositeConfig.hdPhotoHub.apiKey} lang="hdPhotoHubApiKey">
          <FormText state={scopedSettings.micrositeConfig.hdPhotoHub.apiKey} />
        </FormHorizontal>
        <FormHorizontal state={scopedSettings.micrositeConfig.hdPhotoHub.url} lang="hdPhotoHubUrl">
          <FormText state={scopedSettings.micrositeConfig.hdPhotoHub.url} />
        </FormHorizontal>
        <FormHorizontal state={scopedSettings.micrositeConfig.rela.apiKey} name="Rela API Key">
          <FormText state={scopedSettings.micrositeConfig.rela.apiKey} />
        </FormHorizontal>
        <FormHorizontal state={scopedSettings.micrositeConfig.rela.token} name="Rela Token">
          <FormText state={scopedSettings.micrositeConfig.rela.token} />
        </FormHorizontal>
        <FormHorizontal state={scopedSettings.micrositeConfig.rela.uid} name="Rela UID">
          <FormText state={scopedSettings.micrositeConfig.rela.uid} />
        </FormHorizontal>
      </FormGroup>
    </Center>
  );
}
