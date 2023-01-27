import { AlgoliaGroupHit } from 'client/global/Algolia';
import NavigationButton from 'client/global/components/button/NavigationButton';
import Center from 'client/global/components/tailwind/Center';
import { TableCell, TableRow } from 'client/global/components/tailwind/Table';
import SearchToolbar from 'client/global/layout/SearchToolbar';
import * as React from 'react';
import { Hit } from 'react-instantsearch-core';
import { Highlight } from 'react-instantsearch-dom';
import { useNavigate, useParams } from 'react-router-dom';
import Config from 'shared/Config';
import { VendorSettingsProviderDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export default function VendorCustomerGroupsList() {
  const { vendorId } = useParams();

  const { vendor } = useQueryHook(VendorSettingsProviderDocument, { vendorId }, 'cache-and-network');

  const head = (
    <TableRow>
      <TableCell>ID</TableCell>
      <TableCell>Name</TableCell>
      <TableCell>Email</TableCell>
      <TableCell>Type</TableCell>
      <TableCell>Group</TableCell>
    </TableRow>
  );

  const create = <NavigationButton link="./create">Create Customer Group</NavigationButton>;

  return (
    <Center>
      <div className="py">
        <SearchToolbar
          api={vendor.algolia}
          index={Config.SEARCH_INDEX_GROUP}
          head={head}
          actions={create}
          hit={Result}
          placeholder="search by customer group name or email"
        />
      </div>
    </Center>
  );
}

function Result({ hit }: { hit: Hit<AlgoliaGroupHit> }) {
  const navigate = useNavigate();

  return (
    <TableRow hover onClick={() => navigate(`./${hit.objectID}`)}>
      <TableCell>#{hit.objectID}</TableCell>
      <TableCell>
        <Highlight attribute="name" hit={hit} />
      </TableCell>
      <TableCell>
        <Highlight attribute="email" hit={hit} />
      </TableCell>
      <TableCell>
        <Highlight attribute="type.name" hit={hit} />
      </TableCell>
      <TableCell>
        <Highlight attribute="parent.name" hit={hit} />
      </TableCell>
    </TableRow>
  );
}
