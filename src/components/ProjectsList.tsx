import type { Project } from '../api/projects';

type ProjectsListProps = {
  projects: Project[];
};

export default function ProjectsList({ projects }: ProjectsListProps) {
  return (
    <div className="project-table-wrapper">
      <table className="projects-table">
        <thead>
          <tr>
            <th scope="col">Project</th>
            <th scope="col">status</th>
            <th scope="col">Progress</th>
            <th scope="col">Publishing</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
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
                <td>{project.modified_date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
