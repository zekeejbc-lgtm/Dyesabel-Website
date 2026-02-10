import React from 'react';
import { Users, Building2, Globe2, Flag } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  logo: string;
}

interface PartnerCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  partners: Partner[];
}

// Data structure designed to be easily updated by admins
const partnerCategories: PartnerCategory[] = [
  {
    id: 'coalitions',
    title: 'Coalitions',
    icon: <Users className="w-6 h-6" />,
    partners: [
      { id: 'c1', name: 'Youth for Nature', logo: 'https://ui-avatars.com/api/?name=Youth+Nature&background=22d3ee&color=fff' },
      { id: 'c2', name: 'Mindanao Green Alliance', logo: 'https://ui-avatars.com/api/?name=Mindanao+Green&background=2563eb&color=fff' },
    ]
  },
  {
    id: 'gov',
    title: 'Government Partners',
    icon: <Building2 className="w-6 h-6" />,
    partners: [
      { id: 'g1', name: 'DENR', logo: 'https://ui-avatars.com/api/?name=DENR&background=059669&color=fff' },
      { id: 'g2', name: 'Provincial Gov. Davao', logo: 'https://ui-avatars.com/api/?name=Davao+Gov&background=db2777&color=fff' },
      { id: 'g3', name: 'LGU Tagum City', logo: 'https://ui-avatars.com/api/?name=Tagum&background=d97706&color=fff' },
    ]
  },
  {
    id: 'ngo-nat',
    title: 'Non-Government Partners (National)',
    icon: <Flag className="w-6 h-6" />,
    partners: [
      { id: 'n1', name: 'Save PH Seas', logo: 'https://ui-avatars.com/api/?name=Save+PH+Seas&background=0891b2&color=fff' },
      { id: 'n2', name: 'Masungi Georeserve', logo: 'https://ui-avatars.com/api/?name=Masungi&background=65a30d&color=fff' },
    ]
  },
  {
    id: 'ngo-int',
    title: 'Non-Government Partners (International)',
    icon: <Globe2 className="w-6 h-6" />,
    partners: [
      { id: 'i1', name: 'WWF', logo: 'https://ui-avatars.com/api/?name=WWF&background=1f2937&color=fff' },
      { id: 'i2', name: 'Oceana', logo: 'https://ui-avatars.com/api/?name=Oceana&background=2563eb&color=fff' },
    ]
  }
];

export const Partners: React.FC = () => {
  return (
    <section id="partners" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 reveal">
           <h3 className="text-sm font-bold text-primary-blue dark:text-primary-cyan uppercase tracking-[0.3em] mb-4">Together We Are Stronger</h3>
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-ocean-deep dark:text-white drop-shadow-lg mb-6">
            Our Partners
          </h2>
          <p className="text-lg text-ocean-deep/70 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            Collaborating with diverse organizations across sectors to amplify our impact and drive sustainable change.
          </p>
        </div>

        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          {partnerCategories.map((category, index) => (
             <div 
                key={category.id}
                className={`glass-card rounded-2xl p-6 md:p-8 border border-white/10 reveal reveal-delay-${(index + 1) * 100}`}
             >
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-ocean-deep/10 dark:border-white/10">
                   <div className="p-3 rounded-full bg-gradient-to-br from-primary-cyan/20 to-primary-blue/20 text-primary-blue dark:text-primary-cyan shadow-sm">
                      {category.icon}
                   </div>
                   <h3 className="text-xl md:text-2xl font-bold text-ocean-deep dark:text-white">
                      {category.title}
                   </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {category.partners.map((partner) => (
                    <div 
                      key={partner.id} 
                      className="group flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-primary-cyan/30 cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-full mb-3 shadow-md group-hover:scale-110 transition-transform duration-300 overflow-hidden bg-white/20">
                        <img 
                            src={partner.logo} 
                            alt={partner.name}
                            className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-semibold text-center text-ocean-deep/80 dark:text-gray-200 group-hover:text-primary-blue dark:group-hover:text-primary-cyan transition-colors leading-tight">
                        {partner.name}
                      </span>
                    </div>
                  ))}
                  
                  {/* Visual placeholder for "Add New" action (concept only) */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-ocean-deep/10 dark:border-white/10 opacity-50 hover:opacity-100 transition-opacity cursor-pointer min-h-[140px]">
                    <span className="text-3xl font-light text-ocean-deep/40 dark:text-white/40 mb-2">+</span>
                    <span className="text-xs font-medium text-ocean-deep/40 dark:text-white/40 text-center">Join Us</span>
                  </div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </section>
  );
};