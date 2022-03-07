import { Sdk, AuthTokenQuery, RefreshTokenQuery } from './operations.generated';

export type AuthenticationError = {
  message: string;
};

export interface AuthenticationResponse {
  token: string;
  error?: AuthenticationError;
}

export interface RefreshResponse {
  token: string;
}

const authTokenGuard = (
  authTokenQuery: AuthTokenQuery
): AuthenticationResponse => {
  if (authTokenQuery.authToken.__typename === 'AuthToken') {
    return { token: authTokenQuery.authToken.token };
  }

  if (authTokenQuery.authToken.__typename === 'AuthTokenError') {
    switch (authTokenQuery.authToken.error.__typename) {
      case 'DatabaseError':
      case 'InternalError':
        return {
          token: '',
          error: { message: authTokenQuery.authToken.error.description },
        };
    }
  }

  return { token: '', error: { message: '' } };
};

const refreshTokenGuard = (
  refreshTokenQuery: RefreshTokenQuery
): RefreshResponse => {
  if (refreshTokenQuery.refreshToken.__typename === 'RefreshToken') {
    return { token: refreshTokenQuery.refreshToken.token };
  }

  return { token: '' };
};

export const getAuthQueries = (sdk: Sdk) => ({
  get: {
    authToken: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }): Promise<AuthenticationResponse> => {
      const result = await sdk.authToken({
        username,
        password,
      });
      return authTokenGuard(result);
    },
    refreshToken: async (): Promise<RefreshResponse> => {
      const result = await sdk.refreshToken();
      return refreshTokenGuard(result);
    },
  },
});