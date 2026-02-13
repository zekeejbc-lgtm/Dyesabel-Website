import React, { useMemo } from 'react';

// Helper to generate random number in range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

export const BackgroundBubbles: React.FC = () => {
  // Generate bubbles once on mount to avoid re-renders causing jumps
  const bubbles = useMemo(() => {
    return [...Array(25)].map((_, i) => ({
      id: i,
      size: random(15, 60), // Varied sizes (15px to 60px)
      left: random(0, 100), // Random horizontal position
      riseDuration: random(15, 35), // How long to float up
      riseDelay: random(0, 20), // Random start time
      swayDuration: random(3, 8), // How fast to wobble
      swayDelay: random(0, 5), // Wobble offset
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-700 bg-gradient-to-b from-ocean-light via-[#b2dfdb] to-ocean-mint dark:from-ocean-deep dark:via-[#021017] dark:to-ocean-dark">
      
      {/* --- Large Gradient Blobs (Background Color Shifts) --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary-cyan/20 dark:bg-primary-blue/20 rounded-full blur-[100px] animate-float opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-primary-blue/20 dark:bg-primary-cyan/10 rounded-full blur-[120px] animate-float opacity-50" style={{ animationDelay: '3s' }}></div>

      {/* --- Cinematic Rising Bubbles --- */}
      <div className="absolute inset-0">
        {bubbles.map((bubble) => (
           <div
             key={bubble.id}
             className="absolute bottom-[-100px] animate-rise"
             style={{
               left: `${bubble.left}%`,
               width: `${bubble.size}px`,  
               height: `${bubble.size}px`, 
               animationDuration: `${bubble.riseDuration}s`,
               animationDelay: `-${bubble.riseDelay}s`, // Negative delay for instant start
             }}
           >
             {/* Inner Div: Handles the Sway and the Visuals */}
             <div 
               className="w-full h-full rounded-full animate-sway bg-gradient-to-tr from-white/20 to-transparent border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] dark:bg-white/5 dark:border-white/5"
               style={{
                 animationDuration: `${bubble.swayDuration}s`,
                 animationDelay: `-${bubble.swayDelay}s`,
               }}
             />
           </div>
        ))}
      </div>
    </div>
  );
};