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
