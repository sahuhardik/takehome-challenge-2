import dayjs from 'dayjs';
import * as React from 'react';
import PopupView from 'shared/components/tailwind/Popup/PopupView';
import { User } from 'shared/generated';
import CakeIcon from 'shared/icons/CakeIcon';

interface BirthdaysProps {
  users: Array<{ user: Pick<User, 'name' | 'dateOfBirth'> }>;
  date: Date;
}

export default function Birthdays({ users, date }: BirthdaysProps) {
  const referenceDate = dayjs(date).format();
  const getBirthDay = (dateOfBirth, referenceDate) => dayjs(dateOfBirth).year(dayjs(referenceDate).year());
  const birthDayUsers = (users || [])
    .filter((u) => !!u.user.dateOfBirth)
    .map((u) => ({ ...u, birthDayApi: getBirthDay(u.user.dateOfBirth, referenceDate) }))
    .filter((u) => u.birthDayApi.week() === dayjs(referenceDate).week())
    .map((u) => ({
      name: u.user.name,
      birthday: u.birthDayApi.format('ddd M/DD'),
    }));
  return birthDayUsers.length ? (
    <PopupView
      activator={
        <div className="flex items-center group-scope space-x-2 text-secondary cursor-pointer">
          <div className="w-4 h-4 group-scope-hover:text-black">
            <CakeIcon />
          </div>
          <div className="text-xs group-scope-hover:text-black">Birthdays</div>
        </div>
      }
      hover
    >
      <div className="p-2 bg-black bg-opacity-80 round text-white text-sm">
        <ul className="flex flex-col space-y-2">
          {birthDayUsers.map((user, i) => (
            <li key={i}>
              {user.name}, {user.birthday}
            </li>
          ))}
        </ul>
      </div>
    </PopupView>
  ) : null;
}
