import React from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Chapter } from '../types';

export const chaptersData: Chapter[] = [
  { 
    id: 'tagum', 
    name: 'Tagum Chapter', 
    location: 'Tagum City, Davao del Norte', 
    logo: 'https://i.imgur.com/CQCKjQM.png',
    image: 'https://picsum.photos/seed/tagum/1200/600',
    description: 'Leading the way in urban biodiversity conservation within Tagum City, focusing on sustainable waste management and green spaces.',
    email: 'dyesabeltagum@gmail.com',
    phone: '(084) 123-4567',
    facebook: 'https://www.facebook.com/profile.php?id=61578133816723'
  },
  { 
    id: 'nabunturan', 
    name: 'Nabunturan Chapter', 
    location: 'Nabunturan, Davao de Oro', 
    logo: 'https://i.imgur.com/CQCKjQM.png',
    image: 'https://picsum.photos/seed/nabunturan/1200/600',
    description: 'Championing river rehabilitation and watershed protection in the heart of Davao de Oro.',
    email: 'nabunturan@dyesabel.ph',
    phone: '(088) 234-5678'
  },
  { 
    id: 'mati', 
    name: 'Mati Chapter', 
    location: 'Mati City, Davao Oriental', 
    logo: 'https://i.imgur.com/CQCKjQM.png',
    image: 'https://picsum.photos/seed/mati/1200/600',
    description: 'Protectors of our coastal heritage, the Mati Chapter focuses on marine life conservation and sustainable tourism.',
    email: 'mati@dyesabel.ph',
    phone: '(087) 345-6789'
  },
  { 
    id: 'mabini', 
    name: 'Mabini Chapter', 
    location: 'Mabini, Davao de Oro', 
    logo: 'https://i.imgur.com/CQCKjQM.png',
    image: 'https://picsum.photos/seed/mabini/1200/600',
    description: 'Empowering local communities through agro-forestry and sustainable livelihood programs.',
    email: 'mabini@dyesabel.ph',
    phone: '(088) 456-7890'
  },
  { 
    id: 'maco', 
    name: 'Maco Chapter', 
    location: 'Maco, Davao de Oro', 
    logo: 'https://i.imgur.com/CQCKjQM.png',
    image: 'https://picsum.photos/seed/maco/1200/600',
    description: 'Advocating for responsible mining practices and reforestation in the mineral-rich areas of Maco.',
    email: 'maco@dyesabel.ph',
    phone: '(088) 567-8901'
  },
  { 
    id: 'new-corella', 
    name: 'New Corella Chapter', 
    location: 'New Corella, Davao del Norte', 
    logo: 'https://i.imgur.com/CQCKjQM.png',
    image: 'https://picsum.photos/seed/corella/1200/600',
    description: 'Guardians of the highland springs and waterfalls, ensuring clean water access for all.',
    email: 'newcorella@dyesabel.ph',
    phone: '(084) 678-9012'
  },
];

interface ChaptersProps {
  onSelectChapter: (chapter: Chapter) => void;
}

export const Chapters: React.FC<ChaptersProps> = ({ onSelectChapter }) => {
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
          {chaptersData.map((chapter, index) => (
            <div 
              key={chapter.id} 
              onClick={() => onSelectChapter(chapter)}
              className={`glass-card p-5 rounded-2xl flex items-center gap-5 hover:bg-white/10 transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(34,211,238,0.3)] transform hover:-translate-y-2 group reveal reveal-delay-${(index % 3 + 1) * 100} border border-white/10 cursor-pointer`}
            >
              {/* Logo Container */}
              <div className="w-20 h-20 flex-shrink-0 bg-white/20 dark:bg-black/20 rounded-full p-1 border border-white/30 shadow-inner group-hover:scale-105 transition-transform duration-500 overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-tr from-primary-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <img 
                    src={chapter.logo} 
                    alt={`${chapter.name} Logo`} 
                    className="w-full h-full object-cover rounded-full" 
                 />
              </div>
              
              {/* Text Info - Updated to allow wrapping and dynamic sizing */}
              <div className="flex-grow min-w-0 flex flex-col justify-center">
                <h3 className="text-lg md:text-xl font-bold text-ocean-deep dark:text-white group-hover:text-primary-blue dark:group-hover:text-primary-cyan transition-colors leading-tight break-words">
                  {chapter.name}
                </h3>
                <div className="flex items-start gap-1.5 text-xs font-medium text-ocean-deep/60 dark:text-gray-400 mt-1.5 group-hover:text-ocean-deep/80 dark:group-hover:text-gray-300 transition-colors">
                   <MapPin size={14} className="text-primary-cyan flex-shrink-0 mt-0.5" />
                   <span className="leading-tight">{chapter.location}</span>
                </div>
              </div>

              {/* Action Icon */}
              <div className="w-10 h-10 rounded-full bg-white/5 flex flex-shrink-0 items-center justify-center text-ocean-deep/40 dark:text-white/40 group-hover:bg-gradient-to-br group-hover:from-primary-cyan group-hover:to-primary-blue group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg self-center">
                <ArrowUpRight size={20} className="transform group-hover:rotate-45 transition-transform duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};