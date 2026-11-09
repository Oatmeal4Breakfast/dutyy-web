import { useEffect, useState } from 'react';
import type { Project } from '../api/projects';
import { getProjects } from '../api/projects';
import CreateProjectForm from '../components/CreateProjectForm';
import { ApiError } from '../api/client';
import ProjectsList from '../components/ProjectsList';

export default function DashboardPage() {
  const [showCreateProjectForm, setShowCreateProjectForm] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectLoadAttempt, setProjectLoadAttempt] = useState<number>(0);

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
  }, [projectLoadAttempt]);

  return (
    <main className="dashboard-page">
      <section className="projects-heading" aria-labelledby="projects-heading">
        <div className="projects-heading__header">
          <h1 id="projects-heading">Projects</h1>
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
              <CreateProjectForm
                onCreated={(project) => {
                  setProjects((current) => [...current, project]);
                }}
              />
            </section>
          )}
        </div>
        {loadingProjects && (
          <p className="loading-projects-status" role="status">
            Loading Projects
          </p>
        )}
        {!loadingProjects && projectsError && (
          <div>
            <p role="alert">{projectsError}</p>
            <button
              type="button"
              onClick={() => {
                setProjectLoadAttempt((current) => current + 1);
              }}
            >
              Try again
            </button>
          </div>
        )}
        {!loadingProjects && !projectsError && projects.length === 0 && <p>No projects yet.</p>}
        {!loadingProjects && !projectsError && projects.length > 0 && (
          <ProjectsList projects={projects}></ProjectsList>
        )}
      </section>
    </main>
  );
}
