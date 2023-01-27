import Selectable from 'client/global/components/tailwind/Selectable';
import * as React from 'react';

export default function VendorAccountingSettings() {
  return (
    <div className="space-y">
      <div>
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Single-Order Invoicing</h3>
              <p className="mt-1 text-sm text-gray-600">
                When a customer is setup on single-order invoicing, each order will have its own invoice.
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form action="#" method="POST" className="space-y">
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Processor Strategy</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        How would you like to handle credit card charges through the order process?
                      </p>
                    </div>

                    <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                      <Selectable title="Real Time" checked={true}>
                        real time desc
                      </Selectable>
                      <Selectable title="Daily Batch" checked={false}>
                        daily badtch desc
                      </Selectable>
                    </div>
                  </div>
                </div>
              </div>
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Default Charge Strategy</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        At what point would you like to charge the customer&apos;s credit card?
                      </p>
                    </div>

                    <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                      <Selectable title="Order Confirmed" checked={true}>
                        order confirm desc
                      </Selectable>
                      <Selectable title="Order Scheduled" checked={false}>
                        order schedule desc
                      </Selectable>
                      <Selectable title="Order Progress" checked={false}>
                        order progress desc
                      </Selectable>
                      <Selectable title="Order Completed" checked={false}>
                        order complete desc
                      </Selectable>
                    </div>
                  </div>
                </div>
              </div>
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Lines</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        When an invoice is created, how should line items be added?
                      </p>
                    </div>

                    <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                      <Selectable title="Line per Service" checked={true}>
                        Each service can be assigned a &quot;class&quot; if Quickbooks integration is turned on.
                      </Selectable>
                      <Selectable title="Line per Property" checked={false}>
                        Each service property is given the same &quot;class&quot; as the service unless it has been
                        overriden.
                      </Selectable>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="hidden sm:block" aria-hidden="true">
        <div className="py-5">
          <div className="border-t border-gray-200"></div>
        </div>
      </div>

      <div>
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Multi-Order Invoicing</h3>
              <p className="mt-1 text-sm text-gray-600">
                When a customer is setup on multi-order invoicing, all orders will be grouped together and billed based
                on the frequency configured.
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form action="#" method="POST" className="space-y">
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Default NET Terms</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        How would you like to handle credit card charges through the order process?
                      </p>
                    </div>

                    <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                      <Selectable title="Due On Receipt" checked={true}>
                        due on receipt
                      </Selectable>
                      <Selectable title="NET 15" checked={false}>
                        net 15
                      </Selectable>
                    </div>
                  </div>
                </div>
              </div>
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Default Frequency</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        At what point would you like to charge the customer&apos;s credit card?
                      </p>
                    </div>

                    <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                      <Selectable title="Manual" checked={true}>
                        manual
                      </Selectable>
                      <Selectable title="Weekly" checked={true}>
                        weekly
                      </Selectable>
                      <Selectable title="Monthly" checked={false}>
                        monthly
                      </Selectable>
                    </div>
                  </div>
                </div>
              </div>
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Lines</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        When an invoice is created, how should line items be added?
                      </p>
                    </div>

                    <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                      <Selectable title="Line per Order" checked={true}>
                        The description of the invoice line will include a line for every service on the order.
                      </Selectable>
                      <Selectable title="Line per Service" checked={false}>
                        The description of the invoice line will include a line for every service property configured.
                      </Selectable>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="hidden sm:block" aria-hidden="true">
        <div className="py-5">
          <div className="border-t border-gray-200"></div>
        </div>
      </div>

      <div>
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Provider Payouts</h3>
              <p className="mt-1 text-sm text-gray-600">
                All the controlers related to paying a provider for the work they have done.
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form action="#" method="POST" className="space-y">
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Credit Strategy</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        What do you want to do in the event a provider owes you money?
                      </p>
                    </div>

                    <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                      <Selectable title="Ledger Entry" checked={true}>
                        Adjusts the provider&apos;s balance and will subtract the amount from their next payout.
                      </Selectable>
                      <Selectable title="Vendor Credit" checked={false}>
                        Issues an invoice to the vendor for the amount owed.
                      </Selectable>
                    </div>
                  </div>
                </div>
              </div>
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Ledger Strategy</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        For accrual-based accounting, what point do you consider the cost of the provider&apos;s work an
                        expense?
                      </p>
                    </div>

                    <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                      <Selectable title="Job Submitted" checked={true}>
                        job su
                      </Selectable>
                      <Selectable title="Job Completed" checked={false}>
                        job com
                      </Selectable>
                      <Selectable title="Order Completed" checked={false}>
                        order com
                      </Selectable>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="hidden sm:block" aria-hidden="true">
        <div className="py-5">
          <div className="border-t border-gray-200"></div>
        </div>
      </div>

      <div>
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Provider Bills</h3>
              <p className="mt-1 text-sm text-gray-600">
                Configure how all of your provider contractors are paid in the system.
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form action="#" method="POST" className="space-y">
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Default NET Terms</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        How long after a pay period are you required to compensate a provider?
                      </p>
                    </div>

                    <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                      <Selectable title="Due On Receipt" checked={true}>
                        due on r
                      </Selectable>
                      <Selectable title="NET 15" checked={false}>
                        net 15
                      </Selectable>
                      <Selectable title="NET 30" checked={false}>
                        net 30
                      </Selectable>
                    </div>
                  </div>
                </div>
              </div>
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Default Frequency</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        At what point would you like to issue a bill for the providers earnings?
                      </p>
                    </div>

                    <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                      <Selectable title="Manual" checked={true}>
                        manual
                      </Selectable>
                      <Selectable title="Per Job" checked={false}>
                        per job
                      </Selectable>
                      <Selectable title="BiWeekly" checked={false}>
                        bi weekly
                      </Selectable>
                      <Selectable title="Monthly" checked={false}>
                        monthly
                      </Selectable>
                    </div>
                  </div>
                </div>
              </div>
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice Lines</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        When a bill is created, how should line items be added?
                      </p>
                    </div>

                    <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
                      <Selectable title="Line per Job/Address" checked={true}>
                        Created as an &quot;Item Detail&quot; within a Quickbooks bill, every property configuration
                        will be written per line in the description.
                      </Selectable>
                      <Selectable title="Line per Order/Address" checked={false}>
                        Created as an &quot;Item Detail&quot; within a Quickbooks bill, every service on the order will
                        be written per line in the description.
                      </Selectable>
                      <Selectable title="Line per Service" checked={false}>
                        Created as a &quot;Category&quot; within a Quickbooks bill, every service will aggregate
                        earnings and write a single entry on the bill.
                      </Selectable>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
