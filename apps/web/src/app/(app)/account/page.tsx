import type { Metadata } from 'next';
import { LanguageSettings } from '@/components/common/language-switcher';
import { SpeechSettings } from '@/components/common/speech-settings';
import { PageHeader } from '@/components/common/page-header';
import { AccountSettings } from '@/features/auth/components/account-settings';
import { LeaderboardVisibility } from '@/features/leaderboard/components/leaderboard-visibility';
import { NotificationSettings } from '@/features/notifications/components/notification-settings';
import { AccountLevel } from '@/features/stats/components/account-level';
import { BadgeList } from '@/features/stats/components/badge-list';
import { DailyGoalSettings } from '@/features/stats/components/daily-goal-settings';
import { ProfileBadges } from '@/features/stats/components/profile-badges';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.account') };
}

export default async function AccountPage() {
  const t = await getT('common');
  return (
    <>
      <PageHeader title={t('pages.account')} />
      <AccountSettings
        profileExtra={
          <>
            <AccountLevel />
            <ProfileBadges />
          </>
        }
      >
        <BadgeList />
        <DailyGoalSettings />
        <NotificationSettings />
        <LeaderboardVisibility />
        <LanguageSettings />
        <SpeechSettings />
      </AccountSettings>
    </>
  );
}
