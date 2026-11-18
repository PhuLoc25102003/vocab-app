import { statsOverviewResponseSchema, type StatsOverview } from '@vocab/shared';
import { http } from '@/lib/http';

export async function getStatsOverview(): Promise<StatsOverview> {
  return statsOverviewResponseSchema.parse(await http('/stats/overview')).data;
}
