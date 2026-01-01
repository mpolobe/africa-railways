
import React, { useState, useEffect } from 'react';
import { Screen, User, Trip } from './types';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import TripDetailsScreen from './components/TripDetailsScreen';
import ReportScreen from './components/ReportScreen';
import AIAssistantScreen from './components/AIAssistantScreen';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOGIN');
  const [user, setUser] = useState<User>({
    phone: '',
    balance: 18500,
    currency: 'AFR'
  });

  const [activeTrip] = useState<Trip>({
    from: 'Lagos',
    to: 'Abuja',
    status: 'On Time',
    eta: '235 Min',
    speed: '180 km/h',
    nextStop: 'Nexter Iban'
  });

  const handleLogin = (phone: string) => {
    setUser(prev => ({ ...prev, phone }));
    setCurrentScreen('DASHBOARD');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'LOGIN':
        return <LoginScreen onLogin={handleLogin} />;
      case 'DASHBOARD':
        return <DashboardScreen user={user} trip={activeTrip} onNavigate={setCurrentScreen} />;
      case 'TRIP_DETAILS':
        return <TripDetailsScreen trip={activeTrip} onNavigate={setCurrentScreen} />;
      case 'REPORT':
        return <ReportScreen onNavigate={setCurrentScreen} />;
      case 'AI_ASSISTANT':
        return <AIAssistantScreen onNavigate={setCurrentScreen} />;
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-900 overflow-hidden">
      {/* Phone Frame Simulator */}
      <div className="relative w-full max-w-[400px] h-[850px] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-slate-800">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-800 rounded-b-3xl z-50"></div>
        
        {/* App Content */}
        <div className="w-full h-full overflow-y-auto bg-slate-50 relative pb-20">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
};

export default App;
