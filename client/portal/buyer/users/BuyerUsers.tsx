import { useState } from '@hookstate/core';
import { BuyerContent } from 'client/portal/buyer/BuyerLayout';
import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import { UserWrite } from 'shared/generated';
import { BuyerUsersContext, BuyerUsersValidator, BuyerUsersValidatorContext } from './BuyerUsersData';
import { BuyerUsersList } from './BuyerUsersList';
import BuyerUserCreate from './individual/BuyerUserCreate';
import BuyerUserEdit from './individual/BuyerUserEdit';

export default function BuyerUsers() {
  const state = useState<UserWrite>({
    first: '',
    last: '',
    email: '',
    phone: '',
  });

  const validator = new BuyerUsersValidator(state);

  return (
    <BuyerContent padding className="space-y-4">
      <BuyerUsersContext.Provider value={state}>
        <BuyerUsersValidatorContext.Provider value={validator}>
          <Routes>
            <Route path="/" element={<BuyerUsersList />} />
            <Route path="/create" element={<BuyerUserCreate />} />
            <Route path="/:userId" element={<BuyerUserEdit />} />
          </Routes>
        </BuyerUsersValidatorContext.Provider>
      </BuyerUsersContext.Provider>
    </BuyerContent>
  );
}
