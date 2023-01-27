import { useState } from '@hookstate/core';
import NestedColumnLayout from 'client/global/layout/NestedColumnLayout';
import SlidebarRouter from 'client/global/layout/slidebar/SlidebarRouter';
import { VendorPackageCreate, VendorPackageEdit } from 'client/portal/vendor/settings/package/VendorPackageForm';
import VendorPackageList from 'client/portal/vendor/settings/package/VendorPackageList';
import VendorSettingProviderRouter from 'client/portal/vendor/settings/provider/VendorSettingProviderRouter';
import VendorService from 'client/portal/vendor/settings/service/VendorService';
import VendorUsers from 'client/portal/vendor/settings/users/VendorUsers';
import VendorSettingsAdvanced from 'client/portal/vendor/settings/VendorSettingsAdvanced';
import VendorSettingsValidator, {
  VendorSettingsContext,
  VendorSettingsState,
  VendorSettingsValidatorContext,
} from 'client/portal/vendor/settings/VendorSettingsData';
import VendorSettingsDeliveries from 'client/portal/vendor/settings/VendorSettingsDeliveries';
import VendorSettingsFields from 'client/portal/vendor/settings/VendorSettingsFields';
import VendorSettingsGeneral from 'client/portal/vendor/settings/VendorSettingsGeneral';
import VendorSettingsGroups from 'client/portal/vendor/settings/VendorSettingsGroups';
import VendorSettingsNotifications from 'client/portal/vendor/settings/VendorSettingsNotifications';
import VendorSettingsRoles from 'client/portal/vendor/settings/VendorSettingsRoles';
import VendorSettingsRuleRouter from 'client/portal/vendor/settings/VendorSettingsRuleRouter';
import VendorSettingsSave from 'client/portal/vendor/settings/VendorSettingsSave';
import VendorSettingsScheduling from 'client/portal/vendor/settings/VendorSettingsScheduling';
import VendorSettingsServiceArea from 'client/portal/vendor/settings/VendorSettingsServiceArea';
import VendorSettingsShop from 'client/portal/vendor/settings/VendorSettingsShop';
import VendorSettingsTasks from 'client/portal/vendor/settings/VendorSettingsTasks';
import VendorSettingsWizardRouter from 'client/portal/vendor/settings/wizard/VendorSettingsWizardRouter';
import * as React from 'react';
import { Outlet } from 'react-router-dom';
import {
  NotificationConfigEmail,
  NotificationConfigInput,
  NotificationConfigSlack,
  VendorSettingsDocument,
  VendorWrite,
} from 'shared/generated';
import { useQuerySuspense } from 'shared/Graph';
import AdvancedIcon from 'shared/icons/AdvancedIcon';
import CartIcon from 'shared/icons/CartIcon';
import GeneralIcon from 'shared/icons/GeneralIcon';
import MapIcon from 'shared/icons/MapIcon';
import NotificationsIcon from 'shared/icons/NotificationsIcon';
import PropertiesIcon from 'shared/icons/PropertiesIcon';
import SchedulingIcon from 'shared/icons/SchedulingIcon';

export default function VendorSettings({ vendorId }: { vendorId: string }) {
  const query = useQuerySuspense(VendorSettingsDocument, { vendorId }, 'network-only');

  const { id, notifications, ...data } = query.vendor;

  const state: VendorSettingsState = {
    vendor: query.vendor,
    notifications: useState<NotificationConfigInput[]>(
      notifications.map((n) => ({
        method: n.method,
        type: n.type,
        enabled: n.enabled,
        global: n.global,
        attachments: (n as NotificationConfigEmail).attachments,
        message: n.message,
        subject: (n as NotificationConfigEmail).subject,
        channel: (n as NotificationConfigSlack).channel,
      }))
    ),
    settings: useState<VendorWrite>({
      ...data,
      fields: data.fields.map((f) => ({
        ...f,
        values: f.values.filter((v) => !v.archived),
      })),
      serviceArea: data.serviceArea || null,
      businessHours: data.businessHours || null,
      micrositeConfig: {
        rela: {},
        hdPhotoHub: {},
        ...(data.micrositeConfig || {}),
      },
    }),
  };

  const validator = new VendorSettingsValidator(state);

  return (
    <VendorSettingsContext.Provider value={state}>
      <VendorSettingsValidatorContext.Provider value={validator}>
        <NestedColumnLayout
          pages={[
            {
              key: 'preferences',
              name: 'Preferences',
              useElement: () => (
                <NestedColumnLayout
                  wrapper={
                    <div className="flex-1 flex flex-col">
                      <VendorSettingsSave />
                      <Outlet />
                    </div>
                  }
                  pages={[
                    {
                      name: 'General',
                      key: 'general',
                      icon: <GeneralIcon />,
                      useElement: <VendorSettingsGeneral />,
                      error: () => !validator.general(),
                    },
                    {
                      name: 'Scheduling',
                      key: 'scheduling',
                      icon: <SchedulingIcon />,
                      error: () => !validator.scheduling(),
                      useElement: <VendorSettingsScheduling />,
                    },
                    {
                      name: 'Fields',
                      key: 'fields',
                      icon: <PropertiesIcon />,
                      useElement: <VendorSettingsFields />,
                      error: () => !validator.fields(),
                    },
                    {
                      name: 'Notifications',
                      key: 'notifications',
                      icon: <NotificationsIcon />,
                      useElement: <VendorSettingsNotifications />,
                      error: () => !validator.notifications(),
                    },
                    {
                      name: 'Shop',
                      key: 'shop',
                      icon: <CartIcon />,
                      useElement: <VendorSettingsShop />,
                      error: () => !validator.shop(),
                    },
                    {
                      name: 'Service Area',
                      key: 'service-area',
                      icon: <MapIcon />,
                      useElement: <VendorSettingsServiceArea />,
                      error: () => !validator.general(),
                    },
                    {
                      name: 'Advanced',
                      key: 'advanced',
                      icon: <AdvancedIcon />,
                      useElement: <VendorSettingsAdvanced />,
                      error: !validator.advanced(),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'users',
              name: 'Users',
              root: true,
              useElement: <VendorUsers />,
            },
            {
              key: 'services',
              name: 'Services',
              root: true,
              useElement: <VendorService />,
            },
            {
              key: 'packages',
              name: 'Packages',
              root: true,
              useElement: (
                <SlidebarRouter
                  root={<VendorPackageList />}
                  paths={{
                    create: <VendorPackageCreate />,
                    ':packageId': <VendorPackageEdit />,
                  }}
                />
              ),
            },
            {
              key: 'roles',
              name: 'Roles',
              root: true,
              useElement: <VendorSettingsRoles />,
            },
            {
              key: 'groups',
              name: 'Groups',
              useElement: <VendorSettingsGroups />,
            },
            {
              key: 'provider',
              name: 'Providers',
              root: true,
              useElement: <VendorSettingProviderRouter />,
            },
            {
              key: 'tasks',
              name: 'Tasks',
              root: true,
              useElement: <VendorSettingsTasks />,
            },
            {
              key: 'deliveries',
              name: 'Deliveries',
              root: true,
              useElement: <VendorSettingsDeliveries />,
            },
            {
              key: 'wizards',
              name: 'Wizards',
              root: true,
              useElement: <VendorSettingsWizardRouter />,
            },
            {
              key: 'rules',
              name: 'Rules',
              root: true,
              useElement: <VendorSettingsRuleRouter />,
            },
          ]}
        />
      </VendorSettingsValidatorContext.Provider>
    </VendorSettingsContext.Provider>
  );
}
