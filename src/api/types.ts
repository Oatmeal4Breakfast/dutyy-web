export type UserStatus = 'active' | 'inactive' | 'blocked';

export type UserSummary = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: UserStatus;
};
