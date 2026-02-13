import React from 'react';
import { Facebook, Twitter, Instagram, Mail, MapPin, Phone } from 'lucide-react';

interface FooterProps {
  onDonateClick?: (e: React.MouseEvent) => void;
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onDonateClick, onNavigate }) => {
  const handleLinkClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    onNavigate(sectionId);
  };

  return (
    <footer className="bg-ocean-deep/80 backdrop-blur-xl text-white pt-20 pb-10 border-t border-white/5 relative z-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-1 reveal">
            <div className="flex items-center gap-4 mb-6 group">
               <div className="relative">
                  <div className="absolute inset-0 bg-primary-cyan rounded-full blur-md opacity-20 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <img 
                      src="https://i.imgur.com/CQCKjQM.png" 
                      alt="Dyesabel Philippines Logo" 
                      className="relative h-14 w-14 object-contain rounded-full ring-2 ring-white/10 hover:rotate-12 transition-transform duration-500"
                    />
               </div>
               <span className="font-sans font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-cyan">
                 DYESABEL PH
                </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 font-medium">
              Developing the Youth with Environmentally Sustainable Advocacies Building and Empowering Lives.
            </p>
            <div className="flex space-x-5">
              <a href="https://www.facebook.com/dyesabel.ph" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-cyan transition-colors transform hover:-translate-y-1 hover:scale-110 duration-300">
                <Facebook size={22} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-cyan transition-colors transform hover:-translate-y-1 hover:scale-110 duration-300">
                <Twitter size={22} />
              </a>
              <a href="https://www.instagram.com/dyesabel.ph/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-cyan transition-colors transform hover:-translate-y-1 hover:scale-110 duration-300">
                <Instagram size={22} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="reveal reveal-delay-100">
            <h4 className="font-sans font-bold text-lg mb-8 text-white tracking-wide">Quick Links</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li>
                <a href="#home" onClick={(e) => handleLinkClick(e, 'home')} className="hover:text-primary-cyan transition-colors hover:translate-x-2 inline-block duration-300">Home</a>
              </li>
              <li>
                <a href="#pillars" onClick={(e) => handleLinkClick(e, 'pillars')} className="hover:text-primary-cyan transition-colors hover:translate-x-2 inline-block duration-300">Our Pillars</a>
              </li>
              <li>
                <a href="#about" onClick={(e) => handleLinkClick(e, 'about')} className="hover:text-primary-cyan transition-colors hover:translate-x-2 inline-block duration-300">About Us</a>
              </li>
              <li>
                <a href="https://forms.gle/W6WVpftGDwM7fUm19" target="_blank" rel="noopener noreferrer" className="hover:text-primary-cyan transition-colors hover:translate-x-2 inline-block duration-300">Volunteer</a>
              </li>
              <li>
                <a 
                  href="#donate" 
                  onClick={(e) => {
                    if (onDonateClick) {
                      e.preventDefault();
                      onDonateClick(e);
                    }
                  }}
                  className="hover:text-primary-cyan transition-colors hover:translate-x-2 inline-block duration-300"
                >
                  Donate
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="reveal reveal-delay-200">
            <h4 className="font-sans font-bold text-lg mb-8 text-white tracking-wide">Contact Us</h4>
            <ul className="space-y-5 text-gray-400 text-sm font-medium">
              <li className="flex items-start gap-4 group cursor-pointer">
                <MapPin size={20} className="mt-0.5 flex-shrink-0 text-primary-blue group-hover:text-primary-cyan transition-colors" />
                <span className="group-hover:text-white transition-colors">Davao, Philippines</span>
              </li>
              <li className="flex items-center gap-4 group cursor-pointer">
                <Phone size={20} className="flex-shrink-0 text-primary-blue group-hover:text-primary-cyan transition-colors" />
                <span className="group-hover:text-white transition-colors">+63 912 345 6789</span>
              </li>
              <li className="flex items-center gap-4 group cursor-pointer">
                <Mail size={20} className="flex-shrink-0 text-primary-blue group-hover:text-primary-cyan transition-colors" />
                <span className="group-hover:text-white transition-colors">projectdyesabel@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="reveal reveal-delay-300">
            <h4 className="font-sans font-bold text-lg mb-8 text-white tracking-wide">Newsletter</h4>
            <p className="text-gray-400 text-sm mb-6 font-medium">Subscribe to our newsletter for eco-updates.</p>
            <div className="flex flex-col gap-3">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="bg-white/5 text-white placeholder-gray-500 px-5 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-cyan border border-white/10 transition-all hover:bg-white/10"
              />
              <button className="bg-gradient-to-r from-primary-cyan to-primary-blue hover:from-primary-blue hover:to-primary-cyan text-white font-bold py-3 px-5 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transform active:scale-95">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm font-medium">
          <p>&copy; {new Date().getFullYear()} Dyesabel Philippines, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};