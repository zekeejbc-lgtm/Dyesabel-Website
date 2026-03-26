import fs from 'node:fs/promises';
import path from 'node:path';

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://www.dyesabelph.org';
const MAIN_API_URL = process.env.VITE_MAIN_API_URL || process.env.MAIN_API_URL || '';
const OUTPUT_PATH = path.resolve(process.cwd(), 'public', 'sitemap.xml');
const FALLBACK_DATA_PATH = process.env.SITEMAP_FALLBACK_PATH || path.resolve(process.cwd(), 'scripts', 'sitemap-fallback.json');

const slugifyRouteSegment = (value = '') => {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'item';
};

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const normalizeOrigin = (origin) => String(origin || '').replace(/\/+$/, '');

const readFallbackData = async () => {
  try {
    const raw = await fs.readFile(FALLBACK_DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      chapters: Array.isArray(parsed?.chapters) ? parsed.chapters : [],
      pillars: Array.isArray(parsed?.pillars) ? parsed.pillars : []
    };
  } catch (error) {
    return { chapters: [], pillars: [] };
  }
};

const callMainApi = async (action) => {
  if (!MAIN_API_URL) return null;

  const payload = JSON.stringify({ action });
  const attempts = [
    { headers: { 'Content-Type': 'text/plain' } },
    { headers: {} }
  ];

  for (const attempt of attempts) {
    try {
      const response = await fetch(MAIN_API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: attempt.headers,
        body: payload
      });

      if (!response.ok) continue;
      const result = await response.json();
      if (result && result.success !== false) return result;
    } catch (error) {
      // Try next request mode.
    }
  }

  return null;
};

const buildStaticUrls = () => [
  { loc: `${normalizeOrigin(SITE_ORIGIN)}/home`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${normalizeOrigin(SITE_ORIGIN)}/donate`, changefreq: 'weekly', priority: '0.9' }
];

const buildChapterUrls = (chapters) => {
  return (Array.isArray(chapters) ? chapters : [])
    .filter((chapter) => chapter && chapter.id != null)
    .map((chapter) => {
      const chapterId = encodeURIComponent(String(chapter.id));
      const chapterSlug = slugifyRouteSegment(chapter.name || chapter.title || String(chapter.id));
      return {
        loc: `${normalizeOrigin(SITE_ORIGIN)}/chapters/${chapterId}--${chapterSlug}`,
        changefreq: 'weekly',
        priority: '0.8'
      };
    });
};

const buildPillarUrls = (pillars) => {
  return (Array.isArray(pillars) ? pillars : [])
    .filter((pillar) => pillar && pillar.id != null)
    .map((pillar) => {
      const pillarId = encodeURIComponent(String(pillar.id));
      const pillarSlug = slugifyRouteSegment(pillar.title || String(pillar.id));
      return {
        loc: `${normalizeOrigin(SITE_ORIGIN)}/pillars/${pillarId}--${pillarSlug}`,
        changefreq: 'weekly',
        priority: '0.8'
      };
    });
};

const buildSitemapXml = (entries) => {
  const uniqueByLoc = new Map();
  entries.forEach((entry) => {
    if (!entry || !entry.loc) return;
    uniqueByLoc.set(entry.loc, entry);
  });

  const urlNodes = [...uniqueByLoc.values()]
    .map((entry) => {
      const lastmod = new Date().toISOString();
      return [
        '  <url>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${entry.changefreq || 'weekly'}</changefreq>`,
        `    <priority>${entry.priority || '0.7'}</priority>`,
        '  </url>'
      ].join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlNodes}\n</urlset>\n`;
};

const generate = async () => {
  const staticEntries = buildStaticUrls();
  const [chaptersResult, pillarsResult, fallbackData] = await Promise.all([
    callMainApi('listChapters'),
    callMainApi('listPillars'),
    readFallbackData()
  ]);

  const chapters = [
    ...(Array.isArray(chaptersResult?.chapters) ? chaptersResult.chapters : []),
    ...(fallbackData.chapters || [])
  ];
  const pillars = [
    ...(Array.isArray(pillarsResult?.pillars) ? pillarsResult.pillars : []),
    ...(fallbackData.pillars || [])
  ];

  const chapterEntries = buildChapterUrls(chapters);
  const pillarEntries = buildPillarUrls(pillars);
  const allEntries = [...staticEntries, ...chapterEntries, ...pillarEntries];

  const xml = buildSitemapXml(allEntries);
  await fs.writeFile(OUTPUT_PATH, xml, 'utf8');

  const hasApiData = Array.isArray(chaptersResult?.chapters) || Array.isArray(pillarsResult?.pillars);
  const hasFallbackData = fallbackData.chapters.length > 0 || fallbackData.pillars.length > 0;
  const sourceLabel = hasApiData && hasFallbackData
    ? 'api+fallback'
    : hasApiData
      ? 'api'
      : hasFallbackData
        ? 'fallback'
        : 'static-only';
  console.log(`[sitemap] Generated ${allEntries.length} URLs (${sourceLabel}).`);
};

generate().catch((error) => {
  console.error('[sitemap] Generation failed:', error);
  process.exitCode = 1;
});
