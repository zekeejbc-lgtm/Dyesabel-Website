import React from 'react';

export const BackgroundBubbles: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-700 bg-gradient-to-b from-ocean-light via-[#b2dfdb] to-ocean-mint dark:from-ocean-deep dark:via-[#021017] dark:to-ocean-dark">
      
      {/* --- Large Gradient Blobs (Background Color Shifts) --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary-cyan/20 dark:bg-primary-blue/20 rounded-full blur-[100px] animate-float opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-primary-blue/20 dark:bg-primary-cyan/10 rounded-full blur-[120px] animate-float opacity-50" style={{ animationDelay: '3s' }}></div>

      {/* --- Rising Bubbles --- */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
           <div
             key={i}
             className="absolute bg-white/30 dark:bg-white/10 rounded-full blur-[1px] shadow-[inset_0_0_6px_rgba(255,255,255,0.4)] animate-rise"
             style={{
               left: `${Math.random() * 100}%`,
               width: `${Math.random() * 25 + 5}px`,  
               height: `${Math.random() * 25 + 5}px`, 
               animationDuration: `${Math.random() * 10 + 15}s`, // Slower, smoother rise
               /* ✅ KEY FIX: Negative delay makes them appear INSTANTLY */
               animationDelay: `-${Math.random() * 20}s`, 
               bottom: '-50px',
             }}
           />
        ))}
      </div>
    </div>
  );
};