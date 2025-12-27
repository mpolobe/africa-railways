
import React from 'react';
import { Trip, Screen } from '../types';
import { ChevronLeft, MapPin, Train, Home, Compass, Wallet, User as UserIcon } from 'lucide-react';

interface Props {
  trip: Trip;
  onNavigate: (screen: Screen) => void;
}

const TripDetailsScreen: React.FC<Props> = ({ trip, onNavigate }) => {
  return (
    <div className="h-full flex flex-col bg-[#1e40af] relative overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between z-10">
        <button 
          onClick={() => onNavigate('DASHBOARD')}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md"
        >
          <ChevronLeft className="text-white" />
        </button>
        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
           <Train size={20} className="text-blue-900" />
        </div>
      </div>

      {/* Map Content - Simplistic Visual Representation */}
      <div className="flex-1 relative flex items-center justify-center px-4">
        {/* Simplified Africa Map Outline Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
            <path d="M45,10 C55,10 65,15 70,25 C75,35 85,45 80,60 C75,75 60,90 50,95 C40,90 25,85 20,70 C15,55 25,40 30,30 C35,20 40,10 45,10 Z" />
          </svg>
        </div>

        {/* Route Line */}
        <div className="relative w-full h-full flex flex-col items-center justify-center py-20">
          <div className="w-[2px] h-full bg-blue-300 absolute left-1/2 -translate-x-1/2 dashed-border"></div>
          
          {/* Points */}
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white mb-2"></div>
            <div className="bg-blue-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
              <span className="text-white text-[10px] font-bold">Train 70L: 25 min to Abuja</span>
            </div>
          </div>

          <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2">
            <div className="w-4 h-4 rounded-full bg-blue-300 border-2 border-white"></div>
          </div>
        </div>
      </div>

      {/* Trip Details Card */}
      <div className="bg-white rounded-t-[2.5rem] p-8 shadow-2xl relative z-20 pb-28">
        <h3 className="text-slate-800 text-xl font-bold mb-6">Trip Details</h3>
        
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Estimated Arrival</p>
            <h4 className="text-blue-900 text-2xl font-bold">{trip.eta}</h4>
            <p className="text-slate-300 text-[10px] font-bold uppercase">{trip.to}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Current Speed</p>
            <h4 className="text-blue-900 text-2xl font-bold">{trip.speed}</h4>
            <p className="text-slate-300 text-[10px] font-bold uppercase">(180 KM/H)</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Next Stop</p>
            <h4 className="text-blue-900 text-xl font-bold">{trip.nextStop}</h4>
            <p className="text-slate-300 text-[10px] font-bold uppercase">Estimated in 12 min</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Total Distance</p>
            <h4 className="text-blue-900 text-xl font-bold">1200 KM</h4>
            <p className="text-slate-300 text-[10px] font-bold uppercase">From {trip.from}</p>
          </div>
        </div>

        <button className="w-full bg-slate-50 text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
           <MapPin size={18} />
           <span>LIVE TRACKING ENABLED</span>
        </button>
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around py-4 z-30">
        <NavItem icon={<Home />} label="Home" onClick={() => onNavigate('DASHBOARD')} />
        <NavItem icon={<Compass className="text-blue-600" />} label="Trips" active />
        <NavItem icon={<Wallet />} label="Wallet" />
        <NavItem icon={<UserIcon />} label="Account" />
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={onClick}>
    <div className={`${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-400 transition-colors'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
    <span className={`text-[10px] font-bold ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-400'}`}>{label}</span>
  </div>
);

export default TripDetailsScreen;
