import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Users as UsersIcon, Heart, Image as ImageIcon, FileText, Building2, Loader2, Edit, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PillarsEditor } from './PillarsEditor';
import { PartnersEditor } from './PartnersEditor';
import { FoundersEditor } from './FoundersEditor';
import { StoriesEditor } from './StoriesEditor';
import { LandingPageEditor } from './LandingPageEditor';
import { LogoEditor } from './LogoEditor';
// Removed UserManagement import as it is now integrated into ChaptersManagement
import { ChaptersManagement } from './ChaptersManagement';
import { pillarsData } from './Stories';
import { DataService } from '../services/DriveService';
import { SESSION_TOKEN_KEY } from '../types';

// Initial Data Constants (Fallbacks)
const initialPartnerCategories = [
  {
    id: 'coalitions',
    title: 'Coalitions',
    icon: <UsersIcon className="w-6 h-6" />,
    partners: [
      { id: 'c1', name: 'Youth for Nature', logo: 'https://ui-avatars.com/api/?name=Youth+Nature&background=22d3ee&color=fff' },
      { id: 'c2', name: 'Mindanao Green Alliance', logo: 'https://ui-avatars.com/api/?name=Mindanao+Green&background=2563eb&color=fff' },
    ]
  },
  {
    id: 'gov',
    title: 'Government Partners',
    icon: <Building2 className="w-6 h-6" />,
    partners: [
      { id: 'g1', name: 'DENR', logo: 'https://ui-avatars.com/api/?name=DENR&background=059669&color=fff' },
      { id: 'g2', name: 'Provincial Gov. Davao', logo: 'https://ui-avatars.com/api/?name=Davao+Gov&background=db2777&color=fff' },
      { id: 'g3', name: 'LGU Tagum City', logo: 'https://ui-avatars.com/api/?name=Tagum&background=d97706&color=fff' },
    ]
  },
];

const initialFounders = [
  {
    id: '1',
    name: 'Maria Clara Santos',
    role: 'Co-Founder & Executive Director',
    bio: 'An environmental scientist with over 15 years of experience in marine conservation.',
    imageUrl: 'https://picsum.photos/seed/person1/400/400'
  },
  {
    id: '2',
    name: 'Juan Dela Cruz',
    role: 'Co-Founder & Director of Advocacy',
    bio: 'A passionate youth leader and educator focused on grassroots engagement.',
    imageUrl: 'https://picsum.photos/seed/person2/400/400'
  }
];

const initialStories = [
  {
    id: '1',
    title: 'Beach Cleanup Success',
    excerpt: 'Over 200 volunteers joined our coastal cleanup drive...',
    imageUrl: 'https://picsum.photos/seed/story1/600/400',
    date: 'January 15, 2024'
  },
  {
    id: '2',
    title: 'Youth Leadership Training',
    excerpt: 'Empowering the next generation of environmental leaders...',
    imageUrl: 'https://picsum.photos/seed/story2/600/400',
    date: 'February 3, 2024'
  }
];

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  
  // State for all editable content
  const [pillars, setPillars] = useState(pillarsData);
  const [partners, setPartners] = useState(initialPartnerCategories);
  const [founders, setFounders] = useState(initialFounders);
  const [stories, setStories] = useState(initialStories);
  
  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching dashboard data...');

        const [pillarsRes, partnersRes, foundersRes, storiesRes] = await Promise.all([
          DataService.loadPillars(),
          DataService.loadPartners(),
          DataService.loadFounders(),
          DataService.loadStories()
        ]);

        if (pillarsRes.success && pillarsRes.pillars && pillarsRes.pillars.length > 0) {
          setPillars(pillarsRes.pillars);
        }
        
        if (partnersRes.success && partnersRes.partners) {
          setPartners(partnersRes.partners);
        }

        if (foundersRes.success && foundersRes.founders && foundersRes.founders.length > 0) {
          setFounders(foundersRes.founders);
        }

        if (storiesRes.success && storiesRes.stories && storiesRes.stories.length > 0) {
          setStories(storiesRes.stories);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSavePillars = async (updatedPillars: any) => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!sessionToken) {
        alert('Session expired. Please login again.');
        return;
      }
      setPillars(updatedPillars);
      const result = await DataService.savePillars(updatedPillars, sessionToken);
      if (!result.success) {
        alert('Error saving pillars: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving pillars: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSavePartners = async (updatedPartners: any) => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!sessionToken) {
        alert('Session expired. Please login again.');
        return;
      }
      setPartners(updatedPartners);
      const result = await DataService.savePartners(updatedPartners, sessionToken);
      if (!result.success) {
        alert('Error saving partners: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving partners: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSaveFounders = async (updatedFounders: any) => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!sessionToken) {
        alert('Session expired. Please login again.');
        return;
      }
      setFounders(updatedFounders);
      const result = await DataService.saveFounders(updatedFounders, sessionToken);
      if (!result.success) {
        alert('Error saving founders: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving founders: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSaveStories = async (updatedStories: any) => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!sessionToken) {
        alert('Session expired. Please login again.');
        return;
      }
      setStories(updatedStories);
      const result = await DataService.saveStories(updatedStories, sessionToken);
      if (!result.success) {
        alert('Error saving stories: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving stories: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-light to-ocean-mint dark:from-ocean-deep dark:to-ocean-dark flex items-center justify-center p-4">
        <div className="text-center text-ocean-deep dark:text-white">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="mb-4">You don't have permission to access this dashboard.</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-cyan transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-light to-ocean-mint dark:from-ocean-deep dark:to-ocean-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-blue animate-spin mx-auto mb-4" />
          <p className="text-ocean-deep dark:text-white font-medium">Loading Dashboard Data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-ocean-light via-[#b2dfdb] to-ocean-mint dark:from-ocean-deep dark:via-[#021017] dark:to-ocean-dark pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="text-ocean-deep dark:text-white" size={24} />
                </button>
                <div>
                  <h1 className="text-3xl font-black text-ocean-deep dark:text-white">
                    Content Management Dashboard
                  </h1>
                  <p className="text-ocean-deep/60 dark:text-gray-400 mt-1">
                    Welcome back, {user?.username} • Role: {user?.role}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setActiveEditor('logo')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-lg hover:shadow-amber-500/30"
              >
                <Edit size={18} />
                Edit Logo
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-[#051923] rounded-xl shadow-lg border border-white/10 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-blue/10 rounded-lg">
                  <BookOpen className="text-primary-blue" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ocean-deep dark:text-white">{pillars.length}</p>
                  <p className="text-sm text-ocean-deep/60 dark:text-gray-400">Pillars</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#051923] rounded-xl shadow-lg border border-white/10 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-cyan/10 rounded-lg">
                  <Building2 className="text-primary-cyan" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ocean-deep dark:text-white">
                    {partners.reduce((sum, cat) => sum + cat.partners.length, 0)}
                  </p>
                  <p className="text-sm text-ocean-deep/60 dark:text-gray-400">Partners</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#051923] rounded-xl shadow-lg border border-white/10 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Heart className="text-green-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ocean-deep dark:text-white">{stories.length}</p>
                  <p className="text-sm text-ocean-deep/60 dark:text-gray-400">Stories</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#051923] rounded-xl shadow-lg border border-white/10 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <UsersIcon className="text-purple-500" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ocean-deep dark:text-white">{founders.length}</p>
                  <p className="text-sm text-ocean-deep/60 dark:text-gray-400">Founders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ocean-deep dark:text-white mb-4">
              Edit Content Sections
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Pillars Card */}
              <button
                onClick={() => setActiveEditor('pillars')}
                className="bg-white dark:bg-[#051923] rounded-xl shadow-lg border border-white/10 p-6 hover:border-primary-blue dark:hover:border-primary-cyan transition-all hover:shadow-xl text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary-blue/10 rounded-lg group-hover:bg-primary-blue/20 transition-colors">
                    <BookOpen className="text-primary-blue" size={28} />
                  </div>
                  <span className="text-sm font-medium text-primary-blue">Edit →</span>
                </div>
                <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-2">
                  Core Pillars
                </h3>
                <p className="text-sm text-ocean-deep/60 dark:text-gray-400 mb-3">
                  Edit the 5 core pillars and their activities
                </p>
                <div className="text-xs text-ocean-deep/40 dark:text-gray-500">
                  {pillars.length} pillars • {pillars.reduce((sum, p) => sum + p.activities.length, 0)} activities
                </div>
              </button>

              {/* Partners Card */}
              <button
                onClick={() => setActiveEditor('partners')}
                className="bg-white dark:bg-[#051923] rounded-xl shadow-lg border border-white/10 p-6 hover:border-primary-cyan dark:hover:border-primary-cyan transition-all hover:shadow-xl text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary-cyan/10 rounded-lg group-hover:bg-primary-cyan/20 transition-colors">
                    <Building2 className="text-primary-cyan" size={28} />
                  </div>
                  <span className="text-sm font-medium text-primary-cyan">Edit →</span>
                </div>
                <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-2">
                  Partner Organizations
                </h3>
                <p className="text-sm text-ocean-deep/60 dark:text-gray-400 mb-3">
                  Manage partners across all categories
                </p>
                <div className="text-xs text-ocean-deep/40 dark:text-gray-500">
                  {partners.reduce((sum, cat) => sum + cat.partners.length, 0)} partners • {partners.length} categories
                </div>
              </button>

              {/* Stories Card */}
              <button
                onClick={() => setActiveEditor('stories')}
                className="bg-white dark:bg-[#051923] rounded-xl shadow-lg border border-white/10 p-6 hover:border-green-500 dark:hover:border-green-400 transition-all hover:shadow-xl text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                    <Heart className="text-green-500" size={28} />
                  </div>
                  <span className="text-sm font-medium text-green-500">Edit →</span>
                </div>
                <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-2">
                  Success Stories
                </h3>
                <p className="text-sm text-ocean-deep/60 dark:text-gray-400 mb-3">
                  Add and edit success stories & updates
                </p>
                <div className="text-xs text-ocean-deep/40 dark:text-gray-500">
                  {stories.length} stories published
                </div>
              </button>

              {/* Founders Card */}
              <button
                onClick={() => setActiveEditor('founders')}
                className="bg-white dark:bg-[#051923] rounded-xl shadow-lg border border-white/10 p-6 hover:border-purple-500 dark:hover:border-purple-400 transition-all hover:shadow-xl text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                    <UsersIcon className="text-purple-500" size={28} />
                  </div>
                  <span className="text-sm font-medium text-purple-500">Edit →</span>
                </div>
                <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-2">
                  Founders & Leadership
                </h3>
                <p className="text-sm text-ocean-deep/60 dark:text-gray-400 mb-3">
                  Edit founder profiles and bios
                </p>
                <div className="text-xs text-ocean-deep/40 dark:text-gray-500">
                  {founders.length} founders listed
                </div>
              </button>

              {/* Landing Page Card */}
              <button
                onClick={() => setActiveEditor('landing')}
                className="bg-white dark:bg-[#051923] rounded-xl shadow-lg border border-white/10 p-6 hover:border-orange-500 dark:hover:border-orange-400 transition-all hover:shadow-xl text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                    <FileText className="text-orange-500" size={28} />
                  </div>
                  <span className="text-sm font-medium text-orange-500">Edit →</span>
                </div>
                <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-2">
                  Landing Page
                </h3>
                <p className="text-sm text-ocean-deep/60 dark:text-gray-400 mb-3">
                  Edit hero section, slogan, and visuals
                </p>
                <div className="text-xs text-ocean-deep/40 dark:text-gray-500">
                  Main page content
                </div>
              </button>

              {/* Logo & Branding Card */}
              <button
                onClick={() => setActiveEditor('logo')}
                className="bg-white dark:bg-[#051923] rounded-xl shadow-lg border border-white/10 p-6 hover:border-pink-500 dark:hover:border-pink-400 transition-all hover:shadow-xl text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-pink-500/10 rounded-lg group-hover:bg-pink-500/20 transition-colors">
                    <ImageIcon className="text-pink-500" size={28} />
                  </div>
                  <span className="text-sm font-medium text-pink-500">Edit →</span>
                </div>
                <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-2">
                  Logo & Branding
                </h3>
                <p className="text-sm text-ocean-deep/60 dark:text-gray-400 mb-3">
                  Upload logo and update organization name
                </p>
                <div className="text-xs text-ocean-deep/40 dark:text-gray-500">
                  Stored in Google Drive
                </div>
              </button>

              {/* ✅ COMBINED: Chapters & Members Management Card (Admin Only) */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveEditor('chapters')}
                  className="bg-white dark:bg-[#051923] rounded-xl shadow-lg border border-white/10 p-6 hover:border-teal-500 dark:hover:border-teal-400 transition-all hover:shadow-xl text-left group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                      <Globe className="text-teal-500" size={28} />
                    </div>
                    <span className="text-sm font-medium text-teal-500">Manage →</span>
                  </div>
                  <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-2">
                    Chapters & Members
                  </h3>
                  <p className="text-sm text-ocean-deep/60 dark:text-gray-400 mb-3">
                    Manage local chapters and their user accounts
                  </p>
                  <div className="text-xs text-ocean-deep/40 dark:text-gray-500">
                    Network & User administration
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editors */}
      {activeEditor === 'pillars' && (
        <PillarsEditor
          pillars={pillars}
          onSave={handleSavePillars}
          onClose={() => setActiveEditor(null)}
        />
      )}

      {activeEditor === 'partners' && (
        <PartnersEditor
          categories={partners}
          onSave={handleSavePartners}
          onClose={() => setActiveEditor(null)}
        />
      )}
 
      {activeEditor === 'founders' && (
        <FoundersEditor
          founders={founders}
          onSave={handleSaveFounders}
          onClose={() => setActiveEditor(null)}
        />
      )}

      {activeEditor === 'stories' && (
        <StoriesEditor
          stories={stories}
          onSave={handleSaveStories}
          onClose={() => setActiveEditor(null)}
        />
      )}

      {activeEditor === 'landing' && (
        <LandingPageEditor
          onBack={() => setActiveEditor(null)}
        />
      )}

      {activeEditor === 'logo' && (
        <LogoEditor
          onClose={() => setActiveEditor(null)}
          onLogoUpdate={(newLogoUrl) => {
            console.log('Logo updated:', newLogoUrl);
          }}
        />
      )}

      {/* ✅ NEW: Chapters Management Editor (Handles both Chapters & Users) */}
      {activeEditor === 'chapters' && user?.role === 'admin' && (
        <ChaptersManagement
          onBack={() => setActiveEditor(null)}
        />
      )}
    </>
  );
};