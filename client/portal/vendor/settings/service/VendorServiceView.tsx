import { State, useState } from '@hookstate/core';
import { Untracked } from '@hookstate/untracked';
import { useRegisterBreadcrumb } from 'client/global/components/BreadcrumbBar';
import NestedColumnLayout, { NestedPage } from 'client/global/layout/NestedColumnLayout';
import SlidebarRouter from 'client/global/layout/slidebar/SlidebarRouter';
import VendorServiceAdvanced from 'client/portal/vendor/settings/service/forms/VendorServiceAdvanced';
import VendorServiceCart from 'client/portal/vendor/settings/service/forms/VendorServiceCart';
import VendorServiceGeneral from 'client/portal/vendor/settings/service/forms/VendorServiceGeneral';
import VendorServicePricing from 'client/portal/vendor/settings/service/forms/VendorServicePricing';
import VendorServiceScheduling from 'client/portal/vendor/settings/service/forms/VendorServiceScheduling';
import VendorServiceMarketing from 'client/portal/vendor/settings/service/marketing/VendorServiceMarketing';
import VendorServiceProperty from 'client/portal/vendor/settings/service/properties/VendorServiceProperty';
import VendorServicePropertyList from 'client/portal/vendor/settings/service/properties/VendorServicePropertyList';
import { ServiceContext, ServiceValidatorContext } from 'client/portal/vendor/settings/service/VendorServiceContext';
import VendorServiceNotifications from 'client/portal/vendor/settings/service/VendorServiceNotifications';
import VendorServiceProviders from 'client/portal/vendor/settings/service/VendorServiceProviders';
import VendorServiceSave from 'client/portal/vendor/settings/service/VendorServiceSave';
import VendorServiceSteps from 'client/portal/vendor/settings/service/VendorServiceSteps';
import * as React from 'react';
import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import {
  PerformablePropertyValueWrite,
  PerformablePropertyWrite,
  PropertyPricing,
  ServiceWrite,
  VariantValueComparator,
  VendorServiceDocument,
  VendorServiceQuery,
} from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import AdvancedIcon from 'shared/icons/AdvancedIcon';
import CartIcon from 'shared/icons/CartIcon';
import GeneralIcon from 'shared/icons/GeneralIcon';
import MarketingIcon from 'shared/icons/MarketingIcon';
import NotificationsIcon from 'shared/icons/NotificationsIcon';
import PricingIcon from 'shared/icons/PricingIcon';
import PropertiesIcon from 'shared/icons/PropertiesIcon';
import ProviderIcon from 'shared/icons/ProviderIcon';
import SchedulingIcon from 'shared/icons/SchedulingIcon';
import StepsIcon from 'shared/icons/StepsIcon';
import VendorServiceValidator from './VendorServiceData';

function VendorServiceInternal({ data }: { data: VendorServiceQuery }) {
  const { id, ...dservice } = data.service;
  const { vendor, ...extract } = dservice;

  const state = useState<ServiceWrite>({
    ...extract,
    properties: extract.properties.map((p) => ({
      ...p,
      values: p.values.filter((v) => !v.archived).map(({ archived, ...v }) => v),
      tiers: p.tiers,
    })),
    marketing: extract.marketing || {
      images: [],
      links: [],
      videos: [],
    },
    steps: extract.steps.map((d) => {
      delete d.id;

      return d;
    }),
    dependencies: extract.dependencies,
    variants: extract.variants.map((v) => ({
      expense: v.expense,
      revenue: v.revenue,
      properties: v.values,
    })),
  });

  const validator = new VendorServiceValidator(state);

  const links = (): NestedPage[] => {
    const nav: NestedPage[] = [
      {
        name: 'General',
        key: 'sgeneral',
        icon: <GeneralIcon />,
        useElement: <VendorServiceGeneral qb={vendor.quickbooksItems} />,
        error: !validator.general(),
      },
      {
        name: 'Properties',
        key: 'sproperties',
        icon: <PropertiesIcon />,
        useElement: (
          <SlidebarRouter root={<VendorServicePropertyList />} paths={{ ':propertyId': <VendorServiceProperty /> }} />
        ),
        error: !validator.properties(),
      },
      {
        name: 'Scheduling',
        key: 'sscheduling',
        icon: <SchedulingIcon />,
        useElement: <VendorServiceScheduling />,
        error: !validator.scheduling(),
      },
      { name: 'Steps', key: 'steps', icon: <StepsIcon />, useElement: <VendorServiceSteps /> },
      {
        name: 'Notifications',
        key: 'snotifications',
        icon: <NotificationsIcon />,
        useElement: <VendorServiceNotifications />,
      },
      {
        name: 'Providers',
        key: 'sproviders',
        icon: <ProviderIcon />,
        useElement: <VendorServiceProviders />,
      },
    ];

    if (state.properties.some((p) => p.pricingType.get() === PropertyPricing.Matrix)) {
      nav.push({
        name: 'Pricing',
        key: 'spricing',
        useElement: <VendorServicePricing />,
        icon: <PricingIcon />,
      });
    }

    // use a scope stated to prevent validation errors from re-rending the entire VendorServiceInternal component
    return [
      ...nav,
      { name: 'Cart', key: 'scart', icon: <CartIcon />, useElement: <VendorServiceCart /> },
      { name: 'Marketing', key: 'smarketing', icon: <MarketingIcon />, useElement: <VendorServiceMarketing /> },
      {
        name: 'Advanced',
        key: 'sadvanced',
        icon: <AdvancedIcon />,
        useElement: <VendorServiceAdvanced />,
        error: !validator.advanced(),
      },
    ];
  };

  const value = { read: { id, ...dservice }, write: state }; // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <ServiceContext.Provider value={value}>
      <ServiceValidatorContext.Provider value={validator}>
        <StateListener state={state} />
        <NestedColumnLayout
          pages={links}
          wrapper={
            <div className="flex-1 flex flex-col">
              <VendorServiceSave />
              <Outlet />
            </div>
          }
        />
      </ServiceValidatorContext.Provider>
    </ServiceContext.Provider>
  );
}

interface MatrixItem {
  property: PerformablePropertyWrite;
  valuable: boolean;
  value?: PerformablePropertyValueWrite;
}

function StateListener({ state }: { state: State<ServiceWrite> }) {
  const scope = useState(state);
  scope.attach(Untracked);

  const matrix = scope.properties.get().filter((p) => p.pricingType === PropertyPricing.Matrix);

  useEffect(() => {
    const matrixed: MatrixItem[][] = [];

    for (let i = 0; i < matrix.length; i += 1) {
      const property = matrix[i];

      if (!matrixed[i]) {
        matrixed[i] = [];
      }

      const values = property.values || [];

      if (values.length) {
        for (const pv of values) {
          matrixed[i].push({
            property,
            value: pv,
            valuable: true,
          });
        }
      } else {
        matrixed[i].push({
          property,
          valuable: true,
        });

        matrixed[i].push({
          property,
          valuable: false,
        });
      }
    }

    const calculatedVariants = matrixed.reduce(
      (a, b) => a.map((x) => b.map((y) => x.concat(y))).reduce((c, d) => c.concat(d), []),
      [[]] as MatrixItem[][]
    );

    const raw = Untracked(scope.variants)
      .get()
      .filter((v) => {
        if (v.properties.length !== matrix.length) {
          // TODO: clone values instead
          // have to reset all prices if a new property is added
          return false;
        }

        const exists = calculatedVariants.some((calculatedVariantProperties) =>
          v.properties.every((stateVariantProperty) =>
            calculatedVariantProperties.some((vp) => {
              if (vp.property.id !== stateVariantProperty.property) {
                return false;
              }

              if (vp.value?.id && (!stateVariantProperty.value || vp.value?.id !== stateVariantProperty.value)) {
                return false;
              }

              return true;
            })
          )
        );

        if (!exists) {
          // remove old variant combinations that exist in state
          return false;
        }

        return true;
      });

    // add any new matrix items that are missing from state
    for (const calculatedVariantProperties of calculatedVariants) {
      if (calculatedVariantProperties.length === 0) {
        // TODO: new service with select field + options is causing empty variants, why?
        continue;
      }

      const exists = raw.some((stateVariant) =>
        stateVariant.properties.every((stateVariantProperty) =>
          calculatedVariantProperties.some((vp) => {
            if (vp.property.id !== stateVariantProperty.property) {
              return false;
            }

            if (stateVariantProperty.value && vp.value?.id !== stateVariantProperty.value) {
              return false;
            }

            return true;
          })
        )
      );

      if (!exists) {
        raw.push({
          properties: calculatedVariantProperties.map((cv) => {
            return {
              value: cv.value?.id,
              property: cv.property.id,
              comparator: cv.value
                ? VariantValueComparator.Equals
                : cv.valuable
                ? VariantValueComparator.Exists
                : VariantValueComparator.NotExists,
            };
          }),
        });
      }
    }

    scope.variants.set(raw);
    // TODO: pretty smelly but this is some complex logic
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(matrix)]);

  return <></>;
}

export default function VendorServiceView() {
  const { serviceId } = useParams();

  const query = useQueryHook(VendorServiceDocument, { serviceId }, 'cache-and-network');

  useRegisterBreadcrumb({
    name: query.service.internalName,
    link: `/settings/services/${serviceId}`,
  });

  return <VendorServiceInternal data={query} />;
}
