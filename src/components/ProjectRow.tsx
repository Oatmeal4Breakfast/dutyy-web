import { useState } from 'react';
import type { Project } from '../api/projects';
import { ChevronDown, Plus, SquarePen, Check, Ellipsis } from 'lucide-react';

type ProjectRowProps = {
  project: Project;
  completed: number;
  lastActivity: string;
};

export default function ProjectRow({ project, completed, lastActivity }: ProjectRowProps) {
  const [isExpanded, setExpanded] = useState<boolean>(false);
  const dutyysId = `project-${project.id}-dutyys`;

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
        <td>
          <div
            className="project-row__action-cell"
            role="group"
            aria-label={`Actions for ${project.name}`}
          >
            <button
              type="button"
              className="project-action-button"
              aria-label={`Complete ${project.name}`}
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
              <SquarePen aria-label="edit-project" />
            </button>
            <button
              type="button"
              className="project-action-button"
              aria-label={`More actions for ${project.name}`}
            >
              <Ellipsis aria-label="action-menu" />
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
