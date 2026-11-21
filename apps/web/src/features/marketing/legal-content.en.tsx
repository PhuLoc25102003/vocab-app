import Link from 'next/link';
import { BRAND_NAME } from '@/components/common/logo';
import type { LegalSection } from './components/legal-page';

/** Bản tiếng Anh của `legal-content.tsx`; sửa một bản thì sửa cả bản kia. */
const accountLink = (
  <Link href="/account" className="underline underline-offset-4">
    Account
  </Link>
);

export const PRIVACY_TITLE_EN = 'Privacy policy';

export const PRIVACY_INTRO_EN = `This page explains what data ${BRAND_NAME} stores about you, what it is used for and how you can delete it.`;

export const PRIVACY_SECTIONS_EN: LegalSection[] = [
  {
    title: 'Data we store',
    body: [
      'Account details: email, display name and a hashed password. We never store your password in readable form.',
      'When you sign in with Google, we only receive your email, name and Google account ID. We do not read your Gmail, contacts or other Google data.',
      'Content you create: folders, sets, cards and the study progress of each card.',
      'Sign-in sessions: the IP address and browser name of each sign-in, so you can sign out everywhere and so unusual access can be spotted.',
    ],
  },
  {
    title: 'How we use the data',
    body: [
      'To sign you in, save your sets, schedule reviews and show your own study stats.',
      'To keep the service safe, for example by limiting sign-in attempts and logging errors. Logs are kept only for a short time and never contain passwords or tokens.',
      'We do not sell data, do not use it for advertising and use no third-party tracking.',
    ],
  },
  {
    title: 'Cookies and browser storage',
    body: [
      'A secure cookie keeps you signed in. The browser also remembers your light or dark theme, your language and any unfinished session, so you can continue after reloading.',
    ],
  },
  {
    title: 'Who can see your data',
    body: [
      'Private sets are visible only to you. Public sets show their content and the creator’s name to anyone.',
      'Data is stored with the infrastructure providers Vercel, Render and Neon. They only process it to run the service for us.',
    ],
  },
  {
    title: 'Deleting your data',
    body: [
      <>
        You can delete your account at any time on the {accountLink} page. Deleting it removes your
        account, sets, cards and study progress for good, and they cannot be restored.
      </>,
    ],
  },
  {
    title: 'Changes to this policy',
    body: ['When the policy changes, we update this page and the date at the top.'],
  },
];

export const TERMS_TITLE_EN = 'Terms of use';

export const TERMS_INTRO_EN = `By creating an account or using ${BRAND_NAME}, you agree to the terms below.`;

export const TERMS_SECTIONS_EN: LegalSection[] = [
  {
    title: 'The service',
    body: [
      `${BRAND_NAME} is a free tool for creating vocabulary sets and reviewing them in many study modes. The service is in a trial phase and may change, pause or have bugs.`,
    ],
  },
  {
    title: 'Your account',
    body: [
      'You are responsible for keeping your password secret and for all activity in your account. Each person should use only one account.',
    ],
  },
  {
    title: 'Content you create',
    body: [
      'Sets and cards you create remain yours. When you make a set public, you allow others to view and copy it for studying.',
      'Do not post content that breaks the law, insults others or infringes copyright. We may hide or delete such content.',
    ],
  },
  {
    title: 'Fair use',
    body: [
      'Do not try to gain unauthorized access, overload the system or collect other users’ data. Accounts that break these rules may be locked.',
    ],
  },
  {
    title: 'Limitation of liability',
    body: [
      'The service is provided as is. We work to keep your data safe but do not promise the service will always run or never lose data.',
    ],
  },
  {
    title: 'Changes to the terms',
    body: [
      'When the terms change, we update this page. Continuing to use the service means you accept the new version.',
    ],
  },
];
