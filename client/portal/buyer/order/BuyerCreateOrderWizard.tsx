import { State } from '@hookstate/core';
import BuyerCreateOrderAddOn from 'client/portal/buyer/order/BuyerCreateOrderAddOn';
import {
  BuyerCreateOrderState,
  useBuyerOrderCreateStateContext,
} from 'client/portal/buyer/order/BuyerCreateOrderState';
import { BuyerOrderService } from 'client/portal/buyer/order/BuyerOrderService';
import * as React from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { dynamicFieldValueGetState } from 'shared/components/fields/DynamicFieldInput';
import { BuyerCreateOrderVendorFragment, BuyerCreateOrderWizardFragment, ConditionComparator } from 'shared/generated';

function shouldShowPage(
  state: State<BuyerCreateOrderState>,
  vendor: BuyerCreateOrderVendorFragment,
  pages: BuyerCreateOrderWizardFragment['pages'],
  index: number
) {
  const toPage = pages[index];

  for (const condition of toPage.conditions) {
    const exists = state.services.some((service) => {
      if (service.serviceId.get() !== condition.performableId) {
        return false;
      }

      const performable = vendor.performables.find((p) => p.id === condition.performableId);

      if (
        condition.propertyId &&
        !service.fields.some((p) => {
          if (p.fieldId.get() !== condition.propertyId) {
            return false;
          }

          const field = performable.properties.find((f) => f.id === condition.propertyId);

          return !!dynamicFieldValueGetState(field.fieldType, p);
        })
      ) {
        return false;
      }

      return true;
    });

    if (condition.comparator === ConditionComparator.Exists && !exists) {
      return false;
    }

    if (condition.comparator === ConditionComparator.NotExists && exists) {
      return false;
    }
  }

  if (toPage.propertyId) {
    const service = state.services.find((s) => s.serviceId.get() === toPage.performableId);

    if (!service) {
      return false;
    }

    // do not show upsell if already selected
    if (
      service.fields.find((f) => f.fieldId.get() === toPage.propertyId && (f.booleanValue.get() || f.textValue.get()))
    ) {
      return false;
    }
  }

  return true;
}

export default function BuyerCreateOrderWizard({
  state,
  createOrder,
  vendor,
}: {
  createOrder: () => Promise<void>;
  state: State<BuyerCreateOrderState>;
  vendor: BuyerCreateOrderVendorFragment;
}) {
  const context = useBuyerOrderCreateStateContext(state);
  const navigate = useNavigate();
  const { wizardId } = useParams();
  const wizard = vendor.wizards.find((w) => w.id === wizardId);

  const routes = wizard.pages.map((page, index) => {
    const path = `/${index + 1}`;

    const onContinue = async (added) => {
      if (added) {
        state.services.merge([added]);
      }

      let toIndex = index + 1;

      while (toIndex <= wizard.pages.length - 1) {
        const show = shouldShowPage(state, vendor, wizard.pages, toIndex);

        if (show) {
          navigate(`./${toIndex + 1}`);

          return;
        }

        toIndex += 1;
      }

      await createOrder();

      navigate('../additional');
    };

    if (page.propertyId) {
      return (
        <Route
          key={path}
          path={path}
          element={
            <BuyerCreateOrderAddOn
              context={context}
              onContinue={() => onContinue(false)}
              key={page.id}
              page={page}
              state={state}
            />
          }
        />
      );
    }

    if (page.performableId) {
      return (
        <Route
          key={path}
          path={path}
          element={
            <BuyerOrderService context={context} onContinue={onContinue} key={page.id} serviceId={page.performableId} />
          }
        />
      );
    }

    throw new Error('Invalid page.');
  });

  let redirect = <Navigate to="../additional" replace />;
  let firstIndex = 0;

  while (firstIndex <= wizard.pages.length - 1) {
    const show = shouldShowPage(state, vendor, wizard.pages, firstIndex);

    if (show) {
      redirect = <Navigate to={`./${firstIndex + 1}`} replace />;

      break;
    }

    firstIndex += 1;
  }

  return (
    <Routes>
      {routes}
      <Route path="*" element={redirect} />
    </Routes>
  );
}
