'use client';
import * as Ably from 'ably';
import { AblyProvider } from 'ably/react';

let client: Ably.Realtime | undefined;

export function getAblyClient(): Ably.Realtime | undefined {
  if (typeof window === 'undefined') return undefined;    // never construct on the server
  client ??= new Ably.Realtime({ authUrl: '/api/ably' }); // one per tab, forever
  return client;
}

export function ClientAblyProvider({ children }: { children: React.ReactNode }) {
  // const client = useMemo(
  //   () =>
  //     new Ably.Realtime({
  //       authUrl: '/api/ably',
  //       clientId: 'me',
  //       autoConnect: typeof window !== 'undefined', // never authenticate during SSR
  //     }),
  //   [],
  // );
  const client = getAblyClient();

  if (!client) return <>{children}</>

  return (
    <AblyProvider client={client}>
      {children}
    </AblyProvider>
  )
}