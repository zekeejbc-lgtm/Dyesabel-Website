import { APP_CONFIG } from '../config';
import { sendApiRequest } from './apiClient';
import { getCachedValue } from '../utils/cache';

export type ChatbotRole = 'user' | 'assistant';
export type ChatbotSource = 'local' | 'hybrid-gemini' | 'gemini' | 'fallback';

export interface ChatbotMedia {
  type: 'image';
  url: string;
  alt: string;
  caption?: string;
}

export interface ChatbotPersonSummary {
  name: string;
  role?: string;
  bio?: string;
  imageUrl?: string;
}

export interface ChatbotActiveContext {
  type: 'home' | 'chapter' | 'pillar' | 'donate';
  id?: string;
  title?: string;
  excerpt?: string;
  description?: string;
  location?: string;
}

export interface ChatHistoryItem {
  role: ChatbotRole;
  content: string;
}

export interface ChatbotRequestContext {
  organizationName: string;
  supportEmail: string;
  supportPhone?: string;
  supportLocation?: string;
  volunteerUrl?: string;
  chapters?: Array<{
    id: string;
    name: string;
    location?: string;
    imageUrl?: string;
    logoUrl?: string;
    headName?: string;
    headRole?: string;
    headQuote?: string;
    headImageUrl?: string;
  }>;
  pillars?: Array<{ id: string; title: string; excerpt?: string; imageUrl?: string }>;
  founders?: ChatbotPersonSummary[];
  executiveOfficers?: ChatbotPersonSummary[];
  activeContext?: ChatbotActiveContext;
}

export interface ChatbotAnswer {
  source: ChatbotSource;
  answer: string;
  confidence: number;
  matchedIntent?: string;
  usedGemini: boolean;
  media?: ChatbotMedia[];
}

interface LocalKnowledgeItem {
  id: string;
  keywords: string[];
  answer: string;
}

interface LocalMatchResult {
  item: LocalKnowledgeItem;
  confidence: number;
}

interface CachedApiPayload<T> {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

const extractGoogleDriveFileId = (value: string): string => {
  const text = String(value || '').trim();
  if (!text) return '';

  const directIdMatch = text.match(/^[a-zA-Z0-9_-]{20,}$/);
  if (directIdMatch) return directIdMatch[0];

  const filePathMatch = text.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (filePathMatch?.[1]) return filePathMatch[1];

  const queryIdMatch = text.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (queryIdMatch?.[1]) return queryIdMatch[1];

  return '';
};

export const normalizeChatbotImageUrl = (value: string | undefined): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^https?:\/\/lh3\.googleusercontent\.com\//i.test(raw)) {
    return raw;
  }

  const driveFileId = extractGoogleDriveFileId(raw);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveFileId)}&sz=w1200`;
  }

  return /^https?:\/\//i.test(raw) ? raw : '';
};

const readCachedList = <T>(cacheKey: string, dataKey: string): T[] => {
  const payload = getCachedValue<CachedApiPayload<T[]>>(cacheKey);
  if (!payload || payload.success === false) return [];

  const maybeList = payload[dataKey];
  return Array.isArray(maybeList) ? (maybeList as T[]) : [];
};

const normalizeChapterSummaries = (
  chapters: Array<{
    id?: string;
    name?: string;
    location?: string;
    imageUrl?: string;
    image?: string;
    logoUrl?: string;
    logo?: string;
    headName?: string;
    headRole?: string;
    headQuote?: string;
    headImageUrl?: string;
  }>
): Array<{
  id: string;
  name: string;
  location?: string;
  imageUrl?: string;
  logoUrl?: string;
  headName?: string;
  headRole?: string;
  headQuote?: string;
  headImageUrl?: string;
}> => {
  return (chapters || [])
    .map((chapter) => ({
      id: String(chapter?.id || '').trim(),
      name: String(chapter?.name || '').trim(),
      location: String(chapter?.location || '').trim(),
      imageUrl: normalizeChatbotImageUrl(String(chapter?.imageUrl || chapter?.image || '').trim()),
      logoUrl: normalizeChatbotImageUrl(String(chapter?.logoUrl || chapter?.logo || '').trim()),
      headName: String(chapter?.headName || '').trim(),
      headRole: String(chapter?.headRole || '').trim(),
      headQuote: String(chapter?.headQuote || '').trim(),
      headImageUrl: normalizeChatbotImageUrl(String(chapter?.headImageUrl || '').trim())
    }))
    .filter((chapter) => chapter.id && chapter.name);
};

const normalizePillarSummaries = (
  pillars: Array<{ id?: string; title?: string; excerpt?: string; imageUrl?: string }>
): Array<{ id: string; title: string; excerpt?: string; imageUrl?: string }> => {
  return (pillars || [])
    .map((pillar) => ({
      id: String(pillar?.id || '').trim(),
      title: String(pillar?.title || '').trim(),
      excerpt: String(pillar?.excerpt || '').trim(),
      imageUrl: normalizeChatbotImageUrl(String(pillar?.imageUrl || '').trim())
    }))
    .filter((pillar) => pillar.id && pillar.title);
};

const mergeByStringKey = <T>(
  preferred: T[],
  fallback: T[],
  keySelector: (value: T) => string
): T[] => {
  const merged = [...preferred];
  const seen = new Set(preferred.map((item) => keySelector(item)).filter(Boolean));

  fallback.forEach((item) => {
    const key = keySelector(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });

  return merged;
};

const hydrateContextFromCache = (context: ChatbotRequestContext): ChatbotRequestContext => {
  const cachedChapters = normalizeChapterSummaries(readCachedList<any>('main:chapters', 'chapters'));
  const cachedPillars = normalizePillarSummaries(readCachedList<any>('main:pillars', 'pillars'));
  const cachedFounders = normalizePeople(readCachedList<any>('main:founders', 'founders'));
  const cachedExecutive = normalizePeople(readCachedList<any>('main:executive-officers', 'executiveOfficers'));

  const requestedChapters = normalizeChapterSummaries(context.chapters || []);
  const requestedPillars = normalizePillarSummaries(context.pillars || []);
  const requestedFounders = normalizePeople(context.founders || []);
  const requestedExecutive = normalizePeople(context.executiveOfficers || []);

  return {
    ...context,
    chapters: mergeByStringKey(requestedChapters, cachedChapters, (chapter) => `${chapter.id}|${chapter.name}`),
    pillars: mergeByStringKey(requestedPillars, cachedPillars, (pillar) => `${pillar.id}|${pillar.title}`),
    founders: mergeByStringKey(requestedFounders, cachedFounders, (person) => person.name),
    executiveOfficers: mergeByStringKey(requestedExecutive, cachedExecutive, (person) => person.name)
  };
};

const normalizeText = (value: string): string => {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const includesAnyKeyword = (normalizedQuestion: string, keywords: string[]): boolean => {
  return keywords.some((keyword) => normalizedQuestion.includes(normalizeText(keyword)));
};

const normalizePeople = (people: ChatbotPersonSummary[] | undefined): ChatbotPersonSummary[] => {
  return (people || [])
    .map((person) => ({
      name: String(person?.name || '').trim(),
      role: String(person?.role || '').trim(),
      bio: String(person?.bio || '').trim(),
      imageUrl: normalizeChatbotImageUrl(String(person?.imageUrl || '').trim())
    }))
    .filter((person) => person.name);
};

const createPeopleMedia = (people: ChatbotPersonSummary[], defaultAltLabel: string): ChatbotMedia[] => {
  return people
    .filter((person) => person.imageUrl)
    .slice(0, 4)
    .map((person): ChatbotMedia => ({
      type: 'image',
      url: normalizeChatbotImageUrl(person.imageUrl),
      alt: person.name ? `${person.name} - ${defaultAltLabel}` : defaultAltLabel,
      caption: person.role ? `${person.name} - ${person.role}` : person.name
    }))
    .filter((item) => item.url);
};

const buildLeadershipAnswer = (
  normalizedQuestion: string,
  context: ChatbotRequestContext
): ChatbotAnswer | null => {
  const founderKeywords = ['founder', 'founders', 'who founded', 'founding'];
  const nationalKeywords = ['national', 'executive officer', 'executive officers', 'officer', 'leadership'];
  const leadershipKeywords = ['founder', 'national', 'executive', 'leader', 'leadership'];

  if (!includesAnyKeyword(normalizedQuestion, leadershipKeywords)) {
    return null;
  }

  const founders = normalizePeople(context.founders);
  const executiveOfficers = normalizePeople(context.executiveOfficers);

  const wantsFounder = includesAnyKeyword(normalizedQuestion, founderKeywords);
  const wantsNational = includesAnyKeyword(normalizedQuestion, nationalKeywords);

  const segments: string[] = [];
  let media: ChatbotMedia[] = [];

  if ((wantsFounder || !wantsNational) && founders.length) {
    const founderLine = founders
      .map((person) => (person.role ? `${person.name} (${person.role})` : person.name))
      .join(', ');
    segments.push(`Our founders include: ${founderLine}.`);
    media = media.concat(createPeopleMedia(founders, 'Founder'));
  }

  if ((wantsNational || !wantsFounder) && executiveOfficers.length) {
    const executiveLine = executiveOfficers
      .map((person) => (person.role ? `${person.name} (${person.role})` : person.name))
      .join(', ');
    segments.push(`Our national executive officers include: ${executiveLine}.`);
    media = media.concat(createPeopleMedia(executiveOfficers, 'Executive Officer'));
  }

  if (!segments.length) {
    return null;
  }

  return {
    source: 'local',
    answer: segments.join('\n\n'),
    confidence: 0.95,
    matchedIntent: wantsFounder ? 'founders' : 'national-leadership',
    usedGemini: false,
    media: media.slice(0, 4)
  };
};

const buildLocalKnowledge = (context: ChatbotRequestContext): LocalKnowledgeItem[] => {
  const organizationName = context.organizationName || 'DYESABEL PH Inc.';
  const supportEmail = context.supportEmail || APP_CONFIG.supportEmail;
  const supportPhone = context.supportPhone || APP_CONFIG.supportPhone || '';
  const supportLocation = context.supportLocation || APP_CONFIG.supportLocation || 'Davao, Philippines';
  const volunteerUrl = context.volunteerUrl || APP_CONFIG.volunteerUrl || '';
  const chapters = context.chapters || [];
  const chapterNames = chapters.map((chapter) => chapter.name).filter(Boolean);
  const chapterLocations = chapters
    .map((chapter) => chapter.location)
    .filter((value): value is string => Boolean(value));
  const pillars = context.pillars || [];
  const pillarTitles = pillars.map((pillar) => pillar.title).filter(Boolean);

  const chapterLine = chapterNames.length
    ? `Current chapters include: ${chapterNames.join(', ')}.`
    : 'Our chapter list is regularly updated on the Chapters section of this website.';

  const chapterLocationLine = chapterLocations.length
    ? `These chapters are active across locations such as ${Array.from(new Set(chapterLocations)).join(', ')}.`
    : '';

  const pillarsLine = pillarTitles.length
    ? `Our five core pillars include: ${pillarTitles.join(', ')}.`
    : 'Our initiatives are organized into five core pillars: Research and Education, Good Governance, Sustainable Livelihood, Community Health, and Culture and Arts.';

  const volunteerLine = volunteerUrl
    ? `You can apply to volunteer here: ${volunteerUrl}`
    : 'You can volunteer through our official form linked in our site navigation.';

  const contactLine = supportPhone
    ? `You may also reach us at ${supportEmail} or ${supportPhone}.`
    : `You may reach us at ${supportEmail}.`;

  const activeContext = context.activeContext;
  const activeContextItems: LocalKnowledgeItem[] = [];

  if (activeContext?.type === 'pillar') {
    const pillarTitle = activeContext.title || 'this pillar';
    activeContextItems.push({
      id: 'active-pillar-focus',
      keywords: ['this pillar', 'pillar', 'here', 'activities here', 'focus here', 'what is this about'],
      answer: `You are currently viewing the ${pillarTitle} pillar. ${activeContext.excerpt || activeContext.description || 'This section focuses on pillar-specific initiatives and activities.'}`
    });
  }

  if (activeContext?.type === 'chapter') {
    const chapterTitle = activeContext.title || 'this chapter';
    const chapterLocation = activeContext.location ? ` Location: ${activeContext.location}.` : '';
    activeContextItems.push({
      id: 'active-chapter-focus',
      keywords: ['this chapter', 'chapter', 'here', 'chapter activities', 'chapter contact', 'join this chapter'],
      answer: `You are currently viewing ${chapterTitle}.${chapterLocation} ${activeContext.description || 'This section highlights chapter details, activities, and local opportunities.'}`
    });
  }

  return [
    ...activeContextItems,
    {
      id: 'about-organization',
      keywords: ['about', 'organization', 'dyesabel', 'mission', 'vision', 'who are you'],
      answer: `${organizationName} is a youth-led non-profit organization focused on environmental advocacy, education, and sustainable community development in the Philippines, with active programs in Davao and nearby communities.`
    },
    {
      id: 'core-pillars',
      keywords: ['pillar', 'pillars', 'program', 'programs', 'advocacy areas', 'focus areas'],
      answer: pillarsLine
    },
    {
      id: 'chapters',
      keywords: ['chapter', 'chapters', 'local chapter', 'locations', 'branches'],
      answer: `${chapterLine} ${chapterLocationLine}`.trim()
    },
    {
      id: 'volunteer',
      keywords: ['volunteer', 'join', 'member', 'apply', 'registration', 'sign up'],
      answer: volunteerLine
    },
    {
      id: 'donation',
      keywords: ['donate', 'donation', 'fund', 'support financially', 'gcash', 'bank'],
      answer: 'You can support our community projects through the Donate page on this website, where available channels and contribution details are listed.'
    },
    {
      id: 'contact',
      keywords: ['contact', 'email', 'phone', 'reach', 'inquiry', 'inquiries'],
      answer: `For official concerns, partnerships, or detailed inquiries, please contact us directly. ${contactLine}`
    },
    {
      id: 'events-and-activities',
      keywords: ['activity', 'activities', 'event', 'events', 'projects', 'initiatives'],
      answer: 'You can explore activities under each Pillar and Chapter detail page to see current and upcoming initiatives, schedules, and participation links when available.'
    }
  ];
};

const scoreKnowledgeItem = (
  normalizedQuestion: string,
  item: LocalKnowledgeItem,
  context: ChatbotRequestContext
): number => {
  const exactPhraseHits = item.keywords.filter((keyword) => normalizedQuestion.includes(normalizeText(keyword))).length;
  if (exactPhraseHits === 0) return 0;

  const keywordCoverage = exactPhraseHits / Math.max(item.keywords.length, 1);
  const strongHit = exactPhraseHits >= 2 ? 0.2 : 0;
  const isContextItem = item.id === 'active-pillar-focus' || item.id === 'active-chapter-focus';
  const contextBoost = context.activeContext && isContextItem ? 0.25 : 0;
  return Math.min(1, 0.55 + keywordCoverage + strongHit + contextBoost);
};

const matchLocalKnowledge = (
  question: string,
  context: ChatbotRequestContext
): LocalMatchResult | null => {
  const normalizedQuestion = normalizeText(question);
  if (!normalizedQuestion) return null;

  const knowledgeBase = buildLocalKnowledge(context);
  let bestMatch: LocalMatchResult | null = null;

  knowledgeBase.forEach((item) => {
    const confidence = scoreKnowledgeItem(normalizedQuestion, item, context);
    if (confidence <= 0) return;
    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { item, confidence };
    }
  });

  return bestMatch;
};

const buildNoDataMessage = (supportEmail: string): string => {
  const email = supportEmail || APP_CONFIG.supportEmail;
  return `I currently do not have enough verified data to answer that accurately. Please email us at ${email} so our team can assist you directly.`;
};

export const askHybridChatbot = async (
  question: string,
  history: ChatHistoryItem[],
  context: ChatbotRequestContext
): Promise<ChatbotAnswer> => {
  const hydratedContext = hydrateContextFromCache(context);
  const trimmedQuestion = String(question || '').trim();
  const supportEmail = hydratedContext.supportEmail || APP_CONFIG.supportEmail;

  if (!trimmedQuestion) {
    return {
      source: 'fallback',
      answer: `Please type your inquiry. If you need direct help, email us at ${supportEmail}.`,
      confidence: 1,
      usedGemini: false
    };
  }

  const normalizedQuestion = normalizeText(trimmedQuestion);
  const leadershipAnswer = buildLeadershipAnswer(normalizedQuestion, hydratedContext);
  if (leadershipAnswer) {
    return leadershipAnswer;
  }

  const localMatch = matchLocalKnowledge(trimmedQuestion, hydratedContext);
  if (localMatch && localMatch.confidence >= 0.78) {
    return {
      source: 'local',
      answer: localMatch.item.answer,
      confidence: localMatch.confidence,
      matchedIntent: localMatch.item.id,
      usedGemini: false
    };
  }

  const localContextHint = localMatch
    ? {
        intent: localMatch.item.id,
        draftAnswer: localMatch.item.answer,
        confidence: localMatch.confidence
      }
    : null;

  const apiResult = await sendApiRequest<{
    answer?: string;
    source?: ChatbotSource;
    confidence?: number;
    matchedIntent?: string;
    noData?: boolean;
    media?: ChatbotMedia[];
  }>('chatbot', {
    action: 'chatbotAsk',
    question: trimmedQuestion,
    history,
    context: hydratedContext,
    localContextHint
  });

  if (apiResult.success && apiResult.answer) {
    const media = Array.isArray(apiResult.media)
      ? apiResult.media
          .map((item) => ({
            ...item,
            url: normalizeChatbotImageUrl(String(item?.url || '').trim())
          }))
          .filter((item) => item && item.type === 'image' && String(item.url || '').trim())
          .slice(0, 4)
      : undefined;

    return {
      source: apiResult.source || 'hybrid-gemini',
      answer: String(apiResult.answer || '').trim(),
      confidence: Number(apiResult.confidence || 0.7),
      matchedIntent: apiResult.matchedIntent,
      usedGemini: apiResult.source === 'hybrid-gemini' || apiResult.source === 'gemini',
      media
    };
  }

  if (localMatch) {
    return {
      source: 'local',
      answer: `${localMatch.item.answer}\n\nIf you need a more specific answer, please contact us at ${supportEmail}.`,
      confidence: Math.max(0.65, localMatch.confidence),
      matchedIntent: localMatch.item.id,
      usedGemini: false
    };
  }

  return {
    source: 'fallback',
    answer: buildNoDataMessage(supportEmail),
    confidence: 1,
    usedGemini: false
  };
};
