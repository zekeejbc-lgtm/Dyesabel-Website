import { APP_CONFIG, requireConfig } from '../config';
import { dispatchAuthInvalidEvent } from '../utils/session';

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
}

type ApiTarget = 'main' | 'users' | 'donations';

const isAuthInvalidError = (error?: string): boolean => {
  const normalized = String(error || '').toLowerCase();
  return normalized.includes('unauthorized') ||
    normalized.includes('session expired') ||
    normalized.includes('session invalid') ||
    normalized.includes('session revoked');
};

const resolveApiUrl = (target: ApiTarget): string => {
  if (target === 'main') {
    return requireConfig(APP_CONFIG.mainApiUrl, 'VITE_MAIN_API_URL');
  }
  if (target === 'users') {
    return requireConfig(APP_CONFIG.usersApiUrl, 'VITE_USERS_API_URL');
  }
  return requireConfig(APP_CONFIG.donationsApiUrl, 'VITE_DONATIONS_API_URL');
};

const fetchWithTextPlain = async (url: string, payload: string): Promise<Response> => {
  return fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain' },
    body: payload
  });
};

const fetchWithMinimalHeaders = async (url: string, payload: string): Promise<Response> => {
  return fetch(url, {
    method: 'POST',
    redirect: 'follow',
    body: payload
  });
};

const formatRequestError = (error: string): string => {
  if (error.includes('not configured')) return error;
  if (error.includes('fetch') || error.includes('Network')) {
    return 'Unable to reach server. Please check your internet connection.';
  }
  if (error.includes('HTTP 403') || error.includes('forbidden')) {
    return 'Access denied. Please ensure the server is properly configured.';
  }
  if (error.includes('HTTP 500')) {
    return 'Server error. Please try again later.';
  }
  if (error.includes('JSON')) {
    return 'Invalid server response. Please contact support.';
  }
  return 'Connection failed. Please try again.';
};

export const sendApiRequest = async <T>(
  target: ApiTarget,
  payload: object
): Promise<ApiResponse<T>> => {
  let url: string;
  try {
    url = resolveApiUrl(target);
  } catch (error) {
    const configError = error instanceof Error ? error : new Error(String(error));
    console.error(`[apiClient] ${target} API configuration error`, {
      target,
      payload,
      message: configError.message
    });
    return {
      success: false,
      error: formatRequestError(configError.message)
    };
  }
  const payloadJson = JSON.stringify(payload);
  const strategies = [fetchWithTextPlain, fetchWithMinimalHeaders];
  let lastError: Error | null = null;

  for (const strategy of strategies) {
    try {
      const response = await strategy(url, payloadJson);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data || data.success === false) {
        if (isAuthInvalidError(data?.error)) {
          dispatchAuthInvalidEvent(data.error);
        }
      }
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error('[apiClient] Request attempt failed', {
        target,
        url,
        payload,
        strategy: strategy.name,
        message: lastError.message
      });
      if (strategy !== strategies[strategies.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }

  console.error('[apiClient] All request attempts failed', {
    target,
    url,
    payload,
    message: lastError?.message || 'Network Error'
  });
  return {
    success: false,
    error: formatRequestError(lastError?.message || 'Network Error')
  };
};
