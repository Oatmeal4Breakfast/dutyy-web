import { useState } from 'react';
import type { Project } from '../api/projects';

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
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M17.418 6.109c.272-.268.709-.268.979 0s.271.701 0 .969l-7.908 7.83c-.27.268-.707.268-.979 0l-7.908-7.83c-.27-.268-.27-.701 0-.969.271-.268.709-.268.979 0L10 13.25l7.418-7.141z"
                />
              </svg>
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
      </tr>
      {isExpanded && (
        <tr id={dutyysId} className="project-dutyys-row">
          <td colSpan={5} className="project-dutyys-cell">
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
