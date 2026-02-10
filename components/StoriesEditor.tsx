import React, { useState } from 'react';
import { Story } from '../types';
import { X, Save, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface StoriesEditorProps {
  stories: Story[];
  onSave: (stories: Story[]) => void;
  onClose: () => void;
}

export const StoriesEditor: React.FC<StoriesEditorProps> = ({ stories, onSave, onClose }) => {
  const { user } = useAuth();
  const [editedStories, setEditedStories] = useState<Story[]>(stories);
  const [saving, setSaving] = useState(false);

  // Check permission
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return null;
  }

  const updateStory = (index: number, field: keyof Story, value: string) => {
    const updated = [...editedStories];
    updated[index] = { ...updated[index], [field]: value };
    setEditedStories(updated);
  };

  const addStory = () => {
    const newStory: Story = {
      id: `s${Date.now()}`,
      title: 'New Story Title',
      excerpt: 'A brief description of this story...',
      imageUrl: 'https://picsum.photos/seed/newstory/600/400',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    };
    setEditedStories([...editedStories, newStory]);
  };

  const removeStory = (index: number) => {
    if (!confirm('Are you sure you want to remove this story?')) return;
    setEditedStories(editedStories.filter((_, i) => i !== index));
  };

  const handleImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      updateStory(index, 'imageUrl', imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedStories);
      alert('Stories saved successfully!');
      onClose();
    } catch (error) {
      alert('Error saving stories. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Stories</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your organization's success stories and updates
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
                Success Stories & Updates
              </h3>
              <button
                onClick={addStory}
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Story
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {editedStories.map((story, index) => (
                <div
                  key={story.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                >
                  {/* Image Section */}
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
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
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-sm font-medium">Upload Image</span>
                      </div>
                    </label>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => removeStory(index)}
                      className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 space-y-3">
                    {/* Date */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Date
                      </label>
                      <input
                        type="text"
                        value={story.date}
                        onChange={(e) => updateStory(index, 'date', e.target.value)}
                        placeholder="e.g., January 15, 2024"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={story.title}
                        onChange={(e) => updateStory(index, 'title', e.target.value)}
                        placeholder="Story title"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      />
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Excerpt
                      </label>
                      <textarea
                        value={story.excerpt}
                        onChange={(e) => updateStory(index, 'excerpt', e.target.value)}
                        placeholder="Brief description..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {editedStories.length === 0 && (
              <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                <p className="font-medium mb-2">No stories added yet</p>
                <p className="text-sm">Click "Add Story" to create your first success story</p>
              </div>
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
