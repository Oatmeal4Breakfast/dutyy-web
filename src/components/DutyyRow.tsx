import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, Ellipsis, SquarePen, Trash } from 'lucide-react';
import type { Dutyy } from '../api/projects';
import { ApiError } from '../api/client';
import type { ProjectActions } from './ProjectRow';
import './DutyyRow.css';

type DutyyRowProps = {
  projectId: string;
  dutyy: Dutyy;
  actions: ProjectActions;
  onRequestEdit: () => void;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return String(error.getDetail() ?? error.message);
  }
  return fallback;
}

export default function DutyyRow({ projectId, dutyy, actions, onRequestEdit }: DutyyRowProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [completionAccepted, setCompletionAccepted] = useState(false);
  const [deletionAccepted, setDeletionAccepted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = `dutyy-${dutyy.id}-actions`;

  useEffect(() => {
    if (!isMenuOpen) return;

    menuContainerRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (!menuContainerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isMenuOpen]);

  async function handleComplete(): Promise<void> {
    setActionError(null);
    setIsCompleting(true);
    try {
      await actions.completeDutyy(projectId, dutyy.id);
      setCompletionAccepted(true);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Unable to complete dutyy'));
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    const confirmed = window.confirm(`Delete "${dutyy.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    setActionError(null);
    setIsDeleting(true);
    try {
      await actions.removeDutyy(projectId, dutyy.id);
      setDeletionAccepted(true);
      setIsMenuOpen(false);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Unable to delete dutyy'));
    } finally {
      setIsDeleting(false);
    }
  }

  function closeMenuAndRestoreFocus() {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenuAndRestoreFocus();
      return;
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'),
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + direction + items.length) % items.length;
    items[nextIndex]?.focus();
  }

  return (
    <li className="dutyy-row" aria-busy={isCompleting || isDeleting}>
      <div className="dutyy-row__content">
        <div className="dutyy-row__text">
          <div className="dutyy-row__summary">
            <span>{dutyy.title}</span>
            <span className="dutyy-row__status">{dutyy.status.replace('_', ' ')}</span>
          </div>
          {dutyy.details && <p>{dutyy.details}</p>}
        </div>

        <div className="dutyy-row__actions" role="group" aria-label={`Actions for ${dutyy.title}`}>
          <button
            type="button"
            className={`dutyy-action-button ${isCompleting ? 'dutyy-action-button--pending' : ''}`}
            aria-label={isCompleting ? `Completing ${dutyy.title}` : `Complete ${dutyy.title}`}
            aria-busy={isCompleting}
            onClick={() => void handleComplete()}
            disabled={
              isCompleting || completionAccepted || deletionAccepted || dutyy.status === 'complete'
            }
          >
            <Check aria-hidden="true" />
          </button>

          <div ref={menuContainerRef} className="dutyy-row__menu-container">
            <button
              ref={menuButtonRef}
              type="button"
              className="dutyy-action-button"
              aria-label={`More actions for ${dutyy.title}`}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-controls={menuId}
              onClick={() => setIsMenuOpen((current) => !current)}
              disabled={deletionAccepted}
            >
              <Ellipsis aria-hidden="true" />
            </button>
            {deletionAccepted && <span className="dutyy-row__status">Deleted</span>}
            {isMenuOpen && (
              <div
                id={menuId}
                className="dutyy-row__menu"
                role="menu"
                aria-label={`More actions for ${dutyy.title}`}
                onKeyDown={handleMenuKeyDown}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRequestEdit();
                  }}
                >
                  <SquarePen aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="dutyy-row__delete-action"
                  aria-label={isDeleting ? `Deleting ${dutyy.title}` : `Delete ${dutyy.title}`}
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                >
                  <Trash aria-hidden="true" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {actionError && (
        <p className="dutyy-row__error" role="alert">
          {actionError}
        </p>
      )}
    </li>
  );
}
