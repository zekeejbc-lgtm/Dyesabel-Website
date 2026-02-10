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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Chapter, Pillar } from './types';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  
  // Initialize theme from local storage or system preference, default to 'light'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDonatePageOpen, setIsDonatePageOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // Apply theme class to document element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleSelectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setSelectedPillar(null);
    setIsDonatePageOpen(false);
    window.scrollTo(0, 0);
  };

  const handleSelectPillar = (pillar: Pillar) => {
    setSelectedPillar(pillar);
    setSelectedChapter(null);
    setIsDonatePageOpen(false);
    window.scrollTo(0, 0);
  };

  const handleBackToHome = () => {
    setSelectedChapter(null);
    setSelectedPillar(null);
    setIsDonatePageOpen(false);
    window.scrollTo(0, 0);
  };

  const handleDonateClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsDonatePageOpen(true);
    setSelectedChapter(null);
    setSelectedPillar(null);
  };

  const handleFooterNavigation = (sectionId: string) => {
    // Reset view to home first
    setSelectedChapter(null);
    setSelectedPillar(null);
    setIsDonatePageOpen(false);
    setShowDashboard(false);

    // Allow state updates to propagate then scroll
    setTimeout(() => {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 90;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 100);
  };

  const handleLoginSuccess = () => {
    // Automatically show dashboard after successful login
    setShowDashboard(true);
    setSelectedChapter(null);
    setSelectedPillar(null);
    setIsDonatePageOpen(false);
  };

  const handleDashboardBack = () => {
    setShowDashboard(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen relative text-ocean-deep dark:text-white transition-colors duration-500 overflow-x-hidden">
      {/* Global Dynamic Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-700 bg-gradient-to-b from-ocean-light via-[#b2dfdb] to-ocean-mint dark:from-ocean-deep dark:via-[#021017] dark:to-ocean-dark">
        
        {/* Pulsating Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary-cyan/20 dark:bg-primary-blue/20 rounded-full blur-[100px] animate-float opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-primary-blue/20 dark:bg-primary-cyan/10 rounded-full blur-[120px] animate-float opacity-50" style={{ animationDelay: '3s' }}></div>
        
        {/* Rising Bubbles */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
             <div
               key={i}
               className="absolute bg-white/20 dark:bg-white/10 rounded-full blur-[1px] shadow-[inset_0_0_6px_rgba(255,255,255,0.4)] animate-rise"
               style={{
                 left: `${Math.random() * 100}%`,
                 width: `${Math.random() * 20 + 5}px`,
                 height: `${Math.random() * 20 + 5}px`,
                 animationDuration: `${Math.random() * 10 + 10}s`,
                 animationDelay: `${Math.random() * 15}s`,
                 bottom: '-50px',
               }}
             />
          ))}
        </div>
      </div>

      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onHomeClick={handleBackToHome} 
        onSignInClick={() => setIsLoginModalOpen(true)}
      />
      
      <main className="relative">
        {showDashboard && isAuthenticated ? (
          // Show appropriate dashboard based on user role
          user?.role === 'admin' ? (
            <AdminDashboard onBack={handleDashboardBack} />
          ) : user?.role === 'chapter_head' ? (
            <ChapterEditor onBack={handleDashboardBack} />
          ) : user?.role === 'editor' ? (
            <LandingPageEditor onBack={handleDashboardBack} />
          ) : null
        ) : isDonatePageOpen ? (
          <DonatePage onBack={handleBackToHome} />
        ) : selectedPillar ? (
          <PillarDetail pillar={selectedPillar} onBack={handleBackToHome} />
        ) : selectedChapter ? (
          <ChapterDetail chapter={selectedChapter} onBack={handleBackToHome} />
        ) : (
          <>
            <Hero onDonateClick={handleDonateClick} />
            <Slogan />
            <Pillars onSelectPillar={handleSelectPillar} />
            <Chapters onSelectChapter={handleSelectChapter} />
            <Partners />
            <Founders />
          </>
        )}
      </main>
      
      {!isDonatePageOpen && !showDashboard && (
        <Footer 
          onDonateClick={handleDonateClick} 
          onNavigate={handleFooterNavigation}
        />
      )}

      {/* Login Modal */}
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
      <AppContent />
    </AuthProvider>
  );
}

export default App;