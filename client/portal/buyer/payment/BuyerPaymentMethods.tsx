import { useState } from '@hookstate/core';
import { captureException } from '@sentry/react';
import CreditCardBrand from 'client/global/components/CreditCardBrand';
import Badge, { BadgeType } from 'client/global/components/tailwind/Badge';
import Card, { CardTitle } from 'client/global/components/tailwind/Card';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import Modal from 'client/global/components/tailwind/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'client/global/components/tailwind/Table';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import BuyerPaymentQuickbooks from 'client/portal/buyer/payment/BuyerPaymentQuickbooks';
import BuyerPaymentStripe from 'client/portal/buyer/payment/BuyerPaymentStripe';
import * as React from 'react';
import PromiseButton from 'shared/components/button/PromiseButton';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import {
  BuyerPaymentMethodPrimaryDocument,
  BuyerPaymentMethodRemoveDocument,
  BuyerPaymentMethodsDocument,
  PaymentSourceType,
} from 'shared/generated';
import { useQueryHook, useQueryPromise } from 'shared/Graph';
import AddIcon from 'shared/icons/AddIcon';
import CheckIcon from 'shared/icons/CheckIcon';
import DeleteIcon from 'shared/icons/DeleteIcon';

export default function BuyerPaymentMethods() {
  const buyerRelId = useGetCurrentBuyerRelId();
  const vendorMemberId = useCurrentVendorId();

  const query = useQueryHook(BuyerPaymentMethodsDocument, { buyerRelId, vendorMemberId }, 'cache-and-network');
  const refresh = useQueryPromise(BuyerPaymentMethodsDocument);
  const primary = useQueryPromise(BuyerPaymentMethodPrimaryDocument);
  const remove = useQueryPromise(BuyerPaymentMethodRemoveDocument);

  const add = useState(false);

  if (!query.vendor.paymentType) {
    return (
      <Card title="Payment Methods">
        <Message round type={MessageType.INFO}>
          Digital payments are currently disabled for your account.
        </Message>
      </Card>
    );
  }

  const removeSource = (sourceId: string) => async () => {
    await remove({ sourceId });

    await refresh({ buyerRelId, vendorMemberId });
  };

  const badge = (source: typeof query.buyer.sources[0]) =>
    source.primary ? (
      <Badge type={BadgeType.PRIMARY}>Primary Payment Method</Badge>
    ) : (
      <Link
        onClick={() => primary({ buyerRelId, sourceId: source.id })}
        style={LinkStyle.SECONDARY}
        icon={<CheckIcon />}
      >
        Make Primary
      </Link>
    );

  return (
    <div>
      <div className="sm:hidden">
        <CardTitle
          button={
            <Button
              onClick={() => {
                add.set(true);
              }}
              style={ButtonStyle.SECONDARY}
              icon={<AddIcon />}
            >
              New
            </Button>
          }
        >
          Payment Methods
        </CardTitle>

        <div className="space-y">
          {query.buyer.sources.map((source) => (
            <Card key={source.id} onRemove={removeSource(source.id)}>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-sm">{source.name}</div>

                  <div className="flex items-center">
                    <div className="w-8">
                      <CreditCardBrand brand={source.brand} />
                    </div>
                    <div className="ml-1 text-sm">{source.last4}</div>
                  </div>
                </div>

                <div className="flex-1 text-right">{badge(source)}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <div className="hidden sm:block">
        <Card title="Payment Methods">
          <Table round border>
            <TableHead>
              <TableRow>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Account</TableHeadCell>
                <TableHeadCell>Primary</TableHeadCell>
                <TableHeadCell></TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4}>
                  <Link
                    onClick={() => {
                      add.set(true);
                    }}
                    style={LinkStyle.BOLD}
                    icon={<AddIcon />}
                  >
                    Add New Payment Method
                  </Link>
                  {query.buyer.sources.length === 0 && <p>You do not have any payment methods on file.</p>}
                </TableCell>
              </TableRow>
              {query.buyer.sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>{source.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-8">
                        <CreditCardBrand brand={source.brand} />
                      </div>
                      <div className="ml-1">{source.last4}</div>
                    </div>
                  </TableCell>
                  <TableCell>{badge(source)}</TableCell>
                  <TableCell>
                    <PromiseButton onClick={removeSource(source.id)} style={ButtonStyle.DANGER} icon={<DeleteIcon />}>
                      Remove
                    </PromiseButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      <Modal show={add}>
        <div className="w-full max-w-xl px">
          {query.vendor.paymentType === PaymentSourceType.Stripe && (
            <BuyerPaymentStripe
              isDefault={query.buyer.sources.length === 0}
              buyerRelId={buyerRelId}
              onSave={() => {
                refresh({ buyerRelId, vendorMemberId })
                  .then(() => {
                    add.set(false);
                  })
                  .catch(captureException);
              }}
            />
          )}
          {query.vendor.paymentType === PaymentSourceType.Quickbooks && (
            <BuyerPaymentQuickbooks
              buyerRelId={buyerRelId}
              test={query.vendor.paymentTest}
              isDefault={query.buyer.sources.length === 0}
              onSave={() => {
                refresh({ buyerRelId, vendorMemberId })
                  .then(() => {
                    add.set(false);
                  })
                  .catch(captureException);
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
