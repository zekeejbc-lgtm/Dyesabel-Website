import React from 'react';
import { APP_CONFIG } from '../config';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-ocean-dark font-sans text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep via-[#021017] to-ocean-dark opacity-95" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-cyan/10 blur-[100px] animate-pulse-slow" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-10 flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-2 border-b-primary-blue border-l-transparent border-r-transparent border-t-primary-cyan" />
          <div className="absolute inset-3 animate-[spin_4s_linear_infinite] rounded-full border-2 border-b-transparent border-l-primary-blue/40 border-r-primary-cyan/40 border-t-transparent" style={{ animationDirection: 'reverse' }} />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute h-24 w-24 animate-pulse rounded-full bg-primary-cyan/20 blur-xl" />
            <img
              src={APP_CONFIG.logoUrl}
              className="relative z-10 h-20 w-20 rounded-full object-contain drop-shadow-md"
              alt="Dyesabel Logo"
            />
          </div>
        </div>

        <h2 className="bg-gradient-to-r from-primary-cyan via-white to-primary-cyan bg-clip-text pb-2 font-lobster text-5xl tracking-wide text-transparent drop-shadow-lg animate-pulse">
          Dyesabel
        </h2>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary-cyan/50" />
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary-cyan/80 antialiased">
            Philippines
          </p>
          <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary-cyan/50" />
        </div>
      </div>
    </div>
  );
};
