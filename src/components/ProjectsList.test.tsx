import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { makeDutyy, makeProject } from '../test/fixtures';
import type { ProjectActions } from './ProjectRow';
import ProjectsList from './ProjectsList';

function makeActions(): ProjectActions {
  return {
    completeProject: vi.fn(),
    addDutyyToProject: vi.fn(),
    editProject: vi.fn(),
    editDutyy: vi.fn(),
    completeDutyy: vi.fn(),
    removeDutyy: vi.fn(),
    removeProject: vi.fn(),
  };
}

describe('ProjectsList selections', () => {
  it('resolves an edited dutyy by ID while preserving the form draft', async () => {
    const user = userEvent.setup();
    const actions = makeActions();
    const project = makeProject();
    const { rerender } = render(<ProjectsList projects={[project]} actions={actions} />);

    await user.click(screen.getByRole('button', { name: 'Show dutyys for Household' }));
    await user.click(screen.getByRole('button', { name: 'More actions for Buy groceries' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    const titleInput = screen.getByLabelText('Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'My local draft');

    const refreshedProject = makeProject({
      name: 'Updated household',
      status: 'complete',
      dutyys: [makeDutyy({ title: 'Server title' })],
    });
    rerender(<ProjectsList projects={[refreshedProject]} actions={actions} />);

    expect(screen.getByRole('heading', { name: 'Edit Server title' })).toBeVisible();
    expect(titleInput).toHaveValue('My local draft');
    expect(screen.queryByText('Updated household')).not.toBeInTheDocument();
  });
});
