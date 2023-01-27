import { State } from '@hookstate/core';
import Selectable from 'client/global/components/tailwind/Selectable';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { OrderContent, OrderHeading, OrderParagraph } from 'client/portal/buyer/BuyerLayout';
import { BuyerCreateOrderState } from 'client/portal/buyer/order/BuyerCreateOrderState';
import * as React from 'react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PromiseButton from 'shared/components/button/PromiseButton';
import { BuyerCreateOrderFieldsDocument, BuyerCreateOrderVendorFragment } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export default function BuyerCreateOrderWizards({
  state,
  vendor,
}: {
  state: State<BuyerCreateOrderState>;
  vendor: BuyerCreateOrderVendorFragment;
}) {
  const buyerRelId = useGetCurrentBuyerRelId();
  const { orderId } = useParams();
  const query = useQueryHook(BuyerCreateOrderFieldsDocument, { buyerRelId, orderId });
  const navigate = useNavigate();

  useEffect(() => {
    if (!vendor.wizards.length) {
      navigate('../slim', { replace: true });
    } else if (vendor.wizards.length === 1) {
      navigate(`../fields?wizardId=${vendor.wizards[0].id}`, { replace: true });
    }
  }, [vendor, query, navigate]);

  return (
    <OrderContent>
      <OrderHeading caption="What type of services are you interested in?" title="Order Type" />

      <OrderParagraph>Please select one of the following to continue to service selection.</OrderParagraph>

      <div className="space-y mt">
        {vendor.wizards.map((w) => (
          <Selectable
            key={w.id}
            title={w.name}
            button={
              <PromiseButton
                snackbar={false}
                onClick={async () => {
                  state.fields.set((existing) => {
                    for (const field of w.fields) {
                      const efield = existing.find((e) => e.fieldId === field.fieldId);

                      if (efield) {
                        Object.assign(efield, field);
                      } else {
                        existing.push(field);
                      }
                    }

                    return existing;
                  });

                  navigate(`../fields?wizardId=${w.id}`);
                }}
              >
                Continue
              </PromiseButton>
            }
          >
            <></>
          </Selectable>
        ))}
      </div>
    </OrderContent>
  );
}
