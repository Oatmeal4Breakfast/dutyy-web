import { apiRequest } from './client';
import type { Project, ProjectStatus } from './types';

export type updateProjectRequest = {
  projectId: string;
  name: string | null;
  status: ProjectStatus | null;
};

export function getProjects(): Promise<Project[]> {
  return apiRequest<Project[]>('/projects', {
    method: 'GET',
  });
}

export function getProjectById(projectId: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'GET',
  });
}

export function createProject(projectName: string): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: projectName,
    }),
  });
}

export function updateProject(payload: updateProjectRequest): Promise<Project> {
  const hasValue: boolean = [payload.name, payload.status].some(
    (p) => p !== null && p !== undefined && p !== '',
  );
  if (!hasValue) {
    throw new Error('No fields provided to update');
  }

  return apiRequest(`/projects/${encodeURIComponent(payload.projectId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
