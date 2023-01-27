import { State, useState } from '@hookstate/core';
import Selectable from 'client/global/components/tailwind/Selectable';
import { useQueryParams } from 'client/global/NavigationUtil';
import { OrderButton, OrderContent, OrderHeading } from 'client/portal/buyer/BuyerLayout';
import { BuyerCreateOrderState } from 'client/portal/buyer/order/BuyerCreateOrderState';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { BuyerCreateOrderVendorFragment, OrderCreateService, ShopAdditionalDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import Money from 'shared/utilities/Money';
import { v4 } from 'uuid';

export default function BuyerCreateOrderAdditional({
  state,
  updateOrder,
  vendor,
}: {
  state: State<BuyerCreateOrderState>;
  updateOrder: (service?: OrderCreateService) => Promise<void>;
  vendor: BuyerCreateOrderVendorFragment;
}) {
  const scoped = useState(state);
  const navigate = useNavigate();
  const { review } = useQueryParams();

  const { cartServices } = useQueryHook(ShopAdditionalDocument, { vendorId: vendor.id }, 'cache-and-network');

  const sorted = cartServices.sort((a, b) => {
    const aAdded = scoped.services.find((s) => s.serviceId.get() === a.id);
    const bAdded = scoped.services.find((s) => s.serviceId.get() === b.id);

    if (aAdded && !bAdded) {
      return 1;
    }

    if (!aAdded && bAdded) {
      return -1;
    }

    return a.marketing.name.localeCompare(b.marketing.name);
  });

  const grouped = new Map<string, typeof sorted>();

  for (const service of sorted) {
    const group = service.grouping || '';

    if (!grouped.has(group)) {
      grouped.set(group, []);
    }

    grouped.get(group).push(service);
  }

  return (
    <OrderContent>
      <OrderHeading caption="Anything else?" title="Additional Services" />

      <div className="pt-6 space-y">
        {Array.from(grouped.entries()).map(([group, services]) => (
          <div key={group}>
            {grouped.size > 1 && group && <div className="text-xl font-medium mb-2 theme-primary">{group}</div>}
            <div className="space-y-4">
              {services.map((c) => {
                let button;

                let price = (
                  <>
                    +<Money>{c.cost.min}</Money>
                  </>
                );

                if (c.cost.min !== c.cost.max) {
                  price = (
                    <>
                      from <Money>{c.cost.min}</Money>
                    </>
                  );
                }

                if (c.properties.length) {
                  button = (
                    <Button
                      style={ButtonStyle.SECONDARY}
                      onClick={() => navigate(`../configure/${c.id}${review ? '?review=true' : ''}`)}
                    >
                      Configure
                    </Button>
                  );
                } else {
                  button = (
                    <PromiseButton
                      snackbar={false}
                      style={ButtonStyle.SECONDARY}
                      onClick={async () => {
                        await updateOrder({
                          id: v4(),
                          serviceId: c.id,
                          fields: [],
                        });
                      }}
                    >
                      Add
                    </PromiseButton>
                  );
                }

                const title = (
                  <div>
                    {c.marketing.name}
                    <span className="text-gray-500 ml-2">{price}</span>
                  </div>
                );

                return (
                  <Selectable
                    key={c.id}
                    title={title}
                    button={<div className="mb-2 sm:mb-0 sm:w-28 sm:text-center">{button}</div>}
                  >
                    {c.marketing.slimDescription}
                  </Selectable>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {state.services.length === 0 && (
        <Message type={MessageType.ERROR} title="Cannot Continue" className="mt" round>
          Your cart is empty, please add one of the services above to continue.
        </Message>
      )}

      <OrderButton
        onButton={() => navigate('../review')}
        disabled={state.services.length === 0}
        button="Continue to Cart"
      />
    </OrderContent>
  );
}
