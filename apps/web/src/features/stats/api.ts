import {
  badgeListResponseSchema,
  type Badge,
  cardProgressListResponseSchema,
  setProgressResponseSchema,
  type CardProgressItem,
  statsOverviewResponseSchema,
  type SetProgress,
  type StatsOverview,
  type UpdateDailyGoalInput,
  xpSummaryResponseSchema,
  type XpSummary,
} from '@vocab/shared';
import { http } from '@/lib/http';

export async function getStatsOverview(): Promise<StatsOverview> {
  return statsOverviewResponseSchema.parse(await http('/stats/overview')).data;
}

export async function getBadges(): Promise<Badge[]> {
  return badgeListResponseSchema.parse(await http('/stats/badges')).data;
}

export const XP_SUMMARY_KEY = ['stats', 'xp'] as const;

export async function getXpSummary(): Promise<XpSummary> {
  return xpSummaryResponseSchema.parse(await http('/stats/xp')).data;
}

export async function updateDailyGoal(input: UpdateDailyGoalInput): Promise<XpSummary> {
  const body = await http('/stats/xp/goal', { method: 'PUT', body: JSON.stringify(input) });
  return xpSummaryResponseSchema.parse(body).data;
}

export async function getSetProgress(setId: string): Promise<SetProgress> {
  const path = `/stats/sets/${encodeURIComponent(setId)}`;
  return setProgressResponseSchema.parse(await http(path)).data;
}

export async function getCardProgress(setId: string): Promise<CardProgressItem[]> {
  const path = `/stats/sets/${encodeURIComponent(setId)}/cards`;
  return cardProgressListResponseSchema.parse(await http(path)).data;
}
