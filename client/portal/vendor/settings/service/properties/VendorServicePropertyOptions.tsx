import { none, State, useState } from '@hookstate/core';
import SlidebarOpenButton, { SlidebarCloseButton } from 'client/global/components/button/SlidebarOpenButton';
import { Tab } from 'client/global/components/tailwind/Tabs';
import { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import VendorServicePropertyOption from 'client/portal/vendor/settings/service/properties/VendorServicePropertyOption';
import VendorServicePropertyOptionForm from 'client/portal/vendor/settings/service/properties/VendorServicePropertyOptionForm';
import * as React from 'react';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { PerformablePropertyValueWrite, PerformablePropertyWrite } from 'shared/generated';
import { Validation } from 'shared/utilities/Validation';
import { v4 } from 'uuid';

export default function VendorServicePropertyOptions(property: State<PerformablePropertyWrite>): Tab {
  return {
    useElement() {
      const scopedState = useState(property);

      const move = (from: number, to: number) => {
        property.values.merge((values) => ({
          [from]: {
            ...values[to],
            order: values[from].order,
          },
          [to]: {
            ...values[from],
            order: values[to].order,
          },
        }));
      };

      return (
        <div className="space-y-2">
          {scopedState.values.map((v, index) => (
            <VendorServicePropertyOption
              move={move}
              title="Edit Option"
              value={v}
              index={index}
              key={index}
              property={property}
            />
          ))}
        </div>
      );
    },
    name: 'Options',
    key: 'poptions',
    error: () => !Validation(useState(property.values)).valid(), // eslint-disable-line react-hooks/rules-of-hooks
    useActions: () => {
      const state = useState(property); // eslint-disable-line react-hooks/rules-of-hooks

      return [
        <SlidebarOpenButton
          key="addoption"
          button="Add Option"
          style={ButtonStyle.SECONDARY}
          onClose={(cancel) => {
            if (cancel) {
              state.values[state.values.length - 1].set(none);
            }
          }}
          onClick={() => {
            let order = -1;

            for (const value of state.values.get()) {
              if (value.order > order) {
                order = value.order;
              }
            }

            state.values.merge([{ id: v4(), order: order + 1, conditions: [] } as PerformablePropertyValueWrite]);
          }}
        >
          <SlidebarHeader title="Add Option" />
          <SlidebarContent>
            {!!state.values[state.values.length - 1] && (
              <VendorServicePropertyOptionForm state={state.values[state.values.length - 1]} property={property} />
            )}
            <SlidebarCloseButton>Finish</SlidebarCloseButton>
          </SlidebarContent>
        </SlidebarOpenButton>,
      ];
    },
  };
}
