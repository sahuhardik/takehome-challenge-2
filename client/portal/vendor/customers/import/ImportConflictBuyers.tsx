import { none, State, useState } from '@hookstate/core';
import Phone from 'client/global/components/format/Phone';
import Card from 'client/global/components/tailwind/Card';
import { DescriptionListItem } from 'client/global/components/tailwind/DescriptionList';
import ProgressBar from 'client/global/components/tailwind/ProgressBar';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import { ImportCustomer, MutationProgress } from 'client/portal/vendor/customers/import/common';
import * as React from 'react';
import { useRef } from 'react';
import ConfirmationButton from 'shared/components/button/ConfirmationButton';
import PromiseButton from 'shared/components/button/PromiseButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  VendorCustomersImportApproveBuyerDocument,
  VendorCustomersImportBuyerDocument,
  VendorCustomersImportIgnoreBuyerDocument,
  VendorCustomersImportMergeBuyerDocument,
} from 'shared/generated';
import { useQueryPromise, useQuerySuspense } from 'shared/Graph';
import formatPhone from 'shared/utilities/FormatPhone';

function Match({ buyerRelId, onMerge }: { buyerRelId: string; onMerge: () => Promise<void> }) {
  const query = useQuerySuspense(VendorCustomersImportBuyerDocument, { buyerRelId }, 'network-only');

  return (
    <div className="bg-gray-50 grid grid-cols-3 gap-4 p round hover:bg-gray-100">
      <div className="text-sm col-span-2 text-black">
        <strong className="font-semibold">{query.buyer.member.company}</strong>
        <div>{query.buyer.member.email}</div>
        <div>
          <Phone number={query.buyer.member.phone} />
        </div>
      </div>
      <div className="text-right">
        <PromiseButton onClick={onMerge}>Merge</PromiseButton>
      </div>
    </div>
  );
}

export default function ImportConflictBuyers({ state }: { state: State<ImportCustomer>[] }) {
  const ignore = useQueryPromise(VendorCustomersImportIgnoreBuyerDocument);
  const merge = useQueryPromise(VendorCustomersImportMergeBuyerDocument);
  const create = useQueryPromise(VendorCustomersImportApproveBuyerDocument);

  const recordState = state[0];
  const record = recordState.get();
  const { current } = useRef({ resolved: 0, total: state.length });
  const ignoreAll = useState(false);

  const Item = ({
    meta,
    title,
    format = (val: string) => val,
  }: {
    format?: (value: string) => string;
    title: string;
    meta: keyof typeof record.metadata;
  }) => {
    let value = record.metadata[meta];

    if (typeof value === 'string' && format) {
      value = format(value);
    }

    return (
      <DescriptionListItem name={title}>{value || <em className="text-quiet">Not Provided</em>}</DescriptionListItem>
    );
  };

  let content = (
    <>
      <ProgressBar current={current.resolved} total={current.total}>
        Some of the imported records potentially match multiple customers already in the database or we found a similar
        match but not confident it is the same.
      </ProgressBar>

      <div className="flex flex-row mt space-x">
        <div className="border border-gray-300 round p flex-1 space-y-4">
          <div className="text-xl">Imported Record</div>

          <div>
            <Item title="Company" meta="company" />
            <Item title="Company Email" meta="companyEmail" />
            <Item title="Company Phone" meta="companyPhone" format={formatPhone} />
            <Item title="User Email" meta="userEmail" />
            <Item title="User First" meta="first" />
            <Item title="User Last" meta="last" />
            <Item title="User Phone" meta="userPhone" format={formatPhone} />
          </div>
        </div>

        <div className="border border-gray-300 round p flex-1 space-y-4">
          <div className="space-y-2">
            <div className="text-lg font-medium">Create New Customer</div>
            <p className="text-content text-sm">
              We will leave the potential matches alone and create a new customer record with the imported information.
            </p>
            <ConfirmationButton
              title="Are you sure?"
              confirmText="Create Customer"
              description="You will be responsible for manually going through your customer list and cleaning up duplicates."
              onClick={async () => {
                const resp = await create({ importId: record.id });

                current.resolved += 1;

                if (resp.approveImportCustomerBuyer) {
                  recordState.set(none);
                } else {
                  recordState.metadata.resolvedBuyer.set(true);
                }
              }}
            >
              Create
            </ConfirmationButton>
          </div>
          <div className="space-y-2">
            <div className="text-lg font-medium">Ignore Record</div>
            <p className="text-content text-sm">
              We will not alter your customer database and simply remove the imported record from processing.
            </p>
            <PromiseButton
              onClick={async () => {
                const resp = await ignore({ importId: record.id });

                current.resolved += 1;

                if (resp.ignoreImportCustomerBuyer) {
                  recordState.set(none);
                } else {
                  recordState.metadata.resolvedBuyer.set(true);
                }
              }}
            >
              Ignore
            </PromiseButton>
            <ConfirmationButton
              style={ButtonStyle.DANGER}
              snackbar={false}
              title="Do you want to ignore all conflicting records?"
              description="We will leave your existing customer database unmodified and you will have to re-import to start over."
              confirmText="Yes, Ignore Conflicts"
              onClick={() => ignoreAll.set(true)}
            >
              Ignore All
            </ConfirmationButton>
          </div>

          <div className="space-y-2">
            <div className="text-lg font-medium">Merge Record</div>
            <p className="text-content text-sm">
              We will update any missing fields on the existing customer record, with information on the left.
            </p>
            <SpinnerLoader>
              {record.metadata.vendorBuyerRelIds.map((buyerRelId) => (
                <Match
                  buyerRelId={buyerRelId}
                  key={`${record.id}-${buyerRelId}`}
                  onMerge={async () => {
                    const resp = await merge({ importId: record.id, buyerRelId });

                    current.resolved += 1;

                    if (resp.mergeImportCustomerMember) {
                      recordState.set(none);
                    } else {
                      recordState.metadata.resolvedBuyer.set(true);
                    }
                  }}
                />
              ))}
            </SpinnerLoader>
          </div>
        </div>
      </div>
    </>
  );

  if (ignoreAll.get()) {
    content = (
      <MutationProgress
        customers={state}
        query={VendorCustomersImportIgnoreBuyerDocument}
        resolved="resolvedBuyer"
        resp="ignoreImportCustomerBuyer"
      >
        Ignoring conflicts, do not leave this screen...
      </MutationProgress>
    );
  }

  return <Card title="Imported Customer Conflicts">{content}</Card>;
}
