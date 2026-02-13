import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Smartphone, QrCode, Copy, CheckCircle, Heart, Globe, TrendingUp, ShieldCheck } from 'lucide-react';

interface DonatePageProps {
  onBack: () => void;
}

interface RecentDonation {
  id: string;
  name: string;
  amount: string;
  time: string;
  method: string;
}

const recentDonations: RecentDonation[] = [
  { id: '1', name: 'Anonymous', amount: '₱500.00', time: '2 mins ago', method: 'GCash' },
  { id: '2', name: 'Maria C.', amount: '₱1,000.00', time: '15 mins ago', method: 'Maya' },
  { id: '3', name: 'John D.', amount: '$50.00', time: '1 hour ago', method: 'Debit Card' },
  { id: '4', name: 'Sarah L.', amount: '₱2,500.00', time: '3 hours ago', method: 'GoTyme' },
  { id: '5', name: 'Tech Solutions Inc.', amount: '₱10,000.00', time: '5 hours ago', method: 'Bank Transfer' },
];

export const DonatePage: React.FC<DonatePageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'national' | 'international'>('national');
  const [selectedLocalMethod, setSelectedLocalMethod] = useState<'gcash' | 'maya' | 'gotyme'>('gcash');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const localMethods = {
    gcash: {
      name: 'GCash',
      color: 'bg-blue-600',
      number: '0917 123 4567',
      accountName: 'Dyesabel Ph Inc.',
      qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=09171234567'
    },
    maya: {
      name: 'Maya',
      color: 'bg-green-600',
      number: '0918 987 6543',
      accountName: 'Dyesabel Philippines',
      qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=09189876543'
    },
    gotyme: {
      name: 'GoTyme',
      color: 'bg-indigo-600',
      number: '0123 4567 8901',
      accountName: 'Dyesabel Ph Treasury',
      qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=012345678901'
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 relative">
      {/* Background elements inherited from App.tsx */}
      
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={onBack}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-ocean-deep dark:text-white transition-all hover:-translate-x-1"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl md:text-5xl font-black text-ocean-deep dark:text-white tracking-tight">
            Support Our Cause
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Donation Section */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Payment Method Selector */}
            <div className="glass-card rounded-3xl p-1 overflow-hidden flex relative">
              <button 
                onClick={() => setActiveTab('national')}
                className={`flex-1 py-4 text-center font-bold text-lg rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'national' ? 'bg-gradient-to-r from-primary-cyan to-primary-blue text-white shadow-lg' : 'text-ocean-deep/60 dark:text-gray-400 hover:bg-white/5'}`}
              >
                <Smartphone size={20} />
                National (PH)
              </button>
              <button 
                onClick={() => setActiveTab('international')}
                className={`flex-1 py-4 text-center font-bold text-lg rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'international' ? 'bg-gradient-to-r from-primary-blue to-purple-600 text-white shadow-lg' : 'text-ocean-deep/60 dark:text-gray-400 hover:bg-white/5'}`}
              >
                <CreditCard size={20} />
                International
              </button>
            </div>

            {/* Donation Content Area */}
            <div className="glass-card rounded-3xl p-6 md:p-10 min-h-[500px] border border-white/20">
              
              {activeTab === 'national' ? (
                <div className="space-y-8 animate-fadeIn">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-ocean-deep dark:text-white mb-2">Scan or Transfer</h2>
                    <p className="text-ocean-deep/60 dark:text-gray-300">Choose your preferred local wallet</p>
                  </div>

                  {/* Wallet Toggles */}
                  <div className="flex justify-center gap-4 flex-wrap">
                    {(Object.keys(localMethods) as Array<keyof typeof localMethods>).map((method) => (
                      <button
                        key={method}
                        onClick={() => setSelectedLocalMethod(method)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                          selectedLocalMethod === method 
                            ? `${localMethods[method].color} text-white shadow-lg scale-105 ring-2 ring-white/20` 
                            : 'bg-white/10 text-ocean-deep dark:text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {localMethods[method].name}
                      </button>
                    ))}
                  </div>

                  {/* Active Wallet Details */}
                  <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 border border-white/10 backdrop-blur-sm">
                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-xl shadow-xl transform hover:scale-105 transition-transform duration-300">
                      <img 
                        src={localMethods[selectedLocalMethod].qr} 
                        alt={`${localMethods[selectedLocalMethod].name} QR Code`}
                        className="w-48 h-48 md:w-56 md:h-56 object-contain"
                      />
                      <div className="text-center mt-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Scan to Pay</div>
                    </div>

                    {/* Account Info */}
                    <div className="flex-1 space-y-6 w-full">
                      <div>
                        <label className="text-xs font-bold text-ocean-deep/50 dark:text-gray-400 uppercase tracking-wider mb-1 block">Account Name</label>
                        <div className="text-xl font-bold text-ocean-deep dark:text-white">{localMethods[selectedLocalMethod].accountName}</div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-ocean-deep/50 dark:text-gray-400 uppercase tracking-wider mb-1 block">Account Number</label>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl md:text-3xl font-mono font-bold text-primary-blue dark:text-primary-cyan tracking-wider">
                            {localMethods[selectedLocalMethod].number}
                          </span>
                          <button 
                            onClick={() => handleCopy(localMethods[selectedLocalMethod].number, 'number')}
                            className="p-2 rounded-lg bg-white/10 hover:bg-primary-cyan/20 text-ocean-deep dark:text-white transition-colors relative"
                            title="Copy Number"
                          >
                            {copiedField === 'number' ? <CheckCircle size={20} className="text-green-500" /> : <Copy size={20} />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-ocean-deep/60 dark:text-gray-400 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                         <ShieldCheck size={16} className="text-yellow-500" />
                         <span>Please save a screenshot of your transaction for reference.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-fadeIn h-full flex flex-col justify-center">
                   <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-ocean-deep dark:text-white mb-2">International Donation</h2>
                    <p className="text-ocean-deep/60 dark:text-gray-300">Secure payment via Debit/Credit Card</p>
                  </div>

                  {/* Card Simulation */}
                  <div className="max-w-md mx-auto w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                     <div className="flex justify-between items-start mb-8">
                        <CreditCard size={32} className="text-gray-300" />
                        <span className="font-mono text-xl font-bold italic opacity-70">VISA/MC</span>
                     </div>
                     <div className="space-y-6 relative z-10">
                        <div className="space-y-1">
                           <div className="text-xs text-gray-400 uppercase">Card Number</div>
                           <div className="text-xl tracking-widest font-mono">**** **** **** ****</div>
                        </div>
                        <div className="flex justify-between">
                           <div>
                              <div className="text-xs text-gray-400 uppercase">Holder Name</div>
                              <div className="text-sm font-medium">DONOR NAME</div>
                           </div>
                           <div>
                              <div className="text-xs text-gray-400 uppercase">Expires</div>
                              <div className="text-sm font-medium">MM/YY</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="max-w-md mx-auto w-full space-y-4">
                     <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                        <Globe size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-ocean-deep/80 dark:text-gray-300">
                           <span className="font-bold block text-blue-500 mb-1">Bank Transfer (Swift)</span>
                           Use the following details for international wire transfers.
                        </div>
                     </div>
                     
                     <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-ocean-deep/60 dark:text-gray-400">Bank Name</span>
                           <span className="font-bold text-ocean-deep dark:text-white">Bank of the Philippine Islands (BPI)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-ocean-deep/60 dark:text-gray-400">Account Name</span>
                           <span className="font-bold text-ocean-deep dark:text-white">Dyesabel Philippines Inc.</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-ocean-deep/60 dark:text-gray-400">SWIFT Code</span>
                           <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-ocean-deep dark:text-white">BOPIPHMM</span>
                              <Copy size={14} className="cursor-pointer hover:text-primary-cyan" onClick={() => handleCopy('BOPIPHMM', 'swift')} />
                           </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-ocean-deep/60 dark:text-gray-400">Account Number</span>
                           <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-ocean-deep dark:text-white">1234-5678-90</span>
                              <Copy size={14} className="cursor-pointer hover:text-primary-cyan" onClick={() => handleCopy('1234-5678-90', 'iban')} />
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Where Money Goes */}
            <div className="glass-card p-6 rounded-3xl border border-white/20">
              <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="text-primary-cyan" />
                Where your donation goes
              </h3>
              
              <div className="space-y-5">
                {[
                  { label: 'Conservation Projects', pct: '40%', color: 'bg-primary-cyan' },
                  { label: 'Educational Workshops', pct: '30%', color: 'bg-primary-blue' },
                  { label: 'Community Livelihood', pct: '20%', color: 'bg-purple-500' },
                  { label: 'Operations & Research', pct: '10%', color: 'bg-pink-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm font-bold text-ocean-deep dark:text-white mb-2">
                      <span>{item.label}</span>
                      <span>{item.pct}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-1000 w-[${item.pct}]`} style={{ width: item.pct }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Donations */}
            <div className="glass-card p-6 rounded-3xl border border-white/20">
               <h3 className="text-xl font-bold text-ocean-deep dark:text-white mb-6 flex items-center gap-2">
                <Heart className="text-red-500 fill-red-500 animate-pulse" />
                Recent Donations
              </h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {recentDonations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-cyan to-primary-blue flex items-center justify-center text-white font-bold text-xs">
                        {donation.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-ocean-deep dark:text-white text-sm">{donation.name}</div>
                        <div className="text-xs text-ocean-deep/50 dark:text-gray-400">{donation.method} • {donation.time}</div>
                      </div>
                    </div>
                    <div className="font-bold text-primary-blue dark:text-primary-cyan">
                      {donation.amount}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 text-center text-xs text-ocean-deep/40 dark:text-gray-500">
                Thank you for being our hero!
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
