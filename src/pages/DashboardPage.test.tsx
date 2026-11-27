import { onlineManager } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { projectKeys } from '../queries/queryKeys';
import { makeDutyy, makeProject } from '../test/fixtures';
import { renderWithQueryClient } from '../test/renderWithQueryClient';
import { server } from '../test/server';
import DashboardPage from './DashboardPage';

const API = '*/dutyy/api/v1';
const USER_ID = 'user-1';
const REFRESH_ERROR = 'The project list could not be refreshed. Displayed data may be out of date.';

function renderPage() {
  return renderWithQueryClient(<DashboardPage userId={USER_ID} />);
}

describe('DashboardPage project synchronization', () => {
  it('reconciles a dutyy mutation through the canonical project list', async () => {
    const user = userEvent.setup();
    const initialProject = makeProject();
    const completedDutyy = makeDutyy({
      status: 'complete',
      modified_date: '2026-11-19T11:00:00Z',
      completed_date: '2026-11-19T11:00:00Z',
    });
    const refreshedProject = makeProject({
      modified_date: '2026-11-19T11:00:00Z',
      dutyys: [completedDutyy],
    });
    let listRequests = 0;
    let detailRequests = 0;

    server.use(
      http.get(`${API}/projects`, () => {
        listRequests += 1;
        return HttpResponse.json(listRequests === 1 ? [initialProject] : [refreshedProject]);
      }),
      http.get(`${API}/projects/:projectId`, () => {
        detailRequests += 1;
        return HttpResponse.json(refreshedProject);
      }),
      http.patch(`${API}/dutyys/${completedDutyy.id}`, async ({ request }) => {
        expect(await request.json()).toEqual({ status: 'complete' });
        return HttpResponse.json(completedDutyy);
      }),
    );

    const { queryClient } = renderPage();

    expect(await screen.findByText('0 of 1')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Show dutyys for Household' }));
    await user.click(screen.getByRole('button', { name: 'Complete Buy groceries' }));

    expect(await screen.findByText('1 of 1')).toBeVisible();
    expect(screen.getByText('complete')).toBeVisible();
    expect(queryClient.getQueryData(projectKeys.list(USER_ID))).toEqual([refreshedProject]);
    expect(listRequests).toBe(2);
    expect(detailRequests).toBe(0);
  });

  it('separates mutation success from a failed background reconciliation', async () => {
    const user = userEvent.setup();
    const initialProject = makeProject();
    const completedDutyy = makeDutyy({ status: 'complete' });
    let listRequests = 0;
    let patchRequests = 0;

    server.use(
      http.get(`${API}/projects`, () => {
        listRequests += 1;
        return listRequests === 1
          ? HttpResponse.json([initialProject])
          : HttpResponse.json({ detail: 'database unavailable' }, { status: 503 });
      }),
      http.patch(`${API}/dutyys/${completedDutyy.id}`, () => {
        patchRequests += 1;
        return HttpResponse.json(completedDutyy);
      }),
    );

    renderPage();

    expect(await screen.findByText('0 of 1')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Show dutyys for Household' }));
    await user.click(screen.getByRole('button', { name: 'Complete Buy groceries' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(REFRESH_ERROR);
    expect(screen.getByText('0 of 1')).toBeVisible();
    const completeButton = screen.getByRole('button', { name: 'Complete Buy groceries' });
    expect(completeButton).toBeDisabled();
    await user.click(completeButton);
    expect(patchRequests).toBe(1);
  });

  it('does not allow a confirmed project completion to be repeated while data is stale', async () => {
    const user = userEvent.setup();
    const project = makeProject({ dutyys: [] });
    let listRequests = 0;
    let patchRequests = 0;

    server.use(
      http.get(`${API}/projects`, () => {
        listRequests += 1;
        return listRequests === 1
          ? HttpResponse.json([project])
          : HttpResponse.json({ detail: 'database unavailable' }, { status: 503 });
      }),
      http.patch(`${API}/projects/${project.id}`, () => {
        patchRequests += 1;
        return HttpResponse.json({ ...project, status: 'complete' });
      }),
    );

    renderPage();

    await screen.findByText(project.name);
    const completeButton = screen.getByRole('button', { name: `Complete ${project.name}` });
    await user.click(completeButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(REFRESH_ERROR);
    expect(completeButton).toBeDisabled();
    await user.click(completeButton);
    expect(patchRequests).toBe(1);
  });

  it('keeps project mutation failures with the initiating row', async () => {
    const user = userEvent.setup();
    const project = makeProject({ dutyys: [] });
    let patchRequests = 0;

    server.use(
      http.get(`${API}/projects`, () => HttpResponse.json([project])),
      http.patch(`${API}/projects/${project.id}`, () => {
        patchRequests += 1;
        return HttpResponse.json({ detail: 'Completion unavailable' }, { status: 503 });
      }),
    );

    renderPage();

    await screen.findByText(project.name);
    await user.click(screen.getByRole('button', { name: `Complete ${project.name}` }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Completion unavailable');
    expect(screen.getByRole('button', { name: `Complete ${project.name}` })).toBeEnabled();
    expect(patchRequests).toBe(1);
  });

  it('retries an initial project load error', async () => {
    const user = userEvent.setup();
    const project = makeProject();
    let listRequests = 0;

    server.use(
      http.get(`${API}/projects`, () => {
        listRequests += 1;
        return listRequests === 1
          ? HttpResponse.json({ detail: 'database unavailable' }, { status: 503 })
          : HttpResponse.json([project]);
      }),
    );

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('database unavailable');
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(project.name)).toBeVisible();
    expect(listRequests).toBe(2);
  });

  it('shows a pending state when the initial query is paused', async () => {
    onlineManager.setOnline(false);
    server.use(http.get(`${API}/projects`, () => HttpResponse.json([])));

    const { unmount } = renderPage();

    try {
      expect(await screen.findByRole('status')).toHaveTextContent('Loading Projects');
      expect(screen.queryByText('No projects yet.')).not.toBeInTheDocument();
    } finally {
      unmount();
      onlineManager.setOnline(true);
    }
  });

  it('keeps a created project when background reconciliation fails', async () => {
    const user = userEvent.setup();
    const createdProject = makeProject({ id: 'project-new', name: 'New project', dutyys: [] });
    let listRequests = 0;
    let createRequests = 0;

    server.use(
      http.get(`${API}/projects`, () => {
        listRequests += 1;
        return listRequests === 1
          ? HttpResponse.json([])
          : HttpResponse.json({ detail: 'database unavailable' }, { status: 503 });
      }),
      http.post(`${API}/projects`, async ({ request }) => {
        createRequests += 1;
        expect(await request.json()).toEqual({ name: 'New project' });
        return HttpResponse.json(createdProject, { status: 201 });
      }),
    );

    const { queryClient } = renderPage();

    await screen.findByText('No projects yet.');
    await user.click(screen.getByRole('button', { name: 'New Project' }));
    await user.type(screen.getByLabelText('Project Name'), 'New project');
    await user.click(screen.getByRole('button', { name: 'Create Project' }));

    expect(await screen.findByText('Project "New project" created.')).toBeVisible();
    expect(await screen.findByText('New project')).toBeVisible();
    expect(await screen.findByRole('alert')).toHaveTextContent(REFRESH_ERROR);
    expect(queryClient.getQueryData(projectKeys.list(USER_ID))).toEqual([createdProject]);
    expect(createRequests).toBe(1);
  });

  it('removes a deleted project even when background reconciliation fails', async () => {
    const user = userEvent.setup();
    const project = makeProject({ dutyys: [] });
    let listRequests = 0;
    let deleteRequests = 0;
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    server.use(
      http.get(`${API}/projects`, () => {
        listRequests += 1;
        return listRequests === 1
          ? HttpResponse.json([project])
          : HttpResponse.json({ detail: 'database unavailable' }, { status: 503 });
      }),
      http.delete(`${API}/projects/${project.id}`, () => {
        deleteRequests += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { queryClient } = renderPage();

    await screen.findByText(project.name);
    await user.click(screen.getByRole('button', { name: `Delete ${project.name}` }));

    expect(await screen.findByText('No projects yet.')).toBeVisible();
    expect(await screen.findByRole('alert')).toHaveTextContent(REFRESH_ERROR);
    expect(queryClient.getQueryData(projectKeys.list(USER_ID))).toEqual([]);
    expect(deleteRequests).toBe(1);
  });
});
