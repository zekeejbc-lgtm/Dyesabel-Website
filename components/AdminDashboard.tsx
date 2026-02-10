import React, { useState } from 'react';
import { ArrowLeft, Users, BookOpen, Edit, Settings, LogOut, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'chapters' | 'landing' | 'settings'>('users');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Changes saved successfully!');
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-light via-[#b2dfdb] to-ocean-mint dark:from-ocean-deep dark:via-[#021017] dark:to-ocean-dark pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
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
                <h1 className="text-3xl font-black text-ocean-deep dark:text-white">Admin Dashboard</h1>
                <p className="text-ocean-deep/60 dark:text-gray-400 mt-1">
                  Welcome back, {user?.username}
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

        {/* Tabs */}
        <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'users'
                  ? 'bg-primary-blue text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-white/10 text-ocean-deep dark:text-white'
              }`}
            >
              <Users size={18} />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'chapters'
                  ? 'bg-primary-blue text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-white/10 text-ocean-deep dark:text-white'
              }`}
            >
              <BookOpen size={18} />
              Chapter Content
            </button>
            <button
              onClick={() => setActiveTab('landing')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'landing'
                  ? 'bg-primary-blue text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-white/10 text-ocean-deep dark:text-white'
              }`}
            >
              <Edit size={18} />
              Landing Page
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-primary-blue text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-white/10 text-ocean-deep dark:text-white'
              }`}
            >
              <Settings size={18} />
              Settings
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6">
          {activeTab === 'users' && <UserManagementTab />}
          {activeTab === 'chapters' && <ChapterContentTab />}
          {activeTab === 'landing' && <LandingPageTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
};

// User Management Tab
const UserManagementTab: React.FC = () => {
  const [users, setUsers] = useState([
    { id: '1', username: 'admin', email: 'admin@dyesabel.org', role: 'admin' },
    { id: '2', username: 'chapter1', email: 'chapter1@dyesabel.org', role: 'chapter_head', chapterId: 'quezon-city' },
    { id: '3', username: 'editor', email: 'editor@dyesabel.org', role: 'editor' },
  ]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-ocean-deep dark:text-white mb-6">User Management</h2>
      <div className="space-y-4">
        {users.map(user => (
          <div key={user.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-ocean-deep dark:text-white">{user.username}</h3>
                <p className="text-sm text-ocean-deep/60 dark:text-gray-400">{user.email}</p>
                <p className="text-sm text-ocean-deep/60 dark:text-gray-400 mt-1">
                  Role: <span className="font-semibold">{user.role}</span>
                  {user.chapterId && ` • Chapter: ${user.chapterId}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-primary-blue hover:bg-primary-cyan text-white text-sm rounded transition-colors">
                  Edit
                </button>
                <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-6 px-4 py-2 bg-primary-blue hover:bg-primary-cyan text-white rounded-lg transition-colors">
        Add New User
      </button>
    </div>
  );
};

// Chapter Content Tab
const ChapterContentTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ocean-deep dark:text-white mb-6">Chapter Content Editor</h2>
      <p className="text-ocean-deep/60 dark:text-gray-400 mb-4">
        Edit content for all chapters. As an admin, you have full access to modify any chapter.
      </p>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
          <h3 className="font-bold text-ocean-deep dark:text-white mb-2">Quezon City Chapter</h3>
          <button className="px-4 py-2 bg-primary-blue hover:bg-primary-cyan text-white rounded-lg transition-colors">
            Edit Chapter
          </button>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
          <h3 className="font-bold text-ocean-deep dark:text-white mb-2">Manila Chapter</h3>
          <button className="px-4 py-2 bg-primary-blue hover:bg-primary-cyan text-white rounded-lg transition-colors">
            Edit Chapter
          </button>
        </div>
      </div>
    </div>
  );
};

// Landing Page Tab
const LandingPageTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ocean-deep dark:text-white mb-6">Landing Page Editor</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">Hero Section Title</label>
          <input
            type="text"
            className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white"
            placeholder="Enter hero title"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-ocean-deep dark:text-white mb-2">Hero Section Description</label>
          <textarea
            rows={4}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ocean-deep dark:text-white"
            placeholder="Enter hero description"
          />
        </div>
      </div>
    </div>
  );
};

// Settings Tab
const SettingsTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ocean-deep dark:text-white mb-6">Settings</h2>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
          <h3 className="font-bold text-ocean-deep dark:text-white mb-2">Site Settings</h3>
          <p className="text-sm text-ocean-deep/60 dark:text-gray-400">Configure global site settings and preferences</p>
        </div>
      </div>
    </div>
  );
};
