import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../api/client';
import type { ProjectActions } from './ProjectRow';
import { makeDutyy } from '../test/fixtures';
import DutyyRow from './DutyyRow';

function makeActions(overrides: Partial<ProjectActions> = {}): ProjectActions {
  return {
    completeProject: vi.fn(),
    addDutyyToProject: vi.fn(),
    editProject: vi.fn(),
    editDutyy: vi.fn(),
    completeDutyy: vi.fn(),
    removeDutyy: vi.fn(),
    removeProject: vi.fn(),
    ...overrides,
  };
}

function renderRow(
  actions: ProjectActions,
  status: 'new' | 'in_progress' | 'complete' = 'new',
  onRequestEdit = vi.fn(),
) {
  const dutyy = makeDutyy({ status });
  render(
    <ul>
      <DutyyRow
        projectId="project-1"
        dutyy={dutyy}
        actions={actions}
        onRequestEdit={onRequestEdit}
      />
    </ul>,
  );
  return { dutyy, onRequestEdit };
}

describe('DutyyRow', () => {
  describe('completion', () => {
    it('requests completion for the displayed dutyy', async () => {
      const user = userEvent.setup();
      const completeDutyy = vi.fn().mockResolvedValue(undefined);
      const actions = makeActions({ completeDutyy });
      const { dutyy } = renderRow(actions);

      await user.click(screen.getByRole('button', { name: 'Complete Buy groceries' }));

      expect(completeDutyy).toHaveBeenCalledOnce();
      expect(completeDutyy).toHaveBeenCalledWith('project-1', dutyy.id);
    });

    it('disables completion when the dutyy is already complete', () => {
      renderRow(makeActions(), 'complete');

      expect(screen.getByRole('button', { name: 'Complete Buy groceries' })).toBeDisabled();
    });

    it('shows an API failure on the affected row', async () => {
      const user = userEvent.setup();
      const completeDutyy = vi
        .fn()
        .mockRejectedValue(new ApiError(500, { detail: 'Completion unavailable' }));
      renderRow(makeActions({ completeDutyy }));

      await user.click(screen.getByRole('button', { name: 'Complete Buy groceries' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Completion unavailable');
      expect(screen.getByText('Buy groceries')).toBeVisible();
    });

    it('does not allow a confirmed completion to be repeated while data is stale', async () => {
      const user = userEvent.setup();
      const completeDutyy = vi.fn().mockResolvedValue(undefined);
      renderRow(makeActions({ completeDutyy }));

      const completeButton = screen.getByRole('button', { name: 'Complete Buy groceries' });
      await user.click(completeButton);
      await user.click(completeButton);

      expect(completeDutyy).toHaveBeenCalledOnce();
      expect(completeButton).toBeDisabled();
    });
  });

  describe('overflow menu', () => {
    it('closes with Escape and restores focus to its trigger', async () => {
      const user = userEvent.setup();
      renderRow(makeActions());
      const trigger = screen.getByRole('button', { name: 'More actions for Buy groceries' });

      await user.click(trigger);
      expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('requests editing through the parent selection boundary', async () => {
      const user = userEvent.setup();
      const onRequestEdit = vi.fn();
      renderRow(makeActions(), 'new', onRequestEdit);

      await user.click(screen.getByRole('button', { name: 'More actions for Buy groceries' }));
      await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

      expect(onRequestEdit).toHaveBeenCalledOnce();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('deletion', () => {
    it('does not delete when confirmation is cancelled', async () => {
      const user = userEvent.setup();
      const removeDutyy = vi.fn();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderRow(makeActions({ removeDutyy }));

      await user.click(screen.getByRole('button', { name: 'More actions for Buy groceries' }));
      await user.click(screen.getByRole('menuitem', { name: 'Delete Buy groceries' }));

      expect(window.confirm).toHaveBeenCalledWith(
        'Delete "Buy groceries"? This action cannot be undone.',
      );
      expect(removeDutyy).not.toHaveBeenCalled();
      expect(screen.getByText('Buy groceries')).toBeVisible();
    });

    it('deletes after confirmation', async () => {
      const user = userEvent.setup();
      const removeDutyy = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const { dutyy } = renderRow(makeActions({ removeDutyy }));

      await user.click(screen.getByRole('button', { name: 'More actions for Buy groceries' }));
      await user.click(screen.getByRole('menuitem', { name: 'Delete Buy groceries' }));

      await waitFor(() => expect(removeDutyy).toHaveBeenCalledWith('project-1', dutyy.id));
      expect(screen.getByText('Deleted')).toBeVisible();
      expect(screen.getByRole('button', { name: 'More actions for Buy groceries' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Complete Buy groceries' })).toBeDisabled();
      expect(removeDutyy).toHaveBeenCalledOnce();
    });
  });
});
