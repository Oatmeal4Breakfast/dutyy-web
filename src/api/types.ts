export type UserStatus = 'active' | 'inactive' | 'blocked';

export type UserSignUpRequest = {
  first_name: string;
  last_name: string;
  email: string;
};

export type UserUpdateRequest = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

export type ProjectStatus = 'new' | 'in_progress' | 'complete' | 'abandoned';

export type PublishingStatus = 'draft' | 'published';

export type DutyyStatus = 'new' | 'in_progress' | 'complete';

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

export type UserSummary = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: UserStatus;
  last_login: string | null;
  modified_date: string | null;
  created_date: string;
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

export type APIKeyStatus = 'active' | 'inactive';

export type TTL = '7d' | '30d' | '90d' | '1y';

export type NewKeyRequest = {
  key_name: string;
  ttl: TTL;
};

export type APIKeyResponse = {
  id: string;
  name: string;
  status: APIKeyStatus;
  created_date: string;
  last_used: string | null;
  expires_at: string | null;
};

export type APIKey = {
  'api-key': string;
};
