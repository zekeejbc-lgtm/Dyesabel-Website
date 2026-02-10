import React from 'react';

const VOLUNTEER_URL = "https://forms.gle/W6WVpftGDwM7fUm19";

interface HeroProps {
  onDonateClick: (e: React.MouseEvent) => void;
}

export const Hero: React.FC<HeroProps> = ({ onDonateClick }) => {
  const handleJoinClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!VOLUNTEER_URL) {
      e.preventDefault();
      alert("No membership application open yet");
    }
  };

  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background handled in App.tsx */}
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-ocean-deep dark:text-white reveal active">
        <div className="animate-float mb-6 flex justify-center w-full">
          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-lobster tracking-wide drop-shadow-xl bg-clip-text text-transparent bg-gradient-to-b from-ocean-deep to-primary-blue dark:from-white dark:to-primary-cyan py-2 px-1 whitespace-nowrap">
            Dyesabel Philippines
          </h1>
        </div>
        
        <p className="text-lg md:text-xl lg:text-2xl font-light max-w-3xl mx-auto mb-12 text-ocean-deep/90 dark:text-white/90 drop-shadow-sm reveal reveal-delay-200 leading-relaxed">
          Developing the Youth with <span className="font-semibold text-primary-blue dark:text-primary-cyan">Environmentally Sustainable Advocacies</span> Building and Empowering Lives.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center reveal reveal-delay-300">
          <button 
            onClick={onDonateClick}
            className="bg-gradient-to-r from-primary-cyan to-primary-blue text-white font-black tracking-wide py-4 px-10 rounded-full hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group text-lg"
          >
            Donate
          </button>
          
          <a 
            href={VOLUNTEER_URL || '#'}
            onClick={handleJoinClick}
            target={VOLUNTEER_URL ? "_blank" : undefined}
            rel={VOLUNTEER_URL ? "noopener noreferrer" : undefined}
            className="glass text-ocean-deep dark:text-white font-bold tracking-wide py-4 px-10 rounded-full hover:bg-white/20 transition-all hover:shadow-lg transform hover:-translate-y-1 border border-ocean-deep/20 dark:border-white/30 text-lg backdrop-blur-md flex items-center justify-center cursor-pointer"
          >
            Join the Movement
          </a>
        </div>
      </div>
      
      {/* Optional: Subtle gradient overlay at the bottom for section blending */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-ocean-light dark:from-ocean-dark to-transparent pointer-events-none"></div>
    </section>
  );
};