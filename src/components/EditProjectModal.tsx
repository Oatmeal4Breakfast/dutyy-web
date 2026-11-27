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

type FieldEdit<T> = {
  value: T;
  baseline: T;
};

function applyEdit<T>(
  current: FieldEdit<T> | null,
  value: T,
  currentValue: T,
): FieldEdit<T> | null {
  const baseline = current?.baseline ?? currentValue;

  if (value === baseline || value === currentValue) {
    return null;
  }

  return { value, baseline };
}

export function EditProjectModal({
  projectId,
  currentProjectName,
  currentProjectStatus,
  editProject,
  onClose,
}: EditProjectModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nameEdit, setNameEdit] = useState<FieldEdit<string> | null>(null);
  const [statusEdit, setStatusEdit] = useState<FieldEdit<ProjectStatus> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const editProjectNameId = `edit-project-${projectId}-name`;
  const editProjectStatusId = `edit-project-${projectId}-status`;
  const headingId = `edit-project-${projectId}-heading`;
  const descriptionId = `edit-project-${projectId}-description`;
  const projectName = nameEdit?.value ?? currentProjectName;
  const projectStatus = statusEdit?.value ?? currentProjectStatus;
  const normalizedProjectName = projectName.trim();
  const nameChanged = nameEdit !== null && normalizedProjectName !== currentProjectName.trim();
  const statusChanged = statusEdit !== null && projectStatus !== currentProjectStatus;
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

    const payload: UpdateProjectRequest = {};
    if (nameChanged) payload.name = normalizedProjectName;
    if (statusChanged) payload.status = projectStatus;

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
          onChange={(event) => {
            const value = event.target.value;
            setNameEdit((current) => applyEdit(current, value, currentProjectName));
          }}
          disabled={isSubmitting}
          autoFocus
          required
        />

        <label htmlFor={editProjectStatusId}>Project Status</label>
        <select
          id={editProjectStatusId}
          value={projectStatus}
          onChange={(event) => {
            const value = event.target.value as ProjectStatus;
            setStatusEdit((current) => applyEdit(current, value, currentProjectStatus));
          }}
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
