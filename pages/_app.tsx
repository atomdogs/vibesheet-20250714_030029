import React, { ReactNode, useState } from 'react';
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider, Hydrate } from '@tanstack/react-query';
import { DefaultSeo } from 'next-seo';
import { Toaster } from 'react-hot-toast';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import SEO from 'your-seo-config';
import Layout from 'path-to-layout';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const [queryClient] = useState(() => new QueryClient());
  const getLayout = Component.getLayout ?? ((page: ReactNode) => <Layout>{page}</Layout>);

  return (
    <SessionProvider session={pageProps.session}>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <DefaultSeo {...SEO} />
          {getLayout(
            <>
              <Component {...pageProps} />
              <Toaster position="top-right" />
            </>
          )}
        </Hydrate>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </SessionProvider>
  );
}