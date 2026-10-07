import type { UserSummary } from '../api/types';

type DashboardPageProps = {
  user: UserSummary;
};

export default function DashboardPage({ user }: DashboardPageProps) {
  return (
    <main className="dashboard-page">
      <h1>Dashboard</h1>
      <p>Welcome, {user.first_name}.</p>
    </main>
  );
}
