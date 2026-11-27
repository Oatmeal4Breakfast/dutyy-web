import { apiKeyKeys, projectKeys, sessionKeys } from './queryKeys';

describe('query keys', () => {
  it('provides stable feature roots for complete cache removal', () => {
    expect(projectKeys.all).toEqual(['projects']);
    expect(apiKeyKeys.all).toEqual(['apiKeys']);
  });

  it('keeps user-scoped data isolated by user ID', () => {
    expect(projectKeys.byUser('user-1')).toEqual(['projects', 'user-1']);
    expect(projectKeys.list('user-1')).toEqual(['projects', 'user-1', 'list']);
    expect(projectKeys.list('user-2')).not.toEqual(projectKeys.list('user-1'));
    expect(apiKeyKeys.byUser('user-1')).toEqual(['apiKeys', 'user-1']);
    expect(apiKeyKeys.list('user-1')).toEqual(['apiKeys', 'user-1', 'list']);
    expect(apiKeyKeys.list('user-2')).not.toEqual(apiKeyKeys.list('user-1'));
  });

  it('uses one application session key', () => {
    expect(sessionKeys.all).toEqual(['session']);
  });
});
