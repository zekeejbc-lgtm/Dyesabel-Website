import React, { useState } from 'react';
import { ArrowLeft, Save, LogOut, Image as ImageIcon, FileText, Users, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DriveService, DataService } from '../services/DriveService';
import { SESSION_TOKEN_KEY, Chapter } from '../types';

interface ChapterEditorProps {
  onBack: () => void;
  chapter?: Chapter;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({ onBack, chapter }: ChapterEditorProps) => {
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Chapter data (this would be fetched from your backend/GAS)
  const [chapterData, setChapterData] = useState({
    title: chapter?.name || user?.chapterId ? `${user?.chapterId} Chapter` : 'My Chapter',
    description: chapter?.description || 'Building strong communities through education and empowerment',
    activities: [
      { id: 1, title: 'Youth Leadership Program', description: 'Empowering young leaders' },
      { id: 2, title: 'Community Outreach', description: 'Reaching out to communities in need' },
    ],
    members: 45,
    imageUrl: chapter?.image || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800'
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!sessionToken) {
        alert('Session expired. Please login again.');
        setIsSaving(false);
        return;
      }

      const chapterId = user?.chapterId;
      if (!chapterId) {
        alert('Chapter ID not set. Unable to save.');
        setIsSaving(false);
        return;
      }

      console.log('Saving chapter data:', { chapterId, chapterData });
      const result = await DataService.saveChapter(chapterId, chapterData, sessionToken);
      console.log('Save result:', result);

      if (result.success) {
        alert('Chapter changes saved successfully!');
      } else {
        alert('Error saving changes: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving chapter:', error);
      alert('Error saving chapter: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY) || '';
      console.log('Starting image upload...', { fileName: file.name, size: file.size });
      
      const result = await DriveService.uploadImage(file, sessionToken);
      console.log('Upload result:', result);
      
      if (result.success && result.fileUrl) {
        console.log('Image uploaded successfully:', result.fileUrl);
        // Force update state and trigger re-render
        setChapterData(prevState => ({
          ...prevState,
          imageUrl: result.fileUrl
        }));
        alert('Image uploaded successfully!');
      } else {
        console.error('Upload failed:', result.error);
        alert('Upload failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image. Please try again.');
    }
  };

  const handleAddActivity = () => {
    setChapterData({
      ...chapterData, 
      activities: [...chapterData.activities, { id: Date.now(), title: 'New Activity', description: '' }]
    });
  };

  const handleRemoveActivity = (id: number) => {
    if (!confirm('Remove this activity?')) return;
    setChapterData({
      ...chapterData,
      activities: chapterData.activities.filter((a) => a.id !== id)
    });
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-light via-[#b2dfdb] to-ocean-mint dark:from-ocean-deep dark:via-[#021017] dark:to-ocean-dark pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="text-ocean-deep dark:text-white" size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-black text-ocean-deep dark:text-white">Chapter Editor</h1>
                <p className="text-ocean-deep/60 dark:text-gray-400 mt-1">
                  Editing: {chapter?.name || chapterData.title}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue hover:bg-primary-cyan text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="text-xl font-bold text-ocean-deep dark:text-white mb-4 flex items-center gap-2">
                <FileText size={20} />
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    value={chapterData.title}
                    onChange={(e) => setChapterData({...chapterData, title: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={chapterData.description}
                    onChange={(e) => setChapterData({...chapterData, description: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                  />
                </div>
              </div>
            </div>

            {/* Chapter Image */}
            <div>
              <h2 className="text-xl font-bold text-ocean-deep dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon size={20} />
                Chapter Image
              </h2>
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5">
                  <img 
                    src={chapterData.imageUrl} 
                    alt="Chapter" 
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="hidden"
                    />
                    <div className="text-white text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <span className="text-sm font-medium">Upload New Image</span>
                    </div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                    Or use Image URL
                  </label>
                  <input
                    type="text"
                    value={chapterData.imageUrl}
                    onChange={(e) => setChapterData({...chapterData, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                  />
                </div>
              </div>
            </div>

            {/* Activities */}
            <div>
              <h2 className="text-xl font-bold text-ocean-deep dark:text-white mb-4 flex items-center gap-2">
                <Users size={20} />
                Chapter Activities
              </h2>
              <div className="space-y-4">
                {chapterData.activities.map((activity, index) => (
                  <div key={activity.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-semibold text-ocean-deep/60 dark:text-gray-400">
                        Activity {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveActivity(activity.id)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={activity.title}
                      onChange={(e) => {
                        const newActivities = [...chapterData.activities];
                        newActivities[index].title = e.target.value;
                        setChapterData({...chapterData, activities: newActivities});
                      }}
                      className="w-full px-3 py-2 mb-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                      placeholder="Activity title"
                    />
                    <textarea
                      rows={2}
                      value={activity.description}
                      onChange={(e) => {
                        const newActivities = [...chapterData.activities];
                        newActivities[index].description = e.target.value;
                        setChapterData({...chapterData, activities: newActivities});
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                      placeholder="Activity description"
                    />
                  </div>
                ))}
                <button 
                  onClick={handleAddActivity}
                  className="px-4 py-2 bg-primary-blue hover:bg-primary-cyan text-white rounded-lg transition-colors"
                >
                  Add Activity
                </button>
              </div>
            </div>

            {/* Member Count */}
            <div>
              <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                Number of Members
              </label>
              <input
                type="number"
                value={chapterData.members}
                onChange={(e) => setChapterData({...chapterData, members: parseInt(e.target.value)})}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
