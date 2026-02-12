import React, { useState } from 'react';
import { ArrowLeft, Save, LogOut, Image as ImageIcon, FileText, Users, Upload, Trash2, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Megaphone, User } from 'lucide-react';
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
  
  // Initialize state with existing chapter data or defaults
  const [chapterData, setChapterData] = useState({
    // Basic Info
    title: chapter?.name || (user?.chapterId ? `${user?.chapterId} Chapter` : 'My Chapter'),
    description: chapter?.description || '',
    location: chapter?.location || '',
    
    // Images
    imageUrl: chapter?.image || '', // Cover Image
    logoUrl: chapter?.logo || '',   // Chapter Logo

    // Contact Info
    email: chapter?.email || '',
    phone: chapter?.phone || '',
    facebook: chapter?.facebook || '',
    twitter: chapter?.twitter || '', // Add these to types.ts if missing
    instagram: chapter?.instagram || '',

    // Leadership
    headName: chapter?.headName || '',
    headRole: chapter?.headRole || 'Chapter President',
    headQuote: chapter?.headQuote || '',
    headImageUrl: chapter?.headImageUrl || '',

    // CTA Section
    joinCtaDescription: chapter?.joinCtaDescription || 'Become a volunteer and make a direct impact in our community.',
    joinUrl: chapter?.joinUrl || '',

    // Activities
    activities: chapter?.activities || [
      { id: 1, title: 'Sample Activity', description: 'Description here...', date: '2024-01-01', imageUrl: '' },
    ],
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

      const chapterId = user?.chapterId || chapter?.id;
      if (!chapterId) {
        alert('Chapter ID not set. Unable to save.');
        setIsSaving(false);
        return;
      }

      // Map state back to the structure expected by the backend/types
      const payload = {
        name: chapterData.title,
        description: chapterData.description,
        location: chapterData.location,
        image: chapterData.imageUrl,
        logo: chapterData.logoUrl,
        email: chapterData.email,
        phone: chapterData.phone,
        facebook: chapterData.facebook,
        twitter: chapterData.twitter,
        instagram: chapterData.instagram,
        // Custom fields for extended data
        headName: chapterData.headName,
        headRole: chapterData.headRole,
        headQuote: chapterData.headQuote,
        headImageUrl: chapterData.headImageUrl,
        joinCtaDescription: chapterData.joinCtaDescription,
        joinUrl: chapterData.joinUrl,
        activities: chapterData.activities
      };

      console.log('Saving chapter data:', payload);
      const result = await DataService.saveChapter(chapterId, payload, sessionToken);

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

  // Generalized Image Upload Handler
  const handleUpload = async (file: File, field: string) => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY) || '';
      const result = await DriveService.uploadImage(file, sessionToken);
      
      if (result.success && result.fileUrl) {
        setChapterData(prev => ({ ...prev, [field]: result.fileUrl }));
      } else {
        alert('Upload failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error uploading image.');
    }
  };

  const handleActivityChange = (index: number, field: string, value: string) => {
    const newActivities = [...chapterData.activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setChapterData({ ...chapterData, activities: newActivities });
  };

  const handleActivityImageUpload = async (index: number, file: File) => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY) || '';
      const result = await DriveService.uploadImage(file, sessionToken);
      if (result.success && result.fileUrl) {
        handleActivityChange(index, 'imageUrl', result.fileUrl);
      }
    } catch (error) {
      alert('Error uploading activity image.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#021017] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6 mb-6 sticky top-24 z-30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
                <ArrowLeft className="text-gray-900 dark:text-white" size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Chapter Details</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-primary-blue hover:bg-primary-cyan text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Basic Info & Cover */}
            <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-primary-blue" /> Basic Information
              </h2>
              
              <div className="space-y-4">
                {/* Cover Image */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-black/20 border-2 border-dashed border-gray-300 dark:border-gray-700 group">
                  {chapterData.imageUrl ? (
                    <img src={chapterData.imageUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Cover Image</div>
                  )}
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                    <Upload size={32} className="mb-2" />
                    <span className="font-medium">Change Cover Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'imageUrl')} />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chapter Name</label>
                    <input 
                      type="text" 
                      value={chapterData.title}
                      onChange={(e) => setChapterData({...chapterData, title: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
                      <input 
                        type="text" 
                        value={chapterData.location}
                        onChange={(e) => setChapterData({...chapterData, location: e.target.value})}
                        className="w-full p-3 pl-10 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                        placeholder="City, Province"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">About the Chapter</label>
                  <textarea 
                    rows={4}
                    value={chapterData.description}
                    onChange={(e) => setChapterData({...chapterData, description: e.target.value})}
                    className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                    placeholder="Describe your chapter's mission and history..."
                  />
                </div>
              </div>
            </div>

            {/* 2. Recent Activities */}
            <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon size={20} className="text-primary-cyan" /> Recent Activities
                </h2>
                <button 
                  onClick={() => setChapterData({...chapterData, activities: [...chapterData.activities, { id: Date.now(), title: '', description: '', date: '', imageUrl: '' }]})}
                  className="text-xs bg-primary-blue text-white px-3 py-1.5 rounded-lg hover:bg-primary-cyan transition-colors"
                >
                  + Add Activity
                </button>
              </div>

              <div className="space-y-6">
                {chapterData.activities.map((activity: any, index: number) => (
                  <div key={activity.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-gray-400 uppercase">Activity #{index + 1}</span>
                      <button onClick={() => {
                        const newActs = chapterData.activities.filter((_, i) => i !== index);
                        setChapterData({...chapterData, activities: newActs});
                      }} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Activity Image */}
                      <div className="w-full md:w-32 h-32 bg-gray-200 dark:bg-black/20 rounded-lg overflow-hidden relative group flex-shrink-0">
                        {activity.imageUrl ? (
                          <img src={activity.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">No Image</div>
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                          <Upload size={20} className="text-white" />
                          <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleActivityImageUpload(index, e.target.files[0])} />
                        </label>
                      </div>

                      <div className="flex-grow space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            type="text" 
                            placeholder="Activity Title"
                            value={activity.title}
                            onChange={(e) => handleActivityChange(index, 'title', e.target.value)}
                            className="p-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white"
                          />
                          <input 
                            type="text" 
                            placeholder="Date (e.g. March 2024)"
                            value={activity.date}
                            onChange={(e) => handleActivityChange(index, 'date', e.target.value)}
                            className="p-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white"
                          />
                        </div>
                        <textarea 
                          placeholder="Brief description of what happened..."
                          rows={2}
                          value={activity.description}
                          onChange={(e) => handleActivityChange(index, 'description', e.target.value)}
                          className="w-full p-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Sidebar Info */}
          <div className="space-y-6">
            
            {/* 3. Logo & Branding */}
            <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Logo</h2>
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-white/10 overflow-hidden relative group mb-4">
                  <img src={chapterData.logoUrl || `https://ui-avatars.com/api/?name=${chapterData.title}&background=random`} alt="Logo" className="w-full h-full object-cover" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white">
                    <Upload size={24} />
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'logoUrl')} />
                  </label>
                </div>
                <p className="text-xs text-gray-500 text-center">Click to upload new logo</p>
              </div>
            </div>

            {/* 4. Contact Info */}
            <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Phone size={20} className="text-green-500" /> Contact Info
              </h2>
              <div className="space-y-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input type="email" placeholder="Email Address" value={chapterData.email} onChange={(e) => setChapterData({...chapterData, email: e.target.value})} className="w-full p-2 pl-9 bg-gray-50 dark:bg-white/5 border rounded-lg text-sm dark:text-white dark:border-white/10" />
                </div>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input type="text" placeholder="Phone Number" value={chapterData.phone} onChange={(e) => setChapterData({...chapterData, phone: e.target.value})} className="w-full p-2 pl-9 bg-gray-50 dark:bg-white/5 border rounded-lg text-sm dark:text-white dark:border-white/10" />
                </div>
                <div className="relative">
                  <Facebook size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input type="text" placeholder="Facebook URL (Optional)" value={chapterData.facebook} onChange={(e) => setChapterData({...chapterData, facebook: e.target.value})} className="w-full p-2 pl-9 bg-gray-50 dark:bg-white/5 border rounded-lg text-sm dark:text-white dark:border-white/10" />
                </div>
                <div className="relative">
                  <Twitter size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input type="text" placeholder="Twitter URL (Optional)" value={chapterData.twitter} onChange={(e) => setChapterData({...chapterData, twitter: e.target.value})} className="w-full p-2 pl-9 bg-gray-50 dark:bg-white/5 border rounded-lg text-sm dark:text-white dark:border-white/10" />
                </div>
                <div className="relative">
                  <Instagram size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input type="text" placeholder="Instagram URL (Optional)" value={chapterData.instagram} onChange={(e) => setChapterData({...chapterData, instagram: e.target.value})} className="w-full p-2 pl-9 bg-gray-50 dark:bg-white/5 border rounded-lg text-sm dark:text-white dark:border-white/10" />
                </div>
              </div>
            </div>

            {/* 5. Leadership */}
            <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users size={20} className="text-purple-500" /> Leadership
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden relative group flex-shrink-0">
                  <img src={chapterData.headImageUrl || `https://ui-avatars.com/api/?name=${chapterData.headName || 'Head'}`} className="w-full h-full object-cover" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Upload size={16} className="text-white" />
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'headImageUrl')} />
                  </label>
                </div>
                <div className="flex-grow">
                  <input type="text" placeholder="Leader Name" value={chapterData.headName} onChange={(e) => setChapterData({...chapterData, headName: e.target.value})} className="w-full p-2 mb-2 bg-gray-50 dark:bg-white/5 border rounded-lg text-sm dark:text-white dark:border-white/10" />
                  <input type="text" placeholder="Role (e.g. President)" value={chapterData.headRole} onChange={(e) => setChapterData({...chapterData, headRole: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-white/5 border rounded-lg text-xs dark:text-white dark:border-white/10" />
                </div>
              </div>
              <textarea placeholder="Leader's Quote..." rows={2} value={chapterData.headQuote} onChange={(e) => setChapterData({...chapterData, headQuote: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-white/5 border rounded-lg text-sm dark:text-white dark:border-white/10" />
            </div>

            {/* 6. Call to Action */}
            <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Megaphone size={20} className="text-orange-500" /> Join CTA
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                  <textarea rows={3} value={chapterData.joinCtaDescription} onChange={(e) => setChapterData({...chapterData, joinCtaDescription: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-white/5 border rounded-lg text-sm dark:text-white dark:border-white/10" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Google Form Link</label>
                  <input type="text" placeholder="https://forms.google.com/..." value={chapterData.joinUrl} onChange={(e) => setChapterData({...chapterData, joinUrl: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-white/5 border rounded-lg text-sm dark:text-white dark:border-white/10" />
                  <p className="text-[10px] text-gray-400 mt-1">Leave blank to hide the Join button.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};