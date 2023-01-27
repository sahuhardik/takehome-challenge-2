import { useState } from '@hookstate/core';
import * as Sentry from '@sentry/react';
import { loaded } from 'client/global/components/tailwind/SpinnerLoader';
import { redirectToLogin } from 'client/utils/utils';
import * as React from 'react';
import { useEffect } from 'react';
import { ProfileDocument } from 'shared/generated';
import { GlobalState } from 'shared/GlobalState';
import { useQueryPromise } from 'shared/Graph';

function LoadingPage({ markLoaded }: { markLoaded: boolean }) {
  useEffect(() => () => {
    if (!markLoaded) {
      return;
    }

    // after react suspense destroys this node, we can assume all downstream async calls have finished
    loaded();
  });

  return <span className="loading">Loading Page...</span>;
}

function Authenticating() {
  const profile = useQueryPromise(ProfileDocument);

  useEffect(() => {
    profile()
      .then((resp) => {
        if (!resp.profile) {
          window.localStorage.setItem('redirect', `${window.location.pathname}?${window.location.search}`);

          redirectToLogin();

          return;
        }

        Sentry.setUser({ email: resp.profile.email, id: resp.profile.id });

        try {
          window['__ls']('identify', {
            name: resp.profile.name,
            email: resp.profile.email,
          });
        } catch (ex) {
          Sentry.captureException(ex);
        }

        setTimeout(() => {
          // delay to let the logo spin a lil :)
          GlobalState.user.set({
            attempted: true,
            user: resp.profile,
            permissions: [],
          });
        }, 500);
      })
      .catch((ex) => {
        console.error(ex);
      });
  }, [profile]);

  return <span className="loading">Authenticating...</span>;
}

export default function Auth({ children, markLoaded = true }: { children: React.ReactNode; markLoaded?: boolean }) {
  const state = useState(GlobalState.user);

  if (!state.attempted.get()) {
    return <Authenticating />;
  }

  return <React.Suspense fallback={<LoadingPage markLoaded={markLoaded} />}>{children}</React.Suspense>;
}
