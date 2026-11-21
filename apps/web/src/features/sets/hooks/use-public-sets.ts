import { useQuery } from '@tanstack/react-query';
import { listPublicSets, type PublicSetListParams } from '../api';
import { setKeys } from '../query-keys';

export function usePublicSets(params: PublicSetListParams) {
  return useQuery({
    queryKey: setKeys.publicList(params),
    queryFn: () => listPublicSets(params),
  });
}
