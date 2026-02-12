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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Chapter, Pillar } from './types';
import { pillarsData } from './components/Stories';

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
  const [isChapterEditorOpen, setIsChapterEditorOpen] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [isPillarEditorOpen, setIsPillarEditorOpen] = useState(false);
  const [isPartnersEditorOpen, setIsPartnersEditorOpen] = useState(false);
  const [isFoundersEditorOpen, setIsFoundersEditorOpen] = useState(false);
  const [isLogoEditorOpen, setIsLogoEditorOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDonatePageOpen, setIsDonatePageOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // State for editable content
  const [pillars, setPillars] = useState(pillarsData);
  const [partners, setPartners] = useState<any[]>([
    {
      id: 'coalitions',
      title: 'Coalitions',
      partners: [
        { id: 'c1', name: 'Youth for Nature', logo: 'https://ui-avatars.com/api/?name=Youth+Nature&background=22d3ee&color=fff' },
        { id: 'c2', name: 'Mindanao Green Alliance', logo: 'https://ui-avatars.com/api/?name=Mindanao+Green&background=2563eb&color=fff' },
      ]
    },
    {
      id: 'gov',
      title: 'Government Partners',
      partners: [
        { id: 'g1', name: 'DENR', logo: 'https://ui-avatars.com/api/?name=DENR&background=059669&color=fff' },
        { id: 'g2', name: 'Provincial Gov. Davao', logo: 'https://ui-avatars.com/api/?name=Davao+Gov&background=db2777&color=fff' },
        { id: 'g3', name: 'LGU Tagum City', logo: 'https://ui-avatars.com/api/?name=Tagum&background=d97706&color=fff' },
      ]
    },
  ]);
  const [founders, setFounders] = useState<any[]>([
    {
      id: '1',
      name: 'Maria Clara Santos',
      role: 'Co-Founder & Executive Director',
      bio: 'An environmental scientist with over 15 years of experience in marine conservation.',
      imageUrl: 'https://picsum.photos/seed/person1/400/400'
    },
    {
      id: '2',
      name: 'Juan Dela Cruz',
      role: 'Co-Founder & Director of Advocacy',
      bio: 'A passionate youth leader and educator focused on grassroots engagement.',
      imageUrl: 'https://picsum.photos/seed/person2/400/400'
    }
  ]);

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
    setIsChapterEditorOpen(false);
    window.scrollTo(0, 0);
  };

  const handleEditChapter = () => {
    setIsChapterEditorOpen(true);
  };

  const handleBackFromEditor = () => {
    setIsChapterEditorOpen(false);
    window.scrollTo(0, 0);
  };

  const handleSelectPillar = (pillar: Pillar) => {
    setSelectedPillar(pillar);
    setSelectedChapter(null);
    setIsDonatePageOpen(false);
    setIsPillarEditorOpen(false);
    window.scrollTo(0, 0);
  };

  const handleEditPillar = () => {
    setIsPillarEditorOpen(true);
  };

  const handleBackFromPillarEditor = () => {
    setIsPillarEditorOpen(false);
    window.scrollTo(0, 0);
  };

  const handleEditPartners = () => {
    setIsPartnersEditorOpen(true);
  };

  const handleBackFromPartnersEditor = () => {
    setIsPartnersEditorOpen(false);
  };

  const handleEditFounders = () => {
    setIsFoundersEditorOpen(true);
  };

  const handleBackFromFoundersEditor = () => {
    setIsFoundersEditorOpen(false);
  };

  const handleEditLogo = () => {
    setIsLogoEditorOpen(true);
  };

  const handleBackFromLogoEditor = () => {
    setIsLogoEditorOpen(false);
  };

  const handleSavePillars = async (updatedPillars: Pillar[]) => {
    setPillars(updatedPillars);        // Update the state with new data
    setIsPillarEditorOpen(false);      // Close the editor
  };

  const handleSavePartners = async (updatedPartners: any[]) => {
    setPartners(updatedPartners);
    setIsPartnersEditorOpen(false);
  };

  const handleSaveFounders = async (updatedFounders: any[]) => {
    setFounders(updatedFounders);
    setIsFoundersEditorOpen(false);
  };

  const handleBackToHome = () => {
    setSelectedChapter(null);
    setSelectedPillar(null);
    setIsDonatePageOpen(false);
    setIsChapterEditorOpen(false);
    setIsPillarEditorOpen(false);
    setIsPartnersEditorOpen(false);
    setIsFoundersEditorOpen(false);
    setIsLogoEditorOpen(false);
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
    setIsChapterEditorOpen(false);
    setIsPillarEditorOpen(false);
    setIsPartnersEditorOpen(false);
    setIsFoundersEditorOpen(false);
    setIsLogoEditorOpen(false);

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
        onEditLogo={handleEditLogo}
      />
      
      <main className="relative">
        {isLogoEditorOpen ? (
          <LogoEditor onClose={handleBackFromLogoEditor} />
        ) : showDashboard && isAuthenticated ? (
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
        ) : isPartnersEditorOpen ? (
          <PartnersEditor categories={partners} onSave={handleSavePartners} onClose={handleBackFromPartnersEditor} />
        ) : isFoundersEditorOpen ? (
          <FoundersEditor founders={founders} onSave={handleSaveFounders} onClose={handleBackFromFoundersEditor} />
        ) : selectedPillar ? (
          isPillarEditorOpen ? (
            <PillarsEditor pillars={pillars} onSave={handleSavePillars} onClose={handleBackFromPillarEditor} />
          ) : (
            <PillarDetail pillar={selectedPillar} onBack={handleBackToHome} onEdit={handleEditPillar} />
          )
        ) : selectedChapter ? (
          isChapterEditorOpen ? (
            <ChapterEditor chapter={selectedChapter} onBack={handleBackFromEditor} />
          ) : (
            <ChapterDetail chapter={selectedChapter} onBack={handleBackToHome} onEdit={handleEditChapter} />
          )
        ) : (
          <>
            <Hero onDonateClick={handleDonateClick} />
            <Slogan />
            <Pillars onSelectPillar={handleSelectPillar} />
            <Chapters onSelectChapter={handleSelectChapter} />
            <Partners onEdit={handleEditPartners} />
            <Founders onEdit={handleEditFounders} />
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