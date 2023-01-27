import { useState } from '@hookstate/core';
import SlidebarRouter from 'client/global/layout/slidebar/SlidebarRouter';
import * as React from 'react';
import { UserWrite } from 'shared/generated';
import VendorUserEdit from './individual/VendorUser';
import VendorUserCreate from './individual/VendorUserCreate';
import { VendorUsersContext, VendorUsersValidator, VendorUsersValidatorContext } from './VendorUsersData';
import { VendorUsersList } from './VendorUsersList';

export default function VendorUsers() {
  const state = useState<UserWrite>({
    first: '',
    last: '',
    email: '',
    phone: '',
  });

  const validator = new VendorUsersValidator(state);

  return (
    <VendorUsersContext.Provider value={state}>
      <VendorUsersValidatorContext.Provider value={validator}>
        <SlidebarRouter
          root={<VendorUsersList />}
          paths={{ create: <VendorUserCreate />, ':userId': <VendorUserEdit /> }}
        />
      </VendorUsersValidatorContext.Provider>
    </VendorUsersContext.Provider>
  );
}
