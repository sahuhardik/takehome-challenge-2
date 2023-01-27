import { State } from '@hookstate/core';
import VendorServiceValidator from 'client/portal/vendor/settings/service/VendorServiceData';
import { createContext } from 'react';
import { ServiceWrite, VendorServiceQuery } from 'shared/generated';

export const ServiceValidatorContext = createContext<VendorServiceValidator>(null);
export const ServiceContext = createContext<{
  read: VendorServiceQuery['service'];
  write: State<ServiceWrite>;
}>(null);
