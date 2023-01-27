import ActionBar from 'client/global/layout/ActionBar';
import { VendorSettingsContext } from 'client/portal/vendor/settings/VendorSettingsData';
import * as React from 'react';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { VendorUpdateDocument } from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';

export default function VendorSettingsSave() {
  const { settings, notifications } = useContext(VendorSettingsContext);
  const { vendorId } = useParams();

  const update = useMutationPromise(VendorUpdateDocument);

  // Remove the archived prop from values array inside each field
  const filteredData = {
    ...settings.get(),
    fields: settings.get().fields.map((f) => ({
      ...f,
      shortName: f.shortName || '',
      values: f.values.map(({ id, preselected, removed, name, revenue, order, hidden }) => ({
        id,
        removed,
        name,
        preselected,
        revenue,
        order,
        hidden,
      })),
    })),
  };

  return (
    <ActionBar
      state={settings}
      onClick={async () => {
        await update({
          vendorId,
          data: filteredData,
          notifications: notifications.get().filter((n) => n.enabled),
        });
      }}
    />
  );
}
