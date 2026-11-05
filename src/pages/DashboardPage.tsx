import { useEffect, useState } from 'react';
import type { UserSummary } from '../api/users';
import type { Project } from '../api/projects';
import { getProjects } from '../api/projects';
import CreateProjectForm from '../components/CreateProjectForm';
import { ApiError } from '../api/client';

type DashboardPageProps = {
  user: UserSummary;
};

export default function DashboardPage({ user }: DashboardPageProps) {
  const [showCreateProjectForm, setShowCreateProjectForm] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      setProjectsError(null);
      setLoadingProjects(true);
      try {
        const results = await getProjects();
        if (active) {
          setProjects(results);
        }
      } catch (error) {
        if (!active) return;

        if (error instanceof ApiError) {
          setProjectsError(error.message);
        } else {
          setProjectsError('Unable to load projects');
        }
      } finally {
        if (active) {
          setLoadingProjects(false);
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

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

      <section className="projects-heading" aria-labelledby="projects-heading">
        <h2 id="projects-heading">Projects</h2>
        {loadingProjects && (
          <p className="loading-projects-status" role="status">
            Loading Projects
          </p>
        )}
        {!loadingProjects && projectsError && <p role="alert">{projectsError}</p>}
        {!loadingProjects && !projectsError && projects.length === 0 && <p>No projects yet.</p>}
        {!loadingProjects && !projectsError && projects.length > 0 && (
          <ul>
            {projects.map((project) => (
              <li key={project.id}>{project.name}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
