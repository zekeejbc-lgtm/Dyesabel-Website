import React, { useState } from 'react';
import { ArrowLeft, Save, LogOut, Layout, Type, Image } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/DriveService';
import { SESSION_TOKEN_KEY } from '../types';

interface LandingPageEditorProps {
  onBack: () => void;
}

export const LandingPageEditor: React.FC<LandingPageEditorProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Landing page data (this would be fetched from your backend/GAS)
  const [pageData, setPageData] = useState({
    heroTitle: 'Empowering Communities, Transforming Lives',
    heroSubtitle: 'Building stronger Filipino communities through education, empowerment, and sustainable development',
    heroButtonText: 'Support Our Mission',
    sloganText: 'Together, we rise. Together, we thrive.',
    aboutText: 'Dyesabel Philippines is dedicated to creating lasting change in communities across the Philippines.',
    featuredImageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=1200'
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

      console.log('Saving landing page data:', pageData);
      const result = await DataService.saveLandingPageData(pageData, sessionToken);
      console.log('Save result:', result);

      if (result.success) {
        alert('Landing page changes saved successfully!');
      } else {
        alert('Error saving changes: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving landing page:', error);
      alert('Error saving landing page: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSaving(false);
    }
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
                <h1 className="text-3xl font-black text-ocean-deep dark:text-white">Landing Page Editor</h1>
                <p className="text-ocean-deep/60 dark:text-gray-400 mt-1">
                  Customize the main landing page content
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
          <div className="space-y-8">
            {/* Hero Section */}
            <div>
              <h2 className="text-xl font-bold text-ocean-deep dark:text-white mb-4 flex items-center gap-2">
                <Layout size={20} />
                Hero Section
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                    Main Title
                  </label>
                  <input
                    type="text"
                    value={pageData.heroTitle}
                    onChange={(e) => setPageData({...pageData, heroTitle: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                    Subtitle
                  </label>
                  <textarea
                    rows={3}
                    value={pageData.heroSubtitle}
                    onChange={(e) => setPageData({...pageData, heroSubtitle: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={pageData.heroButtonText}
                    onChange={(e) => setPageData({...pageData, heroButtonText: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                  />
                </div>
              </div>
            </div>

            {/* Slogan Section */}
            <div>
              <h2 className="text-xl font-bold text-ocean-deep dark:text-white mb-4 flex items-center gap-2">
                <Type size={20} />
                Slogan
              </h2>
              <div>
                <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                  Slogan Text
                </label>
                <input
                  type="text"
                  value={pageData.sloganText}
                  onChange={(e) => setPageData({...pageData, sloganText: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                />
              </div>
            </div>

            {/* About Section */}
            <div>
              <h2 className="text-xl font-bold text-ocean-deep dark:text-white mb-4 flex items-center gap-2">
                <Type size={20} />
                About Section
              </h2>
              <div>
                <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                  About Text
                </label>
                <textarea
                  rows={4}
                  value={pageData.aboutText}
                  onChange={(e) => setPageData({...pageData, aboutText: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                />
              </div>
            </div>

            {/* Featured Image */}
            <div>
              <h2 className="text-xl font-bold text-ocean-deep dark:text-white mb-4 flex items-center gap-2">
                <Image size={20} />
                Featured Image
              </h2>
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5">
                  <img 
                    src={pageData.featuredImageUrl} 
                    alt="Featured" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={pageData.featuredImageUrl}
                    onChange={(e) => setPageData({...pageData, featuredImageUrl: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan/50"
                  />
                </div>
              </div>
            </div>

            {/* Preview Note */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Changes will be reflected on the main landing page after saving. 
                Make sure to preview your changes before saving.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
