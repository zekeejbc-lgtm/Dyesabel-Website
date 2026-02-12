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
import { DataService } from './services/DriveService';
import { BookOpen, Scale, Leaf, Heart, Palette } from 'lucide-react';

// Add this style block for the water wave animation
const waterStyles = `
@keyframes wave {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes rise {
  0% { top: 120%; }
  100% { top: 20%; }
}
.water-container {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
}
.water-wave {
  position: absolute;
  top: 120%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: rgba(34, 211, 238, 0.6);
  border-radius: 40%;
  animation: wave 5s linear infinite, rise 4s ease-out forwards;
}
.water-wave::after {
  content: '';
  position: absolute;
  top: 5%;
  left: 50%;
  transform: translate(-50%, 0);
  width: 100%;
  height: 100%;
  background: rgba(34, 211, 238, 0.3);
  border-radius: 38%;
  animation: wave 7s linear infinite reverse;
}
`;

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

  // Global Loading State
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);

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

  // Content Data States
  const [pillars, setPillars] = useState(pillarsData);
  const [chapters, setChapters] = useState<Chapter[]>([]);
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

  // Fetch ALL data at once on startup
  useEffect(() => {
    const loadAllData = async () => {
      try {
        console.log("🚀 Starting global data fetch...");
        
        const [pillarsRes, chaptersRes, partnersRes, foundersRes] = await Promise.all([
          DataService.loadPillars(),
          DataService.listChapters(),
          DataService.loadPartners(),
          DataService.loadFounders()
        ]);

        if (pillarsRes.success && pillarsRes.pillars && pillarsRes.pillars.length > 0) {
          const mergedPillars = pillarsRes.pillars.map((p: any, index: number) => ({
            ...p,
            icon: getIconForIndex(index)
          }));
          setPillars(mergedPillars);
        }

        if (chaptersRes.success && chaptersRes.chapters && chaptersRes.chapters.length > 0) {
          setChapters(chaptersRes.chapters);
        }

        if (partnersRes.success && partnersRes.partners) {
          setPartners(partnersRes.partners);
        }

        if (foundersRes.success && foundersRes.founders && foundersRes.founders.length > 0) {
          setFounders(foundersRes.founders);
        }

      } catch (error) {
        console.error("Global fetch error:", error);
      } finally {
        setIsGlobalLoading(false);
      }
    };

    loadAllData();
  }, []);

  useEffect(() => {
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

  // --- Handlers ---
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
    const mergedPillars = updatedPillars.map((p: any, index: number) => ({
      ...p,
      icon: getIconForIndex(index)
    }));
    setPillars(mergedPillars);
    setIsPillarEditorOpen(false);
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
    setSelectedChapter(null);
    setSelectedPillar(null);
    setIsDonatePageOpen(false);
    setShowDashboard(false);
    setIsChapterEditorOpen(false);
    setIsPillarEditorOpen(false);
    setIsPartnersEditorOpen(false);
    setIsFoundersEditorOpen(false);
    setIsLogoEditorOpen(false);

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
    setShowDashboard(true);
    setSelectedChapter(null);
    setSelectedPillar(null);
    setIsDonatePageOpen(false);
  };

  const handleDashboardBack = () => {
    setShowDashboard(false);
    window.scrollTo(0, 0);
  };

  // ✅ LOADING SCREEN WITH WATER ANIMATION
  if (isGlobalLoading) {
    return (
      <>
        <style>{waterStyles}</style>
        <div className="fixed inset-0 z-50 bg-[#00080a] flex flex-col items-center justify-center text-white">
          <div className="water-container">
            <div className="water-wave"></div>
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <img 
                src="https://i.imgur.com/CQCKjQM.png" 
                className="w-14 h-14 object-contain drop-shadow-lg" 
                alt="Logo"
              />
            </div>
          </div>
          <h2 className="mt-8 text-2xl font-black tracking-widest animate-pulse font-sans">DYESABEL PH</h2>
          <p className="text-[#22d3ee] text-sm mt-2 font-medium tracking-wide">Loading resources...</p>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen relative text-ocean-deep dark:text-white transition-colors duration-500 overflow-x-hidden">
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-700 bg-gradient-to-b from-ocean-light via-[#b2dfdb] to-ocean-mint dark:from-ocean-deep dark:via-[#021017] dark:to-ocean-dark">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary-cyan/20 dark:bg-primary-blue/20 rounded-full blur-[100px] animate-float opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-primary-blue/20 dark:bg-primary-cyan/10 rounded-full blur-[120px] animate-float opacity-50" style={{ animationDelay: '3s' }}></div>
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

      {/* ✅ Pass the onOpenDashboard handler here */}
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onHomeClick={handleBackToHome} 
        onSignInClick={() => setIsLoginModalOpen(true)}
        onEditLogo={handleEditLogo}
        onOpenDashboard={() => setShowDashboard(true)}
      />
      
      <main className="relative">
        {isLogoEditorOpen ? (
          <LogoEditor onClose={handleBackFromLogoEditor} />
        ) : showDashboard && isAuthenticated ? (
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
            <Chapters 
              chapters={chapters} 
              onSelectChapter={handleSelectChapter} 
            />
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