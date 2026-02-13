import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Image as ImageIcon, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadLogo, getOrganizationSettings, updateOrganizationSettings } from '../../utils/driveUpload';

interface LogoEditorProps {
  onClose: () => void;
  onLogoUpdate?: (newLogoUrl: string) => void;
}

export const LogoEditor: React.FC<LogoEditorProps> = ({ onClose, onLogoUpdate }) => {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('Dyesabel PH');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check permission
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('dyesabel_session');
      if (!sessionToken) {
        alert('Session expired. Please log in again.');
        return;
      }

      const result = await getOrganizationSettings(sessionToken);
      if (result.success) {
        setLogoUrl(result.logoUrl || '');
        setPreviewUrl(result.logoUrl || '');
        setOrganizationName(result.organizationName || 'Dyesabel PH');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      const sessionToken = localStorage.getItem('dyesabel_session');
      if (!sessionToken) {
        alert('Session expired. Please log in again.');
        return;
      }

      const result = await uploadLogo(selectedFile, sessionToken);
      
      if (result.success && result.url) {
        setLogoUrl(result.url);
        setPreviewUrl(result.url);
        setSelectedFile(null);
        alert('Logo uploaded successfully! Click "Save Changes" to apply.');
      } else {
        alert('Upload failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error uploading logo. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const sessionToken = localStorage.getItem('dyesabel_session');
      if (!sessionToken) {
        alert('Session expired. Please log in again.');
        return;
      }

      const result = await updateOrganizationSettings(sessionToken, {
        logoUrl,
        organizationName
      });

      if (result.success) {
        alert('Organization settings saved successfully!');
        if (onLogoUpdate) {
          onLogoUpdate(logoUrl);
        }
        onClose();
      } else {
        alert('Save failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving settings. Please try again.');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Organization Logo & Branding
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update your organization's logo and name
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary-blue" />
              </div>
            ) : (
              <>
                {/* Organization Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Enter organization name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>

                {/* Logo Preview */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Current Logo
                  </label>
                  <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
                    {previewUrl ? (
                      <div className="absolute inset-0 flex items-center justify-center p-8">
                        <img
                          src={previewUrl}
                          alt="Logo preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="w-16 h-16 mb-2" />
                        <p className="text-sm">No logo uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Upload New Logo
                  </label>
                  
                  <div className="space-y-3">
                    {/* File Input */}
                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-blue dark:hover:border-primary-cyan transition-colors bg-gray-50 dark:bg-gray-800/50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                        disabled={uploading}
                      />
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {selectedFile ? selectedFile.name : 'Choose image file'}
                        </span>
                      </div>
                    </label>

                    {/* Upload Button */}
                    {selectedFile && (
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Uploading to Google Drive...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload to Google Drive
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Supported formats: JPG, PNG, GIF, WebP. Maximum size: 5MB.
                    <br />
                    Logo will be stored in your Google Drive for easy management.
                  </p>
                </div>

                {/* Or Use URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Or Use Image URL
                  </label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      setPreviewUrl(e.target.value);
                    }}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm"
                  />
                </div>

                {/* Logo Guidelines */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    Logo Guidelines
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                    <li>• Recommended size: 400x400px or larger (square format works best)</li>
                    <li>• Use transparent background (PNG) for best results</li>
                    <li>• Ensure logo is clearly visible on both light and dark backgrounds</li>
                    <li>• High resolution images look better on all devices</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading || loading}
              className="flex items-center gap-2 px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
