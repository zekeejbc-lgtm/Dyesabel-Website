/**
 * Google Drive Image Upload Utility
 * 
 * This utility handles uploading images to Google Drive and returning public URLs
 * that can be used in the website.
 */

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbx6jSvrQOC8dh9rtZ9Ort368Q2a--aSEcx7mmWNTfdonGWQglcNPGxM3HLOndS4Mt1ahQ/exec';

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
 * @returns Promise with upload result containing the public URL
 */
export async function uploadImageToDrive(
  file: File,
  folder: string,
  sessionToken: string
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

    // Convert file to base64
    const base64 = await fileToBase64(file);

    // Send to Google Apps Script
    const response = await fetch(GAS_API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8', 
  },
  body: JSON.stringify({
    action: 'uploadImage',
    sessionToken,
    fileName: file.name,
    mimeType: file.type,
    base64Data: base64,
    folder: folder
  })
});

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        url: data.url,
        fileId: data.fileId
      };
    } else {
      return {
        success: false,
        error: data.error || 'Upload failed'
      };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: 'Network error. Please try again.'
    };
  }
}

/**
 * Upload logo to Google Drive (specifically for organization logo)
 * @param file - The logo image file
 * @param sessionToken - User's session token
 * @returns Promise with upload result
 */
export async function uploadLogo(
  file: File,
  sessionToken: string
): Promise<UploadResult> {
  return uploadImageToDrive(file, 'logo', sessionToken);
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
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
  'Content-Type': 'text/plain;charset=utf-8', 
},
      body: JSON.stringify({
        action: 'deleteImage',
        sessionToken,
        fileId
      })
    });

    const data = await response.json();
    return {
      success: data.success,
      error: data.error
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: 'Network error. Please try again.'
    };
  }
}

/**
 * Convert File to base64 string
 * @param file - The file to convert
 * @returns Promise with base64 string (without data URI prefix)
 */
function fileToBase64(file: File): Promise<string> {
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
 * @param sessionToken - User's session token
 * @returns Promise with organization settings
 */
export async function getOrganizationSettings(
  sessionToken: string
): Promise<{
  success: boolean;
  logoUrl?: string;
  organizationName?: string;
  error?: string;
}> {
  try {
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getOrgSettings',
        sessionToken
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching org settings:', error);
    return {
      success: false,
      error: 'Failed to load organization settings'
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
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateOrgSettings',
        sessionToken,
        settings
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Error updating org settings:', error);
    return {
      success: false,
      error: 'Failed to update organization settings'
    };
  }
}
