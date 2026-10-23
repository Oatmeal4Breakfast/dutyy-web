export type UserStatus = 'active' | 'inactive' | 'blocked';

export type ProjectStatus = 'new' | 'in_progress' | 'complete' | 'abandoned';

export type PublishingStatus = 'draft' | 'published';

export type DutyyStatus = 'new' | 'in_progress' | 'complete';

export type UserSummary = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: UserStatus;
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
  publishing_date: string | null;
  completed_date: string | null;
  dutyys: Dutyy[];
};
