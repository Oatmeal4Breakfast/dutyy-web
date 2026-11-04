import { useState } from 'react';
import type { UserSummary } from '../api/users';
import CreateProjectForm from '../components/CreateProjectForm';

type DashboardPageProps = {
  user: UserSummary;
};

export default function DashboardPage({ user }: DashboardPageProps) {
  const [showCreateProjectForm, setShowCreateProjectForm] = useState<boolean>(false);

  return (
    <main className="dashboard-page">
      <h1>Dashboard</h1>
      <p>Welcome, {user.first_name}.</p>
      <button
        type="button"
        className="dashboard-project-toggle"
        aria-expanded={showCreateProjectForm}
        aria-controls="create-project-panel"
        onClick={() => setShowCreateProjectForm((isVisible) => !isVisible)}
      >
        {showCreateProjectForm ? 'Close Form' : 'New Project'}
      </button>
      {showCreateProjectForm && (
        <section id="create-project-panel" className="create-project-panel">
          <h2>Create Project</h2>
          <CreateProjectForm />
        </section>
      )}
    </main>
  );
}
