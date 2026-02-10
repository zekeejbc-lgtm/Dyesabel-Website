import React, { useState } from 'react';
import { Founder } from '../types';
import { X, Save, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FoundersEditorProps {
  founders: Founder[];
  onSave: (founders: Founder[]) => void;
  onClose: () => void;
}

export const FoundersEditor: React.FC<FoundersEditorProps> = ({ founders, onSave, onClose }) => {
  const { user } = useAuth();
  const [editedFounders, setEditedFounders] = useState<Founder[]>(founders);
  const [saving, setSaving] = useState(false);

  // Check permission
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return null;
  }

  const updateFounder = (index: number, field: keyof Founder, value: string) => {
    const updated = [...editedFounders];
    updated[index] = { ...updated[index], [field]: value };
    setEditedFounders(updated);
  };

  const addFounder = () => {
    const newFounder: Founder = {
      id: `f${Date.now()}`,
      name: 'New Founder',
      role: 'Position/Role',
      bio: 'Short biography and background...',
      imageUrl: 'https://picsum.photos/seed/newfounder/400/400'
    };
    setEditedFounders([...editedFounders, newFounder]);
  };

  const removeFounder = (index: number) => {
    if (!confirm('Are you sure you want to remove this founder?')) return;
    setEditedFounders(editedFounders.filter((_, i) => i !== index));
  };

  const handleImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      updateFounder(index, 'imageUrl', imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedFounders);
      alert('Founders saved successfully!');
      onClose();
    } catch (error) {
      alert('Error saving founders. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Founders</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your organization's founders and leadership team
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
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Founders & Leadership
              </h3>
              <button
                onClick={addFounder}
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Founder
              </button>
            </div>

            <div className="space-y-6">
              {editedFounders.map((founder, index) => (
                <div
                  key={founder.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Founder {index + 1}
                    </h4>
                    <button
                      onClick={() => removeFounder(index)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image Upload */}
                    <div className="flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profile Photo
                      </label>
                      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={founder.imageUrl}
                          alt={founder.name}
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(index, e.target.files[0])}
                            className="hidden"
                          />
                          <div className="text-white text-center">
                            <Upload className="w-6 h-6 mx-auto mb-1" />
                            <span className="text-xs font-medium">Upload</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={founder.name}
                          onChange={(e) => updateFounder(index, 'name', e.target.value)}
                          placeholder="Enter full name"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        />
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Role/Position
                        </label>
                        <input
                          type="text"
                          value={founder.role}
                          onChange={(e) => updateFounder(index, 'role', e.target.value)}
                          placeholder="e.g., Co-Founder & Executive Director"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        />
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Biography
                        </label>
                        <textarea
                          value={founder.bio}
                          onChange={(e) => updateFounder(index, 'bio', e.target.value)}
                          placeholder="Brief biography and background..."
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {editedFounders.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="font-medium mb-2">No founders added yet</p>
                  <p className="text-sm">Click "Add Founder" to get started</p>
                </div>
              )}
            </div>
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
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
