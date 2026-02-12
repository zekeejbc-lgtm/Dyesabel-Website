import React, { useState } from 'react';
import { Pillar, PillarActivity } from '../types';
import { X, Save, Plus, Trash2, Upload, BookOpen, Scale, Leaf, Heart, Palette, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { uploadImageToDrive } from '../utils/driveUpload';

interface PillarsEditorProps {
  pillars: Pillar[];
  onSave: (pillars: Pillar[]) => void;
  onClose: () => void;
}

const PILLAR_ICONS = {
  'Research and Education': <BookOpen className="w-6 h-6" />,
  'Good Governance': <Scale className="w-6 h-6" />,
  'Sustainable Livelihood': <Leaf className="w-6 h-6" />,
  'Community Health': <Heart className="w-6 h-6" />,
  'Culture and Arts': <Palette className="w-6 h-6" />
};

export const PillarsEditor: React.FC<PillarsEditorProps> = ({ pillars, onSave, onClose }) => {
  const { user } = useAuth();
  const [editedPillars, setEditedPillars] = useState<Pillar[]>(pillars);
  const [selectedPillarIndex, setSelectedPillarIndex] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Check permission
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return null;
  }

  const updatePillar = (index: number, field: keyof Pillar, value: any) => {
    const updated = [...editedPillars];
    updated[index] = { ...updated[index], [field]: value };
    setEditedPillars(updated);
  };

  const updateActivity = (pillarIndex: number, activityIndex: number, field: keyof PillarActivity, value: string) => {
    const updated = [...editedPillars];
    const activities = [...updated[pillarIndex].activities];
    activities[activityIndex] = { ...activities[activityIndex], [field]: value };
    updated[pillarIndex] = { ...updated[pillarIndex], activities };
    setEditedPillars(updated);
  };

  const addActivity = (pillarIndex: number) => {
    const updated = [...editedPillars];
    const newActivity: PillarActivity = {
      id: `a${pillarIndex}-${Date.now()}`,
      title: 'New Activity',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      description: 'Activity description',
      imageUrl: 'https://picsum.photos/seed/new/500/300'
    };
    updated[pillarIndex].activities = [...updated[pillarIndex].activities, newActivity];
    setEditedPillars(updated);
  };

  const removeActivity = (pillarIndex: number, activityIndex: number) => {
    if (!confirm('Are you sure you want to remove this activity?')) return;
    const updated = [...editedPillars];
    updated[pillarIndex].activities = updated[pillarIndex].activities.filter((_, i) => i !== activityIndex);
    setEditedPillars(updated);
  };

  const handleImageUpload = async (pillarIndex: number, activityIndex: number | null, file: File) => {
    setUploadingImage(true);
    try {
      const sessionToken = localStorage.getItem('dyesabel_session');
      if (!sessionToken) {
        alert('Session expired. Please log in again.');
        setUploadingImage(false);
        return;
      }

      const folder = activityIndex !== null ? 'pillar-activities' : 'pillars';
      console.log('Starting image upload...', { folder, fileName: file.name, size: file.size });
      
      const result = await uploadImageToDrive(file, folder, sessionToken);
      console.log('Upload result:', result);

      if (result.success && result.url) {
        console.log('Image uploaded successfully:', result.url);
        if (activityIndex !== null) {
          updateActivity(pillarIndex, activityIndex, 'imageUrl', result.url);
        } else {
          updatePillar(pillarIndex, 'imageUrl', result.url);
        }
        alert('Image uploaded successfully!');
      } else {
        console.error('Upload failed:', result.error);
        alert('Upload failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedPillars);
      alert('Pillars saved successfully!');
      onClose();
    } catch (error) {
      alert('Error saving pillars. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentPillar = editedPillars[selectedPillarIndex];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Pillars</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your organization's core pillars and activities
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Sidebar - Pillar Selection */}
            <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">
                Select Pillar
              </h3>
              <div className="space-y-2">
                {editedPillars.map((pillar, index) => (
                  <button
                    key={pillar.id}
                    onClick={() => setSelectedPillarIndex(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedPillarIndex === index
                        ? 'bg-primary-blue text-white shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={selectedPillarIndex === index ? 'text-white' : 'text-primary-blue'}>
                        {PILLAR_ICONS[pillar.title as keyof typeof PILLAR_ICONS] || <BookOpen className="w-5 h-5" />}
                      </div>
                      <span className="text-sm font-medium">{pillar.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <div className="space-y-6">
                {/* Pillar Main Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Pillar Cover Image
                  </label>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={currentPillar.imageUrl}
                      alt={currentPillar.title}
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(selectedPillarIndex, null, e.target.files[0])}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <div className="text-white text-center">
                        {uploadingImage ? (
                          <>
                            <Loader className="w-8 h-8 mx-auto mb-2 animate-spin" />
                            <span className="text-sm font-medium">Uploading to Drive...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-sm font-medium">Upload to Google Drive</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={currentPillar.title}
                    onChange={(e) => updatePillar(selectedPillarIndex, 'title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Excerpt (Short Description)
                  </label>
                  <textarea
                    value={currentPillar.excerpt}
                    onChange={(e) => updatePillar(selectedPillarIndex, 'excerpt', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Full Description
                  </label>
                  <textarea
                    value={currentPillar.description}
                    onChange={(e) => updatePillar(selectedPillarIndex, 'description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>

                {/* Aim */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Aim/Goal
                  </label>
                  <textarea
                    value={currentPillar.aim}
                    onChange={(e) => updatePillar(selectedPillarIndex, 'aim', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>

                {/* Activities */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Activities
                    </label>
                    <button
                      onClick={() => addActivity(selectedPillarIndex)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Activity
                    </button>
                  </div>

                  <div className="space-y-4">
                    {currentPillar.activities.map((activity, activityIndex) => (
                      <div
                        key={activity.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">Activity {activityIndex + 1}</h4>
                          <button
                            onClick={() => removeActivity(selectedPillarIndex, activityIndex)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Activity Image */}
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            src={activity.imageUrl}
                            alt={activity.title}
                            className="w-full h-full object-cover"
                          />
                          <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleImageUpload(selectedPillarIndex, activityIndex, e.target.files[0])}
                              className="hidden"
                            />
                            <div className="text-white text-center">
                              <Upload className="w-6 h-6 mx-auto mb-1" />
                              <span className="text-xs font-medium">Change Image</span>
                            </div>
                          </label>
                        </div>

                        <input
                          type="text"
                          value={activity.title}
                          onChange={(e) => updateActivity(selectedPillarIndex, activityIndex, 'title', e.target.value)}
                          placeholder="Activity title"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />

                        <input
                          type="text"
                          value={activity.date}
                          onChange={(e) => updateActivity(selectedPillarIndex, activityIndex, 'date', e.target.value)}
                          placeholder="Date (e.g., January 2024)"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />

                        <textarea
                          value={activity.description}
                          onChange={(e) => updateActivity(selectedPillarIndex, activityIndex, 'description', e.target.value)}
                          placeholder="Activity description"
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
