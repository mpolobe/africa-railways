
import React, { useState } from 'react';
import { Fingerprint, Settings } from 'lucide-react';

interface Props {
  onLogin: (phone: string) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  return (
    <div className="flex flex-col items-center h-full bg-gradient-to-b from-[#1e40af] via-[#3b82f6] to-[#60a5fa] p-8 pt-20">
      {/* Logo Area */}
      <div className="mb-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <svg className="w-12 h-12 text-blue-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zm0 2c3.71 0 5.83.43 5.98 2H6.02c.15-1.57 2.27-2 5.98-2zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 12H6V7h12v5z" />
          </svg>
        </div>
        <h1 className="text-white text-3xl font-bold tracking-tight">AFRICA RAILWAYS</h1>
        <p className="text-blue-100 text-sm opacity-90">Your Journey, Your Digital Wallet</p>
      </div>

      {/* Form */}
      <div className="w-full space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Phone Number (MSISDN)"
            className="w-full bg-white rounded-lg py-4 px-4 text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-yellow-400"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="relative">
          <input
            type="password"
            placeholder="PIN"
            className="w-full bg-white rounded-lg py-4 px-4 text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-yellow-400"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <Settings className="absolute right-4 top-4 text-slate-300 w-5 h-5" />
        </div>

        <button
          onClick={() => onLogin(phone || '2348000000000')}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-4 rounded-lg shadow-md transition-all active:scale-95 uppercase tracking-wide"
        >
          LOGIN SECURELY
        </button>
      </div>

      {/* Biometrics */}
      <div className="mt-12 flex flex-col items-center">
        <button className="w-16 h-16 rounded-full border-2 border-white/50 flex items-center justify-center mb-2 hover:bg-white/10 transition-colors">
          <Fingerprint className="text-white w-10 h-10" />
        </button>
        <p className="text-white text-xs opacity-80">Tap to use Biometrics</p>
      </div>

      <div className="mt-auto pb-4">
        <p className="text-white text-xs">First time? <span className="font-bold underline cursor-pointer">Create Account</span></p>
      </div>
    </div>
  );
};

export default LoginScreen;
