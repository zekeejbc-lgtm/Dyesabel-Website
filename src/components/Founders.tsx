import React, { useState, useEffect } from 'react';
import { Founder } from '../types';
import { Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/DriveService';

// Fallback data (Initial state)
const initialFounders: Founder[] = [
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

interface FoundersProps {
  onEdit?: () => void;
}

export const Founders: React.FC<FoundersProps> = ({ onEdit }) => {
  const { user } = useAuth();
  const [founders, setFounders] = useState<Founder[]>(initialFounders);

  // Fetch Data from Backend
  useEffect(() => {
    const fetchFounders = async () => {
      try {
        const result = await DataService.loadFounders();
        if (result.success && result.founders && result.founders.length > 0) {
          setFounders(result.founders);
        }
      } catch (error) {
        console.error('Failed to load founders:', error);
      }
    };

    fetchFounders();
  }, []);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 mb-16">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-center text-ocean-deep dark:text-white drop-shadow-md reveal">
            Meet the Founders
          </h2>
          {onEdit && (user?.role === 'admin' || user?.role === 'editor') && (
            <button 
              onClick={onEdit}
              className="flex items-center gap-2 bg-primary-blue hover:bg-primary-cyan text-white font-medium px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Edit size={18} />
              <span>Edit Founders</span>
            </button>
          )}
        </div>

        {/* Dynamic Layout Container */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-10 max-w-7xl mx-auto">
          {founders.map((founder, index) => (
            <div 
              key={founder.id} 
              className={`glass-card flex flex-col md:flex-row items-center md:items-start gap-6 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] reveal reveal-delay-${(index + 1) * 200} w-full md:max-w-xl flex-1 min-w-[300px]`}
            >
              {/* Image Container */}
              <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 relative group mx-auto md:mx-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-cyan to-primary-blue rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-500 animate-pulse-slow"></div>
                <img 
                  src={founder.imageUrl} 
                  alt={founder.name} 
                  className="w-full h-full object-cover rounded-full border-[3px] border-white/30 dark:border-white/20 shadow-xl transform group-hover:scale-105 transition-transform duration-500 relative z-10"
                />
              </div>
              
              {/* Text Content */}
              <div className="text-center md:text-left flex-1">
                <h3 className="text-2xl font-bold text-ocean-deep dark:text-white mb-1">{founder.name}</h3>
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-primary-blue to-primary-cyan font-bold text-xs md:text-sm uppercase tracking-widest mb-3">
                  {founder.role}
                </p>
                <p className="text-ocean-deep/80 dark:text-gray-300 leading-relaxed text-sm font-medium">
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
