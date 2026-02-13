import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Save, X, Users, MapPin, 
  Phone, Mail, Globe, Image as ImageIcon, ChevronLeft,
  UserPlus, Search, Shield, Key, Upload, Loader,
  Eye, EyeOff
} from 'lucide-react';
import { DataService, AuthService } from '../../services/DriveService';
import { uploadImageToDrive } from '../../utils/driveUpload';
import { Chapter, User } from '../../types';

// --- Types ---
type ViewState = 'LIST' | 'CREATE_CHAPTER' | 'CHAPTER_DETAIL';
type TabState = 'DETAILS' | 'MEMBERS';

interface ChaptersManagementProps {
  onBack: () => void;
}

export const ChaptersManagement: React.FC<ChaptersManagementProps> = ({ onBack }) => {
  // --- Global State ---
  const [view, setView] = useState<ViewState>('LIST');
  const [activeTab, setActiveTab] = useState<TabState>('DETAILS');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // --- Selected Item State ---
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  // --- Form States ---
  const [chapterFormData, setChapterFormData] = useState<Partial<Chapter>>({});
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'chapter_member' });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Initial Load ---
  useEffect(() => {
    loadData();
  }, []);

  // ... inside ChaptersManagement.tsx ...

  const loadData = async () => {
    setLoading(true);
    try {
      // ✅ FIX: Get the real token from Local Storage
      const token = localStorage.getItem('dyesabel_session') || '';

      const [chapRes, userRes] = await Promise.all([
        DataService.listChapters(),
        AuthService.listUsers(token) // ✅ Pass the REAL token, not 'dummy-token'
      ]);

      if (chapRes.success && chapRes.chapters) setChapters(chapRes.chapters);
      
      // Now this will actually work because the token is valid
      if (userRes.success && userRes.users) {
        setUsers(userRes.users);
      } else {
        console.warn("Could not load users:", userRes.message);
      }

    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the file ...

  // --- Handlers ---
  const handleChapterClick = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setChapterFormData(chapter);
    setView('CHAPTER_DETAIL');
    setActiveTab('DETAILS');
  };

  const generateChapterId = (name: string) => {
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const year = new Date().getFullYear();
    const uniqueCode = Math.random().toString(36).substring(2, 6);
    return `${slug}_chapter_${year}-${uniqueCode}`;
  };

  const handleSaveChapter = async () => {
    if (!chapterFormData.name) return alert("Chapter Name is required");
    
    const isNew = view === 'CREATE_CHAPTER';
    let chapterId = selectedChapter?.id || '';

    if (isNew) {
      chapterId = generateChapterId(chapterFormData.name);
    }
    
    const payload = { ...chapterFormData, id: chapterId };
    const token = localStorage.getItem('dyesabel_session') || 'dummy-token';

    try {
      const res = await DataService.saveChapter(chapterId, payload, token);
      if (res.success) {
        alert(isNew ? "Chapter Created!" : "Chapter Updated!");
        loadData();
        setView('LIST');
      } else {
        alert("Failed to save: " + res.message);
      }
    } catch (e) {
      alert("Error saving chapter");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const token = localStorage.getItem('dyesabel_session') || 'dummy-token';
      const res = await uploadImageToDrive(file, 'chapters', token);
      
      if (res.success && res.url) {
        setChapterFormData(prev => ({ ...prev, logo: res.url }));
      } else {
        alert('Failed to upload logo: ' + (res.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error', error);
      alert('Error uploading logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedChapter) return alert("No chapter selected!");
    if (!newUser.username || !newUser.password) return alert("Username and Password required");

    try {
      const payload = {
        ...newUser,
        chapterId: selectedChapter.id, 
      };
      
      const token = localStorage.getItem('dyesabel_session') || 'dummy-token';
      const res = await AuthService.createUser(token, payload);
      
      if (res.success) {
        // ✅ FIX 1: Optimistic Update - Add user to state immediately
        if (res.user) {
             setUsers(prev => [...prev, res.user]);
        } else {
             // Fallback if backend doesn't return the user object
             loadData();
        }
        
        alert(`User added to ${selectedChapter.name}!`);
        setIsUserModalOpen(false);
        setNewUser({ username: '', email: '', password: '', role: 'chapter_member' });
      } else {
        alert("Failed to add user: " + res.message);
      }
    } catch (e) {
      alert("Error adding user");
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm("Delete this chapter? This cannot be undone.")) return;
    setChapters(prev => prev.filter(c => c.id !== id)); 
    setView('LIST');
    const token = localStorage.getItem('dyesabel_session') || 'dummy-token';
    await DataService.deleteChapter(id, token);
  };

  const chapterUsers = users.filter(u => u.chapterId === selectedChapter?.id);


  // --- RENDER ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn">
      
      <div className="bg-[#0f172a] w-full max-w-7xl max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header Section */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            {view !== 'LIST' && (
              <button 
                onClick={() => {
                  setView('LIST');
                  setSelectedChapter(null);
                }}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Globe className="text-primary-cyan" />
                {view === 'LIST' ? 'Chapter Management' : selectedChapter?.name || 'New Chapter'}
              </h2>
              <p className="text-white/50 text-sm mt-1">
                {view === 'LIST' 
                  ? 'Manage local chapters and their member accounts' 
                  : (selectedChapter?.id || 'ID will be generated on save')}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          
          {loading ? (
            <div className="flex items-center justify-center h-64 text-white/40">
              <Loader className="animate-spin mr-2" /> Loading data...
            </div>
          ) : (
            <>
              {/* VIEW: LIST */}
              {view === 'LIST' && (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <button 
                      onClick={() => { setChapterFormData({}); setView('CREATE_CHAPTER'); }}
                      className="flex items-center gap-2 bg-primary-cyan hover:bg-cyan-400 text-ocean-deep font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                    >
                      <Plus size={20} /> Add New Chapter
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {chapters.map(chapter => (
                      <button 
                        key={chapter.id}
                        onClick={() => handleChapterClick(chapter)}
                        className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all text-left hover:border-primary-cyan/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] flex flex-col h-full"
                      >
                         <div className="flex items-start justify-between mb-4 w-full">
                            <div className="w-14 h-14 rounded-full bg-black/30 border border-white/20 flex items-center justify-center overflow-hidden">
                              {chapter.logo ? (
                                <img src={chapter.logo} alt={chapter.name} className="w-full h-full object-cover" />
                              ) : (
                                <Globe className="text-white/40" size={24} />
                              )}
                            </div>
                            <span className="bg-primary-blue/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full">
                              {users.filter(u => u.chapterId === chapter.id).length} Users
                            </span>
                         </div>
                         
                         <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-cyan transition-colors">
                           {chapter.name}
                         </h3>
                         <div className="flex items-center gap-2 text-white/50 text-xs mb-4">
                           <MapPin size={12} /> {chapter.location || 'No location set'}
                         </div>
                         <div className="text-[10px] text-white/30 font-mono mb-4 truncate">
                           ID: {chapter.id}
                         </div>
                         
                         <p className="text-white/60 text-sm line-clamp-2 mt-auto border-t border-white/10 pt-4">
                           {chapter.description || "No description available."}
                         </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW: CREATE / EDIT */}
              {(view === 'CREATE_CHAPTER' || view === 'CHAPTER_DETAIL') && (
                <div className="max-w-5xl mx-auto">
                  
                  {/* Tabs */}
                  {view === 'CHAPTER_DETAIL' && (
                    <div className="flex gap-2 mb-8 border-b border-white/10 pb-1">
                      <button 
                        onClick={() => setActiveTab('DETAILS')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'DETAILS' ? 'border-primary-cyan text-primary-cyan' : 'border-transparent text-white/50 hover:text-white'}`}
                      >
                        Chapter Details
                      </button>
                      <button 
                        onClick={() => setActiveTab('MEMBERS')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'MEMBERS' ? 'border-primary-cyan text-primary-cyan' : 'border-transparent text-white/50 hover:text-white'}`}
                      >
                        Members ({chapterUsers.length})
                      </button>
                    </div>
                  )}

                  {/* FORM: Details */}
                  {(activeTab === 'DETAILS' || view === 'CREATE_CHAPTER') && (
                    <div className="bg-white/5 rounded-2xl p-8 border border-white/10 space-y-6">
                      {/* ... (Details form remains the same) ... */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-primary-cyan uppercase tracking-wider">Chapter Name</label>
                          <input 
                            value={chapterFormData.name || ''} 
                            onChange={e => setChapterFormData({...chapterFormData, name: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary-cyan focus:outline-none"
                            placeholder="e.g. Tagum City Chapter"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-primary-cyan uppercase tracking-wider">Location</label>
                          <div className="relative">
                            <MapPin size={16} className="absolute left-4 top-3.5 text-white/40" />
                            <input 
                              value={chapterFormData.location || ''} 
                              onChange={e => setChapterFormData({...chapterFormData, location: e.target.value})}
                              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-primary-cyan focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-bold text-primary-cyan uppercase tracking-wider">Description</label>
                          <textarea 
                            value={chapterFormData.description || ''} 
                            onChange={e => setChapterFormData({...chapterFormData, description: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white h-32 resize-none focus:border-primary-cyan focus:outline-none"
                          />
                        </div>

                        {/* Contact Info Group */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-primary-cyan uppercase tracking-wider">Email</label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-4 top-3.5 text-white/40" />
                            <input 
                              value={chapterFormData.email || ''} 
                              onChange={e => setChapterFormData({...chapterFormData, email: e.target.value})}
                              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-primary-cyan focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-primary-cyan uppercase tracking-wider">Phone</label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-4 top-3.5 text-white/40" />
                            <input 
                              value={chapterFormData.phone || ''} 
                              onChange={e => setChapterFormData({...chapterFormData, phone: e.target.value})}
                              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-primary-cyan focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-primary-cyan uppercase tracking-wider">Social Media URL</label>
                          <div className="relative">
                            <Globe size={16} className="absolute left-4 top-3.5 text-white/40" />
                            <input 
                              value={chapterFormData.facebook || ''} 
                              onChange={e => setChapterFormData({...chapterFormData, facebook: e.target.value})}
                              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-primary-cyan focus:outline-none"
                            />
                          </div>
                        </div>
                        
                        {/* Logo Upload Section */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-primary-cyan uppercase tracking-wider">Chapter Logo</label>
                          <div className="flex items-start gap-4">
                            {/* Preview */}
                            <div className="w-20 h-20 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                               {chapterFormData.logo ? (
                                 <img src={chapterFormData.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                               ) : (
                                 <ImageIcon className="text-white/20" />
                               )}
                            </div>
                            
                            {/* Upload Button */}
                            <div className="flex-1">
                               <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-primary-cyan/50 hover:bg-white/5 transition-colors ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                    disabled={isUploadingLogo}
                                  />
                                  <div className="flex items-center gap-2 text-white/60">
                                     {isUploadingLogo ? (
                                        <>
                                           <Loader className="animate-spin" size={18} />
                                           <span className="text-sm">Uploading...</span>
                                        </>
                                     ) : (
                                        <>
                                           <Upload size={18} />
                                           <span className="text-sm font-medium">Upload Image</span>
                                        </>
                                     )}
                                  </div>
                               </label>
                               <p className="text-[10px] text-white/30 mt-1 pl-1">
                                  Supported: JPG, PNG, WebP. Max 5MB.
                               </p>
                            </div>
                          </div>
                        </div>

                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
                        {view === 'CHAPTER_DETAIL' ? (
                          <button 
                            onClick={() => handleDeleteChapter(selectedChapter!.id)}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-bold"
                          >
                            <Trash2 size={16} /> Delete Chapter
                          </button>
                        ) : <div></div>}
                        
                        <div className="flex gap-4">
                          <button onClick={() => setView('LIST')} className="text-white/60 hover:text-white px-4 py-2">Cancel</button>
                          <button 
                            onClick={handleSaveChapter}
                            className="bg-primary-cyan text-ocean-deep font-bold px-6 py-2 rounded-lg hover:bg-cyan-400 transition-colors flex items-center gap-2"
                          >
                            <Save size={18} /> Save Details
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MEMBERS TAB */}
                  {activeTab === 'MEMBERS' && view === 'CHAPTER_DETAIL' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10">
                        <div>
                          <h3 className="text-lg font-bold text-white">Chapter Members</h3>
                          <p className="text-white/50 text-sm">Users who can manage this specific chapter</p>
                        </div>
                        <button 
                          onClick={() => setIsUserModalOpen(true)}
                          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-white/10"
                        >
                          <UserPlus size={18} /> Add Member
                        </button>
                      </div>

                      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                        {chapterUsers.length === 0 ? (
                          <div className="p-12 text-center text-white/40">
                             <Users size={48} className="mx-auto mb-4 opacity-30" />
                             <p>No members assigned to this chapter yet.</p>
                          </div>
                        ) : (
                          <table className="w-full text-left">
                            <thead className="bg-black/20 text-xs uppercase text-white/40">
                              <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {chapterUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      {/* ✅ FIX 2: Profile Picture Preview */}
                                      <img 
                                        src={`https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff`} 
                                        alt={user.username}
                                        className="w-8 h-8 rounded-full border border-white/20"
                                      />
                                      <span className="text-white font-medium">{user.username}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs border ${
                                      user.role === 'admin' 
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/20' 
                                        : user.role === 'chapter_head'
                                        ? 'bg-primary-cyan/20 text-cyan-300 border-primary-cyan/20'
                                        : 'bg-white/10 text-white/70 border-white/10'
                                    }`}>
                                      {user.role}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-white/60 text-sm">{user.email}</td>
                                  <td className="px-6 py-4 text-right">
                                    <button className="text-white/30 hover:text-white transition-colors">
                                      <Edit2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* SUB-MODAL: Add User (Nested) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scaleIn">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <UserPlus className="text-primary-cyan" size={24} />
              Add Member
            </h3>
            
            <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-white/60 mb-1 uppercase">Username</label>
                 <div className="relative">
                   <Users size={16} className="absolute left-3 top-3 text-white/40" />
                   <input 
                      value={newUser.username}
                      onChange={e => setNewUser({...newUser, username: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-primary-cyan focus:outline-none"
                      placeholder="jdoe"
                   />
                 </div>
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-white/60 mb-1 uppercase">Email</label>
                 <div className="relative">
                   <Mail size={16} className="absolute left-3 top-3 text-white/40" />
                   <input 
                      type="email"
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-primary-cyan focus:outline-none"
                      placeholder="user@dyesabel.org"
                   />
                 </div>
               </div>
               
               {/* Password Field with Toggle */}
               <div>
                 <label className="block text-xs font-bold text-white/60 mb-1 uppercase">Password</label>
                 <div className="relative">
                   <Key size={16} className="absolute left-3 top-3 text-white/40" />
                   <input 
                      type={showPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-white focus:border-primary-cyan focus:outline-none"
                      placeholder="••••••••"
                   />
                   <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-white/40 hover:text-white"
                   >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                 </div>
               </div>
               
               {/* Role Selection */}
               <div className="pt-2">
                  <label className="block text-xs font-bold text-white/60 mb-1 uppercase">Role</label>
                  <div className="relative">
                    <Shield size={16} className="absolute left-3 top-3 text-primary-cyan pointer-events-none" />
                    <select
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-primary-cyan focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="chapter_member" className="bg-[#1e293b]">Member</option>
                      <option value="chapter_head" className="bg-[#1e293b]">Chapter Head</option>
                      <option value="editor" className="bg-[#1e293b]">Editor</option>
                      <option value="admin" className="bg-[#1e293b]">Admin</option>
                    </select>
                  </div>
               </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddUser}
                className="flex-1 bg-primary-cyan hover:bg-cyan-400 text-ocean-deep font-bold py-2 rounded-lg transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};