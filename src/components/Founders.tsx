import React, { useMemo, useState } from 'react';
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

type ExecutiveGroup = {
  key: string;
  title: string;
  roles: string[];
};

const EXECUTIVE_GROUPS: ExecutiveGroup[] = [
  {
    key: 'core',
    title: 'Core Executive Officers',
    roles: [
      'National Executive Director',
      'Internal Deputy Director',
      'External Deputy Director',
      'Chief-of-Staff',
      'National Secretary',
      'National Treasurer',
      'Public Relations Officer'
    ]
  },
  {
    key: 'program',
    title: 'Program Directors',
    roles: [
      'Program Director, Good Governance',
      'Program Director, Research, Education and Direct Action',
      'Program Director, Culture and Arts',
      'Program Director, Sustainable Livelihood',
      'Program Director, Community Health'
    ]
  },
  {
    key: 'directors',
    title: 'Department Directors',
    roles: [
      'Director for Creatives',
      'Director for Partnership',
      'Director for Productions Management',
      'Director for Logistics',
      'Director for Monitoring, Evaluation, and Learning'
    ]
  },
  {
    key: 'board',
    title: 'Advisory and Board',
    roles: [
      'Chairperson, Advisory Council',
      'Chairperson, Board of Trustees',
      'Board Secretary'
    ]
  }
];

const normalizeRoleForSort = (role: string) =>
  String(role || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const ROLE_ALIASES: Record<string, string> = {
  'chief of staff': 'Chief-of-Staff',
  'chief-of-staff': 'Chief-of-Staff',
  'program director good governance': 'Program Director, Good Governance',
  'program director research education and direct action': 'Program Director, Research, Education and Direct Action',
  'program director culture and arts': 'Program Director, Culture and Arts',
  'program director sustainable livelihood': 'Program Director, Sustainable Livelihood',
  'program director community health': 'Program Director, Community Health',
  'director for partnerships': 'Director for Partnership'
};

const normalizeRoleWithAliases = (role: string) => {
  const normalized = normalizeRoleForSort(role);
  const aliasTarget = ROLE_ALIASES[normalized] || role;
  return normalizeRoleForSort(aliasTarget);
};

export const Founders: React.FC<FoundersProps> = ({
  founders = [],
  executiveOfficers = [],
  isLoading = false,
  onEdit
}) => {
  const { user } = useAuth();
  const [isExecutivesOpen, setIsExecutivesOpen] = useState(false);
  const [visibleExecutiveGroupCount, setVisibleExecutiveGroupCount] = useState(1);

  const groupedExecutiveOfficers = useMemo(() => {
    const roleOrderMap = new Map<string, { groupIndex: number; roleIndex: number }>();
    EXECUTIVE_GROUPS.forEach((group, groupIndex) => {
      group.roles.forEach((role, roleIndex) => {
        roleOrderMap.set(normalizeRoleWithAliases(role), { groupIndex, roleIndex });
      });
    });

    const sortedOfficers = [...executiveOfficers].sort((a, b) => {
      const aOrder = roleOrderMap.get(normalizeRoleWithAliases(a.role));
      const bOrder = roleOrderMap.get(normalizeRoleWithAliases(b.role));

      if (aOrder && bOrder) {
        if (aOrder.groupIndex !== bOrder.groupIndex) return aOrder.groupIndex - bOrder.groupIndex;
        if (aOrder.roleIndex !== bOrder.roleIndex) return aOrder.roleIndex - bOrder.roleIndex;
      } else if (aOrder) {
        return -1;
      } else if (bOrder) {
        return 1;
      }

      return a.name.localeCompare(b.name);
    });

    const grouped = EXECUTIVE_GROUPS.map((group) => ({
      key: group.key,
      title: group.title,
      officers: [] as ExecutiveOfficer[]
    }));
    const uncategorized: ExecutiveOfficer[] = [];

    sortedOfficers.forEach((officer) => {
      const order = roleOrderMap.get(normalizeRoleWithAliases(officer.role));
      if (!order) {
        uncategorized.push(officer);
        return;
      }
      grouped[order.groupIndex].officers.push(officer);
    });

    const populatedGroups = grouped.filter((group) => group.officers.length > 0);
    if (uncategorized.length) {
      populatedGroups.push({
        key: 'other',
        title: 'Other Officers',
        officers: uncategorized
      });
    }

    return populatedGroups;
  }, [executiveOfficers]);

  const visibleExecutiveCount = groupedExecutiveOfficers
    .slice(0, visibleExecutiveGroupCount)
    .reduce((count, group) => count + group.officers.length, 0);

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
                    alt={`Portrait of ${founder.name}`}
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
              onClick={() => {
                setIsExecutivesOpen((prev) => {
                  var nextOpen = !prev;
                  if (nextOpen) setVisibleExecutiveGroupCount(1);
                  return nextOpen;
                });
              }}
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

            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                isExecutivesOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="px-4 pb-4 pt-1 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
                {visibleExecutiveCount > 0 ? (
                  <div>
                    {groupedExecutiveOfficers.map((group, groupIndex) => {
                      const isGroupVisible = groupIndex < visibleExecutiveGroupCount;
                      return (
                      <div
                        key={group.key}
                        className={`overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-out ${
                          isGroupVisible ? 'mb-7 max-h-[1600px] opacity-100 sm:mb-8' : 'mb-0 max-h-0 opacity-0'
                        }`}
                      >
                        {groupIndex > 0 && (
                          <div className="mb-5 mt-1 sm:mb-6">
                            <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-primary-cyan/20 via-primary-blue/90 to-primary-cyan/20" />
                          </div>
                        )}

                        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-primary-blue dark:text-primary-cyan sm:mb-4 sm:text-sm">
                          {group.title}
                        </p>

                        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
                          {group.officers.map((executive, index) => (
                            <article
                              key={executive.id}
                              className={`reveal active flex items-center gap-3 rounded-[1.6rem] border border-white/15 bg-white/10 p-4 transition-all duration-300 hover:bg-white/15 dark:bg-white/5 max-[420px]:flex-col max-[420px]:items-center max-[420px]:text-center sm:gap-4 md:p-5 reveal-delay-${((index % 6) + 1) * 100}`}
                            >
                              <img
                                src={convertToCORSFreeLink(executive.imageUrl) || getAvatarUrl(executive.name)}
                                alt={`Portrait of ${executive.name}`}
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
                      </div>
                    );})}

                    {(groupedExecutiveOfficers.length > 1) && (
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                        {visibleExecutiveGroupCount < groupedExecutiveOfficers.length && (
                          <button
                            type="button"
                            onClick={() => setVisibleExecutiveGroupCount((count) => Math.min(groupedExecutiveOfficers.length, count + 1))}
                            className="inline-flex items-center gap-2 rounded-full bg-primary-blue px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-primary-cyan hover:shadow-xl sm:text-base"
                          >
                            Show More
                            <ChevronDown size={18} />
                          </button>
                        )}

                        {visibleExecutiveGroupCount > 1 && (
                          <button
                            type="button"
                            onClick={() => setVisibleExecutiveGroupCount((count) => Math.max(1, count - 1))}
                            className="inline-flex items-center gap-2 rounded-full border border-primary-blue/60 bg-transparent px-5 py-2.5 text-sm font-semibold text-primary-blue shadow-lg transition-all duration-300 hover:border-primary-cyan hover:text-primary-cyan dark:text-primary-cyan sm:text-base"
                          >
                            Show Less
                            <ChevronUp size={18} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-ocean-deep/60 dark:text-gray-300 sm:text-base">
                    No executive officers added yet.
                  </div>
                )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
