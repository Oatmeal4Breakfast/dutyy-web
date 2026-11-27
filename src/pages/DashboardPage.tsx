import { useState } from 'react';

import CreateProjectForm from '../components/CreateProjectForm';
import ProjectsList from '../components/ProjectsList';
import type { ProjectActions } from '../components/ProjectRow';
import useProjects from '../hooks/useProjects';

type DashboardPageProps = {
  userId: string;
};

export default function DashboardPage({ userId }: DashboardPageProps) {
  const [showCreateProjectForm, setShowCreateProjectForm] = useState<boolean>(false);
  const projectsState = useProjects(userId);
  const projectActions: ProjectActions = {
    completeProject: projectsState.completeProject,
    addDutyyToProject: projectsState.addDutyyToProject,
    editProject: projectsState.editProject,
    editDutyy: projectsState.editDutyy,
    completeDutyy: projectsState.completeDutyy,
    removeDutyy: projectsState.removeDutyy,
    removeProject: projectsState.removeProject,
  };

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
              <CreateProjectForm createProject={projectsState.createProject} />
            </section>
          )}
        </div>
        {projectsState.loading && (
          <p className="loading-projects-status" role="status">
            Loading Projects
          </p>
        )}
        {!projectsState.loading && projectsState.loadError && (
          <div>
            <p role="alert">{projectsState.loadError}</p>
            <button type="button" onClick={() => void projectsState.retry()}>
              Try again
            </button>
          </div>
        )}
        {!projectsState.loading &&
          !projectsState.loadError &&
          projectsState.projects.length === 0 && <p>No projects yet.</p>}
        {!projectsState.loading &&
          !projectsState.loadError &&
          projectsState.projects.length > 0 && (
            <ProjectsList projects={projectsState.projects} actions={projectActions} />
          )}
        {projectsState.refreshing && <p role="status">Refreshing projects...</p>}
        {projectsState.refreshError && <p role="alert">{projectsState.refreshError}</p>}
      </section>
    </main>
  );
}
