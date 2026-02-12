import React, { useState, useEffect } from 'react';
import { Plus, X, Save, MapPin, Edit, Search, Trash2, Globe } from 'lucide-react';
import { DataService } from '../services/DriveService';
import { Chapter, SESSION_TOKEN_KEY } from '../types';

interface ChaptersManagementProps {
  onBack: () => void;
}

export const ChaptersManagement: React.FC<ChaptersManagementProps> = ({ onBack }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Chapter Form State
  const [newChapter, setNewChapter] = useState({
    id: '',
    name: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    loadChapters();
  }, []);

  const loadChapters = async () => {
    setIsLoading(true);
    try {
      const result = await DataService.listChapters();
      if (result.success && result.chapters) {
        setChapters(result.chapters);
      }
    } catch (error) {
      console.error("Failed to load chapters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChapter = async () => {
    if (!newChapter.name || !newChapter.id) {
      alert("Chapter Name and ID are required.");
      return;
    }

    // Basic ID validation (alphanumeric + dashes only)
    const safeId = newChapter.id.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    setIsSaving(true);
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!sessionToken) throw new Error("Session expired");

      const result = await DataService.saveChapter(safeId, {
        name: newChapter.name,
        location: newChapter.location,
        description: newChapter.description,
        image: '',
        logo: '',
        activities: []
      }, sessionToken);

      if (result.success) {
        alert("Chapter created successfully!");
        setShowAddModal(false);
        setNewChapter({ id: '', name: '', location: '', description: '' }); 
        loadChapters(); 
      } else {
        alert("Error creating chapter: " + result.error);
      }
    } catch (error) {
      alert("Failed to create chapter.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameChange = (val: string) => {
    const generatedId = val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    setNewChapter({ ...newChapter, name: val, id: generatedId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-lg border border-white/10 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-ocean-deep dark:text-white">Chapters Management</h2>
            <p className="text-ocean-deep/60 dark:text-gray-400 mt-1 text-sm">
              Create and manage local chapters.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue hover:bg-primary-cyan text-white rounded-lg transition-colors font-bold shadow-lg"
          >
            <Plus size={18} />
            Add Chapter
          </button>
        </div>
      </div>

      {/* Chapters List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-10 text-gray-500">Loading chapters...</div>
        ) : chapters.map((chapter) => (
          <div key={chapter.id} className="bg-white dark:bg-[#051923] rounded-xl shadow-md border border-white/10 p-5 flex flex-col gap-4 group hover:border-primary-cyan transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden flex-shrink-0">
                <img 
                  src={chapter.logo || `https://ui-avatars.com/api/?name=${chapter.name}&background=random`} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-ocean-deep dark:text-white truncate">{chapter.name}</h3>
                <p className="text-xs text-primary-blue dark:text-primary-cyan font-mono">ID: {chapter.id}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <MapPin size={14} />
              <span className="truncate">{chapter.location || "No location set"}</span>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex justify-between items-center text-xs">
               <span className="text-gray-400">
                 {chapter.activities?.length || 0} Activities
               </span>
               <div className="px-2 py-1 bg-green-500/10 text-green-600 rounded">Active</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Chapter Modal */}
      {showAddModal && (
        // ✅ FIXED: Increased blur to 'md' and adjusted opacity for better visibility
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#051923] rounded-2xl shadow-2xl max-w-lg w-full border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h2 className="text-xl font-black text-ocean-deep dark:text-white flex items-center gap-2">
                <Globe className="text-primary-blue" size={20} />
                Create New Chapter
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                  Chapter Name
                </label>
                <input
                  type="text"
                  value={newChapter.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Panabo City Chapter"
                  className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-ocean-deep dark:text-white focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                  Chapter ID (Unique)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newChapter.id}
                    onChange={(e) => setNewChapter({ ...newChapter, id: e.target.value })}
                    placeholder="panabo-chapter"
                    className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-ocean-deep dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-blue outline-none"
                  />
                  <div className="absolute right-3 top-3.5 text-[10px] text-gray-400 bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded">
                    Database Key
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                  This ID acts as the database key. It must be unique and cannot be changed later.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={newChapter.location}
                    onChange={(e) => setNewChapter({ ...newChapter, location: e.target.value })}
                    placeholder="City, Province"
                    className="w-full p-3 pl-10 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-ocean-deep dark:text-white focus:ring-2 focus:ring-primary-blue outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newChapter.description}
                  onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                  placeholder="Brief description of the chapter..."
                  className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-ocean-deep dark:text-white focus:ring-2 focus:ring-primary-blue outline-none resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChapter}
                disabled={isSaving}
                className="flex-[2] py-3 px-4 bg-gradient-to-r from-primary-blue to-primary-cyan hover:from-blue-600 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg transform active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? "Creating..." : "Create Chapter"}
                {!isSaving && <Save size={18} />}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};