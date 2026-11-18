import { isServer, QueryClient } from '@tanstack/react-query';
import { HttpError } from './http';

const MAX_QUERY_RETRIES = 2;
const TOO_MANY_REQUESTS = 429;

/** Lỗi 4xx sẽ lặp lại y hệt, trừ khi bị giới hạn tốc độ. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof HttpError && error.status < 500 && error.status !== TOO_MANY_REQUESTS) {
    return false;
  }
  return failureCount < MAX_QUERY_RETRIES;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: shouldRetryQuery },
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
