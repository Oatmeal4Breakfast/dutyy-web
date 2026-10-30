import { apiRequest } from './client';
import type {
  Project,
  Dutyy,
  CreateDutyyRequest,
  PatchDutyyRequest,
  UpdateProjectRequest,
} from './types';

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

export function patchProject(projectId: string, payload: UpdateProjectRequest): Promise<Project> {
  const hasValue: boolean = [payload.name, payload.status].some(
    (p) => p !== null && p !== undefined && p.trim() !== '',
  );
  if (!hasValue) {
    throw new Error('No fields provided to update');
  }

  return apiRequest(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function publishProject(projectId: string): Promise<void> {
  return apiRequest(`/projects/${encodeURIComponent(projectId)}/publish`, {
    method: 'POST',
  });
}

export function unpublishProject(projectId: string): Promise<Project> {
  return apiRequest(`/projects/${encodeURIComponent(projectId)}/unpublish`, {
    method: 'POST',
  });
}

export function addDutyy(projectId: string, dutyy: CreateDutyyRequest): Promise<Dutyy> {
  return apiRequest(`/projects/${encodeURIComponent(projectId)}/dutyys`, {
    method: 'POST',
    body: JSON.stringify(dutyy),
  });
}

export function patchDutyy(dutyyId: string, patch: PatchDutyyRequest): Promise<Dutyy> {
  const hasValue: boolean = [patch.title, patch.details, patch.status].some(
    (p) => p !== null && p !== undefined && p.trim() !== '',
  );

  if (!hasValue) {
    throw new Error('No fields provided to update');
  }
  return apiRequest(`/dutyys/${encodeURIComponent(dutyyId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deleteDutyy(projectId: string, dutyyId: string): Promise<void> {
  return apiRequest(
    `/projects/${encodeURIComponent(projectId)}/dutyys/${encodeURIComponent(dutyyId)}`,
    {
      method: 'DELETE',
    },
  );
}
