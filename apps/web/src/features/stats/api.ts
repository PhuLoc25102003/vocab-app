import {
  cardProgressListResponseSchema,
  setProgressResponseSchema,
  type CardProgressItem,
  statsOverviewResponseSchema,
  type SetProgress,
  type StatsOverview,
} from '@vocab/shared';
import { http } from '@/lib/http';

export async function getStatsOverview(): Promise<StatsOverview> {
  return statsOverviewResponseSchema.parse(await http('/stats/overview')).data;
}

export async function getSetProgress(setId: string): Promise<SetProgress> {
  const path = `/stats/sets/${encodeURIComponent(setId)}`;
  return setProgressResponseSchema.parse(await http(path)).data;
}

export async function getCardProgress(setId: string): Promise<CardProgressItem[]> {
  const path = `/stats/sets/${encodeURIComponent(setId)}/cards`;
  return cardProgressListResponseSchema.parse(await http(path)).data;
}
