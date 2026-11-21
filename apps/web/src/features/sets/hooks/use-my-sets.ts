import { useQuery } from '@tanstack/react-query';
import { listMySets, type SetListParams } from '../api';
import { setKeys } from '../query-keys';

export function useMySets(params: SetListParams) {
  return useQuery({
    queryKey: setKeys.mine(params),
    queryFn: () => listMySets(params),
  });
}
