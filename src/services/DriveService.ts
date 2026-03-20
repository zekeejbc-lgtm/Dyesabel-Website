import { User } from '../types';
import { ApiResponse, sendApiRequest } from './apiClient';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const sendRequest = async <T>(payload: object): Promise<ApiResponse<T>> => {
  return sendApiRequest<T>('main', payload);
};

const sendUsersRequest = async <T>(payload: object): Promise<ApiResponse<T>> => {
  return sendApiRequest<T>('users', payload);
};

export const AuthService = {
  login: async (username: string, password: string) => {
    return sendUsersRequest<{ sessionToken: string; user: User }>({
      action: 'login',
      username,
      password
    });
  },

  register: async (username: string, password: string, email: string) => {
    return sendUsersRequest({
      action: 'register',
      username,
      password,
      email
    });
  },

  logout: async (sessionToken: string) => {
    return sendUsersRequest({
      action: 'logout',
      sessionToken
    });
  },

  validateSession: async (sessionToken: string) => {
    return sendUsersRequest<{ valid: boolean; user: User }>({
      action: 'validateSession',
      sessionToken
    });
  },

  listUsers: async (sessionToken: string) => {
    return sendUsersRequest<{ users: User[] }>({
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
    return sendUsersRequest<{ user: User }>({
      action: 'createUser',
      sessionToken,
      ...userData
    });
  },

  updateUser: async (sessionToken: string, userData: {
    userId: string;
    username: string;
    email: string;
    role: string;
    chapterId?: string;
  }) => {
    return sendUsersRequest<{ user: User }>({
      action: 'updateUser',
      sessionToken,
      ...userData
    });
  },

  updateOwnProfile: async (sessionToken: string, profileData: {
    username: string;
    email: string;
    newPassword?: string;
  }) => {
    return sendUsersRequest<{ user: User }>({
      action: 'updateOwnProfile',
      sessionToken,
      ...profileData
    });
  },

  deleteUser: async (sessionToken: string, userId: string) => {
    return sendUsersRequest({
      action: 'deleteUser',
      sessionToken,
      userId
    });
  },

  updatePassword: async (sessionToken: string, newPassword: string, targetUsername?: string) => {
    return sendUsersRequest({
      action: 'updatePassword',
      sessionToken,
      newPassword,
      targetUsername
    });
  }
};

export const DriveService = {
  uploadImage: async (
    file: File,
    sessionToken: string,
    customFolderId?: string
  ) => {
    try {
      if (file.size > 10 * 1024 * 1024) {
        return { success: false, error: 'File too large (>10MB)' };
      }

      const base64 = await fileToBase64(file);

      return sendRequest<{ fileId: string; fileUrl: string; thumbnailUrl: string }>({
        action: 'uploadImage',
        sessionToken,
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
        customFolderId
      });
    } catch {
      return { success: false, error: 'File processing failed' };
    }
  },

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

  createFolder: async (folderName: string, sessionToken: string, parentFolderId?: string) => {
    return sendRequest<{ folderId: string; folderName: string; isNew: boolean }>({
      action: 'createFolder',
      sessionToken,
      folderName,
      parentFolderId
    });
  },

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

export const DataService = {
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

  deleteChapter: async (chapterId: string, sessionToken: string) => {
    return sendRequest({
      action: 'deleteChapter',
      sessionToken,
      chapterId
    });
  },

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

  listPillars: async () => {
    return sendRequest<{ pillars: any[] }>({
      action: 'listPillars'
    });
  },

  getPillar: async (pillarId: string) => {
    return sendRequest<{ pillar: any }>({
      action: 'getPillar',
      pillarId
    });
  },

  createPillar: async (pillar: any, sessionToken: string) => {
    return sendRequest<{ pillar: any }>({
      action: 'createPillar',
      sessionToken,
      pillar
    });
  },

  updatePillar: async (pillar: any, sessionToken: string) => {
    return sendRequest<{ pillar: any }>({
      action: 'updatePillar',
      sessionToken,
      pillar
    });
  },

  deletePillar: async (pillarId: string, sessionToken: string) => {
    return sendRequest<{ pillar: any }>({
      action: 'deletePillar',
      sessionToken,
      pillarId
    });
  },

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

  listChapters: async () => {
    return sendRequest<{ chapters: any[] }>({
      action: 'listChapters'
    });
  },

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

  listPartnerCategories: async () => {
    return sendRequest<{ partners: any }>({
      action: 'listPartnerCategories'
    });
  },

  getPartnerCategory: async (categoryId: string) => {
    return sendRequest<{ category: any }>({
      action: 'getPartnerCategory',
      categoryId
    });
  },

  createPartnerCategory: async (category: any, sessionToken: string) => {
    return sendRequest<{ category: any }>({
      action: 'createPartnerCategory',
      sessionToken,
      category
    });
  },

  updatePartnerCategory: async (category: any, sessionToken: string) => {
    return sendRequest<{ category: any }>({
      action: 'updatePartnerCategory',
      sessionToken,
      category
    });
  },

  deletePartnerCategory: async (categoryId: string, sessionToken: string) => {
    return sendRequest<{ category: any }>({
      action: 'deletePartnerCategory',
      sessionToken,
      categoryId
    });
  },

  getPartner: async (partnerId: string, categoryId?: string) => {
    return sendRequest<{ partner: any; categoryId: string | null }>({
      action: 'getPartner',
      partnerId,
      categoryId
    });
  },

  createPartner: async (categoryId: string, partner: any, sessionToken: string) => {
    return sendRequest<{ partner: any; categoryId: string }>({
      action: 'createPartner',
      sessionToken,
      categoryId,
      partner
    });
  },

  updatePartner: async (categoryId: string, partner: any, sessionToken: string) => {
    return sendRequest<{ partner: any; categoryId: string }>({
      action: 'updatePartner',
      sessionToken,
      categoryId,
      partner
    });
  },

  deletePartner: async (categoryId: string, partnerId: string, sessionToken: string) => {
    return sendRequest<{ partner: any; categoryId: string }>({
      action: 'deletePartner',
      sessionToken,
      categoryId,
      partnerId
    });
  },

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

  listFounders: async () => {
    return sendRequest<{ founders: any }>({
      action: 'listFounders'
    });
  },

  getFounder: async (founderId: string) => {
    return sendRequest<{ founder: any }>({
      action: 'getFounder',
      founderId
    });
  },

  createFounder: async (founder: any, sessionToken: string) => {
    return sendRequest<{ founder: any }>({
      action: 'createFounder',
      sessionToken,
      founder
    });
  },

  updateFounder: async (founder: any, sessionToken: string) => {
    return sendRequest<{ founder: any }>({
      action: 'updateFounder',
      sessionToken,
      founder
    });
  },

  deleteFounder: async (founderId: string, sessionToken: string) => {
    return sendRequest<{ founder: any }>({
      action: 'deleteFounder',
      sessionToken,
      founderId
    });
  },

  saveExecutiveOfficers: async (executiveOfficers: any, sessionToken: string) => {
    return sendRequest({
      action: 'saveExecutiveOfficers',
      sessionToken,
      executiveOfficers
    });
  },

  loadExecutiveOfficers: async () => {
    return sendRequest<{ executiveOfficers: any }>({
      action: 'loadExecutiveOfficers'
    });
  },

  listExecutiveOfficers: async () => {
    return sendRequest<{ executiveOfficers: any }>({
      action: 'listExecutiveOfficers'
    });
  },

  getExecutiveOfficer: async (executiveOfficerId: string) => {
    return sendRequest<{ executiveOfficer: any }>({
      action: 'getExecutiveOfficer',
      executiveOfficerId
    });
  },

  createExecutiveOfficer: async (executiveOfficer: any, sessionToken: string) => {
    return sendRequest<{ executiveOfficer: any }>({
      action: 'createExecutiveOfficer',
      sessionToken,
      executiveOfficer
    });
  },

  updateExecutiveOfficer: async (executiveOfficer: any, sessionToken: string) => {
    return sendRequest<{ executiveOfficer: any }>({
      action: 'updateExecutiveOfficer',
      sessionToken,
      executiveOfficer
    });
  },

  deleteExecutiveOfficer: async (executiveOfficerId: string, sessionToken: string) => {
    return sendRequest<{ executiveOfficer: any }>({
      action: 'deleteExecutiveOfficer',
      sessionToken,
      executiveOfficerId
    });
  },

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
  },

  listStories: async () => {
    return sendRequest<{ stories: any }>({
      action: 'listStories'
    });
  },

  getStory: async (storyId: string) => {
    return sendRequest<{ story: any }>({
      action: 'getStory',
      storyId
    });
  },

  createStory: async (story: any, sessionToken: string) => {
    return sendRequest<{ story: any }>({
      action: 'createStory',
      sessionToken,
      story
    });
  },

  updateStory: async (story: any, sessionToken: string) => {
    return sendRequest<{ story: any }>({
      action: 'updateStory',
      sessionToken,
      story
    });
  },

  deleteStory: async (storyId: string, sessionToken: string) => {
    return sendRequest<{ story: any }>({
      action: 'deleteStory',
      sessionToken,
      storyId
    });
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

export const convertToCORSFreeLink = (url: string | undefined): string => {
  if (!url) return '';

  const normalizedUrl = url.trim();
  if (!normalizedUrl) return '';

  if (normalizedUrl.includes('drive.google.com/thumbnail')) {
    return normalizedUrl;
  }

  const fileId = extractDriveFileId(normalizedUrl);

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w4000`;
  }

  return normalizedUrl;
};

export const extractDriveFileId = (url: string | undefined): string => {
  if (!url) return '';

  const normalizedUrl = url.trim();
  if (!normalizedUrl) return '';

  const idMatch =
    normalizedUrl.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) ||
    normalizedUrl.match(/\/d\/([a-zA-Z0-9_-]{20,})/) ||
    normalizedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/) ||
    normalizedUrl.match(/[-\w]{25,}/);

  return idMatch?.[1] || idMatch?.[0] || '';
};

export const getImageDebugInfo = (url: string | undefined) => {
  const rawUrl = String(url || '').trim();
  const fileId = extractDriveFileId(rawUrl);
  const normalizedUrl = convertToCORSFreeLink(rawUrl);

  return {
    rawUrl,
    normalizedUrl,
    fileId,
    isDriveUrl: /drive\.google\.com|googleusercontent\.com/.test(rawUrl),
    isDataUrl: rawUrl.startsWith('data:'),
    hasUrl: !!rawUrl
  };
};
