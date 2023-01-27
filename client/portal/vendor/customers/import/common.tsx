import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { none, State, useState } from '@hookstate/core';
import { captureException } from '@sentry/react';
import ProgressBar from 'client/global/components/tailwind/ProgressBar';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { VendorCustomersImportQuery } from 'shared/generated';
import { useQueryPromise } from 'shared/Graph';

export type ImportCustomer = VendorCustomersImportQuery['vendor']['imports'][0];

export function MutationProgress<D, R extends keyof ImportCustomer['metadata']>({
  query,
  customers,
  resp,
  resolved,
  children,
}: {
  query: TypedDocumentNode<D, { importId: string }>;
  customers: State<ImportCustomer>[];
  resp: keyof D;
  resolved: ImportCustomer['metadata'][R] extends boolean ? R : never;
  children: string;
}) {
  const { current } = useRef({ processed: 0, total: customers.length, mounted: true });
  const error = useState(false);
  const mutate = useQueryPromise(query);

  useEffect(() => {
    current.mounted = true;

    if (!error.get() && customers.length) {
      mutate({ importId: customers[0].id.get() })
        .then((result) => {
          current.processed += 1;

          if (result[resp]) {
            customers[0].set(none);
          } else {
            (customers[0].metadata[resolved] as State<boolean>).set(true);
          }
        })
        .catch((ex) => {
          captureException(ex);

          if (current.mounted) {
            error.set(true);
          }
        });
    }

    return () => {
      current.mounted = false;
    };
  });

  return (
    <ProgressBar current={current.processed} total={current.total} error={error.get()}>
      {error.get() ? <div>An error has occurred, we cannot continue.</div> : <div>{children}</div>}
    </ProgressBar>
  );
}
