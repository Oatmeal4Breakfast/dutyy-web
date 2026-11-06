import { useState, type ChangeEvent } from 'react';
import type { Project } from '../api/projects';

type SortKey = 'status' | 'activity' | 'name';

type ProjectsListProps = {
  projects: Project[];
};

export default function ProjectsList({ projects }: ProjectsListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('status');

  function getLastActivity(project: Project): string {
    return project.modified_date ?? project.created_date;
  }

  function handleSortChange(event: ChangeEvent<HTMLSelectElement>) {
    setSortKey(event.target.value as SortKey);
  }

  const sortedProjects = projects.toSorted((a, b) => {
    if (sortKey === 'activity') {
      const aDate = getLastActivity(a);
      const bDate = getLastActivity(b);
      return bDate.localeCompare(aDate);
    }
    return b[sortKey].localeCompare(a[sortKey]);
  });

  return (
    <div className="projects-list">
      <div className="project-sort-controls">
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
              <th scope="col">Publishing</th>
              <th scope="col">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map((project) => {
              const completedDutyys = project.dutyys.filter(
                (dutyy) => dutyy.status === 'complete',
              ).length;

              return (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{project.status}</td>
                  <td>
                    {completedDutyys} of {project.dutyys.length}
                  </td>
                  <td>{project.publishing_status}</td>
                  <td>{getLastActivity(project)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
