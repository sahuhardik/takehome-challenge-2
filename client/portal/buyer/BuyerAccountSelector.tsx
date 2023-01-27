import { loaded } from 'client/global/components/tailwind/SpinnerLoader';
import * as React from 'react';
import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BuyerDetectDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';
import { useBuyerPortalUrl } from '../../global/hooks/useBuyerUrl';

export default function BuyerAccountSelector({ vendorId }: { vendorId: string }) {
  const navigate = useNavigate();
  const buyerUrl = useBuyerPortalUrl();
  const { userBuyers } = useQueryHook(BuyerDetectDocument, { vendorId }, 'network-only');

  loaded();

  useEffect(() => {
    if (userBuyers.length === 0) {
      navigate(buyerUrl('/signup'), {
        replace: true,
      });
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-theme-body">
      <p className="font-semibold text-gray-900 pt-4 mb-2 text-center">Choose an account:</p>
      <div className="bg-content border-t-8 border-theme-primary p shadow flex flex-col items-center round">
        <div className="w-80" />
        <ul role="list" className="-my-5 divide-y divide-gray-200">
          {userBuyers.map((buyer) => (
            <li className="py-4" key={buyer.id}>
              <div className="flex  space-x-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{buyer.member.company}</p>
                </div>
                <div>
                  <NavLink
                    to={buyerUrl(`/${buyer.id}`)}
                    className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Continue
                  </NavLink>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
