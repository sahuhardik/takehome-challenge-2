import Requested from 'client/global/components/Requested';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import DescriptionColumns, { DescriptionColumnsItem } from 'client/global/components/tailwind/DescriptionColumns';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import { useVendorUrl } from 'client/global/hooks/useVendorUrl';
import VendorCustomerEditSlidebar from 'client/portal/vendor/customers/VendorCustomerEditSlidebar';
import dayjs from 'dayjs';
import * as React from 'react';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { VendorOrderDetailsComponentDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import EditIcon from 'shared/icons/EditIcon';
import EmailIcon from 'shared/icons/EmailIcon';
import PhoneIcon from 'shared/icons/PhoneIcon';
import formatPhone from 'shared/utilities/FormatPhone';

export default function VendorOrderDetails({
  orderId,
  address = false,
  onCustomersEdit,
  onRequestedEdit,
  onMetadataEdit,
  onAddressEdit,
}: {
  orderId: string;
  address?: boolean;
  onCustomersEdit?: () => void;
  onMetadataEdit?: () => void;
  onRequestedEdit?: () => void;
  onAddressEdit?: () => void;
}) {
  // have to no-cache to prevent rendering when showin a popup
  const query = useQueryHook(VendorOrderDetailsComponentDocument, { orderId }, 'no-cache');
  const url = useVendorUrl();

  const email = query.order.buyer.member.users.some((u) => !!u.user.email);
  const text = query.order.buyer.member.users.some((u) => !!u.user.phone);

  const alert =
    !email && !text ? (
      <Message type={MessageType.WARNING}>This customer is not setup to receive notifications (missing users).</Message>
    ) : (
      !text && (
        <Message type={MessageType.WARNING}>
          This customer is not setup to receive <strong>text</strong> notifications (no user with a phone number).
        </Message>
      )
    );

  return (
    <>
      {alert}
      {address && (
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {onAddressEdit ? (
                  <Link onClick={onAddressEdit} icon={<EditIcon />}>
                    Address
                  </Link>
                ) : (
                  'Address'
                )}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {query.order.address.addressFirst}
                <br />
                {query.order.address.addressSecond}
              </dd>
            </div>
          </dl>
        </div>
      )}
      <div className={`${!address ? '' : 'border-t border-gray-200'} px-4 py-5 sm:p-0`}>
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              {onCustomersEdit ? (
                <Link onClick={onCustomersEdit} icon={<EditIcon />}>
                  Customers
                </Link>
              ) : (
                'Customers'
              )}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 divide-y divide-content">
              <div key={query.order.buyer.id} className="flex justify-between mb-2">
                <Link to={url(`/customers/${query.order.buyer.id}`)} style={LinkStyle.BOLD}>
                  {query.order.buyer.member.company}
                </Link>

                {onCustomersEdit && <VendorCustomerEditSlidebar buyerRelId={query.order.buyer.id} />}
              </div>
              {query.order.buyer.buyerFields.length > 0 && (
                <div className="flex flex-col pt-2 space-y-1">
                  {query.order.buyer.buyerFields.map((p) => (
                    <div className="flex justify-between" key={p.fieldId}>
                      <div className="text-sm font-medium text-gray-500">{p.title}</div>
                      <div className="text-sm text-gray-900">{p.display}</div>
                    </div>
                  ))}
                </div>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {query.order.buyer.member.users.length && (
        <div className={`border-t border-gray-200 px-4 py-5 sm:p-0`}>
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Contacts</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {query.order.buyer.member.users.map((u, i) => (
                  <div key={u.id} className={`${i > 0 ? 'mt-3' : ''}`}>
                    <div className="flex flex-row justify-between items-center">
                      <div className="font-semibold flex-shrink">{u.user.name || 'Unnamed'}</div>
                      <div className="text-xs uppercase text-gray-400 pl-2">{u.roles[0]?.name || 'CC'}</div>
                    </div>
                    <div className="flex flex-row items-center">
                      <div className="w-4 h-4 text-gray-500 mr-2">
                        <PhoneIcon />
                      </div>
                      <div className="flex-shrink">{u?.user ? formatPhone(u.user.phone) : 'No phone number'}</div>
                    </div>

                    <div className="flex flex-row items-center">
                      <div className="w-4 h-4 text-gray-500 mr-2">
                        <EmailIcon />
                      </div>
                      <div className="flex-shrink">{u.user?.email}</div>
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  {query.order.contacts?.map((u, i) => (
                    <div key={u.phone} className={`${i > 0 ? 'mt-3' : ''}`}>
                      <div className="flex flex-row justify-between items-center">
                        <div className="font-semibold flex-shrink">{`${u.first} ${u.last}`}</div>
                        <div className="text-xs uppercase text-gray-400 pl-2">{'CC'}</div>
                      </div>
                      <div className="flex flex-row items-center">
                        <div className="w-4 h-4 text-gray-500 mr-2">
                          <PhoneIcon />
                        </div>
                        <div className="flex-shrink">{formatPhone(u.phone)}</div>
                      </div>

                      <div className="flex flex-row items-center">
                        <div className="w-4 h-4 text-gray-500 mr-2">
                          <EmailIcon />
                        </div>
                        <div className="flex-shrink">{u.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              {onRequestedEdit ? (
                <Link onClick={onRequestedEdit} icon={<EditIcon />}>
                  Requested
                </Link>
              ) : (
                'Requested'
              )}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 space-y-2">
              {query.order.requested.length > 0 ? (
                <ul>
                  {query.order.requested.map((r) => (
                    <li className={query.order.requested.length > 1 ? 'list-disc' : ''} key={`${r.start}${r.end}`}>
                      <Requested
                        start={new Date(r.start)}
                        end={new Date(r.end)}
                        title={query.order.requested.length === 1}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <em>No specific date/time has been requested.</em>
              )}
            </dd>
          </div>
        </dl>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Invoice</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 space-y-2 flex flex-col">
              <Link style={LinkStyle.BOLD} to={query.order.invoice.url}>
                View Invoice (#{query.order.id})
              </Link>
            </dd>
          </div>
        </dl>
      </div>
      {!!query.order.micrositeType && (
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Microsite</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 space-y-2 flex flex-col">
                <div className="flex flex-row space-x">
                  <div className="font-semibold flex-shrink">Status</div>
                  <Badge type={BadgeType.INFO}>
                    {query.order.micrositeStatus ? String(query.order.micrositeStatus).toLowerCase() : 'not synced'}
                  </Badge>
                </div>
                {query.order.micrositePublicUrl && (
                  <div className="flex flex-col">
                    <a
                      className="font-semibold text-theme-primary hover:darken"
                      href={query.order.micrositePublicUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Public URL
                    </a>
                    <p className="text-xs text-gray-400 truncate overflow-ellipsis">{query.order.micrositePublicUrl}</p>
                  </div>
                )}
                {query.order.micrositePreviewUrl && (
                  <div className="flex flex-col">
                    <a
                      className="font-semibold text-theme-primary hover:darken"
                      href={query.order.micrositePreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview URL
                    </a>
                    <p className="text-xs text-gray-400 truncate overflow-ellipsis">
                      {query.order.micrositePreviewUrl}
                    </p>
                  </div>
                )}
                {query.order.micrositeAuthenticatedUrl && (
                  <div className="flex flex-col">
                    <div className="font-semibold flex-shrink">
                      <a
                        className="font-semibold text-theme-primary hover:darken"
                        href={query.order.micrositeAuthenticatedUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Authenticated URL
                      </a>
                    </div>
                    <p className="text-xs text-gray-400 truncate overflow-ellipsis">
                      {query.order.micrositeAuthenticatedUrl}
                    </p>
                  </div>
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}
      {query.order.fields.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200 py-4 sm:py-5 sm:px-6">
            <DescriptionColumns>
              <DescriptionColumnsItem name="Created">
                {dayjs(query.order.created).format('MM/DD/YYYY')}
              </DescriptionColumnsItem>
              {query.order.fields.map((p) => (
                <DescriptionColumnsItem
                  name={
                    onMetadataEdit ? (
                      <Link onClick={onMetadataEdit} icon={<EditIcon />}>
                        {p.title}
                      </Link>
                    ) : (
                      p.title
                    )
                  }
                  key={p.fieldId}
                >
                  {p.display}
                </DescriptionColumnsItem>
              ))}
            </DescriptionColumns>
          </dl>
        </div>
      )}
    </>
  );
}
