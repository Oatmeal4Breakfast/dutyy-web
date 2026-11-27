export const sessionKeys = {
  all: ['session'] as const,
};

export const projectKeys = {
  all: ['projects'] as const,
  byUser: (userId: string) => [...projectKeys.all, userId] as const,
  list: (userId: string) => [...projectKeys.byUser(userId), 'list'] as const,
};

export const apiKeyKeys = {
  all: ['apiKeys'] as const,
  byUser: (userId: string) => [...apiKeyKeys.all, userId] as const,
  list: (userId: string) => [...apiKeyKeys.byUser(userId), 'list'] as const,
};
