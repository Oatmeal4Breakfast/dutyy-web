export type UserStatus = "active" | "inactive" | "blocked";

export type UserSummary = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: UserStatus;
};

export type LoginResponse = { user_summary: UserSummary };

export type SessionState = {
  user_summary: UserSummary;
  idle_expires_at: string;
  absolute_expires_at: string;
};

export type KeyLifeTime = "thirty_days" | "ninety_days" | "one_year";
