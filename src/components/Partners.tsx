import React from 'react';
import { Users, Building2, Globe2, Flag, Edit, Mail, Handshake } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Interfaces matching your backend structure
export interface Partner {
  id: string;
  name: string;
  logo: string;
}

export interface PartnerCategory {
  id: string;
  title: string;
  icon?: React.ReactNode;
  partners: Partner[];
}

interface PartnersProps {
  partners?: PartnerCategory[]; // ✅ Recieved from App.tsx
  isLoading?: boolean;         // ✅ Loading State
  onEdit?: () => void;
  refreshTrigger?: number;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  coalitions: <Users className="w-6 h-6" />,
  gov: <Building2 className="w-6 h-6" />,
  'ngo-nat': <Flag className="w-6 h-6" />,
  'ngo-int': <Globe2 className="w-6 h-6" />,
  default: <Users className="w-6 h-6" />
};

export const Partners: React.FC<PartnersProps> = ({ partners = [], isLoading = false, onEdit }) => {
  const { user } = useAuth();

  const handleJoinPartner = () => {
    const recipient = "dyesabel.system+partnerships@gmail.com";
    const subject = "Partnership Inquiry: [Insert Organization Name]";
    const bodyContent = `Hi Dyesabel Team,\n\nWe are interested in partnering with you!\n\n--- PARTNER DETAILS ---\nOrganization Name: \nContact Person: \nContact Number: \n\n--- PARTNERSHIP SCOPE ---\nWhich Chapter do you wish to partner with? \n\n--- MESSAGE ---\n[Please describe how you would like to collaborate]`;

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyContent)}`;
      window.open(gmailUrl, '_blank');
    } else {
      const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyContent)}`;
      window.location.href = mailtoUrl;
    }
  };

  const getIcon = (category: PartnerCategory) => {
    if (category.icon) return category.icon;
    return ICON_MAP[category.id] || ICON_MAP['default'];
  };

  return (
    <section id="partners" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 reveal flex flex-col items-center">
           <h3 className="text-sm font-bold text-primary-blue dark:text-primary-cyan uppercase tracking-[0.3em] mb-4">
             Together We Are Stronger
           </h3>
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-ocean-deep dark:text-white drop-shadow-lg mb-6">
            Our Partners
          </h2>
          <p className="text-lg text-ocean-deep/70 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            Collaborating with diverse organizations across sectors to amplify our impact and drive sustainable change.
          </p>

          {onEdit && (user?.role === 'admin' || user?.role === 'editor') && (
            <button 
              onClick={onEdit}
              className="mt-6 flex items-center gap-2 bg-primary-blue hover:bg-primary-cyan text-white font-medium px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Edit size={18} />
              <span>Edit Partners</span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          
          {/* ✅ SKELETON LOADING STATE */}
          {isLoading ? (
            // Render 2 fake category cards
            [1, 2].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 md:p-8 border border-white/10 animate-pulse">
                {/* Skeleton Header */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                  <div className="w-12 h-12 rounded-full bg-white/20"></div>
                  <div className="h-6 w-48 bg-white/20 rounded"></div>
                </div>
                {/* Skeleton Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((_, j) => (
                    <div key={j} className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-transparent">
                      <div className="w-16 h-16 rounded-full bg-white/20 mb-3"></div>
                      <div className="h-4 w-24 bg-white/20 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : partners.length === 0 ? (
            // Empty State
            <div className="glass-card rounded-2xl p-12 border border-white/10 text-center flex flex-col items-center justify-center animate-fade-in">
               <Handshake className="w-20 h-20 text-primary-blue dark:text-primary-cyan mb-6 opacity-80" />
               <h3 className="text-2xl font-bold text-ocean-deep dark:text-white mb-2">
                 Be Our First Partner
               </h3>
               <p className="text-ocean-deep/60 dark:text-gray-300 max-w-md mb-8">
                 We are looking for organizations to collaborate with. Join our network and help us protect our oceans.
               </p>
               <button 
                 onClick={handleJoinPartner}
                 className="group flex items-center gap-3 bg-gradient-to-r from-primary-blue to-primary-cyan text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
               >
                 <Mail className="w-5 h-5" />
                 <span>Send Partnership Inquiry</span>
               </button>
            </div>
          ) : (
            // Real Data
            partners.map((category, index) => (
             <div 
                key={category.id}
                className={`glass-card rounded-2xl p-6 md:p-8 border border-white/10 reveal reveal-delay-${(index + 1) * 100}`}
             >
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-ocean-deep/10 dark:border-white/10">
                   <div className="p-3 rounded-full bg-gradient-to-br from-primary-cyan/20 to-primary-blue/20 text-primary-blue dark:text-primary-cyan shadow-sm">
                      {getIcon(category)}
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
                        <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-semibold text-center text-ocean-deep/80 dark:text-gray-200 group-hover:text-primary-blue dark:group-hover:text-primary-cyan transition-colors leading-tight">
                        {partner.name}
                      </span>
                    </div>
                  ))}
                  
                  <div 
                    onClick={handleJoinPartner}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-ocean-deep/10 dark:border-white/10 opacity-60 hover:opacity-100 hover:bg-white/5 hover:border-primary-cyan/50 transition-all cursor-pointer min-h-[140px] group"
                  >
                    <span className="text-3xl font-light text-ocean-deep/40 dark:text-white/40 mb-2 group-hover:text-primary-cyan transition-colors">+</span>
                    <span className="text-xs font-bold text-ocean-deep/40 dark:text-white/40 text-center group-hover:text-primary-cyan transition-colors uppercase tracking-wider">Join Us</span>
                  </div>
                </div>
             </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};