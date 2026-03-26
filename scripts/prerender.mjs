import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { chromium } from 'playwright';

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://www.dyesabelph.org';
const PREVIEW_HOST = '127.0.0.1';
const PREFERRED_PREVIEW_PORT = Number(process.env.PRERENDER_PORT || 4173);
const BUILD_DIR = path.resolve(process.cwd(), 'build');
const SITEMAP_PATH = path.resolve(process.cwd(), 'public', 'sitemap.xml');
const ALLOW_SKIP_ON_MISSING_BROWSER = process.env.PRERENDER_STRICT !== 'true';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const unique = (items) => [...new Set(items)];

const normalizePathname = (pathname) => {
  if (!pathname || pathname === '/') return '/home';
  const cleaned = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return cleaned.replace(/\/+$/g, '') || '/home';
};

const parseSitemapPaths = async () => {
  try {
    const xml = await fs.readFile(SITEMAP_PATH, 'utf8');
    const locMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => String(match[1] || '').trim());
    const paths = locMatches
      .map((loc) => {
        try {
          const url = new URL(loc);
          return url.pathname;
        } catch (_error) {
          return null;
        }
      })
      .filter(Boolean)
      .map((pathname) => normalizePathname(pathname));

    return unique(['/home', '/donate', ...paths]);
  } catch (_error) {
    return ['/home', '/donate'];
  }
};

const waitForPreview = async (baseUrl) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/home`, { method: 'GET' });
      if (response.ok) return;
    } catch (_error) {
      // Retry while preview server starts.
    }
    await sleep(400);
  }

  throw new Error('Timed out waiting for vite preview server.');
};

const getOutputHtmlPath = (routePath) => {
  const normalized = normalizePathname(routePath);
  const relativePath = normalized.replace(/^\//, '');
  return path.join(BUILD_DIR, relativePath, 'index.html');
};

const isPortAvailable = (port) => new Promise((resolve) => {
  const server = net.createServer();
  server.unref();

  server.on('error', () => resolve(false));
  server.listen({ host: PREVIEW_HOST, port }, () => {
    server.close(() => resolve(true));
  });
});

const findAvailablePort = async (startingPort) => {
  for (let offset = 0; offset < 20; offset += 1) {
    const candidate = startingPort + offset;
    if (await isPortAvailable(candidate)) return candidate;
  }

  throw new Error(`Unable to find an available preview port near ${startingPort}.`);
};

const isMissingPlaywrightBrowserError = (error) => {
  const message = String(error?.message || error || '');
  return (
    message.includes("Executable doesn't exist") ||
    message.includes('Please run the following command to download new browsers')
  );
};

const prerenderPath = async (page, baseUrl, routePath) => {
  const targetUrl = `${baseUrl}${routePath}`;
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

  // Some pages keep background requests alive, which can stall networkidle.
  // Wait briefly for app hydration, then continue even if network stays active.
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch (_error) {
    await page.waitForTimeout(1200);
  }

  const html = await page.content();
  const outputPath = getOutputHtmlPath(routePath);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `<!doctype html>\n${html}`, 'utf8');

  return outputPath;
};

const run = async () => {
  const routes = await parseSitemapPaths();
  const previewPort = await findAvailablePort(PREFERRED_PREVIEW_PORT);
  if (previewPort !== PREFERRED_PREVIEW_PORT) {
    console.warn(`[prerender] Preferred port ${PREFERRED_PREVIEW_PORT} is busy. Using ${previewPort} instead.`);
  }
  const baseUrl = `http://${PREVIEW_HOST}:${previewPort}`;

  const viteCliPath = path.resolve(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');

  const previewProcess = spawn(
    process.execPath,
    [viteCliPath, 'preview', '--host', PREVIEW_HOST, '--port', String(previewPort), '--strictPort'],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false
    }
  );

  try {
    await waitForPreview(baseUrl);

    let browser;
    try {
      browser = await chromium.launch({ headless: true });
    } catch (error) {
      if (ALLOW_SKIP_ON_MISSING_BROWSER && isMissingPlaywrightBrowserError(error)) {
        console.warn('[prerender] Playwright browser is not installed in this environment. Skipping prerender.');
        console.warn('[prerender] Set PRERENDER_STRICT=true to fail the build when prerender cannot run.');
        return;
      }
      throw error;
    }

    const page = await browser.newPage({
      viewport: { width: 1366, height: 768 },
      userAgent: 'Mozilla/5.0 (compatible; DyesabelPrerenderBot/1.0; +https://www.dyesabelph.org)'
    });

    for (const routePath of routes) {
      const outputPath = await prerenderPath(page, baseUrl, routePath);
      console.log(`[prerender] ${routePath} -> ${path.relative(process.cwd(), outputPath)}`);
    }

    await browser.close();
    console.log(`[prerender] Completed ${routes.length} routes for ${SITE_ORIGIN}.`);
  } finally {
    previewProcess.kill('SIGTERM');
  }
};

run().catch((error) => {
  console.error('[prerender] Failed:', error);
  process.exitCode = 1;
});
