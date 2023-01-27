import { ButtonGroup } from 'client/global/components/button/ButtonGroup';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import * as React from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { VendorJobAcceptDocument, VendorJobDetailQuery, VendorJobRejectDocument } from 'shared/generated';
import { useMutationPromise } from 'shared/Graph';

export function VendorOrderJobChanges({ job }: { job: VendorJobDetailQuery['orderJob'] }) {
  const accept = useMutationPromise(VendorJobAcceptDocument);
  const reject = useMutationPromise(VendorJobRejectDocument);

  return (
    <>
      <Table round border>
        <TableHead>
          <TableRow>
            <TableHeadCell>Before</TableHeadCell>
            <TableHeadCell>After</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {job.changes.map((change) => {
            const existing = job.fields.find((p) => p.fieldId === change.fieldId);

            return (
              <TableRow key={change.fieldId}>
                <TableCell>{existing?.display}</TableCell>
                <TableCell>{change?.display}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ButtonGroup className="mt">
        <PromiseButton
          onClick={async () => {
            await accept({ jobId: job.id });
          }}
        >
          Accept
        </PromiseButton>
        <PromiseButton
          onClick={async () => {
            await reject({ jobId: job.id });
          }}
          style={ButtonStyle.DANGER}
        >
          Reject
        </PromiseButton>
      </ButtonGroup>
    </>
  );
}
