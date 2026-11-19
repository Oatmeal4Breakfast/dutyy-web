import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { makeDutyy, makeProject } from '../test/fixtures';
import { server } from '../test/server';
import DashboardPage from './DashboardPage';

const API = '*/dutyy/api/v1';

describe('DashboardPage duty synchronization', () => {
  it('refreshes the affected project after completing a dutyy', async () => {
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
    const refreshRequests: string[] = [];

    server.use(
      http.get(`${API}/projects`, () => HttpResponse.json([initialProject])),
      http.patch(`${API}/dutyys/${completedDutyy.id}`, async ({ request }) => {
        expect(await request.json()).toEqual({ status: 'complete' });
        return HttpResponse.json(completedDutyy);
      }),
      http.get(`${API}/projects/:projectId`, ({ params }) => {
        refreshRequests.push(String(params.projectId));
        return HttpResponse.json(refreshedProject);
      }),
    );

    render(<DashboardPage />);

    expect(await screen.findByText('0 of 1')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Show dutyys for Household' }));
    await user.click(screen.getByRole('button', { name: 'Complete Buy groceries' }));

    expect(await screen.findByText('1 of 1')).toBeVisible();
    expect(refreshRequests).toEqual(['project-1']);
    expect(screen.getByText('complete')).toBeVisible();
  });
});
