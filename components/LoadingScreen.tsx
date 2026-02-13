import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ocean-dark text-white overflow-hidden font-sans">
      {/* Deep Ocean Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep via-[#021017] to-ocean-dark opacity-95"></div>
      
      {/* Ambient Center Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-cyan/10 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container System */}
        <div className="relative w-36 h-36 mb-10 flex items-center justify-center">
           {/* Spinning Cyan/Blue Gradients (Energy Rings) - No Background, Just Border */}
           <div className="absolute inset-0 rounded-full border-2 border-t-primary-cyan border-r-transparent border-b-primary-blue border-l-transparent animate-[spin_3s_linear_infinite]"></div>
           <div className="absolute inset-3 rounded-full border-2 border-t-transparent border-r-primary-cyan/40 border-b-transparent border-l-primary-blue/40 animate-[spin_4s_linear_infinite]" style={{ animationDirection: 'reverse' }}></div>
           
           {/* Logo Mechanism (Matches Header: Relative Container + Blur Glow + Rounded Image) */}
           <div className="absolute inset-0 flex items-center justify-center">
              {/* Pulse Glow (Similar to Header hover effect, but active for loading) */}
              <div className="absolute w-24 h-24 bg-primary-cyan/20 rounded-full blur-xl animate-pulse"></div>
              
              {/* Actual Logo - Same Styling as Header (No Background, No Float) */}
              <img 
                src="https://i.imgur.com/CQCKjQM.png" 
                className="relative w-20 h-20 object-contain rounded-full drop-shadow-md z-10" 
                alt="Dyesabel Logo"
              />
           </div>
        </div>

        {/* Typography */}
        <h2 className="text-5xl font-lobster text-transparent bg-clip-text bg-gradient-to-r from-primary-cyan via-white to-primary-cyan animate-pulse tracking-wide drop-shadow-lg pb-2">
          Dyesabel
        </h2>
        <div className="flex items-center gap-3 mt-4">
           <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary-cyan/50"></div>
           <p className="text-primary-cyan/80 text-[10px] font-bold uppercase tracking-[0.4em] antialiased">
             Philippines
           </p>
           <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary-cyan/50"></div>
        </div>
      </div>
    </div>
  );
};