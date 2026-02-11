// ==========================================
// 1. CONFIGURATION
// ==========================================

// Replace this with your actual Web App URL from the Google Apps Script deployment
const GAS_API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYED_GAS_URL/exec';

// ==========================================
// 2. TYPES & INTERFACES
// ==========================================

export interface User {
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'chapter_head' | 'user';
  id: string;
  chapterId?: string;
}

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
// 3. CORE API HELPER (CORS BYPASS)
// ==========================================

/**
 * Sends a request to the Google Apps Script Backend.
 * Uses 'text/plain' to bypass CORS Preflight checks.
 */
const sendRequest = async <T>(payload: object): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      redirect: 'follow',
      // CRITICAL: This bypasses the CORS Options preflight
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network Error'
    };
  }
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
      action: 'getOrgSettings' // Public action, no token needed usually, or add if strict
    });
  },

  updateOrgSettings: async (settings: any, sessionToken: string) => {
    return sendRequest({
      action: 'updateOrgSettings',
      sessionToken,
      settings
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
      // Remove "data:image/png;base64," prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};