import Birthdays from 'client/portal/vendor/schedule/Birthdays';
import { VendorCalendarProvider } from 'client/portal/vendor/schedule/VendorScheduleCommon';
import { VendorScheduleModel } from 'client/portal/vendor/schedule/VendorScheduleModel';
import * as React from 'react';
import Button from 'shared/components/tailwind/Button';
import { Permission } from 'shared/generated';
import PayIcon from 'shared/icons/PayIcon';
import RouteIcon from 'shared/icons/RouteIcon';
import WeekIcon from 'shared/icons/WeekIcon';
import { useHasPermission } from 'shared/UserState';
import Money from 'shared/utilities/Money';

interface VendorCalendarResourceProps {
  provider: VendorCalendarProvider;
  model: VendorScheduleModel;
  selected: boolean;
  onRoute: () => void;
  onSelect: () => void;
  onDeselect: () => void;
}

export default function VendorScheduleProvider({
  provider,
  selected,
  onSelect,
  onRoute,
  onDeselect,
  model,
}: VendorCalendarResourceProps) {
  const hasPermission = useHasPermission();

  if (selected) {
    return (
      <div className="bg-content p-4 flex items-center border-b-8 space-x-4" style={{ borderColor: provider.color }}>
        <Button onClick={onDeselect}>Back</Button>

        <div className="text-base font-medium">{provider.name}</div>
      </div>
    );
  }
  return (
    <div className="bg-content p-4 flex flex-col justify-center border-r-8" style={{ borderColor: provider.color }}>
      <div className="text-base">{provider.name}</div>
      <div className="flex items-center mt-1 space-x-4">
        {hasPermission(Permission.ViewExpenses) && (
          <div onClick={() => onRoute()} className="flex items-center space-x-2 text-secondary cursor-pointer">
            <div className="w-4 h-4">
              <PayIcon />
            </div>
            <div className="text-xs">
              <Money>{provider.balance}</Money>
            </div>
          </div>
        )}
        <div
          onClick={() => onRoute()}
          className="flex items-center group-scope space-x-2 text-secondary cursor-pointer"
        >
          <div className="w-4 h-4 group-scope-hover:text-black">
            <RouteIcon />
          </div>
          <div className="text-xs group-scope-hover:text-black">View Route</div>
        </div>
        <div onClick={onSelect} className="flex items-center group-scope space-x-2 text-secondary cursor-pointer">
          <div className="w-4 h-4 group-scope-hover:text-black">
            <WeekIcon />
          </div>
          <div className="text-xs group-scope-hover:text-black">View Week</div>
        </div>

        <Birthdays users={provider.users} date={model.start} />
      </div>
    </div>
  );
}
