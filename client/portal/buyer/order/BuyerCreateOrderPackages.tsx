import { State, useState } from '@hookstate/core';
import Selectable from 'client/global/components/tailwind/Selectable';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { useQueryParams } from 'client/global/NavigationUtil';
import { OrderButton, OrderContent, OrderHeading } from 'client/portal/buyer/BuyerLayout';
import {
  BuyerCreateOrderState,
  useBuyerOrderCreateStateContext,
} from 'client/portal/buyer/order/BuyerCreateOrderState';
import { RuleContextAccessor } from 'common/rules/Condition';
import { buildConditionTree, validateConditionTree } from 'common/rules/Rule';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { BuyerCreateOrderPackagesDocument, OrderCreateService } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import Money from 'shared/utilities/Money';
import { ValidationAttach } from 'shared/utilities/Validation';

export default function BuyerCreateOrderPackages({
  state,
  slim,
  updateOrder,
}: {
  state: State<BuyerCreateOrderState>;
  slim: boolean;
  updateOrder: (service?: OrderCreateService, pkg?: { packageId: string; performableIds: string[] }) => Promise<void>;
}) {
  const buyerRelId = useGetCurrentBuyerRelId();
  const query = useQueryHook(BuyerCreateOrderPackagesDocument, { buyerRelId });
  const context = useBuyerOrderCreateStateContext(state);
  const navigate = useNavigate();
  const { wizardId } = useQueryParams();

  const packages = query.buyer.vendor.packages.filter((pkg) => {
    const tree = buildConditionTree(pkg.conditions);

    // TODO: why does typescript complain about tree?
    return validateConditionTree(new RuleContextAccessor(context), tree as never);
  });

  const local = useState({
    packageId: null as string,
    performableIds: [] as string[],
  });

  const pkgToGroups = (pkg: typeof packages[0]) => {
    const groups = new Map<number, typeof pkg.performables>();

    for (const perf of pkg.performables) {
      if (!groups.has(perf.group)) {
        groups.set(perf.group, []);
      }

      groups.get(perf.group).push(perf);
    }

    return groups;
  };

  ValidationAttach(local, (validator) => {
    validator.validate(({ packageId, performableIds }) => {
      if (!packageId) {
        return true;
      }

      const groups = pkgToGroups(packages.find((p) => p.id === packageId));

      for (const group of groups.values()) {
        if (group.length > 1 && !performableIds.some((id) => group.some((g) => g.performable.id === id))) {
          return false;
        }
      }

      return true;
    });
  });

  return (
    <OrderContent>
      <OrderHeading caption="Interested in one of our bundles?" title="Package Options" />

      <div className="space-y mt">
        <Selectable
          title="No Package"
          checked={!local.packageId.get()}
          onClick={() => local.set({ packageId: null, performableIds: [] })}
        >
          By selecting no package, you are able to customize your order however you may miss out on the discounts
          provided by bundling.
        </Selectable>

        {packages.map((pkg) => {
          const groups = new Map<number, typeof pkg.performables>();

          for (const perf of pkg.performables) {
            if (!groups.has(perf.group)) {
              groups.set(perf.group, []);
            }

            groups.get(perf.group).push(perf);
          }

          let revenue = 0;

          for (const perf of pkg.performables) {
            if (perf.revenue) {
              revenue += parseFloat(perf.revenue);
            }
          }

          if (revenue == 0 && pkg.revenue) {
            revenue = parseFloat(pkg.revenue);
          }

          const title = pkg.revenue ? (
            <div className="flex items-center justify-between">
              <div className="flex-1">{pkg.name}</div>
              <span className="text-gray-500 text-sm font-semibold">
                <Money>{revenue}</Money>
              </span>
            </div>
          ) : (
            pkg.name
          );

          return (
            <Selectable
              title={title}
              key={pkg.id}
              checked={local.packageId.get() === pkg.id}
              onClick={() =>
                local.set((data) => ({
                  packageId: data.packageId === pkg.id ? null : pkg.id,
                  performableIds: [],
                }))
              }
            >
              <div className="space-y mt-2">
                {Array.from(groups.entries()).map(([group, perfs]) => {
                  const desc = (perf: typeof perfs[0]) =>
                    perf.fields
                      .filter((f) => f.shouldDisplay)
                      .map((field) => (
                        <div key={field.fieldId}>
                          <strong className="text-quiet">{field.title}</strong>: {field.display}
                        </div>
                      ));

                  if (perfs.length === 1) {
                    return (
                      <Selectable
                        key={perfs[0].id}
                        title={perfs[0].name || perfs[0].performable.marketing.name || perfs[0].performable.name}
                      >
                        {desc(perfs[0])}
                      </Selectable>
                    );
                  }

                  const ids = local.performableIds.get();
                  const selected = ids.find((id) => perfs.some((p) => p.performable.id === id));

                  return (
                    <div key={group} className="space-y-2">
                      <strong>Select one of the following:</strong>
                      {perfs.map((perf) => {
                        const checked = perf.performable.id === selected;
                        const disabled = selected && selected !== perf.performable.id;

                        return (
                          <Selectable
                            key={perf.id}
                            title={perf.name || perf.performable.marketing.name || perf.performable.name}
                            checked={checked}
                            onClick={() => {
                              local.set({
                                packageId: pkg.id,
                                performableIds: checked
                                  ? ids.filter((id) => id !== perf.performable.id)
                                  : disabled
                                  ? [...ids.filter((id) => id !== selected), perf.performable.id]
                                  : [...ids, perf.performable.id],
                              });
                            }}
                          >
                            {desc(perf)}
                          </Selectable>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </Selectable>
          );
        })}
      </div>

      <OrderButton
        onButton={async () => {
          if (local.packageId.get()) {
            await updateOrder(undefined, local.get());

            navigate('../additional');

            return;
          }

          if (slim || !wizardId) {
            navigate('../slim');
          } else {
            navigate(`../wizard/${wizardId}`);
          }
        }}
        disabled={local}
        button="Continue"
      />
    </OrderContent>
  );
}
