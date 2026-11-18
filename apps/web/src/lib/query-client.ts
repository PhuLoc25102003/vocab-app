import { isServer, QueryClient } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, refetchOnWindowFocus: false },
    },
  });
}

let browserClient: QueryClient | undefined;

/** Server: mỗi request một client. Browser: dùng chung một client. */
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  browserClient ??= makeQueryClient();
  return browserClient;
}
