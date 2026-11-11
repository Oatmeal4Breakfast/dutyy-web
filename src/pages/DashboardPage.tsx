import { useEffect, useState } from 'react';
import type { Project } from '../api/projects';
import { getProjectById, getProjects, patchProject } from '../api/projects';
import CreateProjectForm from '../components/CreateProjectForm';
import { ApiError } from '../api/client';
import ProjectsList from '../components/ProjectsList';
import type { ProjectActions } from '../components/ProjectRow';

export default function DashboardPage() {
  const [showCreateProjectForm, setShowCreateProjectForm] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectLoadAttempt, setProjectLoadAttempt] = useState<number>(0);
  const [actionsError, setActionsError] = useState<string | null>(null);

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

  async function refreshProject(projectId: string): Promise<void> {
    const updatedProject = await getProjectById(projectId);

    setProjects((current) =>
      current.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
    );
  }

  async function completeProject(projectId: string): Promise<void> {
    setActionsError(null);

    try {
      await patchProject(projectId, { status: 'complete' });
      await refreshProject(projectId);
    } catch (error) {
      if (error instanceof ApiError) {
        setActionsError(error.message);
      } else {
        setActionsError('Could not mark project as complete');
      }
    }
  }

  const projectActions: ProjectActions = {
    completeProject,
  };

  const activeProjects = projects.filter((project) => project.status !== 'complete');

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
          <ProjectsList projects={activeProjects} actions={projectActions}></ProjectsList>
        )}
        {actionsError && <p role="alert">{actionsError}</p>}
      </section>
    </main>
  );
}
