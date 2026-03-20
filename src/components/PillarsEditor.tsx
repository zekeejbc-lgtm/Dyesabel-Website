import React, { useState } from 'react';
import { Pillar, PillarActivity } from '../types';
import { X, Save, Plus, Trash2, Upload, BookOpen, Scale, Leaf, Heart, Palette, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppDialog } from '../contexts/AppDialogContext';
import { uploadImageToDrive } from '../utils/driveUpload';
import { getSessionToken } from '../utils/session';

interface PillarsEditorProps {
  pillars: Pillar[];
  onSave: (pillars: Pillar[]) => void;
  onClose: () => void;
  activitiesOnly?: boolean;
}

const PILLAR_ICONS = {
  'Research and Education': <BookOpen className="w-6 h-6" />,
  'Good Governance': <Scale className="w-6 h-6" />,
  'Sustainable Livelihood': <Leaf className="w-6 h-6" />,
  'Community Health': <Heart className="w-6 h-6" />,
  'Culture and Arts': <Palette className="w-6 h-6" />
};

var ACTIVITY_INITIAL_VISIBLE_COUNT = 6;

export const PillarsEditor: React.FC<PillarsEditorProps> = ({ pillars, onSave, onClose, activitiesOnly = false }) => {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useAppDialog();
  const canEdit = !!user && (user.role === 'admin' || (user.role === 'editor' && !user.chapterId));
  const [editedPillars, setEditedPillars] = useState<Pillar[]>(pillars);
  const [selectedPillarIndex, setSelectedPillarIndex] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  const [visibleActivityCount, setVisibleActivityCount] = useState<Record<string, number>>({});

  // Check permission
  if (!canEdit) {
    return null;
  }

  const getActivityKey = (pillarIndex: number, activity: PillarActivity, activityIndex: number) =>
    `${pillarIndex}:${activity.id || activityIndex}`;

  const getVisibleCountForPillar = (pillarIndex: number, totalActivities: number) =>
    Math.min(visibleActivityCount[pillarIndex] || ACTIVITY_INITIAL_VISIBLE_COUNT, totalActivities);

  const isActivityExpanded = (pillarIndex: number, activity: PillarActivity, activityIndex: number) =>
    expandedActivities[getActivityKey(pillarIndex, activity, activityIndex)] !== false;

  const toggleActivityExpanded = (pillarIndex: number, activity: PillarActivity, activityIndex: number) => {
    const key = getActivityKey(pillarIndex, activity, activityIndex);
    setExpandedActivities((current) => ({
      ...current,
      [key]: current[key] === false
    }));
  };

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
    setExpandedActivities((current) => ({
      ...current,
      [getActivityKey(pillarIndex, newActivity, updated[pillarIndex].activities.length - 1)]: true
    }));
    setVisibleActivityCount((current) => ({
      ...current,
      [pillarIndex]: updated[pillarIndex].activities.length
    }));
  };

  const removeActivity = async (pillarIndex: number, activityIndex: number) => {
    const shouldRemove = await showConfirm('Are you sure you want to remove this activity?', {
      title: 'Remove Activity',
      confirmLabel: 'Remove'
    });
    if (!shouldRemove) return;
    const updated = [...editedPillars];
    updated[pillarIndex].activities = updated[pillarIndex].activities.filter((_, i) => i !== activityIndex);
    setEditedPillars(updated);
  };

  const handleImageUpload = async (pillarIndex: number, activityIndex: number | null, file: File) => {
    setUploadingImage(true);
    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        await showAlert('Session expired. Please log in again.');
        setUploadingImage(false);
        return;
      }

      const folder = activityIndex !== null ? 'pillar-activities' : 'pillars';
      
      const result = await uploadImageToDrive(file, folder, sessionToken);

      if (result.success && result.url) {
        if (activityIndex !== null) {
          updateActivity(pillarIndex, activityIndex, 'imageUrl', result.url);
        } else {
          updatePillar(pillarIndex, 'imageUrl', result.url);
        }
        await showAlert('Image uploaded successfully!', { title: 'Upload Complete' });
      } else {
        await showAlert('Upload failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      await showAlert('Error uploading image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedPillars);
      await showAlert('Pillars saved successfully!', { title: 'Pillars Updated' });
      onClose();
    } catch (error) {
      await showAlert('Error saving pillars. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentPillar = editedPillars[selectedPillarIndex];
  const visibleActivities = currentPillar.activities.slice(0, getVisibleCountForPillar(selectedPillarIndex, currentPillar.activities.length));
  const hasHiddenActivities = visibleActivities.length < currentPillar.activities.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm md:p-8">
      <button
        type="button"
        aria-label="Close pillars editor"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative flex w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] dark:bg-gray-900">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Pillars</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {activitiesOnly ? 'Manage activities for each core pillar' : "Manage your organization's core pillars and activities"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="min-h-0 flex flex-1 flex-col lg:flex-row">
            {/* Sidebar - Pillar Selection */}
            <div className="shrink-0 border-b border-gray-200 p-4 lg:w-64 lg:overflow-y-auto lg:border-b-0 lg:border-r dark:border-gray-700">
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
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {!activitiesOnly && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Pillar Cover Image
                  </label>
                  <div className="relative mx-auto aspect-[3/2] w-full max-w-3xl max-h-[360px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={currentPillar.imageUrl}
                      alt={currentPillar.title}
                      className="w-full h-full object-contain"
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
                )}

                {!activitiesOnly && (
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
                )}

                {!activitiesOnly && (
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
                )}

                {!activitiesOnly && (
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
                )}

                {!activitiesOnly && (
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
                )}

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
                    {visibleActivities.map((activity, activityIndex) => {
                      var activityKey = getActivityKey(selectedPillarIndex, activity, activityIndex);
                      var isExpanded = isActivityExpanded(selectedPillarIndex, activity, activityIndex);

                      return (
                      <div
                        key={activityKey}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => toggleActivityExpanded(selectedPillarIndex, activity, activityIndex)}
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          >
                            <div className="mt-0.5 text-primary-blue dark:text-primary-cyan">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {activity.title || `Activity ${activityIndex + 1}`}
                              </h4>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {activity.date || 'No date set'}
                              </p>
                              {!isExpanded && (
                                <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                                  {activity.description || 'No description yet.'}
                                </p>
                              )}
                            </div>
                          </button>
                          <button
                            onClick={() => removeActivity(selectedPillarIndex, activityIndex)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="space-y-3">
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
                        )}
                      </div>
                    )})}

                    {hasHiddenActivities && (
                      <button
                        type="button"
                        onClick={() => setVisibleActivityCount((current) => ({
                          ...current,
                          [selectedPillarIndex]: (current[selectedPillarIndex] || ACTIVITY_INITIAL_VISIBLE_COUNT) + ACTIVITY_INITIAL_VISIBLE_COUNT
                        }))}
                        className="w-full rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Load More Activities
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
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
  );
};

