import { AlgoliaCustomerHit } from 'client/global/Algolia';
import NavigationButton from 'client/global/components/button/NavigationButton';
import SlidebarOpenButton from 'client/global/components/button/SlidebarOpenButton';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Center from 'client/global/components/tailwind/Center';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import { TableCell, TableRow } from 'client/global/components/tailwind/Table';
import { useVendorUrl } from 'client/global/hooks/useVendorUrl';
import SearchToolbar from 'client/global/layout/SearchToolbar';
import { useQueryParams } from 'client/global/NavigationUtil';
import { VendorCustomerAppointmentsNotify } from 'client/portal/vendor/customers/VendorCustomerAppointmentsNotify';
import * as React from 'react';
import { Hit } from 'react-instantsearch-core';
import { Highlight } from 'react-instantsearch-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import Config from 'shared/Config';
import { VendorSettingsProviderDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import TagIcon from 'shared/icons/TagIcon';

export default function VendorCustomersList() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const vendorUrl = useVendorUrl();
  const { excludeId } = useQueryParams();

  const { vendor } = useQueryHook(VendorSettingsProviderDocument, { vendorId }, 'cache-and-network');
  const hasDefaultRole = vendor.roles.some((r) => r.default);

  const head = (
    <TableRow>
      <TableCell>ID</TableCell>
      <TableCell>Name</TableCell>
      <TableCell>Email</TableCell>
      <TableCell>Phone</TableCell>
      <TableCell>Users</TableCell>
      <TableCell></TableCell>
    </TableRow>
  );

  const create = [
    <NavigationButton link="./create" key="create">
      Create Customer
    </NavigationButton>,
    <NavigationButton link="./import" key="import">
      Import
    </NavigationButton>,
    <SlidebarOpenButton key="notification" button="Notify appointments" style={ButtonStyle.SECONDARY}>
      <VendorCustomerAppointmentsNotify vendorId={vendorId} />
    </SlidebarOpenButton>,
  ];

  return (
    <Center>
      <div className="py">
        {hasDefaultRole || (
          <Message
            className="mb"
            type={MessageType.WARNING}
            actions={[
              {
                label: 'Roles',
                onClick: () => {
                  navigate(vendorUrl('/settings/roles'));
                },
              },
            ]}
          >
            Please create a default role in order to be able to add customers
          </Message>
        )}

        <SearchToolbar
          api={vendor.algolia}
          index={Config.SEARCH_INDEX_BUYER}
          head={head}
          actions={hasDefaultRole ? create : []}
          hit={excludeObjectId(Result, excludeId)}
          placeholder="search by customer name, email or phone"
        />
      </div>
    </Center>
  );
}

function Result({ hit }: { hit: Hit<AlgoliaCustomerHit> }) {
  const { vendorId } = useParams();
  const userMatch = hit._highlightResult.users || [];

  return (
    <TableRow hover>
      <TableCell>#{hit.objectID}</TableCell>
      <TableCell>
        <Link to={`/ui/vendor/${vendorId}/customers/${hit.objectID}`}>
          <Highlight attribute="name" hit={hit} />
        </Link>
        <div className="flex align-middle space-x-2 mt-1">
          {hit.groupTypeId ? (
            <Badge type={BadgeType.NEUTRAL} icon={<TagIcon />}>
              {hit.groupTypeName}
            </Badge>
          ) : null}
          {hit.parents?.length
            ? hit.parents.map((p) => (
                <Badge key={p.groupTypeId} type={BadgeType.PRIMARY}>
                  {p.name}
                </Badge>
              ))
            : null}
        </div>
      </TableCell>
      <TableCell>
        <Highlight attribute="email" hit={hit} />
      </TableCell>
      <TableCell>
        <Highlight attribute="phone" hit={hit} />
      </TableCell>
      <TableCell>
        {userMatch.length ? (
          <ul>
            {hit.users.map((user, index) => {
              const match = userMatch[index];

              if (match.email && match.email.matchLevel !== 'none') {
                return (
                  <li>
                    <Highlight attribute={`users[${index}].email`} hit={hit} />
                  </li>
                );
              }

              if (
                (match.first && match.first.matchLevel !== 'none') ||
                (match.last && match.last.matchLevel !== 'none')
              ) {
                return (
                  <li>
                    <Highlight attribute={`users[${index}].first`} hit={hit} />
                    &nbsp;
                    <Highlight attribute={`users[${index}].last`} hit={hit} />
                  </li>
                );
              }
            })}
          </ul>
        ) : null}
      </TableCell>
      <TableCell>
        <Link to={`/ui/buyer/${vendorId}/${hit.objectID}/orders`} style={LinkStyle.BOLD}>
          Impersonate
        </Link>
      </TableCell>
    </TableRow>
  );
}

function excludeObjectId(
  Component: React.FC<{ hit: Hit<AlgoliaCustomerHit> }>,
  objectId: string | string[] | undefined
) {
  const check = (id: string) =>
    Array.isArray(objectId) ? objectId.some((x) => x === id) : typeof objectId === 'string' ? objectId === id : false;
  return ({ hit }: { hit: Hit<AlgoliaCustomerHit> }) => (check(hit.objectID) ? <></> : <Component hit={hit} />);
}
