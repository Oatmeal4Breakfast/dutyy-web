import { apiRequest } from './client';

export type ProjectStatus = 'new' | 'in_progress' | 'complete' | 'abandoned';

export type PublishingStatus = 'draft' | 'published';

export type DutyyStatus = 'new' | 'in_progress' | 'complete';

export type CreateProjectRequest = {
  name: string;
  dutyys?: CreateDutyyRequest[];
};

export type CreateDutyyRequest = {
  title: string;
  details?: string | null;
};

export type PatchDutyyRequest = {
  title?: string | null;
  status?: DutyyStatus | null;
  details?: string | null;
};

export type UpdateProjectRequest = {
  name?: string | null;
  status?: ProjectStatus | null;
};

export type Dutyy = {
  id: string;
  title: string;
  details: string | null;
  status: DutyyStatus;
  project_id: string;
  created_date: string;
  modified_date: string | null;
  completed_date: string | null;
};

export type Project = {
  id: string;
  name: string;
  owner_id: string;
  status: ProjectStatus;
  publishing_status: PublishingStatus;
  created_date: string;
  modified_date: string | null;
  published_date: string | null;
  completed_date: string | null;
  dutyys: Dutyy[];
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

export function createProject(payload: CreateProjectRequest): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
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
