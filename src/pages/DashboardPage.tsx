import { useState } from 'react';
import type { UserSummary } from '../api/users';
import CreateProjectForm from '../components/CreateProjectForm';

type DashboardPageProps = {
  user: UserSummary;
};

export default function DashboardPage({ user }: DashboardPageProps) {
  const [showCreateProjectButton, setShowCreateProjectButton] = useState<boolean>(false);

  return (
    <main className="dashboard-page">
      <h1>Dashboard</h1>
      <p>Welcome, {user.first_name}.</p>
      <button
        type="button"
        aria-expanded={showCreateProjectButton}
        aria-controls="create-project-panel"
        onClick={() => setShowCreateProjectButton(!showCreateProjectButton)}
      >
        {showCreateProjectButton ? 'Close Form' : 'New Project'}
      </button>
      {showCreateProjectButton && (
        <section id="create-project-panel" className="create-project-panel">
          <h2>Create Project</h2>
          <CreateProjectForm></CreateProjectForm>
        </section>
      )}
    </main>
  );
}
