import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../api/client';
import { makeDutyy } from '../test/fixtures';
import EditDutyyModal from './EditDutyyModal';

describe('EditDutyyModal', () => {
  it('starts with current values and disables unchanged submission', () => {
    const dutyy = makeDutyy();

    render(
      <EditDutyyModal dutyy={dutyy} projectId="project-1" editDutyy={vi.fn()} onClose={vi.fn()} />,
    );

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Buy groceries');
    expect(screen.getByRole('textbox', { name: 'Details' })).toHaveValue('Milk and eggs');
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('new');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('submits only changed fields and supports clearing details', async () => {
    const user = userEvent.setup();
    const editDutyy = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const dutyy = makeDutyy();
    render(
      <EditDutyyModal
        dutyy={dutyy}
        projectId="project-1"
        editDutyy={editDutyy}
        onClose={onClose}
      />,
    );

    await user.clear(screen.getByRole('textbox', { name: 'Details' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'complete');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(editDutyy).toHaveBeenCalledWith('project-1', dutyy.id, {
      details: null,
      status: 'complete',
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('preserves touched drafts without submitting refreshed untouched fields', async () => {
    const user = userEvent.setup();
    const editDutyy = vi.fn().mockResolvedValue(undefined);
    const initialDutyy = makeDutyy();
    const { rerender } = render(
      <EditDutyyModal
        dutyy={initialDutyy}
        projectId="project-1"
        editDutyy={editDutyy}
        onClose={vi.fn()}
      />,
    );

    const title = screen.getByRole('textbox', { name: 'Title' });
    await user.clear(title);
    await user.type(title, 'My title draft');

    const refreshedDutyy = makeDutyy({
      title: 'Server title',
      details: 'Server details',
      status: 'complete',
    });
    rerender(
      <EditDutyyModal
        dutyy={refreshedDutyy}
        projectId="project-1"
        editDutyy={editDutyy}
        onClose={vi.fn()}
      />,
    );

    expect(title).toHaveValue('My title draft');
    expect(screen.getByRole('textbox', { name: 'Details' })).toHaveValue('Server details');
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('complete');

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(editDutyy).toHaveBeenCalledWith('project-1', refreshedDutyy.id, {
      title: 'My title draft',
    });
  });

  it('resumes following refreshed props after a reverted edit', async () => {
    const user = userEvent.setup();
    const editDutyy = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(
      <EditDutyyModal
        dutyy={makeDutyy()}
        projectId="project-1"
        editDutyy={editDutyy}
        onClose={onClose}
      />,
    );

    const title = screen.getByRole('textbox', { name: 'Title' });
    const details = screen.getByRole('textbox', { name: 'Details' });
    const status = screen.getByRole('combobox', { name: 'Status' });
    await user.clear(title);
    await user.type(title, 'Temporary title');
    await user.clear(title);
    await user.type(title, 'Buy groceries');
    await user.clear(details);
    await user.type(details, 'Temporary details');
    await user.clear(details);
    await user.type(details, 'Milk and eggs');
    await user.selectOptions(status, 'in_progress');
    await user.selectOptions(status, 'new');

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();

    rerender(
      <EditDutyyModal
        dutyy={makeDutyy({
          title: 'Server title',
          details: 'Server details',
          status: 'complete',
        })}
        projectId="project-1"
        editDutyy={editDutyy}
        onClose={onClose}
      />,
    );

    expect(title).toHaveValue('Server title');
    expect(details).toHaveValue('Server details');
    expect(status).toHaveValue('complete');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('keeps the dialog open and shows API failures', async () => {
    const user = userEvent.setup();
    const editDutyy = vi
      .fn()
      .mockRejectedValue(new ApiError(422, { detail: 'That title is unavailable' }));
    const onClose = vi.fn();
    render(
      <EditDutyyModal
        dutyy={makeDutyy()}
        projectId="project-1"
        editDutyy={editDutyy}
        onClose={onClose}
      />,
    );

    const title = screen.getByRole('textbox', { name: 'Title' });
    await user.clear(title);
    await user.type(title, 'Weekly shopping');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That title is unavailable');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
