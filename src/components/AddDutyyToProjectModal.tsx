import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import type { CreateDutyyRequest } from '../api/projects';
import { ApiError } from '../api/client';
import './AddDutyyToProjectModal.css';

export type AddDutyyModalProps = {
  projectId: string;
  projectName: string;
  addDutyy: (projectId: string, payload: CreateDutyyRequest) => Promise<void>;
  onClose: () => void;
};

export function AddDutyyToProjectModal({
  projectId,
  projectName,
  addDutyy,
  onClose,
}: AddDutyyModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dutyyTitle, setDutyyTitle] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const titleId = `add-dutyy-${projectId}-title`;
  const detailsId = `add-dutyy-${projectId}-details`;
  const headingId = `add-dutyy-${projectId}-heading`;
  const descriptionId = `add-dutyy-${projectId}-description`;

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

    const title = dutyyTitle.trim();
    if (!title) {
      setFormError('Enter a title for the dutyy');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title,
      details: details.trim() || null,
    } satisfies CreateDutyyRequest;

    try {
      await addDutyy(projectId, payload);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(String(error.getDetail() ?? error.message));
      } else {
        setFormError('Unable to add new dutyy');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="add-dutyy-to-project-dialog"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <form className="add-dutyy-to-project-form" aria-busy={isSubmitting} onSubmit={handleSubmit}>
        <header>
          <p className="add-dutyy-to-project-form__kicker">New dutyy</p>
          <h2 id={headingId}>Add to {projectName}</h2>
          <p id={descriptionId} className="add-dutyy-to-project-form__description">
            Add a title and any details needed to complete this dutyy.
          </p>
        </header>

        <label htmlFor={titleId}>Title</label>
        <input
          id={titleId}
          value={dutyyTitle}
          onChange={(event) => setDutyyTitle(event.target.value)}
          disabled={isSubmitting}
          autoFocus
          required
        />

        <label htmlFor={detailsId}>Details</label>
        <textarea
          id={detailsId}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          disabled={isSubmitting}
          rows={5}
        />

        {formError && <p role="alert">{formError}</p>}

        <div className="add-dutyy-to-project-form__actions">
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || !dutyyTitle.trim()}>
            {isSubmitting ? 'Adding...' : 'Add dutyy'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
