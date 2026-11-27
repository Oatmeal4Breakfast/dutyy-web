import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EditProjectModal } from './EditProjectModal';

describe('EditProjectModal', () => {
  it('preserves touched drafts without submitting refreshed untouched fields', async () => {
    const user = userEvent.setup();
    const editProject = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const { rerender } = render(
      <EditProjectModal
        projectId="project-1"
        currentProjectName="Household"
        currentProjectStatus="in_progress"
        editProject={editProject}
        onClose={onClose}
      />,
    );

    const name = screen.getByRole('textbox', { name: 'Name' });
    await user.clear(name);
    await user.type(name, 'My project draft');

    rerender(
      <EditProjectModal
        projectId="project-1"
        currentProjectName="Server project name"
        currentProjectStatus="complete"
        editProject={editProject}
        onClose={onClose}
      />,
    );

    expect(name).toHaveValue('My project draft');
    expect(screen.getByRole('combobox', { name: 'Project Status' })).toHaveValue('complete');

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(editProject).toHaveBeenCalledWith('project-1', {
      name: 'My project draft',
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('resumes following refreshed props after a reverted edit', async () => {
    const user = userEvent.setup();
    const editProject = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(
      <EditProjectModal
        projectId="project-1"
        currentProjectName="Household"
        currentProjectStatus="in_progress"
        editProject={editProject}
        onClose={onClose}
      />,
    );

    const name = screen.getByRole('textbox', { name: 'Name' });
    const status = screen.getByRole('combobox', { name: 'Project Status' });
    await user.clear(name);
    await user.type(name, 'Temporary');
    await user.clear(name);
    await user.type(name, 'Household');
    await user.selectOptions(status, 'complete');
    await user.selectOptions(status, 'in_progress');

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();

    rerender(
      <EditProjectModal
        projectId="project-1"
        currentProjectName="Server project name"
        currentProjectStatus="abandoned"
        editProject={editProject}
        onClose={onClose}
      />,
    );

    expect(name).toHaveValue('Server project name');
    expect(status).toHaveValue('abandoned');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('keeps whitespace in a draft instead of snapping back to props', async () => {
    const user = userEvent.setup();
    render(
      <EditProjectModal
        projectId="project-1"
        currentProjectName="Household"
        currentProjectStatus="in_progress"
        editProject={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const name = screen.getByRole('textbox', { name: 'Name' });
    await user.type(name, ' ');

    expect(name).toHaveValue('Household ');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });
});
