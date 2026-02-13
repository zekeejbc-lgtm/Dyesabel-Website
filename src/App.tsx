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
import { LoadingScreen } from './components/LoadingScreen';
import { BackgroundBubbles } from './components/BackgroundBubbles';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Chapter, Pillar } from './types';
import { pillarsData } from './components/Stories';
import { DataService } from './services/DriveService';
import { BookOpen, Scale, Leaf, Heart, Palette } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  
  // Initialize theme
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  // ✅ LOADING STATE: Controls the skeletons
  const [isLoading, setIsLoading] = useState(true);

  // Navigation & Editor States
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isChapterEditorOpen, setIsChapterEditorOpen] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [isPillarEditorOpen, setIsPillarEditorOpen] = useState(false);
  const [isPartnersEditorOpen, setIsPartnersEditorOpen] = useState(false);
  const [isFoundersEditorOpen, setIsFoundersEditorOpen] = useState(false);
  const [isLogoEditorOpen, setIsLogoEditorOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDonatePageOpen, setIsDonatePageOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // ✅ DATA STATES: Initialized as EMPTY (No Mock Data)
  const [pillars, setPillars] = useState(pillarsData);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [founders, setFounders] = useState<any[]>([]);

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
      setIsLoading(true); // Start showing skeletons
      try {
        const [pillarsRes, chaptersRes, partnersRes, foundersRes] = await Promise.all([
          DataService.loadPillars(),
          DataService.listChapters(),
          DataService.loadPartners(),
          DataService.loadFounders()
        ]);

        if (pillarsRes.success && pillarsRes.pillars?.length > 0) {
          setPillars(pillarsRes.pillars.map((p: any, index: number) => ({
            ...p,
            icon: getIconForIndex(index)
          })));
        }
        if (chaptersRes.success && chaptersRes.chapters) setChapters(chaptersRes.chapters);
        if (partnersRes.success && partnersRes.partners) setPartners(partnersRes.partners);
        if (foundersRes.success && foundersRes.founders) setFounders(foundersRes.founders);

      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        // Stop showing skeletons after fetch
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

  return (
    <div className="min-h-screen relative text-ocean-deep dark:text-white transition-colors duration-500 overflow-x-hidden">
      <BackgroundBubbles />

      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onHomeClick={handleBackToHome} 
        onSignInClick={() => setIsLoginModalOpen(true)}
        onEditLogo={() => setIsLogoEditorOpen(true)}
        onOpenDashboard={() => setShowDashboard(true)}
        isDashboardOpen={showDashboard}
      />
      
      <main className="relative">
        {isLogoEditorOpen ? (
          <LogoEditor onClose={() => setIsLogoEditorOpen(false)} />
        ) : showDashboard && isAuthenticated ? (
          user?.role === 'admin' ? (
            <AdminDashboard onBack={() => setShowDashboard(false)} />
          ) : user?.role === 'chapter_head' ? (
            <ChapterEditor onBack={() => setShowDashboard(false)} />
          ) : user?.role === 'editor' ? (
            <LandingPageEditor onBack={() => setShowDashboard(false)} />
          ) : null
        ) : isDonatePageOpen ? (
          <DonatePage onBack={handleBackToHome} />
        ) : isPartnersEditorOpen ? (
          <PartnersEditor categories={partners} onSave={(p) => { setPartners(p); setIsPartnersEditorOpen(false); }} onClose={() => setIsPartnersEditorOpen(false)} />
        ) : isFoundersEditorOpen ? (
          <FoundersEditor founders={founders} onSave={(f) => { setFounders(f); setIsFoundersEditorOpen(false); }} onClose={() => setIsFoundersEditorOpen(false)} />
        ) : selectedPillar ? (
          isPillarEditorOpen ? (
            <PillarsEditor pillars={pillars} onSave={(p) => { setPillars(p.map((x:any, i) => ({...x, icon: getIconForIndex(i)}))); setIsPillarEditorOpen(false); }} onClose={() => setIsPillarEditorOpen(false)} />
          ) : (
            <PillarDetail pillar={selectedPillar} onBack={handleBackToHome} onEdit={() => setIsPillarEditorOpen(true)} />
          )
        ) : selectedChapter ? (
          isChapterEditorOpen ? (
            <ChapterEditor chapter={selectedChapter} onBack={() => setIsChapterEditorOpen(false)} />
          ) : (
            <ChapterDetail chapter={selectedChapter} onBack={handleBackToHome} onEdit={() => setIsChapterEditorOpen(true)} />
          )
        ) : (
          <>
            <Hero onDonateClick={handleDonateClick} />
            <Slogan />
            <Pillars 
              pillars={pillars} 
              onSelectPillar={(p) => { setSelectedPillar(p); window.scrollTo(0,0); }} 
            />
            
            {/* ✅ PASSING isLoading & DATA to components */}
            <Chapters 
              chapters={chapters} 
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
              isLoading={isLoading}
              onEdit={() => setIsFoundersEditorOpen(true)} 
            />
          </>
        )}
      </main>
      
      {!isDonatePageOpen && !showDashboard && (
        <Footer onDonateClick={handleDonateClick} onNavigate={handleFooterNavigation} />
      )}

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => { setShowDashboard(true); setIsLoginModalOpen(false); }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;