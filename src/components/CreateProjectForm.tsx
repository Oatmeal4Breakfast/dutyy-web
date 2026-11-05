import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { ApiError } from '../api/client';
import { createProject, type CreateProjectRequest, type Project } from '../api/projects';

type DutyyDraft = {
  clientId: string;
  title: string;
  details: string;
};

type CreateProjectFormProps = {
  onCreated: (project: Project) => void;
};

export default function CreateProjectForm({ onCreated }: CreateProjectFormProps) {
  const [projectName, setProjectName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [dutyys, setDutyys] = useState<DutyyDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function addDutyy(): void {
    setDutyys((previousDutyys) => [
      ...previousDutyys,
      {
        clientId: crypto.randomUUID(),
        title: '',
        details: '',
      },
    ]);
  }

  function updateDutyy(clientId: string, field: 'title' | 'details', value: string): void {
    setDutyys((previousDutyys) =>
      previousDutyys.map((dutyy) =>
        dutyy.clientId === clientId ? { ...dutyy, [field]: value } : dutyy,
      ),
    );
  }

  function removeDutyy(clientId: string): void {
    setDutyys((previousDutyys) => previousDutyys.filter((dutyy) => dutyy.clientId !== clientId));
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const newProject = {
      name: projectName.trim(),
      ...(dutyys.length > 0 && {
        dutyys: dutyys.map(({ title, details }) => ({
          title: title.trim(),
          details: details.trim() || null,
        })),
      }),
    } satisfies CreateProjectRequest;

    try {
      const project = await createProject(newProject);
      onCreated(project);
      setProjectName('');
      setDutyys([]);
      setSuccess(`Project "${project.name}" created.`);
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Unable to create new project');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form className="create-project-form" onSubmit={handleSubmit}>
        <label htmlFor="name">Project Name</label>
        <input
          id="name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={submitting}
          required
        />

        {dutyys.map((dutyy, index) => {
          const titleId = `${dutyy.clientId}-title`;
          const detailsId = `${dutyy.clientId}-details`;

          return (
            <fieldset
              key={dutyy.clientId}
              className="create-project-form__dutyy"
              disabled={submitting}
            >
              <legend>Dutyy {index + 1}</legend>

              <label htmlFor={titleId}>Title</label>
              <input
                id={titleId}
                value={dutyy.title}
                onChange={(e) => updateDutyy(dutyy.clientId, 'title', e.target.value)}
                required
              />

              <label htmlFor={detailsId}>Details</label>
              <textarea
                id={detailsId}
                value={dutyy.details}
                onChange={(e) => updateDutyy(dutyy.clientId, 'details', e.target.value)}
              />

              <button
                type="button"
                className="create-project-form__remove"
                onClick={() => removeDutyy(dutyy.clientId)}
              >
                Remove dutyy
              </button>
            </fieldset>
          );
        })}

        <button
          type="button"
          className="create-project-form__add"
          onClick={addDutyy}
          disabled={submitting}
        >
          Add a dutyy
        </button>
        <button type="submit" className="create-project-form__submit" disabled={submitting}>
          {submitting ? 'Creating new project...' : 'Create Project'}
        </button>

        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}
      </form>
    </div>
  );
}
