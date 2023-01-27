import { State } from '@hookstate/core';
import OrderFieldsForm from 'client/global/components/fields/OrderFieldsForm';
import { useQueryParams } from 'client/global/NavigationUtil';
import { OrderButton, OrderContent, OrderHeading, OrderParagraph, OrderSection } from 'client/portal/buyer/BuyerLayout';
import {
  BuyerCreateOrderState,
  useBuyerOrderCreateStateContext,
} from 'client/portal/buyer/order/BuyerCreateOrderState';
import { RuleContextAccessor } from 'common/rules/Condition';
import { buildConditionTree, validateConditionTree } from 'common/rules/Rule';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { BuyerCreateOrderVendorFragment, OrderCreateService } from 'shared/generated';

export default function BuyerCreateOrderFields({
  state,
  vendor,
  updateOrder,
  slim,
}: {
  state: State<BuyerCreateOrderState>;
  vendor: BuyerCreateOrderVendorFragment;
  slim: boolean;
  updateOrder: (service?: OrderCreateService) => Promise<void>;
}) {
  const navigate = useNavigate();
  const { review, wizardId } = useQueryParams();
  const context = useBuyerOrderCreateStateContext(state);

  const packages = vendor.packages.some((pkg) => {
    const tree = buildConditionTree(pkg.conditions);

    // TODO: why does typescript complain about tree?
    return validateConditionTree(new RuleContextAccessor(context), tree as never);
  });

  return (
    <OrderContent>
      <OrderHeading caption="Almost there..." title="Additional Information" />

      <OrderParagraph>
        To better serve you, please provide additional information about the listing so that we can recommend the
        appropriate services.
      </OrderParagraph>

      <OrderFieldsForm
        state={state.fields}
        vendorId={vendor.id}
        context={new RuleContextAccessor(context)}
        wrapper={OrderSection}
        onlyOnCreate
        review={!!review}
      />

      <OrderButton
        disabled={state.fields}
        onButton={async () => {
          if (review) {
            await updateOrder();

            navigate('../review');

            return;
          }

          if (packages) {
            navigate(`../packages?wizardId=${wizardId}`);

            return;
          }

          if (slim) {
            if (state.sawFields.get()) {
              // prevent invalid service state due to coming back and changing fields
              state.merge({
                services: [],
                preselected: [],
              });
            } else {
              state.sawFields.set(true);
            }

            navigate('../slim');

            return;
          } else {
            state.sawFields.set(true);
          }

          navigate(`../wizard/${wizardId}/`);
        }}
        button="Continue"
      />
    </OrderContent>
  );
}
