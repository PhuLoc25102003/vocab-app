import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/store';
import { DashboardScreen } from './dashboard-screen';

vi.mock('@/features/admin/components/admin-overview', () => ({
  AdminOverview: () => <div data-testid="admin-overview">Admin Overview</div>,
}));

vi.mock('@/features/classes/components/teacher-overview', () => ({
  TeacherOverview: () => <div data-testid="teacher-overview">Teacher Overview</div>,
}));

vi.mock('@/features/classes/components/class-work', () => ({
  ClassWork: () => <div data-testid="class-work">Class Work</div>,
}));

vi.mock('@/features/stats/components/xp-progress', () => ({
  XpProgress: () => <div data-testid="xp-progress">XP</div>,
}));
vi.mock('@/features/stats/components/stats-overview', () => ({
  StatsOverview: () => <div data-testid="stats-overview">Stats Overview</div>,
}));

vi.mock('@/features/sets/components/recent-sets', () => ({
  RecentSets: () => <div data-testid="recent-sets">Recent Sets</div>,
}));

describe('DashboardScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('với ADMIN: hiện AdminOverview ở trên cùng, khối gập mở cho Giáo viên & Học sinh ở dưới', () => {
    useAuthStore.setState({
      status: 'authenticated',
      user: {
        id: 'admin1',
        email: 'admin@vocab.local',
        displayName: 'Admin User',
        role: 'ADMIN',
      },
    });

    render(<DashboardScreen />);

    expect(screen.getByTestId('admin-overview')).toBeInTheDocument();
    expect(screen.getByText('Giao diện Giáo viên & Học sinh')).toBeInTheDocument();
    expect(
      screen.getByText('Bấm để mở xem tổng quan các lớp bạn đang dạy, bài tập và việc học cá nhân'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('teacher-overview')).toBeInTheDocument();
    expect(screen.getByTestId('class-work')).toBeInTheDocument();
  });

  it('với TEACHER: hiện TeacherOverview ở trên, khối gập mở việc học cá nhân ở dưới', () => {
    useAuthStore.setState({
      status: 'authenticated',
      user: {
        id: 'teacher1',
        email: 'teacher@vocab.local',
        displayName: 'Teacher User',
        role: 'TEACHER',
      },
    });

    render(<DashboardScreen />);

    expect(screen.queryByTestId('admin-overview')).not.toBeInTheDocument();
    expect(screen.getByTestId('teacher-overview')).toBeInTheDocument();
    expect(screen.getByText('Việc học của tôi')).toBeInTheDocument();
    expect(
      screen.getByText('Bấm để xem thống kê học tập và các bộ từ gần đây'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('stats-overview')).toBeInTheDocument();
    expect(screen.getByTestId('recent-sets')).toBeInTheDocument();
  });

  it('với STUDENT: hiện trực tiếp bài tập lớp và việc học', () => {
    useAuthStore.setState({
      status: 'authenticated',
      user: {
        id: 'student1',
        email: 'student@vocab.local',
        displayName: 'Student User',
        role: 'STUDENT',
      },
    });

    render(<DashboardScreen />);

    expect(screen.queryByTestId('admin-overview')).not.toBeInTheDocument();
    expect(screen.queryByTestId('teacher-overview')).not.toBeInTheDocument();
    expect(screen.getByTestId('class-work')).toBeInTheDocument();
    expect(screen.getByTestId('xp-progress')).toBeInTheDocument();
    expect(screen.getByTestId('stats-overview')).toBeInTheDocument();
    expect(screen.getByTestId('recent-sets')).toBeInTheDocument();
  });
});
