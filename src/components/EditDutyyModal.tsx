import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import type { Dutyy, DutyyStatus, PatchDutyyRequest } from '../api/projects';
import { ApiError } from '../api/client';
import './EditDutyyModal.css';

type EditDutyyModalProps = {
  dutyy: Dutyy;
  projectId: string;
  editDutyy: (projectId: string, dutyyId: string, payload: PatchDutyyRequest) => Promise<void>;
  onClose: () => void;
};

export default function EditDutyyModal({
  dutyy,
  projectId,
  editDutyy,
  onClose,
}: EditDutyyModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(dutyy.title);
  const [details, setDetails] = useState(dutyy.details ?? '');
  const [status, setStatus] = useState<DutyyStatus>(dutyy.status);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const headingId = `edit-dutyy-${dutyy.id}-heading`;
  const descriptionId = `edit-dutyy-${dutyy.id}-description`;
  const titleId = `edit-dutyy-${dutyy.id}-title`;
  const detailsId = `edit-dutyy-${dutyy.id}-details`;
  const statusId = `edit-dutyy-${dutyy.id}-status`;
  const normalizedTitle = title.trim();
  const normalizedDetails = details.trim();
  const originalDetails = (dutyy.details ?? '').trim();
  const titleChanged = normalizedTitle !== dutyy.title;
  const detailsChanged = normalizedDetails !== originalDetails;
  const statusChanged = status !== dutyy.status;
  const hasChanges = titleChanged || detailsChanged || statusChanged;

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

    if (!normalizedTitle) {
      setFormError('Dutyy title is required');
      return;
    }

    if (!hasChanges) {
      return;
    }

    const payload: PatchDutyyRequest = {};
    if (titleChanged) payload.title = normalizedTitle;
    if (detailsChanged) payload.details = normalizedDetails || null;
    if (statusChanged) payload.status = status;

    setIsSubmitting(true);

    try {
      await editDutyy(projectId, dutyy.id, payload);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(String(error.getDetail() ?? error.message));
      } else {
        setFormError('Unable to edit dutyy');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="edit-dutyy-dialog"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) onClose();
      }}
    >
      <form className="edit-dutyy-form" aria-busy={isSubmitting} onSubmit={handleSubmit}>
        <header>
          <p className="edit-dutyy-form__kicker">Dutyy settings</p>
          <h2 id={headingId}>Edit {dutyy.title}</h2>
          <p id={descriptionId} className="edit-dutyy-form__description">
            Update this dutyy's title, details, or status.
          </p>
        </header>

        <label htmlFor={titleId}>Title</label>
        <input
          id={titleId}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
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

        <label htmlFor={statusId}>Status</label>
        <select
          id={statusId}
          value={status}
          onChange={(event) => setStatus(event.target.value as DutyyStatus)}
          disabled={isSubmitting}
        >
          <option value="new">New</option>
          <option value="in_progress">In progress</option>
          <option value="complete">Complete</option>
        </select>

        {formError && <p role="alert">{formError}</p>}

        <div className="edit-dutyy-form__actions">
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || !normalizedTitle || !hasChanges}>
            {isSubmitting ? 'Saving changes...' : 'Save changes'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
