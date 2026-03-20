import React, { Suspense, lazy, startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Slogan } from './components/Slogan';
import { Pillars } from './components/Stories';
import { Chapters } from './components/Chapters';
import { Partners } from './components/Partners';
import { Founders } from './components/Founders';
import { Footer } from './components/Footer';
import { BackgroundBubbles } from './components/BackgroundBubbles';
import { LoadingScreen } from './components/LoadingScreen';
import { DonatePage } from './components/DonatePage';
import { PillarDetail } from './components/PillarDetail';
import { ChapterDetail } from './components/ChapterDetail';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppDialogProvider } from './contexts/AppDialogContext';
import { AppView, patchPersistedAppState, readPersistedAppState } from './utils/appState';
import { Chapter, ExecutiveOfficer, Pillar, User } from './types';
import { DataService } from './services/DriveService';
import { getSessionUser } from './utils/session';
import { BookOpen, Heart, Leaf, Palette, Scale } from 'lucide-react';
import { APP_CONFIG } from './config';
import {
  buildDashboardPath,
  buildChapterPath,
  buildPillarPath,
  canUserAccessDashboard,
  DONATE_PATH,
  getDefaultAuthenticatedPath,
  HOME_PATH,
  isChapterRouteForChapter,
  isDashboardRouteForUser,
  isPillarRouteForPillar,
  LOGIN_PATH,
  parseAppPath
} from './utils/routes';

const LoginModal = lazy(() => import('./components/LoginModal').then((module) => ({ default: module.LoginModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const ChapterEditor = lazy(() => import('./components/ChapterEditor').then((module) => ({ default: module.ChapterEditor })));
const LandingPageEditor = lazy(() => import('./components/LandingPageEditor').then((module) => ({ default: module.LandingPageEditor })));
const PillarsEditor = lazy(() => import('./components/PillarsEditor').then((module) => ({ default: module.PillarsEditor })));
const PartnersEditor = lazy(() => import('./components/PartnersEditor').then((module) => ({ default: module.PartnersEditor })));
const FoundersEditor = lazy(() => import('./components/FoundersEditor').then((module) => ({ default: module.FoundersEditor })));

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

const readStoredTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  return window.localStorage.getItem('theme') || 'dark';
};

function AppContent() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isGlobalEditor = user?.role === 'editor' && !user?.chapterId;
  const isScopedDashboardUser = !!user?.chapterId;
  const canAccessDashboard = isAdmin || isGlobalEditor || isScopedDashboardUser;

  const [theme, setTheme] = useState(readStoredTheme);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [isChapterEditorOpen, setIsChapterEditorOpen] = useState(false);
  const [isPillarEditorOpen, setIsPillarEditorOpen] = useState(false);
  const [isPartnersEditorOpen, setIsPartnersEditorOpen] = useState(false);
  const [isFoundersEditorOpen, setIsFoundersEditorOpen] = useState(false);
  const [isLandingEditorOpen, setIsLandingEditorOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDonatePageOpen, setIsDonatePageOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [pathname, setPathname] = useState(() => window.location.pathname || '/');
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [founders, setFounders] = useState<any[]>([]);
  const [executiveOfficers, setExecutiveOfficers] = useState<ExecutiveOfficer[]>([]);

  const hasRestoredAppState = useRef(false);
  const hasHydratedNavigationState = useRef(false);
  const currentViewRef = useRef<AppView>('home');
  const scrollSaveTimer = useRef<number | null>(null);
  const currentRoute = parseAppPath(pathname);

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => String(chapter.id) === String(selectedChapterId)) || null,
    [chapters, selectedChapterId]
  );
  const selectedPillar = useMemo(
    () => pillars.find((pillar) => String(pillar.id) === String(selectedPillarId)) || null,
    [pillars, selectedPillarId]
  );
  const displayPillars = useMemo(
    () => pillars.map((pillar, index) => ({ ...pillar, icon: getIconForIndex(index) })),
    [pillars]
  );

  const isScopedEditorForSelectedChapter =
    !!user && !!selectedChapter && user.role === 'editor' && user.chapterId === selectedChapter.id;
  const isChapterHeadForSelectedChapter =
    !!user && !!selectedChapter && user.role === 'chapter_head' && user.chapterId === selectedChapter.id;
  const canEditSelectedChapter =
    !!user &&
    !!selectedChapter &&
    (user.role === 'admin' || isScopedEditorForSelectedChapter || isChapterHeadForSelectedChapter);

  const currentPageLabel = useMemo(() => {
    if (isLoginModalOpen) return 'Login';
    if (showDashboard) return user ? `${user.username} ${user.role.replace('_', ' ')}` : 'Dashboard';
    if (isDonatePageOpen) return 'Donate';
    if (selectedChapter) return selectedChapter.name;
    if (selectedPillar) return selectedPillar.title;
    return 'Home';
  }, [isDonatePageOpen, isLoginModalOpen, selectedChapter, selectedPillar, showDashboard, user]);
  const currentDocumentTitle = `${currentPageLabel} | Dyesabel PH Inc.`;

  const currentView: AppView = showDashboard
    ? 'dashboard'
    : isDonatePageOpen
      ? 'donate'
      : selectedPillarId
        ? 'pillar'
        : selectedChapterId
          ? 'chapter'
          : 'home';

  const restoreScrollForView = (view: AppView) => {
    const persistedState = readPersistedAppState();
    const nextScrollY = Math.max(0, Math.floor(persistedState.scrollPositions[view] || 0));

    window.requestAnimationFrame(() => {
      window.scrollTo(0, nextScrollY);
    });
  };

  const syncPathname = () => {
    setPathname(window.location.pathname || '/');
  };

  const navigateTo = (nextPath: string, options?: { replace?: boolean }) => {
    const normalizedNextPath = nextPath || HOME_PATH;
    const currentPath = window.location.pathname || '/';

    if (currentPath === normalizedNextPath) {
      syncPathname();
      return;
    }

    const historyMethod = options?.replace ? 'replaceState' : 'pushState';
    window.history[historyMethod](null, '', normalizedNextPath);
    syncPathname();
  };

  useEffect(() => {
    currentViewRef.current = currentView;
    if (!hasHydratedNavigationState.current) return;
    patchPersistedAppState({
      view: currentView,
      selectedChapterId,
      selectedPillarId
    });
  }, [currentView, selectedChapterId, selectedPillarId]);

  useEffect(() => {
    const handlePopState = () => syncPathname();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    setIsLoginModalOpen(currentRoute.type === 'login');

    if (currentRoute.type === 'home' || currentRoute.type === 'root' || currentRoute.type === 'unknown') {
      startTransition(() => {
        setIsDonatePageOpen(false);
        setShowDashboard(false);
        setSelectedChapterId(null);
        setSelectedPillarId(null);
      });
      return;
    }

    if (currentRoute.type === 'donate') {
      startTransition(() => {
        setIsDonatePageOpen(true);
        setShowDashboard(false);
        setSelectedChapterId(null);
        setSelectedPillarId(null);
      });
      return;
    }

    if (currentRoute.type === 'chapter') {
      startTransition(() => {
        setIsDonatePageOpen(false);
        setShowDashboard(false);
        setSelectedChapterId(currentRoute.chapterId);
        setSelectedPillarId(null);
      });
      return;
    }

    if (currentRoute.type === 'pillar') {
      startTransition(() => {
        setIsDonatePageOpen(false);
        setShowDashboard(false);
        setSelectedChapterId(null);
        setSelectedPillarId(currentRoute.pillarId);
      });
      return;
    }

    if (currentRoute.type === 'dashboard') {
      startTransition(() => {
        setIsDonatePageOpen(false);
        setShowDashboard(true);
        setSelectedChapterId(null);
        setSelectedPillarId(null);
      });
    }
  }, [currentRoute]);

  useEffect(() => {
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const timeoutId = window.setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    }, 100);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [displayPillars, chapters, selectedChapterId, selectedPillarId, isDonatePageOpen, showDashboard, isLoading]);

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);

      try {
        const [pillarsRes, chaptersRes, partnersRes, foundersRes, executiveOfficersRes] = await Promise.all([
          DataService.loadPillars(),
          DataService.listChapters(),
          DataService.loadPartners(),
          DataService.loadFounders(),
          DataService.loadExecutiveOfficers()
        ]);

        if (pillarsRes.success && Array.isArray(pillarsRes.pillars)) {
          setPillars(pillarsRes.pillars);
        }

        if (chaptersRes.success && Array.isArray(chaptersRes.chapters)) {
          setChapters(chaptersRes.chapters);
        }

        if (partnersRes.success && partnersRes.partners) {
          setPartners(partnersRes.partners);
        }

        if (foundersRes.success && foundersRes.founders) {
          setFounders(foundersRes.founders);
        }

        if (executiveOfficersRes.success && executiveOfficersRes.executiveOfficers) {
          setExecutiveOfficers(executiveOfficersRes.executiveOfficers);
        }
      } catch (error) {
        console.error('[App] Unhandled homepage data load error', error);
      } finally {
        window.setTimeout(() => setIsLoading(false), 300);
      }
    };

    void loadAllData();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    window.localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.title = currentDocumentTitle;
  }, [currentDocumentTitle]);

  useEffect(() => {
    if (isLoading || hasRestoredAppState.current) return;

    const persistedState = readPersistedAppState();
    hasRestoredAppState.current = true;
    hasHydratedNavigationState.current = true;

    const routeDrivenView: AppView =
      currentRoute.type === 'donate'
        ? 'donate'
        : currentRoute.type === 'dashboard'
          ? 'dashboard'
          : currentRoute.type === 'chapter'
            ? 'chapter'
            : currentRoute.type === 'pillar'
              ? 'pillar'
          : 'home';

    const isChapterRoute = currentRoute.type === 'chapter';
    const isPillarRoute = currentRoute.type === 'pillar';
    const shouldUsePersistedDetailView = !isChapterRoute && !isPillarRoute && routeDrivenView === 'home';

    startTransition(() => {
      setSelectedChapterId(
        isChapterRoute ? currentRoute.chapterId : shouldUsePersistedDetailView ? persistedState.selectedChapterId : null
      );
      setSelectedPillarId(
        isPillarRoute ? currentRoute.pillarId : shouldUsePersistedDetailView ? persistedState.selectedPillarId : null
      );
      setIsDonatePageOpen(currentRoute.type === 'donate');
      setShowDashboard(currentRoute.type === 'dashboard');
      setIsLoginModalOpen(currentRoute.type === 'login');
    });

    restoreScrollForView(shouldUsePersistedDetailView ? persistedState.view : routeDrivenView);
  }, [currentRoute.type, isLoading]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (currentRoute.type === 'root' || currentRoute.type === 'unknown') {
      navigateTo(HOME_PATH, { replace: true });
      return;
    }

    if (currentRoute.type === 'login' && user) {
      navigateTo(getDefaultAuthenticatedPath(user), { replace: true });
      return;
    }

    if (currentRoute.type === 'chapter') {
      if (isLoading) return;

      const matchedChapter = chapters.find((chapter) => String(chapter.id) === String(currentRoute.chapterId));
      if (!matchedChapter) {
        navigateTo(HOME_PATH, { replace: true });
        return;
      }

      if (!isChapterRouteForChapter(currentRoute, matchedChapter)) {
        navigateTo(buildChapterPath(matchedChapter), { replace: true });
      }
      return;
    }

    if (currentRoute.type === 'pillar') {
      if (isLoading) return;

      const matchedPillar = pillars.find((pillar) => String(pillar.id) === String(currentRoute.pillarId));
      if (!matchedPillar) {
        navigateTo(HOME_PATH, { replace: true });
        return;
      }

      if (!isPillarRouteForPillar(currentRoute, matchedPillar)) {
        navigateTo(buildPillarPath(matchedPillar), { replace: true });
      }
      return;
    }

    if (currentRoute.type !== 'dashboard') return;

    if (!user) {
      navigateTo(LOGIN_PATH, { replace: true });
      return;
    }

    if (!canUserAccessDashboard(user)) {
      navigateTo(HOME_PATH, { replace: true });
      return;
    }

    if (!isDashboardRouteForUser(currentRoute, user)) {
      navigateTo(buildDashboardPath(user), { replace: true });
    }
  }, [chapters, currentRoute, isAuthLoading, isLoading, pillars, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const persistScrollPosition = () => {
      patchPersistedAppState({
        scrollPositions: {
          [currentViewRef.current]: window.scrollY
        }
      });
    };

    const handleScroll = () => {
      if (scrollSaveTimer.current !== null) {
        window.clearTimeout(scrollSaveTimer.current);
      }

      scrollSaveTimer.current = window.setTimeout(persistScrollPosition, 120);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    persistScrollPosition();

    return () => {
      if (scrollSaveTimer.current !== null) {
        window.clearTimeout(scrollSaveTimer.current);
      }
      persistScrollPosition();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isLoading || !hasRestoredAppState.current) return;
    restoreScrollForView(currentView);
  }, [currentView, isLoading]);

  const toggleTheme = () => setTheme((previousTheme) => previousTheme === 'light' ? 'dark' : 'light');

  const closeEditors = () => {
    setIsChapterEditorOpen(false);
    setIsPillarEditorOpen(false);
    setIsPartnersEditorOpen(false);
    setIsFoundersEditorOpen(false);
    setIsLandingEditorOpen(false);
  };

  const resetToHome = (restorePreviousScroll: boolean) => {
    closeEditors();

    startTransition(() => {
      setSelectedChapterId(null);
      setSelectedPillarId(null);
      setIsLoginModalOpen(false);
      setIsDonatePageOpen(false);
      setShowDashboard(false);
    });

    navigateTo(HOME_PATH);
    patchPersistedAppState({
      view: 'home',
      selectedChapterId: null,
      selectedPillarId: null
    });

    if (restorePreviousScroll) {
      window.setTimeout(() => restoreScrollForView('home'), 0);
      return;
    }

    patchPersistedAppState({
      scrollPositions: { home: 0 }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeaderHomeClick = () => {
    resetToHome(false);
  };

  const handleBackToHome = () => {
    resetToHome(true);
  };

  const handleOpenDashboard = () => {
    if (!user) return;

    closeEditors();
    startTransition(() => {
      setIsLoginModalOpen(false);
      setIsDonatePageOpen(false);
      setSelectedChapterId(null);
      setSelectedPillarId(null);
      setShowDashboard(true);
    });
    navigateTo(buildDashboardPath(user));
    patchPersistedAppState({
      view: 'dashboard',
      selectedChapterId: null,
      selectedPillarId: null,
      scrollPositions: { dashboard: 0 }
    });
    window.scrollTo(0, 0);
  };

  const handleDonateClick = (event?: React.MouseEvent) => {
    event?.preventDefault();
    closeEditors();
    startTransition(() => {
      setIsLoginModalOpen(false);
      setIsDonatePageOpen(true);
      setSelectedChapterId(null);
      setSelectedPillarId(null);
      setShowDashboard(false);
    });
    navigateTo(DONATE_PATH);
    patchPersistedAppState({
      view: 'donate',
      selectedChapterId: null,
      selectedPillarId: null,
      scrollPositions: { donate: 0 }
    });
    window.scrollTo(0, 0);
  };

  const handleSelectPillar = (pillar: Pillar) => {
    closeEditors();
    startTransition(() => {
      setSelectedPillarId(pillar.id);
      setSelectedChapterId(null);
      setIsDonatePageOpen(false);
      setShowDashboard(false);
    });
    navigateTo(buildPillarPath(pillar));
    patchPersistedAppState({
      view: 'pillar',
      selectedChapterId: null,
      selectedPillarId: pillar.id,
      scrollPositions: { pillar: 0 }
    });
    window.scrollTo(0, 0);
  };

  const handleSelectChapter = (chapter: Chapter) => {
    closeEditors();
    startTransition(() => {
      setSelectedChapterId(chapter.id);
      setSelectedPillarId(null);
      setIsDonatePageOpen(false);
      setShowDashboard(false);
    });
    navigateTo(buildChapterPath(chapter));
    patchPersistedAppState({
      view: 'chapter',
      selectedChapterId: chapter.id,
      selectedPillarId: null,
      scrollPositions: { chapter: 0 }
    });
    window.scrollTo(0, 0);
  };

  const handleFooterNavigation = (sectionId: string) => {
    resetToHome(false);

    window.setTimeout(() => {
      if (sectionId === 'home') {
        patchPersistedAppState({ scrollPositions: { home: 0 } });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const element = document.getElementById(sectionId);
      if (!element) return;

      const headerOffset = 90;
      const offsetPosition = element.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }, 100);
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);

    const storedUser: User | null = user || getSessionUser();

    if (!storedUser) return;

    if (
      storedUser.role === 'admin' ||
      (storedUser.role === 'editor' && !storedUser.chapterId) ||
      !!storedUser.chapterId
    ) {
      handleOpenDashboard();
      return;
    }

    navigateTo(HOME_PATH, { replace: true });
    if (storedUser.role !== 'member' && storedUser.chapterId) {
      const matchedChapter = chapters.find((chapter) => chapter.id === storedUser?.chapterId);
      if (matchedChapter) {
        handleSelectChapter(matchedChapter);
      }
    }
  };

  return (
    <div className="min-h-screen relative text-ocean-deep dark:text-white transition-colors duration-500 overflow-x-hidden">
      {isLoading && <LoadingScreen />}
      <BackgroundBubbles />

      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onHomeClick={handleHeaderHomeClick}
        onSignInClick={() => navigateTo(LOGIN_PATH)}
        onOpenDashboard={canAccessDashboard ? handleOpenDashboard : undefined}
        isDashboardOpen={showDashboard}
      />

      <main className="relative">
        <Suspense fallback={<LoadingScreen />}>
          {isLandingEditorOpen ? (
            <LandingPageEditor onBack={() => setIsLandingEditorOpen(false)} />
          ) : isPartnersEditorOpen ? (
            <PartnersEditor
              categories={partners}
              onSave={(nextPartners) => {
                setPartners(nextPartners);
                setIsPartnersEditorOpen(false);
              }}
              onClose={() => setIsPartnersEditorOpen(false)}
            />
          ) : isFoundersEditorOpen ? (
            <FoundersEditor
              founders={founders}
              executiveOfficers={executiveOfficers}
              onSave={({ founders: nextFounders, executiveOfficers: nextExecutiveOfficers }) => {
                setFounders(nextFounders);
                setExecutiveOfficers(nextExecutiveOfficers);
                setIsFoundersEditorOpen(false);
              }}
              onClose={() => setIsFoundersEditorOpen(false)}
            />
          ) : isPillarEditorOpen ? (
            <PillarsEditor
              pillars={displayPillars}
              onSave={(nextPillars) => {
                setPillars(nextPillars);
                setIsPillarEditorOpen(false);
              }}
              onClose={() => setIsPillarEditorOpen(false)}
            />
          ) : isChapterEditorOpen ? (
            <ChapterEditor
              chapter={selectedChapter || undefined}
              onBack={() => setIsChapterEditorOpen(false)}
            />
          ) : showDashboard && isAuthenticated ? (
            canAccessDashboard ? (
              <AdminDashboard onBack={handleBackToHome} />
            ) : (
              <div className="pt-32 text-center">
                <h2 className="text-2xl font-bold">Access Denied</h2>
              </div>
            )
          ) : isDonatePageOpen ? (
            <DonatePage onBack={handleBackToHome} />
          ) : selectedPillar ? (
            <PillarDetail
              pillar={selectedPillar}
              onBack={handleBackToHome}
              onEdit={() => setIsPillarEditorOpen(true)}
            />
          ) : selectedChapter ? (
            <ChapterDetail
              chapter={selectedChapter}
              onBack={handleBackToHome}
              onEdit={canEditSelectedChapter ? () => setIsChapterEditorOpen(true) : undefined}
            />
          ) : (
            <>
              <Hero onDonateClick={handleDonateClick} />
              <Slogan />
              <Pillars
                pillars={displayPillars}
                isLoading={isLoading}
                onSelectPillar={handleSelectPillar}
              />
              <Chapters
                chapters={chapters}
                isLoading={isLoading}
                onSelectChapter={handleSelectChapter}
              />
              <Partners
                partners={partners}
                isLoading={isLoading}
                onEdit={() => setIsPartnersEditorOpen(true)}
              />
              <Founders
                founders={founders}
                executiveOfficers={executiveOfficers}
                isLoading={isLoading}
                onEdit={() => setIsFoundersEditorOpen(true)}
              />
            </>
          )}
        </Suspense>
      </main>

      {!isDonatePageOpen && !showDashboard && !isLandingEditorOpen && !isChapterEditorOpen && !isPillarEditorOpen && !isPartnersEditorOpen && !isFoundersEditorOpen && (
        <Footer onDonateClick={handleDonateClick} onNavigate={handleFooterNavigation} />
      )}

      <Suspense fallback={null}>
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => navigateTo(HOME_PATH, { replace: true })}
          onLoginSuccess={handleLoginSuccess}
        />
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppDialogProvider>
        <AppContent />
      </AppDialogProvider>
    </AuthProvider>
  );
}

export default App;
