import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Slogan } from './components/Slogan';
import { Pillars } from './components/Stories';
import { Chapters } from './components/Chapters';
import { ChapterDetail } from './components/ChapterDetail';
import { Partners } from './components/Partners';
import { Founders } from './components/Founders';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { DonatePage } from './components/DonatePage';
import { PillarDetail } from './components/PillarDetail';
import { AdminDashboard } from './components/AdminDashboard';
import { ChapterEditor } from './components/ChapterEditor';
import { LandingPageEditor } from './components/LandingPageEditor';
import { PillarsEditor } from './components/PillarsEditor';
import { PartnersEditor } from './components/PartnersEditor';
import { FoundersEditor } from './components/FoundersEditor';
import { LogoEditor } from './components/LogoEditor';
import { BackgroundBubbles } from './components/BackgroundBubbles';
import { LoadingScreen } from './components/LoadingScreen';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppDialogProvider } from './contexts/AppDialogContext';
import { Chapter, ExecutiveOfficer, Pillar, USER_STORAGE_KEY, User } from './types';
import { DataService } from './services/DriveService';
import { BookOpen, Scale, Leaf, Heart, Palette } from 'lucide-react';
import { APP_CONFIG } from './config';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isGlobalEditor = user?.role === 'editor' && !user?.chapterId;
  const canAccessDashboard = isAdmin || isGlobalEditor;
  
  // Initialize theme
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
    }
    return 'dark';
  });

  // ✅ LOADING STATE
  const [isLoading, setIsLoading] = useState(true);

  // Navigation & Editor States
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const isScopedEditorForSelectedChapter = !!user && !!selectedChapter && user.role === 'editor' && user.chapterId === selectedChapter.id;
  const isChapterHeadForSelectedChapter = !!user && !!selectedChapter && user.role === 'chapter_head' && user.chapterId === selectedChapter.id;
  const canEditSelectedChapter = !!user && !!selectedChapter && (
    user.role === 'admin' ||
    isScopedEditorForSelectedChapter ||
    isChapterHeadForSelectedChapter
  );
  
  const [isChapterEditorOpen, setIsChapterEditorOpen] = useState(false);
  const [isPillarEditorOpen, setIsPillarEditorOpen] = useState(false);
  const [isPartnersEditorOpen, setIsPartnersEditorOpen] = useState(false);
  const [isFoundersEditorOpen, setIsFoundersEditorOpen] = useState(false);
  const [isLandingEditorOpen, setIsLandingEditorOpen] = useState(false); // New State
  const [isLogoEditorOpen, setIsLogoEditorOpen] = useState(false);
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDonatePageOpen, setIsDonatePageOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // ✅ DATA STATES: Initialized as EMPTY
  const [pillars, setPillars] = useState<any[]>([]); 
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [founders, setFounders] = useState<any[]>([]);
  const [executiveOfficers, setExecutiveOfficers] = useState<ExecutiveOfficer[]>([]);

  const visibleChapters = user && (
    user.role === 'chapter_head' ||
    user.role === 'member' ||
    (user.role === 'editor' && !!user.chapterId)
  )
    ? chapters.filter(chapter => chapter.id === user.chapterId)
    : chapters;

  // Helper to map index to icon
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

  // Intersection Observer
  useEffect(() => {
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target); 
        }
      });
    }, observerOptions);

    const timeoutId = setTimeout(() => {
      const revealElements = document.querySelectorAll('.reveal');
      revealElements.forEach(el => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [pillars, chapters, selectedChapter, selectedPillar, isDonatePageOpen, showDashboard, isLoading]);

  // Fetch ALL data
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      console.info('[App] Starting homepage data load', {
        mainApiUrl: APP_CONFIG.mainApiUrl || '(missing)',
        donationsApiUrl: APP_CONFIG.donationsApiUrl || '(missing)'
      });
      try {
        const [pillarsRes, chaptersRes, partnersRes, foundersRes, executiveOfficersRes] = await Promise.all([
          DataService.loadPillars(),
          DataService.listChapters(),
          DataService.loadPartners(),
          DataService.loadFounders(),
          DataService.loadExecutiveOfficers()
        ]);

        console.info('[App] Homepage data responses', {
          pillarsRes,
          chaptersRes,
          partnersRes,
          foundersRes,
          executiveOfficersRes
        });

        if (pillarsRes.success && pillarsRes.pillars?.length > 0) {
          setPillars(pillarsRes.pillars.map((p: any, index: number) => ({
            ...p,
            icon: getIconForIndex(index)
          })));
        } else {
          console.warn('[App] Pillars data missing or empty', pillarsRes);
        }
        if (chaptersRes.success && chaptersRes.chapters) {
          setChapters(chaptersRes.chapters);
        } else {
          console.warn('[App] Chapters data missing or empty', chaptersRes);
        }
        if (partnersRes.success && partnersRes.partners) {
          setPartners(partnersRes.partners);
        } else {
          console.warn('[App] Partners data missing or empty', partnersRes);
        }
        if (foundersRes.success && foundersRes.founders) {
          setFounders(foundersRes.founders);
        } else {
          console.warn('[App] Founders data missing or empty', foundersRes);
        }
        if (executiveOfficersRes.success && executiveOfficersRes.executiveOfficers) {
          setExecutiveOfficers(executiveOfficersRes.executiveOfficers);
        } else {
          console.warn('[App] Executive officers data missing or empty', executiveOfficersRes);
        }

      } catch (error) {
        console.error('[App] Unhandled homepage data load error', error);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };
    loadAllData();
  }, []);

  // Theme Handling
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Navigation Handlers
  const handleBackToHome = () => {
    setSelectedChapter(null);
    setSelectedPillar(null);
    setIsDonatePageOpen(false);
    setIsChapterEditorOpen(false);
    setIsPillarEditorOpen(false);
    setIsPartnersEditorOpen(false);
    setIsFoundersEditorOpen(false);
    setIsLandingEditorOpen(false);
    setIsLogoEditorOpen(false);
    setShowDashboard(false); 
    window.scrollTo(0, 0);
  };

  const handleDonateClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsDonatePageOpen(true);
    setSelectedChapter(null);
    setSelectedPillar(null);
  };

  const handleFooterNavigation = (sectionId: string) => {
    handleBackToHome();
    setTimeout(() => {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const element = document.getElementById(sectionId);
        if (element) {
          const headerOffset = 90;
          const offsetPosition = element.getBoundingClientRect().top + window.scrollY - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }
    }, 100);
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    let storedUser: User | null = null;
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      storedUser = raw ? JSON.parse(raw) as User : null;
    } catch (error) {
      storedUser = null;
    }

    if (!storedUser) return;
    if (storedUser.role === 'admin' || (storedUser.role === 'editor' && !storedUser.chapterId)) {
      setShowDashboard(true);
      return;
    }

    setShowDashboard(false);
    if (storedUser.chapterId) {
      const matchedChapter = chapters.find(chapter => chapter.id === storedUser.chapterId);
      if (matchedChapter) {
        setSelectedChapter(matchedChapter);
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
        onHomeClick={handleBackToHome} 
        onSignInClick={() => setIsLoginModalOpen(true)}
        onEditLogo={isAdmin ? () => setIsLogoEditorOpen(true) : undefined}
        onOpenDashboard={canAccessDashboard ? () => setShowDashboard(true) : undefined}
        isDashboardOpen={showDashboard}
      />
      
      <main className="relative">
        {/* =========================================================
            EDITOR MODALS (Higher Priority)
            These render ON TOP of everything else if active.
           ========================================================= */}
        {isLogoEditorOpen ? (
          <LogoEditor onClose={() => setIsLogoEditorOpen(false)} />
        ) : isLandingEditorOpen ? (
          <LandingPageEditor onBack={() => setIsLandingEditorOpen(false)} />
        ) : isPartnersEditorOpen ? (
          <PartnersEditor 
            categories={partners} 
            onSave={(p) => { setPartners(p); setIsPartnersEditorOpen(false); }} 
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
            pillars={pillars} 
            onSave={(p) => { setPillars(p.map((x:any, i) => ({...x, icon: getIconForIndex(i)}))); setIsPillarEditorOpen(false); }} 
            onClose={() => setIsPillarEditorOpen(false)} 
          />
        ) : isChapterEditorOpen ? (
          <ChapterEditor 
            chapter={selectedChapter || undefined} 
            onBack={() => setIsChapterEditorOpen(false)} 
          />
        ) 

        /* =========================================================
            ADMIN DASHBOARD & NAVIGATION
           ========================================================= */
        : showDashboard && isAuthenticated ? (
          canAccessDashboard ? (
            <AdminDashboard onBack={() => setShowDashboard(false)} />
          ) : (
            <div className="pt-32 text-center">
              <h2 className="text-2xl font-bold">Access Denied</h2>
            </div>
          )
        ) 
        
        /* =========================================================
            PUBLIC PAGES (View Mode)
           ========================================================= */
        : isDonatePageOpen ? (
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
          /* =========================================================
              HOME PAGE (Default)
             ========================================================= */
          <>
            <Hero onDonateClick={handleDonateClick} />
            <Slogan />
            <Pillars 
              pillars={pillars} 
              isLoading={isLoading} 
              onSelectPillar={(p) => { setSelectedPillar(p); window.scrollTo(0,0); }} 
            />
            
            <Chapters 
              chapters={visibleChapters} 
              isLoading={isLoading}
              onSelectChapter={(c) => { setSelectedChapter(c); window.scrollTo(0,0); }} 
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
      </main>
      
      {!isDonatePageOpen && !showDashboard && !isLandingEditorOpen && !isChapterEditorOpen && !isPillarEditorOpen && !isPartnersEditorOpen && !isFoundersEditorOpen && (
        <Footer onDonateClick={handleDonateClick} onNavigate={handleFooterNavigation} />
      )}

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
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
