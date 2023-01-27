import { State, useState } from '@hookstate/core';
import { createContext } from 'react';
import {
  MicrositeType,
  NotificationConfigInput,
  NotificationMethod,
  VendorSettingsQuery,
  VendorWrite,
} from 'shared/generated';
import { Validation, ValidationAttach } from 'shared/utilities/Validation';

export default class VendorSettingsValidator {
  constructor(private state: VendorSettingsState) {
    ValidationAttach(state.notifications, (validator) => {
      const enabled = validator.when((n) => n.enabled.get());

      enabled.message.required();
      enabled.when((n) => n.method.get() === NotificationMethod.Slack).channel.required();
      enabled.when((n) => n.method.get() === NotificationMethod.Email).subject.required();
    });

    ValidationAttach(state.settings, (validator) => {
      validator.timezone.required();
      validator.fields.name.required();
      validator.fields.role.required();
      validator.fields.conditions.logic.required();
      validator.fields.conditions.referenceId.required();

      const rela = validator.when((settings) => settings?.micrositeConfig?.defaultType.get() === MicrositeType.Rela)
        .micrositeConfig.rela;

      rela.apiKey.required();
      rela.token.required();
      rela.uid.required();

      const hdph = validator.when(
        (settings) => settings?.micrositeConfig?.defaultType.get() === MicrositeType.HdPhotoHub
      ).micrositeConfig.hdPhotoHub;

      hdph.apiKey.required();
      hdph.url.required();
    });
  }

  valid() {
    return Validation(useState(this.state.settings)).valid(true); // eslint-disable-line react-hooks/rules-of-hooks
  }

  general() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return Validation(useState(this.state.settings)).valid(true, ['timezone', 'reviewOrder']);
  }

  fields() {
    return Validation(useState(this.state.settings)).valid(true, ['fields']); // eslint-disable-line react-hooks/rules-of-hooks
  }

  scheduling() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return Validation(useState(this.state.settings)).valid(true, ['buyerReminderMinutes', 'inlineScheduling']);
  }

  shop() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return Validation(useState(this.state.settings)).valid(true, [
      'cartDomain',
      'themePrimary',
      'themeSecondary',
      'themeBackground',
      'themeLogo',
    ]);
  }

  notifications() {
    return Validation(useState(this.state.notifications)).valid(true); // eslint-disable-line react-hooks/rules-of-hooks
  }

  advanced() {
    return Validation(useState(this.state.notifications)).valid(true); // eslint-disable-line react-hooks/rules-of-hooks
  }
}

export interface VendorSettingsState {
  settings: State<VendorWrite>;
  notifications: State<NotificationConfigInput[]>;
  vendor: VendorSettingsQuery['vendor'];
}

export const VendorSettingsValidatorContext = createContext<VendorSettingsValidator>(null);
export const VendorSettingsContext = createContext<{
  settings: State<VendorWrite>;
  notifications: State<NotificationConfigInput[]>;
  vendor: VendorSettingsQuery['vendor'];
}>(null);
