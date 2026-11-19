import { useState } from 'react';
import { ChevronDown, Plus, SquarePen, Check, Trash } from 'lucide-react';
import type {
  CreateDutyyRequest,
  PatchDutyyRequest,
  Project,
  UpdateProjectRequest,
} from '../api/projects';
import { ApiError } from '../api/client';
import DutyyRow from './DutyyRow';
import './ProjectRow.css';
type ProjectRowProps = {
  project: Project;
  completed: number;
  lastActivity: string;
  actions: ProjectActions;
  onRequestAddDutyy: () => void;
  onRequestEditProject: () => void;
};

export type ProjectActions = {
  completeProject: (projectId: string) => Promise<void>;
  addDutyyToProject: (projectId: string, payload: CreateDutyyRequest) => Promise<void>;
  editProject: (projectId: string, payload: UpdateProjectRequest) => Promise<void>;
  editDutyy: (projectId: string, dutyyId: string, payload: PatchDutyyRequest) => Promise<void>;
  completeDutyy: (projectId: string, dutyyId: string) => Promise<void>;
  removeDutyy: (projectId: string, dutyyId: string) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;
};

export default function ProjectRow({
  project,
  completed,
  lastActivity,
  actions,
  onRequestAddDutyy,
  onRequestEditProject,
}: ProjectRowProps) {
  const [isExpanded, setExpanded] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const dutyysId = `project-${project.id}-dutyys`;

  async function handleCompleteProject(): Promise<void> {
    setIsCompleting(true);

    try {
      await actions.completeProject(project.id);
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleRemoveProject(): Promise<void> {
    const confirmed = window.confirm(`Delete "${project.name}"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await actions.removeProject(project.id);
    } catch (error) {
      if (error instanceof ApiError) {
        setDeleteError(String(error.getDetail() ?? error.message));
      } else {
        setDeleteError('Unable to delete project');
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const lastActivityDate = new Date(lastActivity).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <tr className="project-row">
        <td className="project-row__name">
          <span className="project-row__name-content">
            <button
              type="button"
              className="project-row-toggle"
              aria-expanded={isExpanded}
              aria-controls={dutyysId}
              aria-label={`${isExpanded ? 'Hide' : 'Show'} dutyys for ${project.name}`}
              onClick={() => setExpanded((current) => !current)}
            >
              <ChevronDown />
            </button>
            <span>{project.name}</span>
          </span>
        </td>
        <td>{project.status}</td>
        <td>
          {completed} of {project.dutyys.length}
        </td>
        <td>{lastActivityDate}</td>
        <td className="project-row__action-cell">
          <div
            className="project-row__actions"
            role="group"
            aria-label={`Actions for ${project.name}`}
          >
            <button
              type="button"
              className={`project-action-button ${isCompleting ? 'project-action-button--pending' : ''}`}
              aria-label={`Complete ${project.name}`}
              onClick={() => void handleCompleteProject()}
              disabled={isCompleting || project.status === 'complete'}
            >
              <Check aria-hidden="true" />
            </button>
            <button
              type="button"
              className="project-action-button"
              aria-label={`Add dutyy to ${project.name}`}
              aria-haspopup="dialog"
              onClick={onRequestAddDutyy}
            >
              <Plus aria-hidden="true" />
            </button>
            <button
              type="button"
              className="project-action-button"
              aria-label={`Edit ${project.name}`}
              aria-haspopup="dialog"
              onClick={onRequestEditProject}
            >
              <SquarePen aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`project-action-button project-action-button--destructive ${
                isDeleting ? 'project-action-button--pending' : ''
              }`}
              aria-label={isDeleting ? `Deleting ${project.name}` : `Delete ${project.name}`}
              aria-busy={isDeleting}
              onClick={() => void handleRemoveProject()}
              disabled={isDeleting}
            >
              <Trash aria-hidden="true" />
            </button>
          </div>
        </td>
      </tr>
      {deleteError && (
        <tr className="project-row__error-row">
          <td colSpan={5} className="project-row__error-cell">
            <p role="alert">{deleteError}</p>
          </td>
        </tr>
      )}
      {isExpanded && (
        <tr id={dutyysId} className="project-dutyys-row">
          <td colSpan={5} className="project-dutyys-cell">
            {project.dutyys.length > 0 ? (
              <ul className="project-dutyys-list">
                {project.dutyys.map((dutyy) => (
                  <DutyyRow key={dutyy.id} projectId={project.id} dutyy={dutyy} actions={actions} />
                ))}
              </ul>
            ) : (
              <p className="project-dutyys-empty">No dutyys yet.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
