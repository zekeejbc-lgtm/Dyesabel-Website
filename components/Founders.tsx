import React from 'react';
import { Founder } from '../types';

const founders: Founder[] = [
  {
    id: '1',
    name: 'Maria Clara Santos',
    role: 'Co-Founder & Executive Director',
    bio: 'An environmental scientist with over 15 years of experience in marine conservation. Maria leads our strategic initiatives and partnerships.',
    imageUrl: 'https://picsum.photos/seed/person1/400/400'
  },
  {
    id: '2',
    name: 'Juan Dela Cruz',
    role: 'Co-Founder & Director of Advocacy',
    bio: 'A passionate youth leader and educator. Juan focuses on our grassroots community engagement and educational programs.',
    imageUrl: 'https://picsum.photos/seed/person2/400/400'
  }
];

export const Founders: React.FC = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-center text-ocean-deep dark:text-white drop-shadow-md mb-20 reveal">
          Meet the Founders
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {founders.map((founder, index) => (
            <div 
              key={founder.id} 
              className={`glass-card flex flex-col md:flex-row items-center md:items-start gap-8 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] reveal reveal-delay-${(index + 1) * 200}`}
            >
              <div className="w-36 h-36 flex-shrink-0 relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-cyan to-primary-blue rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-500 animate-pulse-slow"></div>
                <img 
                  src={founder.imageUrl} 
                  alt={founder.name} 
                  className="w-full h-full object-cover rounded-full border-[3px] border-white/30 dark:border-white/20 shadow-xl transform group-hover:scale-105 transition-transform duration-500 relative z-10"
                />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-ocean-deep dark:text-white mb-2">{founder.name}</h3>
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-primary-blue to-primary-cyan font-bold text-sm uppercase tracking-widest mb-4">{founder.role}</p>
                <p className="text-ocean-deep/80 dark:text-gray-300 leading-relaxed text-sm md:text-base font-medium">
                  {founder.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};