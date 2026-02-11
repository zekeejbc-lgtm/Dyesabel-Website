// Google Apps Script Web App URL - Replace with your deployed GAS URL
const GAS_API_URL = 'YOUR_DEPLOYED_WEB_APP_URL';

export type FolderType = 
  | 'Pillars' 
  | 'Activities' 
  | 'Partners' 
  | 'Founders' 
  | 'Stories' 
  | 'Chapters' 
  | 'Logos' 
  | 'Landing';

export interface UploadResponse {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  fileName?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Uploads an image file to Google Drive via Apps Script
 * @param file - The image file to upload
 * @param folderType - The destination folder type
 * @param sessionToken - Authentication token from login
 * @param onProgress - Optional callback for upload progress
 * @returns Upload result with file ID and URL
 */
export const uploadImageToDrive = async (
  file: File,
  folderType: FolderType,
  sessionToken: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> => {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return { 
        success: false, 
        error: 'Invalid file type. Allowed types: JPEG, PNG, WebP, GIF' 
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { 
        success: false, 
        error: 'File size exceeds 10MB limit' 
      };
    }

    // Convert file to base64
    const base64Data = await fileToBase64(file);

    // Prepare upload payload
    const payload = {
      action: 'uploadImage',
      sessionToken,
      folderType,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData: base64Data
    };

    // Send upload request
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP error! status: ${response.status}` 
      };
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        fileId: result.fileId,
        fileUrl: result.fileUrl,
        fileName: result.fileName
      };
    } else {
      return {
        success: false,
        error: result.error || 'Upload failed'
      };
    }
  } catch (error) {
    console.error('Drive upload error:', error);
    return {
      success: false,
      error: handleCORSError(error)
    };
  }
};

/**
 * Uploads a file from URL to Google Drive
 * Useful for importing external images
 * @param imageUrl - URL of the image to upload
 * @param fileName - Name to save the file as
 * @param folderType - The destination folder type
 * @param sessionToken - Authentication token from login
 * @returns Upload result with file ID and URL
 */
export const uploadImageFromUrl = async (
  imageUrl: string,
  fileName: string,
  folderType: FolderType,
  sessionToken: string
): Promise<UploadResponse> => {
  try {
    const payload = {
      action: 'uploadImageFromUrl',
      sessionToken,
      imageUrl,
      fileName,
      folderType
    };

    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        fileId: result.fileId,
        fileUrl: result.fileUrl,
        fileName: result.fileName
      };
    } else {
      return {
        success: false,
        error: result.error || 'Upload from URL failed'
      };
    }
  } catch (error) {
    console.error('Drive URL upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload from URL failed'
    };
  }
};

/**
 * Deletes an image from Google Drive
 * @param fileId - The Google Drive file ID
 * @param sessionToken - Authentication token from login
 * @returns Deletion result
 */
export const deleteImageFromDrive = async (
  fileId: string,
  sessionToken: string
): Promise<UploadResponse> => {
  try {
    const payload = {
      action: 'deleteImage',
      sessionToken,
      fileId
    };

    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || 'Deletion failed'
      };
    }
  } catch (error) {
    console.error('Drive deletion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deletion failed'
    };
  }
};

/**
 * Gets information about a file in Google Drive
 * @param fileId - The Google Drive file ID
 * @param sessionToken - Authentication token from login
 * @returns File information
 */
export const getImageInfo = async (
  fileId: string,
  sessionToken: string
): Promise<UploadResponse> => {
  try {
    const payload = {
      action: 'getImageInfo',
      sessionToken,
      fileId
    };

    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        fileName: result.fileName,
        fileUrl: result.fileUrl,
        fileId: result.fileId
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to get image info'
      };
    }
  } catch (error) {
    console.error('Drive info error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get image info'
    };
  }
};

/**
 * Lists all images in a specific folder
 * @param folderType - The folder type to list
 * @param sessionToken - Authentication token from login
 * @returns Array of files in the folder
 */
export const listImagesInFolder = async (
  folderType: FolderType,
  sessionToken: string
): Promise<any[]> => {
  try {
    const payload = {
      action: 'listImages',
      sessionToken,
      folderType
    };

    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success && Array.isArray(result.files)) {
      return result.files;
    } else {
      console.error('Failed to list images:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Drive listing error:', error);
    return [];
  }
};

/**
 * Generates a shareable link for a Drive file
 * @param fileId - The Google Drive file ID
 * @param sessionToken - Authentication token from login
 * @returns The shareable URL
 */
export const getShareableLink = async (
  fileId: string,
  sessionToken: string
): Promise<string> => {
  try {
    // Google Drive direct view URL format
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (error) {
    console.error('Error generating shareable link:', error);
    return '';
  }
};

/**
 * Helper function to convert file to base64
 * @param file - The file to convert
 * @returns Base64 string of the file
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Validates folder type
 * @param folderType - The folder type to validate
 * @returns True if valid folder type
 */
export const isValidFolderType = (folderType: string): folderType is FolderType => {
  const validFolders: FolderType[] = [
    'Pillars',
    'Activities',
    'Partners',
    'Founders',
    'Stories',
    'Chapters',
    'Logos',
    'Landing'
  ];
  return validFolders.includes(folderType as FolderType);
};

/**
 * Generates thumbnail URL for a Drive image
 * @param fileId - The Google Drive file ID
 * @param size - Optional size parameter (s32, s64, s128, s220, s256, s288, s320, s512, s576, s640, s720, s800, s912)
 * @returns Thumbnail URL
 */
export const getThumbnailUrl = (fileId: string, size: string = 's220'): string => {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
};

/**
 * Validates image dimensions
 * @param file - The image file to validate
 * @param minWidth - Minimum width in pixels
 * @param minHeight - Minimum height in pixels
 * @returns Promise that resolves with validation result
 */
export const validateImageDimensions = (
  file: File,
  minWidth: number = 100,
  minHeight: number = 100
): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const valid = img.width >= minWidth && img.height >= minHeight;
      resolve(valid);
    };
    img.onerror = () => {
      resolve(false);
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculates file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Utility function to handle CORS errors gracefully
 * @param error - The error object
 * @returns User-friendly error message
 */
export const handleCORSError = (error: unknown): string => {
  if (error instanceof TypeError) {
    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes('cors') || errorMsg.includes('fetch')) {
      return 'CORS error: Unable to connect to the server. Please check if the GAS URL is correct and the web app is deployed with "Anyone" access. Error: ' + error.message;
    }
  }
  return error instanceof Error ? error.message : 'An unknown error occurred';
};
