import React, { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon, LogIn } from 'lucide-react';
import { NavLink } from '../types';

const VOLUNTEER_URL = "https://forms.gle/W6WVpftGDwM7fUm19";

const navLinks: NavLink[] = [
  { label: 'Our Pillars', href: '#pillars' },
  { label: 'Chapters', href: '#chapters' },
  { label: 'Partners', href: '#partners' },
  { label: 'Volunteer', href: VOLUNTEER_URL },
  { label: 'About Us', href: '#about' },
];

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  onHomeClick?: () => void;
  onSignInClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onHomeClick, onSignInClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (onHomeClick) {
      e.preventDefault();
      onHomeClick();
      window.scrollTo(0, 0);
    }
  };

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, link: NavLink) => {
    // Check for empty volunteer URL
    if (link.label === 'Volunteer' && !link.href) {
      e.preventDefault();
      alert("No membership application open yet");
      setIsMobileMenuOpen(false);
      return;
    }

    // Handle External Links
    if (link.href.startsWith('http')) {
      setIsMobileMenuOpen(false);
      // Allow default browser behavior (navigation)
      return;
    }

    // Handle Internal Anchors
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    // Reset view to Home if needed
    if (onHomeClick) {
      onHomeClick();
    }
    
    // Scroll with offset
    setTimeout(() => {
      const element = document.querySelector(link.href);
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

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        isScrolled 
          ? 'bg-white/90 dark:bg-ocean-deep/90 backdrop-blur-md shadow-lg border-ocean-deep/5 dark:border-white/10 py-2' 
          : 'bg-transparent border-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 group cursor-pointer flex-shrink-0" onClick={handleLogoClick}>
            <div className="relative">
                <div className="absolute inset-0 bg-primary-cyan/50 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img 
                src="https://i.imgur.com/CQCKjQM.png" 
                alt="Dyesabel Philippines Logo" 
                className="relative h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 object-contain rounded-full transition-transform duration-300 drop-shadow-md z-10"
                />
            </div>
            
            <div className="flex flex-col">
              <span className={`font-lobster text-lg lg:text-2xl tracking-wide leading-none transition-colors duration-300 ${
                  isScrolled ? 'text-ocean-deep dark:text-white' : 'text-ocean-deep dark:text-white drop-shadow-md'
              }`}>
                Dyesabel
              </span>
              <span className={`font-sans font-bold text-[10px] lg:text-xs tracking-[0.2em] uppercase leading-none mt-0.5 ${
                  isScrolled ? 'text-gray-600 dark:text-gray-300' : 'text-gray-700 dark:text-gray-200'
              }`}>
                Philippines, Inc.
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">
             <div className="flex items-center">
                {navLinks.map((link, index) => (
                <React.Fragment key={link.label}>
                    <a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={(e) => handleNavigation(e, link)}
                    className={`text-[10px] lg:text-xs xl:text-sm font-bold tracking-wider uppercase transition-colors duration-200 whitespace-nowrap ${
                        isScrolled ? 'text-ocean-deep dark:text-gray-200 hover:text-primary-blue dark:hover:text-primary-cyan' : 'text-ocean-deep dark:text-white hover:text-primary-blue dark:hover:text-primary-cyan'
                    }`}
                    >
                    {link.label}
                    </a>
                    {index < navLinks.length - 1 && (
                        <span className={`mx-2 lg:mx-3 xl:mx-4 select-none text-[10px] lg:text-xs ${
                            isScrolled ? 'text-gray-300 dark:text-gray-600' : 'text-ocean-deep/40 dark:text-white/40'
                        }`}>|</span>
                    )}
                </React.Fragment>
                ))}
             </div>

            {/* Separator between links and buttons */}
            <div className={`h-4 lg:h-5 w-px mx-3 lg:mx-5 ${isScrolled ? 'bg-gray-300 dark:bg-gray-700' : 'bg-ocean-deep/20 dark:bg-white/20'}`}></div>

            {/* Sign In Button */}
            <button
              onClick={onSignInClick}
              className="bg-gradient-to-r from-primary-blue to-primary-cyan text-white px-4 lg:px-6 py-1.5 lg:py-2 rounded-full shadow-lg hover:shadow-primary-cyan/50 hover:scale-105 border border-white/20 text-[10px] lg:text-sm font-bold tracking-wide transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
            >
              Sign In
              <LogIn size={14} className="lg:w-4 lg:h-4" />
            </button>
            
            {/* Theme Toggle Button (Desktop) */}
            <button 
              onClick={toggleTheme}
              className={`ml-2 p-1.5 lg:p-2 rounded-full transition-all hover:scale-110 flex-shrink-0 ${
                isScrolled 
                  ? 'bg-gray-200/50 dark:bg-white/10 text-ocean-deep dark:text-yellow-300' 
                  : 'bg-white/20 text-ocean-deep dark:text-white backdrop-blur-md'
              }`}
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun size={16} className="lg:w-5 lg:h-5" /> : <Moon size={16} className="lg:w-5 lg:h-5" />}
            </button>
          </nav>

          {/* Mobile Actions */}
          <div className="flex items-center gap-4 md:hidden">
            <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${
                  isScrolled 
                    ? 'bg-gray-100 dark:bg-white/10 text-ocean-deep dark:text-yellow-400' 
                    : 'bg-white/20 text-ocean-deep dark:text-white backdrop-blur-md'
                }`}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className={`${isScrolled ? 'text-ocean-deep dark:text-white' : 'text-ocean-deep dark:text-white'} focus:outline-none hover:opacity-80 transition-colors`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden absolute top-full left-4 right-4 mt-2 rounded-2xl bg-white dark:bg-ocean-deep border border-ocean-deep/10 dark:border-white/10 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden transform origin-top ${
          isMobileMenuOpen ? 'max-h-[32rem] opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95'
        }`}
      >
        <div className="flex flex-col px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="block text-center py-3 text-lg rounded-xl transition-colors text-ocean-deep dark:text-gray-200 font-semibold hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary-blue dark:hover:text-primary-cyan"
              onClick={(e) => handleNavigation(e, link)}
            >
              {link.label}
            </a>
          ))}
          {/* Mobile Sign In */}
           <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onSignInClick();
              }}
              className="w-full bg-gradient-to-r from-primary-blue to-primary-cyan text-white font-bold py-3 rounded-xl shadow-lg mt-2 flex items-center justify-center gap-2"
            >
              Sign In
              <LogIn size={18} />
            </button>
        </div>
      </div>
    </header>
  );
};