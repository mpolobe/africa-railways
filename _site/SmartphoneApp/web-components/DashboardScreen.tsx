
import React from 'react';
import { User, Trip, Screen } from '../types';
import { 
  CreditCard, 
  Map as MapIcon, 
  Clock, 
  QrCode, 
  Smartphone, 
  HelpCircle,
  Home,
  Wallet,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';

interface Props {
  user: User;
  trip: Trip;
  onNavigate: (screen: Screen) => void;
}

const DashboardScreen: React.FC<Props> = ({ user, trip, onNavigate }) => {
  return (
    <div className="p-6 bg-white min-h-full">
      <div className="flex justify-between items-center mb-6 pt-4">
        <h2 className="text-2xl font-bold text-slate-800">Home Dashboard</h2>
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-slate-600" />
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-4 right-4 opacity-20">
          <QrCode size={40} />
        </div>
        <p className="text-blue-900 text-sm font-semibold mb-1">AfriCoin Gold</p>
        <div className="flex items-baseline gap-2 mb-2">
          <h3 className="text-3xl font-bold text-blue-900">{user.balance.toLocaleString()} AFR</h3>
        </div>
        <p className="text-blue-800 text-xs font-medium mb-6">≈ 12,000 NIGN</p>
        <button className="bg-blue-900 text-white text-xs font-bold px-6 py-2 rounded-lg shadow-md absolute bottom-6 right-6 hover:bg-blue-800">
          Top Up
        </button>
      </div>

      {/* Upcoming Trip Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-slate-400 text-xs font-semibold mb-1">Upcoming Trip</p>
            <h4 className="text-blue-900 text-lg font-bold">{trip.from} → {trip.to}</h4>
          </div>
          <span className="bg-green-100 text-green-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
            {trip.status}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <button 
            onClick={() => onNavigate('TRIP_DETAILS')}
            className="text-slate-400 text-xs font-medium bg-slate-50 px-4 py-2 rounded-lg hover:bg-slate-100"
          >
            View
          </button>
          <div className="flex items-center gap-2">
             <QrCode size={24} className="text-slate-800" />
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Services</h3>
        <div className="grid grid-cols-3 gap-4">
          <ServiceItem icon={<Clock />} label="Schedules" />
          <ServiceItem icon={<MapIcon />} label="Live Map" onClick={() => onNavigate('TRIP_DETAILS')} />
          <ServiceItem icon={<CreditCard />} label="Scan Pay" />
          <ServiceItem icon={<ShieldAlert />} label="Report" onClick={() => onNavigate('REPORT')} />
          <ServiceItem icon={<HelpCircle />} label="AI Chat" onClick={() => onNavigate('AI_ASSISTANT')} />
          <ServiceItem icon={<HelpCircle className="rotate-180" />} label="Support" />
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around py-4">
        <NavItem icon={<Home className="text-blue-600" />} label="Home" active />
        <NavItem icon={<Wallet />} label="Wallet" />
        <NavItem icon={<MessageSquare />} label="Support" />
      </div>
    </div>
  );
};

const ServiceItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 group">
    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
    <span className="text-slate-600 text-xs font-medium">{label}</span>
  </button>
);

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <div className="flex flex-col items-center gap-1 cursor-pointer">
    <div className={`${active ? 'text-blue-600' : 'text-slate-400'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
    <span className={`text-[10px] font-bold ${active ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
  </div>
);

export default DashboardScreen;
