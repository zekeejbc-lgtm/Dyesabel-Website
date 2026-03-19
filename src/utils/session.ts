import { SESSION_TOKEN_KEY } from '../types';

export const getSessionToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  return token && token.trim() ? token : null;
};
