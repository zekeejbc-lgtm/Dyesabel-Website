import React from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Chapter } from '../types';

interface ChaptersProps {
  chapters: Chapter[];
  isLoading?: boolean; // ✅ Loading State
  onSelectChapter: (chapter: Chapter) => void;
}

export const Chapters: React.FC<ChaptersProps> = ({ chapters, isLoading = false, onSelectChapter }) => {
  return (
    <section id="chapters" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 reveal">
           <h3 className="text-sm font-bold text-primary-blue dark:text-primary-cyan uppercase tracking-[0.3em] mb-4">Our Network</h3>
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-ocean-deep dark:text-white drop-shadow-lg mb-6">
            Our Chapters
          </h2>
          <p className="text-lg text-ocean-deep/70 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            Expanding our reach and impact through local chapters committed to environmental sustainability across the region.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* ✅ SKELETON LOADING STATE */}
          {isLoading ? (
             [1, 2, 3].map((_, i) => (
                <div key={i} className="glass-card p-5 rounded-2xl flex items-center gap-5 border border-white/10 animate-pulse">
                   <div className="w-20 h-20 rounded-full bg-white/20 flex-shrink-0"></div>
                   <div className="flex-grow flex flex-col gap-2">
                      <div className="h-6 w-3/4 bg-white/20 rounded"></div>
                      <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                   </div>
                   <div className="w-10 h-10 rounded-full bg-white/10"></div>
                </div>
             ))
          ) : (
             // Real Data
             chapters.map((chapter, index) => (
              <div 
                key={chapter.id} 
                onClick={() => onSelectChapter(chapter)}
                className={`glass-card p-5 rounded-2xl flex items-center gap-5 hover:bg-white/10 transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(34,211,238,0.3)] transform hover:-translate-y-2 group reveal reveal-delay-${(index % 3 + 1) * 100} border border-white/10 cursor-pointer`}
              >
                <div className="w-20 h-20 flex-shrink-0 bg-white/20 dark:bg-black/20 rounded-full p-1 border border-white/30 shadow-inner group-hover:scale-105 transition-transform duration-500 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <img 
                      src={chapter.logo || `https://ui-avatars.com/api/?name=${chapter.name}&background=random`} 
                      alt={`${chapter.name} Logo`} 
                      className="w-full h-full object-cover rounded-full" 
                  />
                </div>
                
                <div className="flex-grow min-w-0 flex flex-col justify-center">
                  <h3 className="text-lg md:text-xl font-bold text-ocean-deep dark:text-white group-hover:text-primary-blue dark:group-hover:text-primary-cyan transition-colors leading-tight break-words">
                    {chapter.name}
                  </h3>
                  <div className="flex items-start gap-1.5 text-xs font-medium text-ocean-deep/60 dark:text-gray-400 mt-1.5 group-hover:text-ocean-deep/80 dark:group-hover:text-gray-300 transition-colors">
                    <MapPin size={14} className="text-primary-cyan flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">{chapter.location || 'Location not set'}</span>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-white/5 flex flex-shrink-0 items-center justify-center text-ocean-deep/40 dark:text-white/40 group-hover:bg-gradient-to-br group-hover:from-primary-cyan group-hover:to-primary-blue group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg self-center">
                  <ArrowUpRight size={20} className="transform group-hover:rotate-45 transition-transform duration-300" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};