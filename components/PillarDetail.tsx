import React, { useEffect } from 'react';
import { ArrowLeft, Target, Calendar, CheckCircle2 } from 'lucide-react';
import { Pillar } from '../types';

interface PillarDetailProps {
  pillar: Pillar;
  onBack: () => void;
}

export const PillarDetail: React.FC<PillarDetailProps> = ({ pillar, onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-10">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="fixed top-24 left-4 md:left-8 z-40 flex items-center gap-2 bg-ocean-deep/90 text-white backdrop-blur-md hover:bg-ocean-deep transition-all duration-300 font-medium px-5 py-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/10 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Pillars</span>
      </button>

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-end pb-16 overflow-hidden mb-12">
        <div className="absolute inset-0 z-0">
          <img 
            src={pillar.imageUrl} 
            alt={pillar.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep via-ocean-deep/70 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 reveal active">
          <div className="max-w-4xl">
            <span className="inline-block py-1 px-3 rounded-full bg-primary-cyan/20 border border-primary-cyan/50 text-primary-cyan font-bold text-sm tracking-widest uppercase mb-4 backdrop-blur-md">
              Core Pillar
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
              {pillar.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-light max-w-2xl leading-relaxed">
              {pillar.excerpt}
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Description */}
            <div className="reveal reveal-delay-100">
              <h2 className="text-3xl font-bold text-ocean-deep dark:text-white mb-6">Overview</h2>
              <div className="prose prose-lg dark:prose-invert text-ocean-deep/80 dark:text-gray-300 leading-relaxed text-justify">
                <p>{pillar.description}</p>
              </div>
            </div>

            {/* Implemented Activities */}
            <div className="reveal reveal-delay-200">
              <h2 className="text-3xl font-bold text-ocean-deep dark:text-white mb-8 flex items-center gap-3">
                <span className="w-2 h-8 bg-primary-cyan rounded-full"></span>
                Implemented Activities
              </h2>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="grid gap-6 p-2">
                  {pillar.activities.map((activity) => (
                    <div key={activity.id} className="glass-card rounded-2xl overflow-hidden flex flex-col md:flex-row group hover:bg-white/5 transition-colors border border-white/10 shrink-0">
                      <div className="w-full md:w-1/3 h-48 md:h-auto relative overflow-hidden">
                         <img 
                            src={activity.imageUrl} 
                            alt={activity.title}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1.5">
                             <Calendar size={12} className="text-primary-cyan" />
                             {activity.date}
                          </div>
                      </div>
                      <div className="p-6 md:p-8 flex flex-col justify-center flex-1">
                        <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-3 group-hover:text-primary-blue dark:group-hover:text-primary-cyan transition-colors">
                          {activity.title}
                        </h3>
                        <p className="text-ocean-deep/70 dark:text-gray-400 mb-4 leading-relaxed">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-bold text-primary-cyan mt-auto">
                          <CheckCircle2 size={16} />
                          <span>Completed</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {pillar.activities.length === 0 && (
                     <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/20">
                        <p className="text-gray-500">Upcoming activities to be announced.</p>
                     </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Our Aim Card */}
            <div className="glass-card p-8 rounded-3xl sticky top-24 border-t-4 border-primary-blue shadow-xl reveal reveal-delay-300">
              <div className="w-14 h-14 bg-primary-blue/10 rounded-full flex items-center justify-center text-primary-blue dark:text-primary-cyan mb-6">
                 <Target size={28} />
              </div>
              <h3 className="text-2xl font-bold text-ocean-deep dark:text-white mb-4">Our Aim</h3>
              <p className="text-lg text-ocean-deep/80 dark:text-gray-300 leading-relaxed font-medium italic">
                "{pillar.aim}"
              </p>
              
              <div className="mt-8 pt-6 border-t border-ocean-deep/10 dark:border-white/10">
                 <h4 className="font-bold text-sm uppercase tracking-wider text-ocean-deep/50 dark:text-gray-500 mb-4">Impact Areas</h4>
                 <div className="flex flex-wrap gap-2">
                    {['Sustainability', 'Youth', 'Community', 'Future'].map(tag => (
                       <span key={tag} className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-ocean-deep dark:text-white border border-white/10">
                          #{tag}
                       </span>
                    ))}
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};