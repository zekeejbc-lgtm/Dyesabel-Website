// ==========================================
// 1. CONFIGURATION
// ==========================================

// Replace this with your actual Web App URL from the Google Apps Script deployment
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbx6jSvrQOC8dh9rtZ9Ort368Q2a--aSEcx7mmWNTfdonGWQglcNPGxM3HLOndS4Mt1ahQ/exec';

// ==========================================
// 2. IMPORTS & TYPES
// ==========================================

import { User } from '../types';

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  // Dynamic data fields based on the specific request
  [key: string]: any;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ==========================================
// 3. CORS BYPASS UTILITIES
// ==========================================

/**
 * Detects if running on mobile/app environment
 */
const isMobileEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent) ||
         /capacitor|cordova/.test(userAgent);
};

/**
 * CORS Bypass Strategy 1: text/plain header (Primary - sidles CORS preflight)
 */
const fetchWithTextPlain = async (url: string, payload: string): Promise<Response> => {
  return fetch(url, {
    method: 'POST',
    redirect: 'follow',
    // REMOVE charset to ensure this is treated strictly as a Simple Request
    // This prevents the browser from sending an OPTIONS preflight check
    headers: { 'Content-Type': 'text/plain' },
    body: payload
  });
};

/**
 * CORS Bypass Strategy 2: Minimal headers (Fallback)
 */
const fetchWithMinimalHeaders = async (url: string, payload: string): Promise<Response> => {
  return fetch(url, {
    method: 'POST',
    redirect: 'follow',
    body: payload
  });
};

/**
 * CORS Bypass Strategy 3: CORS Proxy (Last resort for mobile)
 */
const fetchWithProxy = async (url: string, payload: string): Promise<Response> => {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  return fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: payload
  });
};

/**
 * Attempts to send request with fallback CORS strategies
 * Strategy Order:
 * 1. text/plain header (fastest, prevents preflight)
 * 2. Minimal headers (fallback if #1 fails)
 * 3. CORS proxy (last resort for mobile environments)
 */
const attemptCORSBypass = async (
  url: string,
  payload: string,
  strategy: 'text-plain' | 'minimal' | 'proxy' = 'text-plain'
): Promise<Response> => {
  try {
    if (strategy === 'text-plain') {
      return await fetchWithTextPlain(url, payload);
    } else if (strategy === 'minimal') {
      return await fetchWithMinimalHeaders(url, payload);
    } else {
      return await fetchWithProxy(url, payload);
    }
  } catch (error) {
    console.warn(`CORS strategy '${strategy}' failed:`, error);
    throw error;
  }
};

/**
 * Sends a request to the Google Apps Script Backend with automatic CORS bypass
 * Retries with different strategies on failure.
 */
const sendRequest = async <T>(payload: object): Promise<ApiResponse<T>> => {
  const payloadJson = JSON.stringify(payload);
  const strategies: Array<'text-plain' | 'minimal' | 'proxy'> = ['text-plain', 'minimal'];
  
  // Add proxy strategy for mobile environments
  if (isMobileEnvironment()) {
    strategies.push('proxy');
  }

  let lastError: Error | null = null;

  // Try each strategy sequentially
  for (const strategy of strategies) {
    try {
      console.debug(`[DriveService] Attempting request with strategy: ${strategy}`);
      
      const response = await attemptCORSBypass(GAS_API_URL, payloadJson, strategy);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.debug(`[DriveService] Request successful with strategy: ${strategy}`);
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[DriveService] Strategy '${strategy}' failed:`, lastError.message);
      
      // Continue to next strategy
      if (strategy !== strategies[strategies.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay before retry
      }
    }
  }

  // All strategies exhausted
  console.error('[DriveService] All CORS bypass strategies failed:', lastError);
  const errorMessage = lastError instanceof Error ? lastError.message : 'Network Error';
  
  return {
    success: false,
    error: formatCORSError(errorMessage)
  };
};

/**
 * Formats CORS/network errors into user-friendly messages
 */
const formatCORSError = (error: string): string => {
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

// ==========================================
// 4. AUTHENTICATION SERVICES
// ==========================================

export const AuthService = {
  login: async (username: string, password: string) => {
    return sendRequest<{ sessionToken: string; user: User }>({
      action: 'login',
      username,
      password
    });
  },

  register: async (username: string, password: string, email: string) => {
    return sendRequest({
      action: 'register',
      username,
      password,
      email
    });
  },

  logout: async (sessionToken: string) => {
    return sendRequest({
      action: 'logout',
      sessionToken
    });
  },

  validateSession: async (sessionToken: string) => {
    return sendRequest<{ valid: boolean; user: User }>({
      action: 'validateSession',
      sessionToken
    });
  },

  // --- User Management (Admin only) ---
  listUsers: async (sessionToken: string) => {
    return sendRequest<{ users: User[] }>({
      action: 'listUsers',
      sessionToken
    });
  },

  createUser: async (sessionToken: string, userData: {
    username: string;
    password: string;
    email: string;
    role: string;
    chapterId?: string;
  }) => {
    return sendRequest<{ user: User }>({
      action: 'createUser',
      sessionToken,
      ...userData
    });
  },

  deleteUser: async (sessionToken: string, userId: string) => {
    return sendRequest({
      action: 'deleteUser',
      sessionToken,
      userId
    });
  },

  updatePassword: async (sessionToken: string, newPassword: string, targetUsername?: string) => {
    return sendRequest({
      action: 'updatePassword',
      sessionToken,
      newPassword,
      targetUsername
    });
  }
};

// ==========================================
// 5. DRIVE & FILE SERVICES
// ==========================================

export const DriveService = {

  /**
   * Uploads a file to Google Drive.
   * @param customFolderId - (Optional) The ID of the folder to upload into.
   */
  uploadImage: async (
    file: File,
    sessionToken: string,
    customFolderId?: string
  ) => {
    try {
      if (file.size > 10 * 1024 * 1024) return { success: false, error: 'File too large (>10MB)' };

      const base64 = await fileToBase64(file);

      return sendRequest<{ fileId: string; fileUrl: string; thumbnailUrl: string }>({
        action: 'uploadImage',
        sessionToken,
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
        customFolderId // If null, backend sends to Root
      });
    } catch (e) {
      return { success: false, error: 'File processing failed' };
    }
  },

  /**
   * Imports an image from a URL.
   */
  uploadFromUrl: async (
    imageUrl: string,
    fileName: string,
    sessionToken: string,
    customFolderId?: string
  ) => {
    return sendRequest<{ fileId: string; fileUrl: string }>({
      action: 'uploadImageFromUrl',
      sessionToken,
      imageUrl,
      fileName,
      customFolderId
    });
  },

  /**
   * Creates a new folder.
   * @param parentFolderId - (Optional) ID of parent. If null, creates in Root.
   */
  createFolder: async (folderName: string, sessionToken: string, parentFolderId?: string) => {
    return sendRequest<{ folderId: string; folderName: string; isNew: boolean }>({
      action: 'createFolder',
      sessionToken,
      folderName,
      parentFolderId
    });
  },

  /**
   * Lists images inside a specific folder.
   */
  listImages: async (folderId: string, sessionToken: string) => {
    return sendRequest<{ files: any[] }>({
      action: 'listImages',
      sessionToken,
      customFolderId: folderId
    });
  },

  deleteImage: async (fileId: string, sessionToken: string) => {
    return sendRequest({
      action: 'deleteImage',
      sessionToken,
      fileId
    });
  }
};

// ==========================================
// 6. CONTENT & DATA SERVICES
// ==========================================

export const DataService = {

  // --- Org Settings ---
  getOrgSettings: async () => {
    return sendRequest<{ settings: any }>({
      action: 'getOrgSettings'
    });
  },

  updateOrgSettings: async (settings: any, sessionToken: string) => {
    return sendRequest({
      action: 'updateOrgSettings',
      sessionToken,
      settings
    });
  },

  // --- Landing Page ---
  saveLandingPageData: async (landingPage: any, sessionToken: string) => {
    return sendRequest({
      action: 'saveLandingPage',
      sessionToken,
      landingPage
    });
  },

  getLandingPageData: async () => {
    return sendRequest<{ landingPage: any }>({
      action: 'loadLandingPage'
    });
  },

  // --- Pillars ---
  savePillars: async (pillars: any[], sessionToken: string) => {
    return sendRequest({
      action: 'savePillars',
      sessionToken,
      pillars
    });
  },

  loadPillars: async () => {
    return sendRequest<{ pillars: any[] }>({
      action: 'loadPillars'
    });
  },

  // --- Chapters ---
  saveChapter: async (chapterId: string, chapterData: any, sessionToken: string) => {
    return sendRequest({
      action: 'saveChapter',
      sessionToken,
      chapterId,
      chapterData
    });
  },

  loadChapter: async (chapterId: string) => {
    return sendRequest<{ chapter: any }>({
      action: 'loadChapter',
      chapterId
    });
  },

  // --- Partners ---
  savePartners: async (partners: any, sessionToken: string) => {
    return sendRequest({
      action: 'savePartners',
      sessionToken,
      partners
    });
  },

  loadPartners: async () => {
    return sendRequest<{ partners: any }>({
      action: 'loadPartners'
    });
  },

  // --- Founders ---
  saveFounders: async (founders: any, sessionToken: string) => {
    return sendRequest({
      action: 'saveFounders',
      sessionToken,
      founders
    });
  },

  loadFounders: async () => {
    return sendRequest<{ founders: any }>({
      action: 'loadFounders'
    });
  },

  // --- Stories ---
  saveStories: async (stories: any, sessionToken: string) => {
    return sendRequest({
      action: 'saveStories',
      sessionToken,
      stories
    });
  },

  loadStories: async () => {
    return sendRequest<{ stories: any }>({
      action: 'loadStories'
    });
  }
};

// ==========================================
// 7. UTILITIES
// ==========================================

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Converts standard Drive links to high-res thumbnail links.
 * Bypasses CORS restrictions on <img> tags.
 */
export const convertToCORSFreeLink = (url: string | undefined): string => {
  if (!url) return '';
  
  // Extract ID from standard Drive URL
  const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    // Return high-res (w4000) thumbnail link which skips CORS
    return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w4000`;
  }
  
  return url;
};
