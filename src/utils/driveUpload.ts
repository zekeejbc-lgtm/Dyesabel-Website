/**
 * Google Drive Image Upload Utility
 * 
 * This utility provides wrapper functions for uploading images to Google Drive.
 * It uses DriveService for all API calls, which includes CORS bypass and error handling.
 */

import { DriveService, DataService } from '../services/DriveService';

export interface UploadResult {
  success: boolean;
  url?: string;
  fileId?: string;
  error?: string;
}

/**
 * Upload an image file to Google Drive
 * @param file - The image file to upload
 * @param folder - The folder name in Google Drive (e.g., 'pillars', 'partners', 'logos')
 * @param sessionToken - User's session token for authentication
 * @param oldFileId - (Optional) File ID of image to delete/replace
 * @returns Promise with upload result containing the public URL
 */
export async function uploadImageToDrive(
  file: File,
  folder: string,
  sessionToken: string,
  oldFileId?: string
): Promise<UploadResult> {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images.'
      };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      };
    }

    // If replacing an image, delete the old one first
    if (oldFileId) {
      try {
        const deleteResult = await DriveService.deleteImage(oldFileId, sessionToken);
        if (!deleteResult.success) {
          console.warn('Failed to delete old image:', deleteResult.error);
          // Continue anyway - old image stays but new one will be uploaded
        }
      } catch (deleteError) {
        console.warn('Error deleting old image:', deleteError);
        // Continue with upload despite delete failure
      }
    }

    // Use DriveService with CORS bypass and error handling
    const result = await DriveService.uploadImage(file, sessionToken);

    if (result.success) {
      return {
        success: true,
        url: result.fileUrl,
        fileId: result.fileId
      };
    } else {
      return {
        success: false,
        error: result.error || 'Upload failed'
      };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error. Please try again.'
    };
  }
}

/**
 * Upload logo to Google Drive (specifically for organization logo)
 * @param file - The logo image file
 * @param sessionToken - User's session token
 * @param oldFileId - (Optional) File ID of old logo to delete/replace
 * @returns Promise with upload result
 */
export async function uploadLogo(
  file: File,
  sessionToken: string,
  oldFileId?: string
): Promise<UploadResult> {
  return uploadImageToDrive(file, 'logo', sessionToken, oldFileId);
}

/**
 * Replace an existing image with a new one
 * Automatically deletes the old image and uploads the new one
 * @param newFile - The new image file
 * @param oldFileId - The Google Drive file ID of the image to replace
 * @param folder - The folder name in Google Drive
 * @param sessionToken - User's session token
 * @returns Promise with upload result
 */
export async function replaceImage(
  newFile: File,
  oldFileId: string,
  folder: string,
  sessionToken: string
): Promise<UploadResult> {
  return uploadImageToDrive(newFile, folder, sessionToken, oldFileId);
}

/**
 * Delete an image from Google Drive
 * @param fileId - The Google Drive file ID
 * @param sessionToken - User's session token
 * @returns Promise indicating success or failure
 */
export async function deleteImageFromDrive(
  fileId: string,
  sessionToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await DriveService.deleteImage(fileId, sessionToken);
    return {
      success: result.success,
      error: result.error
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error. Please try again.'
    };
  }
}

/**
 * Convert File to base64 string
 * @param file - The file to convert
 * @returns Promise with base64 string (without data URI prefix)
 * 
 * Note: This function is provided for reference. DriveService.uploadImage() handles this internally.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URI prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


/**
 * Get organization settings including logo URL
 * @returns Promise with organization settings
 */
export async function getOrganizationSettings(): Promise<{
  success: boolean;
  logoUrl?: string;
  organizationName?: string;
  error?: string;
}> {
  try {
    const result = await DataService.getOrgSettings();
    
    if (result.success && result.settings) {
      return {
        success: true,
        logoUrl: result.settings.logoUrl,
        organizationName: result.settings.organizationName
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to load organization settings'
      };
    }
  } catch (error) {
    console.error('Error fetching org settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load organization settings'
    };
  }
}

/**
 * Update organization settings including logo
 * @param sessionToken - User's session token
 * @param settings - Settings to update
 * @returns Promise indicating success or failure
 */
export async function updateOrganizationSettings(
  sessionToken: string,
  settings: {
    logoUrl?: string;
    logoFileId?: string;
    organizationName?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await DataService.updateOrgSettings(settings, sessionToken);
    
    return {
      success: result.success,
      error: result.error
    };
  } catch (error) {
    console.error('Error updating org settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update organization settings'
    };
  }
}
