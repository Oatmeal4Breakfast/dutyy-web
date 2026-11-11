import { useState } from 'react';
import { ChevronDown, Plus, SquarePen, Check, Ellipsis } from 'lucide-react';
import type { Project } from '../api/projects';
import './ProjectRow.css';

type ProjectRowProps = {
  project: Project;
  completed: number;
  lastActivity: string;
  actions: ProjectActions;
};

export type ProjectActions = {
  completeProject: (projectId: string) => Promise<void>;
};

export default function ProjectRow({ project, completed, lastActivity, actions }: ProjectRowProps) {
  const [isExpanded, setExpanded] = useState<boolean>(false);
  const [isMenuOpen, setMenuOpen] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const dutyysId = `project-${project.id}-dutyys`;

  async function handleCompleteProject(): Promise<void> {
    setIsCompleting(true);

    try {
      await actions.completeProject(project.id);
    } finally {
      setIsCompleting(false);
    }
  }

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
        <td>{project.publishing_status}</td>
        <td>{lastActivity}</td>
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
            >
              <Plus aria-hidden="true" />
            </button>
            <button
              type="button"
              className="project-action-button"
              aria-label={`Edit ${project.name}`}
            >
              <SquarePen aria-hidden="true" />
            </button>
            <button
              type="button"
              className="project-action-button"
              aria-label={`More actions for ${project.name}`}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <Ellipsis aria-hidden="true" />
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr id={dutyysId} className="project-dutyys-row">
          <td colSpan={6} className="project-dutyys-cell">
            {project.dutyys.length > 0 ? (
              <ul className="project-dutyys-list">
                {project.dutyys.map((dutyy) => (
                  <li key={dutyy.id}>
                    <div className="project-dutyy-summary">
                      <span>{dutyy.title}</span>
                      <span className="project-dutyy-status">{dutyy.status.replace('_', ' ')}</span>
                    </div>
                    {dutyy.details && <p>{dutyy.details}</p>}
                  </li>
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
