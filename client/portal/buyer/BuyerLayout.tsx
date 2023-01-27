import { Stream } from '@cloudflare/stream-react';
import { captureException } from '@sentry/react';
import SlidebarOpenButton, { SlidebarOpenLink } from 'client/global/components/button/SlidebarOpenButton';
import { EditUser, ProfileNotifications } from 'client/global/components/form/FormUserRoles';
import Lightbox from 'client/global/components/tailwind/Lightbox';
import Link, { LinkStyle } from 'client/global/components/tailwind/Link';
import SpinnerLoader from 'client/global/components/tailwind/SpinnerLoader';
import { useBuyerAuthUrl, useBuyerPortalUrl } from 'client/global/hooks/useBuyerUrl';
import useGetCurrentBuyerRelId from 'client/global/hooks/useCurrentBuyer';
import useUserback from 'client/global/hooks/useUserback';
import * as React from 'react';
import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AlertStateComponent } from 'shared/components/alert';
import PromiseButton, { PromiseButtonProps } from 'shared/components/button/PromiseButton';
import { PerformableFormType } from 'shared/components/fields/PerformableConfigureForm';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import {
  BuyerLayoutDocument,
  FormUserRolesGetDocument,
  MarketingMediaRole,
  Permission,
  PermissionsDocument,
  ShopMarketingFragment,
} from 'shared/generated';
import { useQueryHook, useQueryPromise } from 'shared/Graph';
import CreditCardIcon from 'shared/icons/CreditCardIcon';
import CustomersIcon from 'shared/icons/CustomersIcon';
import EditIcon from 'shared/icons/EditIcon';
import MenuIcon from 'shared/icons/MenuIcon';
import OrdersIcon from 'shared/icons/OrdersIcon';
import UsersIcon from 'shared/icons/UsersIcon';
import { useHasPermission, useLogout, useSetPermissions, useUser } from 'shared/UserState';
import { embedYoutubeUrl } from 'shared/utilities/embedYoutubeUrl';

export function BuyerContent({
  children,
  padding,
  className = '',
}: {
  className?: string;
  padding?: boolean;
  children: React.ReactNode;
}) {
  return <div className={`max-w-screen-lg ${padding ? 'p' : ''} ${className}`}>{children}</div>;
}

export function BuyerOrderContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p md:py-12 lg:py-16 md:px-12 lg:px-24 ${className}`}>{children}</div>;
}

function LayoutLink({ path, icon: Icon, name }: { path: string; icon: React.FunctionComponent; name: string }) {
  const classes = 'group flex items-center px-2 py-2 text-sm font-medium rounded-md';

  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${classes}` +
        (isActive ? `bg-gray-100 text-theme-secondary ${classes}` : '')
      }
    >
      <div className="icon mr-2">
        <Icon />
      </div>
      <div>{name}</div>
    </NavLink>
  );
}

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const buyerRelId = useGetCurrentBuyerRelId();
  const portalUrl = useBuyerPortalUrl(true);
  const buyerUrl = useBuyerAuthUrl();

  const currentUser = useUser();
  const { user } = useQueryHook(FormUserRolesGetDocument, { userId: currentUser.id });
  const logout = useLogout(portalUrl('/'));
  const query = useQueryHook(BuyerLayoutDocument, { buyerId: buyerRelId }, 'cache-and-network');
  const hasPermission = useHasPermission();
  const setPermissions = useSetPermissions();
  const permissionsQuery = useQueryPromise(PermissionsDocument);

  const isVendor = currentUser.superuser || currentUser.members.some((m) => m.id === query.buyer.vendor.id);

  useEffect(() => {
    if (isVendor) {
      setPermissions([Permission.BuyerInvoice, Permission.BuyerCost, Permission.BuyerPayment]);
      return;
    }

    if (permissionsQuery && query.buyer.member.id && user?.id) {
      permissionsQuery({
        memberId: query.buyer.member.id,
        userId: user?.id,
      })
        .then((query) => {
          if (query?.permissions) {
            setPermissions(query?.permissions || []);
          }
        })
        .catch(captureException);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.buyer.member.id, user?.id, isVendor]);

  document.title = query.buyer.member.company;

  // only show feedback widget if vendor is impersonating customer
  useUserback(isVendor);

  const nav = (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="bg-white flex-shrink-0 pt-5 flex items-center px-4">
        <NavLink to={buyerUrl('/')}>
          {query.buyer.vendor.themeLogo && <img src={query.buyer.vendor.themeLogo.image} className="w-48 sm:mx-auto" />}
        </NavLink>
      </div>
      <nav className="pt-5 px-2 space-y-1 bg-white flex-1">
        <LayoutLink name="Orders" icon={OrdersIcon} path={buyerUrl('/orders')} />
        {hasPermission(Permission.BuyerPayment) && (
          <LayoutLink name="Payment" icon={CreditCardIcon} path={buyerUrl('/payment')} />
        )}
        <LayoutLink name="Users" icon={UsersIcon} path={buyerUrl('/users')} />
        <LayoutLink name="Profile" icon={CustomersIcon} path={buyerUrl('/profile')} />
      </nav>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex flex-col ml-3 space-y-3">
          <SlidebarOpenLink text={user.name} className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            <EditUser profileEdit={true} userId={user.id} memberId={null} checkMemberIds={[]} title="User Profile" />
          </SlidebarOpenLink>
          <SlidebarOpenLink
            icon={<></>}
            text="Notifications"
            className="text-sm font-medium text-gray-700 group-hover:text-gray-900"
          >
            <ProfileNotifications
              type={PerformableFormType.BUYER}
              allowedNotificationConfigs={query.buyer.vendor.notifications}
            />
          </SlidebarOpenLink>
          <Link className="text-xs text-gray-500" onClick={logout}>
            Logout
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 border-l-8 border-theme-primary">
      <AlertStateComponent />
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">{nav}</div>
        </div>
      </div>
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="bg-content flex flex-items items-center p-2 border-b border-gray-200 lg:hidden">
          <div className="flex-1">
            {query.buyer.vendor.themeLogo && <img src={query.buyer.vendor.themeLogo.image} className="h-6" />}
          </div>
          <SlidebarOpenButton slim large icon={<MenuIcon />} left>
            {nav}
          </SlidebarOpenButton>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <SpinnerLoader>{children}</SpinnerLoader>
        </main>
      </div>
      <a
        href="https://www.photog.tech/privacy-policy/"
        className="text-gray-400 text-sm p-4 absolute bottom-0 right-0 z-50"
        rel="noreferrer"
        target="_blank"
      >
        Privacy Policy
      </a>
    </div>
  );
}

export function OrderHeading({ caption, title }: { caption?: string; title?: string }) {
  return (
    <div className="flex-1">
      {caption && <div className="text-theme-primary uppercase font-semibold tracking-wide">{caption}</div>}
      {title && (
        <div className="font-bold text-3xl lg:text-5xl tracking-tighter text-gray-700 leading-10 lg:pt-2">{title}</div>
      )}
    </div>
  );
}

export function OrderContent({ children, print = false }: { children: React.ReactNode; print?: boolean }) {
  let classes = 'flex-1 p bg-content min-h-full col-span-2';

  if (!print) {
    classes += 'max-w-screen-lg md:py-12 lg:py-16 md:px-12 lg:px-20 ';
  }

  return (
    <div className={classes}>
      <div className="z-20 relative">{children}</div>
    </div>
  );
}

export function OrderParagraph({ children, bottom = false }: { children: React.ReactNode; bottom?: boolean }) {
  return <p className={`text-lg text-gray-500 p${bottom ? 'b' : 't'}-4`}>{children}</p>;
}

export function OrderBorder({
  children,
  background,
  print = false,
}: {
  children: React.ReactNode;
  background?: string;
  print?: boolean;
}) {
  return (
    <div className="flex min-h-screen">
      <div className={`${print ? 'w-6' : 'w-2 md:w-24'} bg-theme-primary flex-shrink-0`}></div>
      <div
        className={`flex z-20 relative ${
          background ? 'lg:w-8/12 2xl:w-7/12' : print ? 'w-full' : 'lg:w-9/12 xl:w-8/12 max-w-screen-lg'
        }`}
      >
        {children}
      </div>
      {background && (
        <div className="hidden lg:block fixed top-0 left-2/3 2xl:left-1/2 right-0 bottom-0 overflow-hidden z-10">
          <div
            className="absolute bg-cover w-full h-full blur transform scale-125"
            style={{
              backgroundImage: `url(${background})`,
            }}
          />
          <div className="absolute bg-theme-primary opacity-50 z-20 w-full h-full"></div>
        </div>
      )}
    </div>
  );
}

export function OrderCenter({ children, background }: { children: React.ReactNode; background?: string }) {
  return (
    <div className="min-h-screen lg:bg-theme-body flex flex-col justify-center relative">
      <div className="mx-auto w-full lg:max-w-screen-sm lg:round overflow-hidden lg:shadow-md relative z-20">
        <OrderContent>{children}</OrderContent>
      </div>

      {background && (
        <div className="hidden lg:block w-full h-full absolute top-0 left-0 overflow-hidden">
          <div
            className="w-full h-full absolute top-0 left-0 transform -rotate-12 scale-150 z-10"
            style={{
              opacity: 0.02,
              mixBlendMode: 'luminosity',
              backgroundImage: `url(${background})`,
            }}
          ></div>
        </div>
      )}
    </div>
  );
}

export function OrderSection({
  name,
  children,
  linkUrl,
  linkName,
  id,
  print = false,
}: {
  id?: string;
  name: string;
  children: React.ReactNode;
  linkUrl?: string;
  linkName?: string;
  print?: boolean;
}) {
  return (
    <div id={id}>
      <div className="pt-8 pb-4 flex items-center justify-between">
        <div className="font-bold text-2xl text-quiet">{name}</div>
        {!!linkUrl && (
          <Link to={linkUrl} icon={<EditIcon />} style={LinkStyle.SECONDARY} className="flex-shrink-0">
            {linkName}
          </Link>
        )}
      </div>
      <div className={print ? '' : 'sm:pl-6'}>{children}</div>
    </div>
  );
}

export function OrderButton({
  onButton,
  onLink,
  disabled,
  button,
  link,
}: {
  disabled?: PromiseButtonProps['disabled'];
  onButton?: PromiseButtonProps['onClick'];
  onLink?: () => void;
  button?: string;
  link?: string;
}) {
  return (
    <div className="flex flex-col-reverse lg:flex-row items-center justify-center items-center pt lg:pt-6 lg:space-x-6">
      {link && (
        <Link style={LinkStyle.QUIET} onClick={onLink} className="mt sm:mt-0">
          {link}
        </Link>
      )}
      {button && (
        <PromiseButton snackbar={false} style={ButtonStyle.PRIMARY} onClick={onButton} disabled={disabled}>
          {button}
        </PromiseButton>
      )}
    </div>
  );
}

export function OrderMarketing({
  marketing,
  caption,
  children,
  shorten,
}: {
  shorten?: boolean;
  caption?: string;
  marketing: ShopMarketingFragment;
  children: React.ReactNode;
}) {
  const heroImage = marketing.images.find((i) => i.role === MarketingMediaRole.Hero);
  const heroEmbed = marketing.links
    .map((i) => ({
      ...i,
      url: embedYoutubeUrl(i.url),
    }))
    .find((i) => i.role === MarketingMediaRole.Embed);
  const heroVideo = marketing.videos.find((i) => i.role === MarketingMediaRole.Hero);

  const exampleLinks = marketing.links.filter((i) => i.role === MarketingMediaRole.Example);
  const exampleImages = marketing.images.filter((i) => i.role === MarketingMediaRole.Example);

  return (
    <>
      {heroImage && (
        <div
          className="bg-cover bg-center aspect-h-1 aspect-w-3 sm:aspect-w-5 lg:aspect-w-4"
          style={{ backgroundImage: `url(${heroImage.hero})` }}
        ></div>
      )}
      <OrderContent>
        <OrderHeading caption={caption || 'Featured Service'} title={marketing.name} />

        {heroEmbed && (
          <div className="pt-6">
            <div className="w-full aspect-w-16 aspect-h-9 relative">
              <iframe
                src={heroEmbed.url}
                className="w-full h-full absolute"
                frameBorder={0}
                allowFullScreen
                allow="xr-spatial-tracking"
              />
            </div>
          </div>
        )}

        {heroVideo && (
          <div className="pt-6">
            <Stream controls src={heroVideo.streamId} poster={heroVideo.thumbnail} />
          </div>
        )}

        {marketing.description && !shorten && (
          <div className="pb-6">
            {marketing.description
              .split('\n')
              .filter((d) => d.trim())
              .map((p, index) => (
                <p className="text-lg text-gray-500 pt-4" key={`${index}`}>
                  {p}
                </p>
              ))}
          </div>
        )}

        {exampleImages.length > 0 && !shorten && (
          <div className={`grid gap-4 grid-cols-2 md:grid-cols-3 ${!marketing.description ? 'pt' : ''}`}>
            {exampleImages.map((e) => (
              <Lightbox src={e.file.s3} sizes={[275, '25vw']} key={e.file.s3} />
            ))}
          </div>
        )}

        {exampleLinks.length > 0 && !shorten && (
          <>
            <div className="font-semibold tracking-wide text-gray-500 uppercase pt-4">Other Resources</div>

            <div className="grid gap-4 grid-cols-2 pt-2 pb-6">
              {exampleLinks.map((link) => (
                <a
                  key={link.label}
                  className="font-semibold text-theme-primary hover:darken"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </>
        )}

        <div className={shorten ? 'pt-6' : ''}>{children}</div>
      </OrderContent>
    </>
  );
}
