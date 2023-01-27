import { useState } from '@hookstate/core';
import Sortable from 'client/global/components/Sortable';
import Center from 'client/global/components/tailwind/Center';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { ProvidersOrderWrite, VendorProvidersDocument, VendorUpdateProvidersDocument } from 'shared/generated';
import { useMutationPromise, useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import EditIcon from 'shared/icons/EditIcon';
import MoveIcon from 'shared/icons/MoveIcon';
import { useUser } from 'shared/UserState';

export default function VendorSettingProviderList() {
  const { vendorId } = useParams();

  const user = useUser();

  const query = useQueryHook(VendorProvidersDocument, { vendorId }, 'cache-and-network');
  const queryRefresh = useQueryPromise(VendorProvidersDocument);

  // Making list Sortable component friendly
  const providersInOrder = query.vendor.providers
    .sort((a, b) => (a.sort > b.sort ? 1 : -1))
    .map((provider, index) => ({ ...provider, order: index + 1 }));
  const providers = useState(providersInOrder);

  const update = useMutationPromise(VendorUpdateProvidersDocument);
  const updateProviders = async () => {
    const sortedProviders = providers.map<ProvidersOrderWrite>(({ member, order }) => ({
      memberId: member.id.get(),
      order: order.get(),
    }));

    await update({ providers: sortedProviders });

    // TODO: update VendorUpdateProviders to return list of providers so that cache refresh happens automatically
    await queryRefresh({ vendorId });
  };

  return (
    <Center small>
      <Table card>
        <TableHead>
          <TableRow>
            <TableHeadCell>Provider Name</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <Link icon={<AddIcon />} to="./create" style={LinkStyle.BOLD}>
                Create Provider
              </Link>
            </TableCell>
          </TableRow>
          {providers.map((p, index) => (
            <TableRow key={index}>
              <TableCell>
                <Sortable index={index} state={providers} key={index} onDrop={updateProviders}>
                  <div className="flex">
                    <div className="w-4 h-4 mr-2 cursor-move">
                      <MoveIcon />
                    </div>
                    <Link to={`./${p.id.get()}`} icon={<EditIcon />} className="flex-1 relative">
                      {p.member.company.get()}
                    </Link>
                    {user.superuser && (
                      <Link to={`/ui/provider/${p.member.id.get()}`} style={LinkStyle.BOLD}>
                        Impersonate
                      </Link>
                    )}
                  </div>
                </Sortable>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Center>
  );
}
