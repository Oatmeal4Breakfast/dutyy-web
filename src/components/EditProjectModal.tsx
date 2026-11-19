import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import type { ProjectStatus, UpdateProjectRequest } from '../api/projects';
import { ApiError } from '../api/client';
import './EditProjectModal.css';

export type EditProjectModalProps = {
  projectId: string;
  currentProjectName: string;
  currentProjectStatus: ProjectStatus;
  editProject: (projectId: string, payload: UpdateProjectRequest) => Promise<void>;
  onClose: () => void;
};

export function EditProjectModal({
  projectId,
  currentProjectName,
  currentProjectStatus,
  editProject,
  onClose,
}: EditProjectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [projectName, setProjectName] = useState<string>(currentProjectName);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>(currentProjectStatus);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const editProjectNameId = `edit-project-${projectId}-name`;
  const editProjectStatusId = `edit-project-${projectId}-status`;
  const headingId = `edit-project-${projectId}-heading`;
  const descriptionId = `edit-project-${projectId}-description`;
  const normalizedProjectName = projectName.trim();
  const nameChanged = normalizedProjectName !== currentProjectName;
  const statusChanged = projectStatus !== currentProjectStatus;
  const hasChanges = nameChanged || statusChanged;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
    };
  }, []);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    if (!normalizedProjectName) {
      setFormError('Project name is required');
      return;
    }

    if (!hasChanges) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: nameChanged ? normalizedProjectName : null,
      status: statusChanged ? projectStatus : null,
    } satisfies UpdateProjectRequest;

    try {
      await editProject(projectId, payload);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(String(error.getDetail() || error.message));
      } else {
        setFormError('Unable to edit Project');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="edit-project-dialog"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <form className="edit-project-form" aria-busy={isSubmitting} onSubmit={handleSubmit}>
        <header>
          <p className="edit-project-form__kicker">Project settings</p>
          <h2 id={headingId}>Edit {currentProjectName}</h2>
          <p id={descriptionId} className="edit-project-form__description">
            Update the project name or status.
          </p>
        </header>

        <label htmlFor={editProjectNameId}>Name</label>
        <input
          id={editProjectNameId}
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          disabled={isSubmitting}
          autoFocus
          required
        />

        <label htmlFor={editProjectStatusId}>Project Status</label>
        <select
          id={editProjectStatusId}
          value={projectStatus}
          onChange={(event) => setProjectStatus(event.target.value as ProjectStatus)}
          disabled={isSubmitting}
        >
          <option value="new">New</option>
          <option value="in_progress">In progress</option>
          <option value="complete">Complete</option>
          <option value="abandoned">Abandoned</option>
        </select>

        {formError && <p role="alert">{formError}</p>}

        <div className="edit-project-form__actions">
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || !normalizedProjectName || !hasChanges}>
            {isSubmitting ? 'Saving changes...' : 'Save changes'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
