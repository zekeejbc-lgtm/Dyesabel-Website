import React, { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Facebook, Twitter, Instagram, Edit, Loader } from 'lucide-react';
import { Chapter } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/DriveService';

interface ChapterDetailProps {
  chapter: Chapter;
  onBack: () => void;
  onEdit?: () => void;
}

export const ChapterDetail: React.FC<ChapterDetailProps> = ({ chapter: initialChapter, onBack, onEdit }) => {
  const { user } = useAuth();
  const [chapter, setChapter] = useState<Chapter>(initialChapter);
  const [loading, setLoading] = useState(false);
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ✅ NEW: Fetch latest chapter data from Backend
  useEffect(() => {
    const fetchChapterData = async () => {
      if (!initialChapter.id) return;
      
      setLoading(true);
      try {
        const result = await DataService.loadChapter(initialChapter.id);
        if (result.success && result.chapter) {
          console.log('Loaded chapter from backend:', result.chapter);
          // Merge backend data with initial data to ensure no fields are missing
          setChapter({ ...initialChapter, ...result.chapter });
        }
      } catch (error) {
        console.error('Failed to load chapter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [initialChapter.id]);

  return (
    <div className="min-h-screen pt-20 pb-10 relative">
      {loading && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-white/80 dark:bg-black/50 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2">
          <Loader className="animate-spin w-4 h-4 text-primary-blue" />
          <span className="text-sm font-medium">Loading latest content...</span>
        </div>
      )}

      {/* Floating Back Button */}
      <button 
        onClick={onBack}
        className="fixed top-24 left-4 md:left-8 z-40 flex items-center gap-2 bg-ocean-deep/90 text-white backdrop-blur-md hover:bg-ocean-deep transition-all duration-300 font-medium px-5 py-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/10 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Chapters</span>
      </button>

      {/* Edit Button - Show only if user is chapter head for this chapter or admin */}
      {onEdit && (user?.role === 'chapter_head' || user?.role === 'admin') && (
        <button 
          onClick={onEdit}
          className="fixed top-24 right-4 md:right-8 z-40 flex items-center gap-2 bg-primary-blue/90 text-white backdrop-blur-md hover:bg-primary-cyan transition-all duration-300 font-medium px-5 py-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/10 group"
        >
          <Edit size={18} className="group-hover:scale-110 transition-transform" />
          <span>Edit Chapter</span>
        </button>
      )}

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-end pb-12 overflow-hidden mb-12">
        <div className="absolute inset-0 z-0">
          <img 
            src={chapter.image || 'https://picsum.photos/1200/600'} 
            alt={chapter.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep via-ocean-deep/60 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 reveal active">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-md shadow-2xl p-2 flex-shrink-0 overflow-hidden">
            <img 
              src={chapter.logo || `https://ui-avatars.com/api/?name=${chapter.name}`} 
              alt={chapter.name} 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="text-center md:text-left text-white mb-2">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2">{chapter.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-white/80 font-medium text-lg">
              <MapPin size={20} className="text-primary-cyan" />
              {chapter.location || 'Location Not Set'}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* About */}
            <div className="glass-card p-8 rounded-3xl reveal reveal-delay-100">
              <h2 className="text-2xl font-bold text-ocean-deep dark:text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-1 bg-primary-cyan rounded-full"></span>
                About the Chapter
              </h2>
              <p className="text-lg text-ocean-deep/80 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {chapter.description || "This chapter is dedicated to environmental sustainability in its local community."}
              </p>
            </div>

            {/* Recent Activities */}
            <div className="reveal reveal-delay-200">
              <h2 className="text-2xl font-bold text-ocean-deep dark:text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-primary-blue rounded-full"></span>
                Recent Activities
              </h2>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                {chapter.activities && chapter.activities.length > 0 ? (
                  <div className="space-y-4 p-2">
                    {chapter.activities.map((activity: any, i: number) => (
                      <div key={activity.id || i} className="glass-card p-6 rounded-2xl flex flex-col md:flex-row gap-6 hover:bg-white/5 transition-colors group">
                        <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-white/5">
                          {activity.imageUrl ? (
                            <img src={activity.imageUrl} alt="Activity" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                          )}
                        </div>
                        <div className="flex-grow">
                          {activity.date && (
                            <div className="flex items-center gap-2 text-primary-cyan text-sm font-bold mb-2">
                              <Calendar size={14} />
                              <span>{activity.date}</span>
                            </div>
                          )}
                          <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-2 group-hover:text-primary-cyan transition-colors">
                            {activity.title || 'Untitled Activity'}
                          </h3>
                          <p className="text-sm text-ocean-deep/60 dark:text-gray-400 line-clamp-2">
                            {activity.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500">No recent activities posted yet.</div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Contact Info */}
            <div className="glass-card p-8 rounded-3xl reveal reveal-delay-300 border-t-4 border-primary-cyan">
              <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-6">Get in Touch</h3>
              <ul className="space-y-4">
                {chapter.email && (
                  <li className="flex items-center gap-3 text-ocean-deep/80 dark:text-gray-300">
                    <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue dark:text-primary-cyan flex-shrink-0">
                      <Mail size={18} />
                    </div>
                    <a href={`mailto:${chapter.email}`} className="truncate hover:text-primary-cyan transition-colors">{chapter.email}</a>
                  </li>
                )}
                {chapter.phone && (
                  <li className="flex items-center gap-3 text-ocean-deep/80 dark:text-gray-300">
                    <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue dark:text-primary-cyan flex-shrink-0">
                      <Phone size={18} />
                    </div>
                    <span>{chapter.phone}</span>
                  </li>
                )}
                {chapter.location && (
                  <li className="flex items-center gap-3 text-ocean-deep/80 dark:text-gray-300">
                    <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue dark:text-primary-cyan flex-shrink-0">
                      <MapPin size={18} />
                    </div>
                    <span>{chapter.location}</span>
                  </li>
                )}
              </ul>
              
              {/* Social Links */}
              {(chapter.facebook || chapter.twitter || chapter.instagram) && (
                <div className="mt-8 pt-6 border-t border-ocean-deep/10 dark:border-white/10 flex justify-center gap-4">
                  {chapter.facebook && (
                      <a href={chapter.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-primary-blue hover:text-white transition-all text-ocean-deep/60 dark:text-gray-400">
                          <Facebook size={20} />
                      </a>
                  )}
                  {chapter.twitter && (
                    <a href={chapter.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-sky-500 hover:text-white transition-all text-ocean-deep/60 dark:text-gray-400">
                      <Twitter size={20} />
                    </a>
                  )}
                  {chapter.instagram && (
                    <a href={chapter.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-pink-600 hover:text-white transition-all text-ocean-deep/60 dark:text-gray-400">
                      <Instagram size={20} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Chapter Leadership */}
            {(chapter.headName || chapter.headQuote) && (
              <div className="glass-card p-8 rounded-3xl reveal reveal-delay-400">
                <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-6">Chapter Leadership</h3>
                <div className="flex items-center gap-4 mb-4">
                  <img src={chapter.headImageUrl || `https://ui-avatars.com/api/?name=${chapter.headName || 'Head'}`} alt="Chapter Head" className="w-14 h-14 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-ocean-deep dark:text-white">{chapter.headName || 'Leader'}</h4>
                    <p className="text-xs text-primary-blue dark:text-primary-cyan uppercase font-bold tracking-wider">{chapter.headRole || 'Chapter Head'}</p>
                  </div>
                </div>
                {chapter.headQuote && (
                  <p className="text-sm text-ocean-deep/60 dark:text-gray-400 italic">
                    "{chapter.headQuote}"
                  </p>
                )}
              </div>
            )}

            {/* Join CTA */}
            {chapter.joinUrl && (
              <div className="bg-gradient-to-br from-primary-blue to-primary-cyan rounded-3xl p-8 text-center text-white shadow-xl reveal reveal-delay-500 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                 <h3 className="text-2xl font-black mb-2 relative z-10">Join {chapter.name}</h3>
                 <p className="mb-6 opacity-90 text-sm relative z-10">
                   {chapter.joinCtaDescription || `Become a volunteer and make a direct impact in ${chapter.location}.`}
                 </p>
                 <a 
                   href={chapter.joinUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="block w-full py-3 bg-white text-primary-blue font-bold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all relative z-10"
                 >
                   Sign Up Now
                 </a>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};