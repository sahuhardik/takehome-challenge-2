import ErrorRoute from 'client/global/components/ErrorRoute';
import Login from 'client/global/components/Login';
import { useBuyerPortalUrl } from 'client/global/hooks/useBuyerUrl';
import Loaded from 'client/global/Loaded';
import { applyTheme } from 'client/global/theme/utils';
import Auth from 'client/portal/Auth';
import BuyerSignup from 'client/portal/buyer/auth/BuyerSignup';
import BuyerLayout from 'client/portal/buyer/BuyerLayout';
import BuyerOrders from 'client/portal/buyer/BuyerOrders';
import BuyerOrderView from 'client/portal/buyer/BuyerOrderView';
import BuyerCreateOrderRouter from 'client/portal/buyer/order/BuyerCreateOrderRouter';
import BuyerPayment from 'client/portal/buyer/payment/BuyerPayment';
import BuyerCustomerEdit from 'client/portal/buyer/profile/BuyerCustomerEdit';
import BuyerUsers from 'client/portal/buyer/users/BuyerUsers';
import ChangePassword from 'client/portal/ChangePassword';
import * as React from 'react';
import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { BuyerDetectDocument, BuyerVendorDocument, ProfileDocument } from 'shared/generated';
import { useQueryHook, useQueryPromise } from 'shared/Graph';
import LogoIcon from 'shared/icons/LogoIcon';
import { setTimezone } from 'shared/state/TimezoneState';
import BuyerAccountSelector from './BuyerAccountSelector';

function BuyerRouter() {
  return (
    <Auth>
      <BuyerLayout>
        <Routes>
          <Route
            path="orders/create/*"
            element={
              <ErrorRoute>
                <BuyerCreateOrderRouter />
              </ErrorRoute>
            }
          />
          <Route
            path="orders/continue/:orderId/*"
            element={
              <ErrorRoute>
                <BuyerCreateOrderRouter />
              </ErrorRoute>
            }
          />
          <Route
            path="orders/:orderId/*"
            element={
              <ErrorRoute>
                <BuyerOrderView />
              </ErrorRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ErrorRoute>
                <BuyerOrders />
              </ErrorRoute>
            }
          />
          <Route
            path="payment"
            element={
              <ErrorRoute>
                <BuyerPayment />
              </ErrorRoute>
            }
          />
          <Route
            path="users/*"
            element={
              <ErrorRoute>
                <BuyerUsers />
              </ErrorRoute>
            }
          />
          <Route
            path="profile/*"
            element={
              <ErrorRoute>
                <BuyerCustomerEdit />
              </ErrorRoute>
            }
          />
          <Route path="*" element={<Navigate to="orders" />} />
        </Routes>
      </BuyerLayout>
    </Auth>
  );
}

function Redirector({ vendorId }: { vendorId: string }) {
  const { buyerId } = useParams();
  const navigate = useNavigate();
  const buyerUrl = useBuyerPortalUrl();

  const { profile } = useQueryHook(ProfileDocument);
  const detect = useQueryPromise(BuyerDetectDocument, 'network-only');

  useEffect(() => {
    if (profile) {
      const go = (url: string) => {
        const destination = buyerUrl(url);

        navigate(
          buyerUrl(profile.passwordReset ? `/change-password?next=${encodeURIComponent(destination)}` : destination),
          {
            replace: true,
          }
        );
      };

      if (buyerId) {
        go(`/${buyerId}`);
      } else {
        detect({ vendorId }).then(({ userBuyers }) => {
          if (userBuyers.length === 1) {
            go(`/${userBuyers[0].id}`);
          } else if (userBuyers.length > 1) {
            go('/select');
          } else {
            go('/signup');
          }
        });
      }
    } else {
      navigate(buyerUrl('/login'), { replace: true });
    }
  });

  return <></>;
}

export default function BuyerPortal({ vendorId: vendorIdOverride }: { vendorId?: string }) {
  const { vendorId } = useParams();

  const realVendorId = vendorIdOverride || vendorId;

  const { vendor } = useQueryHook(BuyerVendorDocument, { vendorId: realVendorId }, 'cache-first');

  applyTheme({
    primary: vendor.themePrimary,
    secondary: vendor.themeSecondary,
    body: vendor.themeBackground,
  });

  setTimezone(vendor.timezoneDisplay);

  return (
    <Routes>
      <Route
        path="login"
        element={
          <ErrorRoute center card>
            <Loaded>
              <Login
                logo={vendor.themeLogo?.image ? <img src={vendor.themeLogo?.image} /> : <LogoIcon />}
                loginBoxInfo={vendor?.loginBoxInfo}
              />
            </Loaded>
          </ErrorRoute>
        }
      />
      <Route
        path="change-password"
        element={
          <ErrorRoute center card>
            <Loaded>
              <ChangePassword logo={vendor.themeLogo?.image ? <img src={vendor.themeLogo?.image} /> : <LogoIcon />} />
            </Loaded>
          </ErrorRoute>
        }
      />
      <Route
        path="signup"
        element={
          <ErrorRoute center card>
            <Loaded>
              <BuyerSignup />
            </Loaded>
          </ErrorRoute>
        }
      />
      <Route
        path=":buyerId/*"
        element={
          <ErrorRoute center card>
            <BuyerRouter />
          </ErrorRoute>
        }
      />
      <Route path="select" element={<BuyerAccountSelector vendorId={realVendorId} />} />
      <Route path="*" element={<Redirector vendorId={realVendorId} />} />
    </Routes>
  );
}
