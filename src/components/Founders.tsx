import React from 'react';
import { Founder } from '../types';
import { Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FoundersProps {
  founders?: Founder[]; // ✅ Recieved from App.tsx
  isLoading?: boolean; // ✅ Loading State
  onEdit?: () => void;
}

export const Founders: React.FC<FoundersProps> = ({ founders = [], isLoading = false, onEdit }) => {
  const { user } = useAuth();

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 mb-16">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-center text-ocean-deep dark:text-white drop-shadow-md reveal">
            Meet the Founders
          </h2>
          {onEdit && (user?.role === 'admin' || user?.role === 'editor') && (
            <button 
              onClick={onEdit}
              className="flex items-center gap-2 bg-primary-blue hover:bg-primary-cyan text-white font-medium px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Edit size={18} />
              <span>Edit Founders</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-10 max-w-7xl mx-auto">
          
          {/* ✅ SKELETON LOADING STATE */}
          {isLoading ? (
             [1, 2].map((_, i) => (
                <div key={i} className="glass-card flex flex-col md:flex-row items-center md:items-start gap-6 p-8 rounded-3xl w-full md:max-w-xl flex-1 animate-pulse border border-white/10">
                   {/* Skeleton Image */}
                   <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 flex-shrink-0"></div>
                   {/* Skeleton Text */}
                   <div className="flex-1 w-full flex flex-col items-center md:items-start gap-3">
                      <div className="h-8 w-3/4 bg-white/20 rounded"></div>
                      <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                      <div className="h-20 w-full bg-white/10 rounded mt-2"></div>
                   </div>
                </div>
             ))
          ) : (
             // Real Data
             founders.map((founder, index) => (
              <div 
                key={founder.id} 
                className={`glass-card flex flex-col md:flex-row items-center md:items-start gap-6 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] reveal reveal-delay-${(index + 1) * 200} w-full md:max-w-xl flex-1 min-w-[300px]`}
              >
                <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 relative group mx-auto md:mx-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-cyan to-primary-blue rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-500 animate-pulse-slow"></div>
                  <img 
                    src={founder.imageUrl} 
                    alt={founder.name} 
                    className="w-full h-full object-cover rounded-full border-[3px] border-white/30 dark:border-white/20 shadow-xl transform group-hover:scale-105 transition-transform duration-500 relative z-10"
                  />
                </div>
                
                <div className="text-center md:text-left flex-1">
                  <h3 className="text-2xl font-bold text-ocean-deep dark:text-white mb-1">{founder.name}</h3>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-primary-blue to-primary-cyan font-bold text-xs md:text-sm uppercase tracking-widest mb-3">
                    {founder.role}
                  </p>
                  <p className="text-ocean-deep/80 dark:text-gray-300 leading-relaxed text-sm font-medium">
                    {founder.bio}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};