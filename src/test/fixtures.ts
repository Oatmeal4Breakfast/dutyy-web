import type { Dutyy, Project } from '../api/projects';
import type { SessionState } from '../api/auth';
import type { UserSummary } from '../api/users';

export function makeDutyy(overrides: Partial<Dutyy> = {}): Dutyy {
  return {
    id: 'dutyy-1',
    title: 'Buy groceries',
    details: 'Milk and eggs',
    status: 'new',
    project_id: 'project-1',
    created_date: '2026-11-19T10:00:00Z',
    modified_date: null,
    completed_date: null,
    ...overrides,
  };
}

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    name: 'Household',
    owner_id: 'user-1',
    status: 'in_progress',
    publishing_status: 'draft',
    created_date: '2026-11-19T09:00:00Z',
    modified_date: null,
    published_date: null,
    completed_date: null,
    dutyys: [makeDutyy()],
    ...overrides,
  };
}

export function makeSession(overrides: Partial<SessionState> = {}): SessionState {
  return {
    user_summary: makeUser(),
    idle_expires_at: '2026-11-20T11:00:00Z',
    absolute_expires_at: '2026-11-27T11:00:00Z',
    ...overrides,
  };
}
export function makeUser(overrides: Partial<UserSummary> = {}): UserSummary {
  return {
    id: 'user-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    status: 'active',
    last_login: null,
    modified_date: null,
    created_date: '2026-11-19T09:00:00Z',
    ...overrides,
  };
}
