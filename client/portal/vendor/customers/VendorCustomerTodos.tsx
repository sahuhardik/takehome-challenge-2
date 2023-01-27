import { SlidebarOpenLink } from 'client/global/components/button/SlidebarOpenButton';
import { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import VendorTodoActions from 'client/portal/vendor/components/todo/VendorTodoActions';
import VendorTodoCreate from 'client/portal/vendor/components/todo/VendorTodoCreate';
import * as React from 'react';
import { VendorCustomerAddTodoDocument, VendorCustomerTodosDocument } from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';

export default function VendorCustomerTodos({ buyerRelId }: { buyerRelId: string }) {
  const { buyer } = useQueryHook(VendorCustomerTodosDocument, { buyerRelId }, 'cache-and-network');
  const refresh = useQueryPromise(VendorCustomerTodosDocument, 'network-only');
  const add = useMutationPromise(VendorCustomerAddTodoDocument);

  return (
    <Table card>
      <TableHead>
        <TableRow>
          <TableHeadCell>Name</TableHeadCell>
          <TableHeadCell>Action</TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell colSpan={2}>
            <SlidebarOpenLink icon={<AddIcon />} text="Create Todo" style={LinkStyle.BOLD}>
              <VendorTodoCreate
                onSave={async (todo) => {
                  await add({ name: todo, buyerRelId });
                  await refresh({ buyerRelId });
                }}
              />
            </SlidebarOpenLink>
          </TableCell>
        </TableRow>
        {buyer.todos.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="w-full">{job.name}</TableCell>
            <TableCell className="flex">
              <VendorTodoActions
                vendorId={buyer.vendorId}
                job={job}
                onAction={async () => {
                  await refresh({ buyerRelId });
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
