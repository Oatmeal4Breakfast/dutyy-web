import { useState, type ChangeEvent } from 'react';
import type { Project } from '../api/projects';
import type { ProjectActions } from './ProjectRow';
import ProjectRow from './ProjectRow';
import { AddDutyyToProjectModal } from './AddDutyyToProjectModal';
import EditDutyyModal from './EditDutyyModal';
import { EditProjectModal } from './EditProjectModal';
import './ProjectsList.css';

type SortKey = 'status' | 'activity' | 'name';
type ProjectView = 'active' | 'completed' | 'all';

type ProjectsListProps = {
  projects: Project[];
  actions: ProjectActions;
};

export default function ProjectsList({ projects, actions }: ProjectsListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [projectView, setProjectView] = useState<ProjectView>('active');
  const [addDutyyProjectId, setAddDutyyProjectId] = useState<string | null>(null);
  const [editedProjectId, setEditedProjectId] = useState<string | null>(null);
  const [editedDutyyIds, setEditedDutyyIds] = useState<{
    projectId: string;
    dutyyId: string;
  } | null>(null);

  function getLastActivity(project: Project): string {
    return project.modified_date ?? project.created_date;
  }

  function handleSortChange(event: ChangeEvent<HTMLSelectElement>) {
    setSortKey(event.target.value as SortKey);
  }

  const filteredProjects = projects.filter((project) => {
    switch (projectView) {
      case 'active':
        return project.status === 'new' || project.status === 'in_progress';

      case 'completed':
        return project.status === 'complete';

      case 'all':
        return true;
    }
  });

  const sortedProjects = filteredProjects.toSorted((a, b) => {
    if (sortKey === 'activity') {
      const aDate = getLastActivity(a);
      const bDate = getLastActivity(b);
      return bDate.localeCompare(aDate);
    }
    return b[sortKey].localeCompare(a[sortKey]);
  });
  const addDutyyProject = projects.find((project) => project.id === addDutyyProjectId);
  const editedProject = projects.find((project) => project.id === editedProjectId);
  const editedDutyyProject = projects.find((project) => project.id === editedDutyyIds?.projectId);
  const editedDutyy = editedDutyyProject?.dutyys.find(
    (dutyy) => dutyy.id === editedDutyyIds?.dutyyId,
  );

  if (addDutyyProjectId && !addDutyyProject) {
    setAddDutyyProjectId(null);
  }
  if (editedProjectId && !editedProject) {
    setEditedProjectId(null);
  }
  if (editedDutyyIds && !editedDutyy) {
    setEditedDutyyIds(null);
  }

  return (
    <div className="projects-list">
      <div className="project-sort-controls">
        <div className="project-view-buttons" role="group" aria-label="project-filter">
          {(['active', 'completed', 'all'] as const).map((view) => (
            <button
              key={view}
              type="button"
              aria-pressed={projectView === view}
              onClick={() => setProjectView(view)}
            >
              {view}
            </button>
          ))}
        </div>

        <label htmlFor="project-sort">Sort projects by</label>
        <select
          id="project-sort"
          className="project-sort-keys"
          value={sortKey}
          onChange={handleSortChange}
        >
          <option value="status">Project status</option>
          <option value="activity">Last activity</option>
          <option value="name">Project name</option>
        </select>
      </div>
      <div className="project-table-wrapper">
        <table className="projects-table">
          <thead>
            <tr>
              <th scope="col">Project</th>
              <th scope="col">Status</th>
              <th scope="col">Progress</th>
              <th scope="col">Last activity</th>
              <th scope="col" className="projects-table__actions-heading">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map((project) => {
              const completedDutyys = project.dutyys.filter(
                (dutyy) => dutyy.status === 'complete',
              ).length;
              const lastActivity = getLastActivity(project);
              return (
                <ProjectRow
                  key={project.id}
                  project={project}
                  completed={completedDutyys}
                  lastActivity={lastActivity}
                  actions={actions}
                  onRequestAddDutyy={() => setAddDutyyProjectId(project.id)}
                  onRequestEditProject={() => setEditedProjectId(project.id)}
                  onRequestEditDutyy={(dutyyId) =>
                    setEditedDutyyIds({ projectId: project.id, dutyyId })
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>
      {addDutyyProject && (
        <AddDutyyToProjectModal
          projectId={addDutyyProject.id}
          projectName={addDutyyProject.name}
          addDutyy={actions.addDutyyToProject}
          onClose={() => setAddDutyyProjectId(null)}
        />
      )}
      {editedProject && (
        <EditProjectModal
          projectId={editedProject.id}
          currentProjectName={editedProject.name}
          currentProjectStatus={editedProject.status}
          editProject={actions.editProject}
          onClose={() => setEditedProjectId(null)}
        />
      )}
      {editedDutyyIds && editedDutyy && (
        <EditDutyyModal
          key={`${editedDutyyIds.projectId}:${editedDutyyIds.dutyyId}`}
          dutyy={editedDutyy}
          projectId={editedDutyyIds.projectId}
          editDutyy={actions.editDutyy}
          onClose={() => setEditedDutyyIds(null)}
        />
      )}
    </div>
  );
}
