import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ExecutiveOfficer, Founder } from '../types';
import { convertToCORSFreeLink } from '../services/DriveService';
import { SkeletonBlock, SkeletonCircle } from './Skeleton';

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
    <section className="relative py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-5">
        <div className="mb-10 flex flex-col items-center gap-4 sm:mb-14 sm:gap-6 lg:mb-16">
          <h2 className="reveal text-center text-[clamp(2.1rem,8vw,4rem)] font-black tracking-[-0.04em] text-ocean-deep drop-shadow-md dark:text-white">
            Meet the Founders
          </h2>
          {onEdit && user?.role === 'admin' && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 rounded-full bg-primary-blue px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:bg-primary-cyan hover:shadow-xl sm:px-6 sm:py-3 sm:text-base"
            >
              <Edit size={18} />
              <span>Edit Founders</span>
            </button>
          )}
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:gap-6 md:flex-row md:flex-wrap md:justify-center md:gap-8 lg:gap-10">
          {isLoading ? (
            [1, 2].map((_, i) => (
              <div key={i} className="glass-card flex w-full flex-1 flex-col items-center gap-5 rounded-[2rem] border border-white/10 p-5 sm:p-6 md:max-w-xl md:flex-row md:items-start lg:p-8">
                <SkeletonCircle className="h-28 w-28 flex-shrink-0 sm:h-32 sm:w-32 md:h-40 md:w-40" />
                <div className="flex w-full flex-1 flex-col items-center gap-3 md:items-start">
                  <SkeletonBlock className="h-8 w-3/4" />
                  <SkeletonBlock className="h-4 w-1/2" />
                  <SkeletonBlock className="mt-2 h-20 w-full" />
                </div>
              </div>
            ))
          ) : (
            founders.map((founder, index) => (
              <div
                key={founder.id}
                className={`glass-card reveal flex w-full flex-col items-center gap-5 rounded-[2rem] p-5 transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] sm:p-6 md:max-w-xl md:flex-1 md:flex-row md:items-start lg:p-8 reveal-delay-${(index + 1) * 200}`}
              >
                <div className="relative mx-auto h-28 w-28 flex-shrink-0 group sm:h-32 sm:w-32 md:mx-0 md:h-40 md:w-40">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-cyan to-primary-blue rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-500 animate-pulse-slow" />
                  <img
                    src={convertToCORSFreeLink(founder.imageUrl) || getAvatarUrl(founder.name)}
                    alt={founder.name}
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      console.error('[Founders] Founder image failed to load', {
                        founder,
                        attemptedSrc: event.currentTarget.currentSrc || event.currentTarget.src,
                        rawImageUrl: founder.imageUrl,
                        normalizedImageUrl: convertToCORSFreeLink(founder.imageUrl)
                      });
                      event.currentTarget.src = getAvatarUrl(founder.name);
                    }}
                    className="w-full h-full object-cover rounded-full border-[3px] border-white/30 dark:border-white/20 shadow-xl transform group-hover:scale-105 transition-transform duration-500 relative z-10"
                  />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="mb-1 text-[clamp(1.55rem,5vw,2rem)] font-bold text-ocean-deep dark:text-white">{founder.name}</h3>
                  <p className="mb-3 bg-gradient-to-r from-primary-blue to-primary-cyan bg-clip-text text-[11px] font-bold uppercase tracking-[0.22em] text-transparent sm:text-xs md:text-sm">
                    {founder.role}
                  </p>
                  <p className="text-sm font-medium leading-relaxed text-ocean-deep/80 dark:text-gray-300 sm:text-[0.95rem]">
                    {founder.bio}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mx-auto mt-8 max-w-7xl sm:mt-10 md:mt-12">
          <div className="glass-card overflow-hidden rounded-[2rem] border border-white/10">
            <button
              type="button"
              onClick={() => setIsExecutivesOpen((prev) => !prev)}
              className="flex w-full flex-col items-start gap-3 px-4 py-4 text-left transition-colors duration-300 hover:bg-white/10 sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between md:px-8"
            >
              <div>
                <h3 className="text-[clamp(1.6rem,6vw,2.25rem)] font-black tracking-tight text-ocean-deep dark:text-white">
                  Meet the Executives
                </h3>
                <p className="mt-1 text-sm text-ocean-deep/70 dark:text-gray-300 sm:text-base">
                  National Executive Officers
                </p>
              </div>
              <span className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-primary-blue dark:text-primary-cyan md:w-auto md:justify-start">
                {isExecutivesOpen ? 'Collapse' : 'Show Executives'}
                {isExecutivesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>

            {isExecutivesOpen && (
              <div className="px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
                {visibleExecutiveOfficers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
                    {visibleExecutiveOfficers.map((executive, index) => (
                      <article
                        key={executive.id}
                        className={`reveal active flex items-center gap-3 rounded-[1.6rem] border border-white/15 bg-white/10 p-4 transition-all duration-300 hover:bg-white/15 dark:bg-white/5 max-[420px]:flex-col max-[420px]:items-center max-[420px]:text-center sm:gap-4 md:p-5 reveal-delay-${((index % 6) + 1) * 100}`}
                      >
                        <img
                          src={convertToCORSFreeLink(executive.imageUrl) || getAvatarUrl(executive.name)}
                          alt={executive.name}
                          referrerPolicy="no-referrer"
                          onError={(event) => {
                            console.error('[Founders] Executive image failed to load', {
                              executive,
                              attemptedSrc: event.currentTarget.currentSrc || event.currentTarget.src,
                              rawImageUrl: executive.imageUrl,
                              normalizedImageUrl: convertToCORSFreeLink(executive.imageUrl)
                            });
                            event.currentTarget.src = getAvatarUrl(executive.name);
                          }}
                          className="h-16 w-16 flex-shrink-0 rounded-full border-2 border-white/30 object-cover shadow-lg sm:h-18 sm:w-18 md:h-20 md:w-20"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-[clamp(0.7rem,2.7vw,0.8rem)] font-bold uppercase tracking-[0.16em] text-primary-blue dark:text-primary-cyan sm:tracking-[0.18em]">
                            {executive.role}
                          </p>
                          <h4 className="text-[clamp(1rem,4.2vw,1.125rem)] font-bold leading-tight text-ocean-deep break-words dark:text-white">
                            {executive.name}
                          </h4>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-ocean-deep/60 dark:text-gray-300 sm:text-base">
                    No executive officers added yet.
                  </div>
                )}

                {executiveOfficers.length > 6 && (
                  <div className="flex justify-center mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAllExecutives((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-blue px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-primary-cyan hover:shadow-xl sm:text-base"
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
