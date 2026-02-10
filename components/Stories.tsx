import React from 'react';
import { Pillar } from '../types';
import { Leaf, BookOpen, Scale, Heart, Palette } from 'lucide-react';

// Extended data with details
export const pillarsData: (Pillar & { icon: React.ReactNode })[] = [
  {
    id: '1',
    title: 'Research and Education',
    excerpt: 'Conducting scientific studies and educational workshops to deepen understanding of our marine ecosystems.',
    description: 'We believe that conservation begins with understanding. Our Research and Education pillar focuses on gathering data-driven insights about our local ecosystems and disseminating this knowledge to the community. Through partnerships with academic institutions and experts, we conduct regular biodiversity assessments and translate complex scientific concepts into accessible educational programs for schools and local communities.',
    aim: 'To bridge the gap between scientific knowledge and community understanding, ensuring evidence-based conservation efforts.',
    imageUrl: 'https://picsum.photos/seed/research/600/400',
    icon: <BookOpen className="w-6 h-6 text-white" />,
    activities: [
      {
        id: 'a1-1',
        title: 'Marine Biodiversity Assessment 2023',
        date: 'August 2023',
        description: 'A comprehensive survey of coral reef health and fish population in key coastal areas of Davao del Norte.',
        imageUrl: 'https://picsum.photos/seed/activity1/500/300'
      },
      {
        id: 'a1-2',
        title: '"Sea Class" for Elementary Students',
        date: 'October 2023',
        description: 'An interactive workshop series teaching over 500 elementary students about marine life and plastic pollution.',
        imageUrl: 'https://picsum.photos/seed/activity2/500/300'
      }
    ]
  },
  {
    id: '2',
    title: 'Good Governance',
    excerpt: 'Advocating for transparent, accountable, and participatory decision-making in environmental management.',
    description: 'Environmental protection requires strong policy support and active civic engagement. Our Good Governance pillar works closely with Local Government Units (LGUs) to draft, review, and implement environmental ordinances. We empower citizens to participate in public consultations and monitor the enforcement of environmental laws.',
    aim: 'To empower local leaders and citizens with the tools and frameworks necessary for sustainable policy-making and enforcement.',
    imageUrl: 'https://picsum.photos/seed/governance/600/400',
    icon: <Scale className="w-6 h-6 text-white" />,
    activities: [
      {
        id: 'a2-1',
        title: 'Environmental Code Drafting Summit',
        date: 'July 2023',
        description: 'Facilitated a multi-sectoral summit to review and propose amendments to the local environmental code.',
        imageUrl: 'https://picsum.photos/seed/activity3/500/300'
      },
      {
        id: 'a2-2',
        title: 'Barangay Green Leadership Training',
        date: 'November 2023',
        description: 'Capacity building workshop for barangay officials on solid waste management implementation.',
        imageUrl: 'https://picsum.photos/seed/activity4/500/300'
      }
    ]
  },
  {
    id: '3',
    title: 'Sustainable Livelihood',
    excerpt: 'Empowering coastal communities with eco-friendly income opportunities that work in harmony with nature.',
    description: 'Conservation should not come at the cost of livelihood. We demonstrate that economic prosperity and environmental stewardship can go hand in hand. By introducing alternative livelihood programs such as ecotourism and sustainable aquaculture, we reduce reliance on extractive practices like dynamite fishing or illegal logging.',
    aim: 'To provide resilient economic alternatives that uplift communities while regenerating natural resources.',
    imageUrl: 'https://picsum.photos/seed/livelihood/600/400',
    icon: <Leaf className="w-6 h-6 text-white" />,
    activities: [
      {
        id: 'a3-1',
        title: 'Seaweed Farming Initiative',
        date: 'September 2023',
        description: 'Provided startup materials and training for 50 fisherfolk families to start sustainable seaweed farms.',
        imageUrl: 'https://picsum.photos/seed/activity5/500/300'
      },
      {
        id: 'a3-2',
        title: 'Upcycled Crafts Workshop',
        date: 'December 2023',
        description: 'Training women\'s groups to turn plastic waste into marketable bags and accessories.',
        imageUrl: 'https://picsum.photos/seed/activity6/500/300'
      }
    ]
  },
  {
    id: '4',
    title: 'Community Health',
    excerpt: 'Promoting public health and well-being through clean environments, sanitation, and access to safe resources.',
    description: 'A healthy environment is the foundation of a healthy community. Pollution and environmental degradation directly impact public health. Our initiatives focus on sanitation, waste management, and securing clean water sources to prevent waterborne diseases and improve the overall quality of life.',
    aim: 'To ensure that environmental health translates directly to improved human health and well-being.',
    imageUrl: 'https://picsum.photos/seed/health/600/400',
    icon: <Heart className="w-6 h-6 text-white" />,
    activities: [
      {
        id: 'a4-1',
        title: 'Coastal Cleanup & Sanitation Drive',
        date: 'Monthly',
        description: 'Regular community-led cleanups combined with dengue prevention information campaigns.',
        imageUrl: 'https://picsum.photos/seed/activity7/500/300'
      },
      {
        id: 'a4-2',
        title: 'Clean Water Access Project',
        date: 'January 2024',
        description: 'Installation of community water filtration systems in remote coastal sitios.',
        imageUrl: 'https://picsum.photos/seed/activity8/500/300'
      }
    ]
  },
  {
    id: '5',
    title: 'Culture and Arts',
    excerpt: 'Celebrating local heritage and raising environmental awareness through creative expression and storytelling.',
    description: 'Art has the power to move hearts and change minds. We leverage culture and the arts to tell the story of our environment, reviving indigenous wisdom regarding nature conservation and engaging the youth through music, visual arts, and theater.',
    aim: 'To use creative mediums to advocate for nature preservation and celebrate our cultural connection to the environment.',
    imageUrl: 'https://picsum.photos/seed/arts/600/400',
    icon: <Palette className="w-6 h-6 text-white" />,
    activities: [
      {
        id: 'a5-1',
        title: '"Dyesabel" Theater Production',
        date: 'February 2024',
        description: 'A musical play performed by youth volunteers highlighting marine conservation issues.',
        imageUrl: 'https://picsum.photos/seed/activity9/500/300'
      },
      {
        id: 'a5-2',
        title: 'Ocean Mural Painting Contest',
        date: 'March 2024',
        description: 'Beautifying public spaces with murals that educate passersby about local marine species.',
        imageUrl: 'https://picsum.photos/seed/activity10/500/300'
      }
    ]
  }
];

interface PillarsProps {
  onSelectPillar: (pillar: Pillar) => void;
}

export const Pillars: React.FC<PillarsProps> = ({ onSelectPillar }) => {
  return (
    <section id="pillars" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20 reveal">
          <h3 className="text-sm font-bold text-primary-blue dark:text-primary-cyan uppercase tracking-[0.3em] mb-4">What Drives Us</h3>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-ocean-deep dark:text-white drop-shadow-lg">Our Core Pillars</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {pillarsData.map((pillar, index) => (
            <div 
              key={pillar.id} 
              onClick={() => onSelectPillar(pillar)}
              className={`glass-card rounded-2xl overflow-hidden group flex flex-col h-full transform hover:-translate-y-3 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(34,211,238,0.3)] reveal reveal-delay-${(index + 1) * 100} cursor-pointer`}
            >
              {/* Image Section */}
              <div className="relative h-48 md:h-36 lg:h-48 overflow-hidden">
                <img 
                  src={pillar.imageUrl} 
                  alt={pillar.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/90 via-transparent to-transparent opacity-90"></div>
                
                {/* Icon Badge */}
                <div className="absolute bottom-4 left-4 bg-gradient-to-br from-primary-cyan to-primary-blue p-2.5 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300 ring-2 ring-white/20">
                  {pillar.icon}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 flex flex-col flex-grow text-center md:text-left relative">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                <h3 className="text-xl md:text-lg lg:text-xl font-bold text-ocean-deep dark:text-white mb-3 leading-tight group-hover:text-primary-blue dark:group-hover:text-primary-cyan transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-ocean-deep/70 dark:text-gray-300 text-sm leading-relaxed flex-grow font-medium">
                  {pillar.excerpt}
                </p>
                <div className="mt-4 pt-4 border-t border-ocean-deep/10 dark:border-white/10 text-xs font-bold text-primary-blue dark:text-primary-cyan uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                  Read More →
                </div>
              </div>
              
              {/* Decorative bottom bar */}
              <div className="h-1.5 w-0 bg-gradient-to-r from-primary-cyan to-primary-blue group-hover:w-full transition-all duration-700 ease-out"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};