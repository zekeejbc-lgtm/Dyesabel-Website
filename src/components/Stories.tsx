import React from 'react';
import { Pillar } from '../types';
import { Leaf, BookOpen, Scale, Heart, Palette } from 'lucide-react';

// Helper to map index to icon since icons can't be saved in JSON
const getIconForIndex = (index: number) => {
  const icons = [
    <BookOpen className="w-6 h-6 text-white" />,
    <Scale className="w-6 h-6 text-white" />,
    <Leaf className="w-6 h-6 text-white" />,
    <Heart className="w-6 h-6 text-white" />,
    <Palette className="w-6 h-6 text-white" />
  ];
  return icons[index % icons.length];
};

interface PillarsProps {
  pillars?: (Pillar & { icon?: React.ReactNode })[];
  onSelectPillar: (pillar: Pillar) => void;
  isLoading?: boolean;
}

export const Pillars: React.FC<PillarsProps> = ({ pillars = [], onSelectPillar, isLoading = false }) => {

  // ✅ 1. Loading State (Skeletons)
  if (isLoading) {
    return (
      <section id="pillars" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
             {/* Title Skeletons */}
             <div className="h-4 w-32 bg-gray-300 dark:bg-white/10 rounded mx-auto mb-4 animate-pulse"></div>
             <div className="h-12 w-64 md:w-96 bg-gray-300 dark:bg-white/10 rounded mx-auto animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden h-full animate-pulse border border-white/20">
                {/* Image Area Skeleton */}
                <div className="h-48 md:h-36 lg:h-48 bg-gray-300 dark:bg-white/10 w-full relative">
                    <div className="absolute bottom-4 left-4 w-10 h-10 bg-gray-400 dark:bg-white/20 rounded-xl"></div>
                </div>
                {/* Text Content Skeleton */}
                <div className="p-6">
                  <div className="h-6 w-3/4 bg-gray-300 dark:bg-white/10 rounded mb-3"></div>
                  <div className="h-4 w-full bg-gray-300 dark:bg-white/10 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-gray-300 dark:bg-white/10 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ✅ 2. Empty State (Hide section if no data)
  if (!pillars || pillars.length === 0) {
    return null;
  }

  // ✅ 3. Real Data Render
  return (
    <section id="pillars" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20 reveal">
          <h3 className="text-sm font-bold text-primary-blue dark:text-primary-cyan uppercase tracking-[0.3em] mb-4">What Drives Us</h3>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-ocean-deep dark:text-white drop-shadow-lg">Our Core Pillars</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {pillars.map((pillar, index) => (
            <div 
              key={pillar.id} 
              onClick={() => onSelectPillar(pillar)}
              className={`glass-card rounded-2xl overflow-hidden group flex flex-col h-full transform hover:-translate-y-3 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(34,211,238,0.3)] reveal reveal-delay-${(index + 1) * 100} cursor-pointer`}
            >
              <div className="relative h-48 md:h-36 lg:h-48 overflow-hidden">
                <img 
                  src={pillar.imageUrl} 
                  alt={pillar.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/90 via-transparent to-transparent opacity-90"></div>
                
                <div className="absolute bottom-4 left-4 bg-gradient-to-br from-primary-cyan to-primary-blue p-2.5 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300 ring-2 ring-white/20">
                  {pillar.icon || getIconForIndex(index)} 
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow text-center md:text-left relative">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                <h3 className="text-xl md:text-lg lg:text-xl font-bold text-ocean-deep dark:text-white mb-3 leading-tight group-hover:text-primary-blue dark:group-hover:text-primary-cyan transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-ocean-deep/70 dark:text-gray-300 text-sm leading-relaxed flex-grow font-medium">
                  {pillar.excerpt}
                </p>
                <div className="mt-4 pt-4 border-t border-ocean-deep/10 dark:border-white/10 text-xs font-bold text-primary-blue dark:text-primary-cyan uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                  Read More →
                </div>
              </div>
              
              <div className="h-1.5 w-0 bg-gradient-to-r from-primary-cyan to-primary-blue group-hover:w-full transition-all duration-700 ease-out"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};