import type { Dutyy, Project } from '../api/projects';

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
