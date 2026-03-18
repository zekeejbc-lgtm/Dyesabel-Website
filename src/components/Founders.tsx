import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ExecutiveOfficer, Founder } from '../types';
import { convertToCORSFreeLink } from '../services/DriveService';

interface FoundersProps {
  founders?: Founder[];
  executiveOfficers?: ExecutiveOfficer[];
  isLoading?: boolean;
  onEdit?: () => void;
}

export const Founders: React.FC<FoundersProps> = ({
  founders = [],
  executiveOfficers = [],
  isLoading = false,
  onEdit
}) => {
  const { user } = useAuth();
  const [isExecutivesOpen, setIsExecutivesOpen] = useState(false);
  const [showAllExecutives, setShowAllExecutives] = useState(false);

  const visibleExecutiveOfficers = showAllExecutives
    ? executiveOfficers
    : executiveOfficers.slice(0, 6);

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=256&bold=true`;

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 mb-16">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-center text-ocean-deep dark:text-white drop-shadow-md reveal">
            Meet the Founders
          </h2>
          {onEdit && user?.role === 'admin' && (
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
          {isLoading ? (
            [1, 2].map((_, i) => (
              <div key={i} className="glass-card flex flex-col md:flex-row items-center md:items-start gap-6 p-8 rounded-3xl w-full md:max-w-xl flex-1 animate-pulse border border-white/10">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 flex-shrink-0" />
                <div className="flex-1 w-full flex flex-col items-center md:items-start gap-3">
                  <div className="h-8 w-3/4 bg-white/20 rounded" />
                  <div className="h-4 w-1/2 bg-white/10 rounded" />
                  <div className="h-20 w-full bg-white/10 rounded mt-2" />
                </div>
              </div>
            ))
          ) : (
            founders.map((founder, index) => (
              <div
                key={founder.id}
                className={`glass-card flex flex-col md:flex-row items-center md:items-start gap-6 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] reveal reveal-delay-${(index + 1) * 200} w-full md:max-w-xl flex-1 min-w-[300px]`}
              >
                <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 relative group mx-auto md:mx-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-cyan to-primary-blue rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-500 animate-pulse-slow" />
                  <img
                    src={convertToCORSFreeLink(founder.imageUrl) || getAvatarUrl(founder.name)}
                    alt={founder.name}
                    onError={(event) => {
                      event.currentTarget.src = getAvatarUrl(founder.name);
                    }}
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

        <div className="mt-12 max-w-7xl mx-auto">
          <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsExecutivesOpen((prev) => !prev)}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 md:px-8 text-left hover:bg-white/10 transition-colors duration-300"
            >
              <div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-ocean-deep dark:text-white">
                  Meet the Executives
                </h3>
                <p className="text-sm md:text-base text-ocean-deep/70 dark:text-gray-300 mt-1">
                  National Executive Officers
                </p>
              </div>
              <span className="flex items-center gap-2 text-sm font-semibold text-primary-blue dark:text-primary-cyan whitespace-nowrap">
                {isExecutivesOpen ? 'Collapse' : 'Show Executives'}
                {isExecutivesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>

            {isExecutivesOpen && (
              <div className="px-6 pb-6 md:px-8 md:pb-8">
                {visibleExecutiveOfficers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                    {visibleExecutiveOfficers.map((executive, index) => (
                      <article
                        key={executive.id}
                        className={`rounded-2xl border border-white/15 bg-white/10 dark:bg-white/5 p-4 md:p-5 flex items-center gap-4 hover:bg-white/15 transition-all duration-300 reveal reveal-delay-${((index % 6) + 1) * 100}`}
                      >
                        <img
                          src={convertToCORSFreeLink(executive.imageUrl) || getAvatarUrl(executive.name)}
                          alt={executive.name}
                          onError={(event) => {
                            event.currentTarget.src = getAvatarUrl(executive.name);
                          }}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-white/30 shadow-lg flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.18em] text-primary-blue dark:text-primary-cyan mb-1">
                            {executive.role}
                          </p>
                          <h4 className="text-base md:text-lg font-bold text-ocean-deep dark:text-white leading-tight break-words">
                            {executive.name}
                          </h4>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-ocean-deep/60 dark:text-gray-300">
                    No executive officers added yet.
                  </div>
                )}

                {executiveOfficers.length > 6 && (
                  <div className="flex justify-center mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAllExecutives((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-blue hover:bg-primary-cyan text-white font-semibold px-5 py-2.5 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {showAllExecutives ? 'Show Less' : 'Show More'}
                      {showAllExecutives ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
