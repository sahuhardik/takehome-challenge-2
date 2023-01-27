import { flatfileImporter } from '@flatfile/sdk';
import { IFlatfileImporter } from '@flatfile/sdk/dist/types/interfaces';
import { useState } from '@hookstate/core';
import { captureException } from '@sentry/react';
import Spinner from 'client/global/components/tailwind/Spinner';
import { useCurrentVendorId } from 'client/global/hooks/useCurrentVendor';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import Button from 'shared/components/tailwind/Button';
import Message from 'shared/components/tailwind/Message';
import { MessageType } from 'shared/components/tailwind/Message/MessageCommon';
import { VendorClearCustomerImportDocument, VendorCustomersImportUploadDocument } from 'shared/generated';
import { useQueryPromise } from 'shared/Graph';

export default function ImportUploadFile({ token, onFinish }: { token: string; onFinish: () => void }) {
  const vendorId = useCurrentVendorId();
  const save = useQueryPromise(VendorCustomersImportUploadDocument);
  const clear = useQueryPromise(VendorClearCustomerImportDocument);
  const state = useState({ importing: false, problem: false });

  const importer = useRef<IFlatfileImporter>();

  useEffect(() => {
    const instance = flatfileImporter(token);

    instance.on('error', ({ error }) => {
      captureException(error);

      state.merge({ importing: true, problem: true });
    });

    instance.on('complete', async (payload) => {
      if (state.importing.get()) {
        return;
      }

      try {
        state.merge({ importing: true, problem: false });

        const data = await payload.data();

        let valid = data.rows.filter((r) => r.info.length === 0);

        // remove all existing records
        await clear({ vendorId });

        while (valid.length > 0) {
          const chunk = valid.slice(0, 100);

          await save({
            vendorId,
            customers: chunk.map((v) => ({
              companyEmail: v.data.email as string,
              address: v.data.address as string,
              userEmail: (v.data.user_email || v.data.email) as string,
              companyPhone: v.data.phone as string,
              userPhone: (v.data.user_phone || v.data.phone) as string,
              first: v.data.first as string,
              last: v.data.last as string,
              company: v.data.company as string,
              notes: v.data.notes as string,
            })),
          });

          valid = valid.slice(100);
        }

        await onFinish();

        state.importing.set(false);
      } catch (ex) {
        captureException(ex);

        try {
          state.merge({
            importing: true,
            problem: true,
          });
        } catch (ex) {
          // component may be unmounted
        }
      }
    });

    importer.current = instance;
  }, [state, save, token, vendorId, onFinish, clear]);

  let content = (
    <>
      <div className="text-xl">Upload Customer File</div>
      <p className="text-sm text-content">
        You will be prompted to upload a file (such as CSV, XLS, etc) and map your dataset to the fields below (do not
        worry about the name you give to your columns).
      </p>

      <div className="space-y-2">
        <p className="space-x-1">
          <strong>Email Address</strong>
          <em className="text-quiet text-xs">required</em>
        </p>

        <p className="text-content text-sm">
          For <strong>companies</strong>, this is the email address typical used on their website or other marketing
          materials. It may be associated with any individual at that company but it is preferred to be a generic (eg:
          info@domain.com, sales@domain.com) in the event that the individual moves on from their position.
        </p>

        <p className="text-content text-sm">
          For <strong>individuals</strong>, this is the email address you intend to send notifications and general
          correspondence regarding their orders or status as a customer.
        </p>

        <Message type={MessageType.INFO} title="Email vs User Email" round>
          If user information (<strong className="font-semibold">first name</strong>/
          <strong className="font-semibold">last name</strong>) and an email address is provided, the email address will
          be associated with <strong>both</strong> the user and the company. If you would like to set a different email
          address for user notifications, map that second address to the <strong>User Email</strong> field.
        </Message>
      </div>

      <div className="space-y-2">
        <p className="space-x-1">
          <strong>Company Name</strong>
          <em className="text-quiet text-xs">conditionally required</em>
        </p>

        <p className="text-content text-sm">
          If the customer is not a company but an individual, you can either define a custom name to give their customer
          account or we will <strong>combine</strong> their first and last name to derive the company name.
        </p>
      </div>

      <div className="space-y-2">
        <p className="space-x-1">
          <strong>First and Last Name</strong>
          <em className="text-quiet text-xs">conditionally required</em>
        </p>

        <p className="text-content text-sm">
          The name of the user to associate with the customer. If a company name is not provided, then a first and last
          name must be defined. If not provided, a customer will be created without any associated users.
        </p>
      </div>

      <div className="space-y-2">
        <p className="space-x-1">
          <strong>Phone Number</strong>
          <em className="text-quiet text-xs">optional</em>
        </p>

        <p className="text-content text-sm">
          For <strong>companies</strong>, this is the phone number typical used on their website or other marketing
          materials. It may be associated with any individual at that company but it is preferred to be a generic in the
          event that the individual moves on from their position.
        </p>

        <p className="text-content text-sm">
          For <strong>individuals</strong>, this is the phone number you intend to send notifications and general
          correspondence (via text message) regarding their orders or status as a customer.
        </p>

        <Message type={MessageType.INFO} title="Phone vs User Phone Fields" round>
          <p>
            If your data set has <strong>only one</strong> phone column available, you should assign that column to the{' '}
            <strong>Phone</strong> field. If user information (<strong className="font-semibold">first name</strong>/
            <strong className="font-semibold">last name</strong>) is provided, and the given number is eligible to
            receive text messages. it will be associated with the user <strong>AND</strong> customer, otherwise it will{' '}
            <strong>ONLY</strong> be associated with the customer.
          </p>
          <p>
            If your data set has <strong>more than one</strong> phone column available (eg: home/work vs mobile, primary
            vs secondary), associate the number most likely to be a mobile phone number to the{' '}
            <strong>User Phone</strong> field, and set the other one to <strong>Phone</strong>.
          </p>
        </Message>
      </div>

      <Button onClick={() => importer.current.launch()}>Upload File</Button>
    </>
  );

  if (state.importing.get()) {
    if (state.problem.get()) {
      content = (
        <Message type={MessageType.ERROR} title="Import Failed" round>
          An unexpected error has occurred while trying to import your data. Our team has been notified and will
          investigate.
        </Message>
      );
    } else {
      content = (
        <div className="h-full flex flex-col items-center justify-center space-y-2">
          <div className="text-2lx text-gray-700 font-semibold">Processing data...</div>
          <div className="w-32 h-32">
            <Spinner />
          </div>
        </div>
      );
    }
  }

  return content;
}
