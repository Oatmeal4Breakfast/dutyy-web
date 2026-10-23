import { apiRequest } from './client';
import type { ProjectStatus, Project, Dutyy, PublishingStatus } from './types';
import type { SessionState } from './auth';

export function getProjects(): Promise<Project[]> {
  return apiRequest('/projects', {
    method: 'GET',
  });
}

export function getProjectById(projectId: string): Promise<Project> {
  return apiRequest(`/projects/${projectId}`, {
    method: 'GET',
  });
}
