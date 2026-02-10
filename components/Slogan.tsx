import React from 'react';

export const Slogan: React.FC = () => {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-5xl mx-auto reveal glass-card rounded-3xl p-10 md:p-16 shadow-2xl border border-white/20 dark:border-white/10">
          
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-ocean-deep dark:text-white leading-tight mb-2">
            <span className="font-lobster font-normal text-5xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary-blue to-primary-cyan">
              Dyesabel
            </span>
          </h2>
          
          <div className="text-xl md:text-3xl lg:text-4xl font-serif italic text-ocean-deep/80 dark:text-white/80 mt-4 block reveal reveal-delay-200">
            "for the People, Planet, and the Philippines"
          </div>
          
          <div className="w-32 h-1.5 bg-gradient-to-r from-primary-cyan to-primary-blue mx-auto mt-10 rounded-full reveal reveal-delay-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
          
          <p className="mt-8 text-ocean-deep dark:text-gray-300 max-w-3xl mx-auto text-lg md:text-xl reveal reveal-delay-400 font-medium leading-loose">
            We are dedicated to fostering a <span className="text-primary-blue dark:text-primary-cyan font-bold">sustainable future</span> by empowering the youth and protecting our precious natural resources across the archipelago.
          </p>
        </div>
      </div>
    </section>
  );
};