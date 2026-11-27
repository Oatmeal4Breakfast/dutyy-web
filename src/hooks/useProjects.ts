import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '../api/client';
import {
  addDutyy,
  createProject,
  deleteDutyy,
  deleteProject,
  getProjects,
  patchDutyy,
  patchProject,
  type CreateDutyyRequest,
  type CreateProjectRequest,
  type PatchDutyyRequest,
  type Project,
  type UpdateProjectRequest,
} from '../api/projects';
import { projectKeys } from '../queries/queryKeys';

const PROJECTS_REFRESH_ERROR =
  'The project list could not be refreshed. Displayed data may be out of date.';

function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;

  const detail = error.getDetail();
  return detail ? String(detail) : error.message;
}

export default function useProjects(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = projectKeys.list(userId);
  const projectsQuery = useQuery({
    queryKey,
    queryFn: ({ signal }) => getProjects(signal),
  });

  function reconcileProjects(): void {
    void queryClient.invalidateQueries({ queryKey, exact: true });
  }

  const createProjectMutation = useMutation({
    mutationFn: (payload: CreateProjectRequest) => createProject(payload),
    onSuccess: (createdProject) => {
      queryClient.setQueryData<Project[]>(queryKey, (current) => [
        ...(current?.filter((project) => project.id !== createdProject.id) ?? []),
        createdProject,
      ]);
      reconcileProjects();
    },
  });

  const completeProjectMutation = useMutation({
    mutationFn: (projectId: string) => patchProject(projectId, { status: 'complete' }),
    onSuccess: reconcileProjects,
  });

  const addDutyyMutation = useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: CreateDutyyRequest }) =>
      addDutyy(projectId, payload),
    onSuccess: reconcileProjects,
  });

  const editProjectMutation = useMutation({
    mutationFn: ({ projectId, payload }: { projectId: string; payload: UpdateProjectRequest }) =>
      patchProject(projectId, payload),
    onSuccess: reconcileProjects,
  });

  const editDutyyMutation = useMutation({
    mutationFn: ({
      dutyyId,
      payload,
    }: {
      projectId: string;
      dutyyId: string;
      payload: PatchDutyyRequest;
    }) => patchDutyy(dutyyId, payload),
    onSuccess: reconcileProjects,
  });

  const completeDutyyMutation = useMutation({
    mutationFn: ({ dutyyId }: { projectId: string; dutyyId: string }) =>
      patchDutyy(dutyyId, { status: 'complete' }),
    onSuccess: reconcileProjects,
  });

  const removeDutyyMutation = useMutation({
    mutationFn: ({ projectId, dutyyId }: { projectId: string; dutyyId: string }) =>
      deleteDutyy(projectId, dutyyId),
    onSuccess: reconcileProjects,
  });

  const removeProjectMutation = useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: (_, projectId) => {
      queryClient.setQueryData<Project[]>(queryKey, (current) =>
        current?.filter((project) => project.id !== projectId),
      );
      reconcileProjects();
    },
  });

  const loading = projectsQuery.data === undefined && projectsQuery.isFetching;
  const loadError =
    !loading && projectsQuery.data === undefined && projectsQuery.error
      ? getErrorMessage(projectsQuery.error, 'Unable to load projects')
      : null;
  const refreshError =
    projectsQuery.data !== undefined && projectsQuery.error ? PROJECTS_REFRESH_ERROR : null;

  return {
    projects: projectsQuery.data ?? [],
    loading,
    refreshing: projectsQuery.data !== undefined && projectsQuery.isFetching,
    loadError,
    refreshError,
    retry: () => projectsQuery.refetch(),
    createProject: (payload: CreateProjectRequest) => createProjectMutation.mutateAsync(payload),
    completeProject: async (projectId: string): Promise<void> => {
      await completeProjectMutation.mutateAsync(projectId);
    },
    addDutyyToProject: async (projectId: string, payload: CreateDutyyRequest): Promise<void> => {
      await addDutyyMutation.mutateAsync({ projectId, payload });
    },
    editProject: async (projectId: string, payload: UpdateProjectRequest): Promise<void> => {
      await editProjectMutation.mutateAsync({ projectId, payload });
    },
    editDutyy: async (
      projectId: string,
      dutyyId: string,
      payload: PatchDutyyRequest,
    ): Promise<void> => {
      await editDutyyMutation.mutateAsync({ projectId, dutyyId, payload });
    },
    completeDutyy: async (projectId: string, dutyyId: string): Promise<void> => {
      await completeDutyyMutation.mutateAsync({ projectId, dutyyId });
    },
    removeDutyy: async (projectId: string, dutyyId: string): Promise<void> => {
      await removeDutyyMutation.mutateAsync({ projectId, dutyyId });
    },
    removeProject: async (projectId: string): Promise<void> => {
      await removeProjectMutation.mutateAsync(projectId);
    },
  };
}
