import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const SEEN_KEY = "pwa-install-seen";
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const isAppInstalled = () => {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // @ts-ignore
  return Boolean(navigator.standalone);
};

const isIosDevice = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export default function PwaInstallPrompt({
  enabled = true,
  delayMs = 3000,
}: {
  enabled?: boolean;
  delayMs?: number;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);
  const [isReady, setIsReady] = useState(delayMs === 0);
  const hasRecordedSeen = useRef(false);

  useEffect(() => {
    setInstalled(isAppInstalled());
    setIsIos(isIosDevice());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      setDismissedAt(parsed);
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw === "true") {
      setHasSeen(true);
      hasRecordedSeen.current = true;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => setIsReady(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [enabled, delayMs]);

  const isDismissed = useMemo(() => {
    if (!dismissedAt) return false;
    return Date.now() - dismissedAt < DISMISS_DURATION_MS;
  }, [dismissedAt]);

  const shouldOfferInstall = enabled && isReady && !installed && !isDismissed && !hasSeen;
  const shouldRenderPrompt = shouldOfferInstall && (isIos ? !deferredPrompt : Boolean(deferredPrompt));

  useEffect(() => {
    if (!shouldRenderPrompt || hasRecordedSeen.current) return;
    localStorage.setItem(SEEN_KEY, "true");
    hasRecordedSeen.current = true;
  }, [shouldRenderPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "dismissed") {
      const now = Date.now();
      localStorage.setItem(DISMISS_KEY, String(now));
      setDismissedAt(now);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    const now = Date.now();
    localStorage.setItem(DISMISS_KEY, String(now));
    setDismissedAt(now);
    setDeferredPrompt(null);
  };

  if (!shouldRenderPrompt) return null;

  return (
    <div
      className="fixed bottom-6 right-6 w-[320px] max-w-[90vw] rounded-xl border border-white/10 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md"
      style={{ zIndex: 9999 }}
      role="dialog"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 rounded-full bg-cyan-500/20 p-2 text-cyan-400">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 text-white">
          <p className="text-sm font-semibold">Install Dyesabel</p>
          <p className="text-xs text-slate-300 mt-1">
            {isIos 
              ? "Tap the Share button and select 'Add to Home Screen' for the best experience."
              : "Install the app for offline access and faster loading."}
          </p>
          
          <div className="mt-3 flex items-center justify-end gap-2">
            <button 
              onClick={handleDismiss}
              className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5"
            >
              Not now
            </button>
            {!isIos && (
              <button 
                onClick={handleInstall}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-600 transition-colors"
              >
                <Download className="h-3 w-3" />
                Install
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}