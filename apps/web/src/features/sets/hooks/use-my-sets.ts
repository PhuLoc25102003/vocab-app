import { useQuery } from '@tanstack/react-query';
import { listMySets, type SetListParams } from '../api';

export function useMySets(params: SetListParams) {
  return useQuery({
    queryKey: ['sets', 'mine', params],
    queryFn: () => listMySets(params),
  });
}
