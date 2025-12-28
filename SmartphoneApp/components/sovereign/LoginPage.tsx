
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    // Simulate biometric scan & identity verification
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
      setTimeout(() => {
        onLogin();
      }, 800);
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#1e7c91] p-8 text-white animate-in fade-in duration-700">
      {/* Header */}
      <div className="mt-8 text-center">
        <h1 className="text-3xl font-black tracking-widest text-white/95">
          DIGITAL IDENTITY
        </h1>
      </div>

      {/* Central Fingerprint Section */}
      <div className="flex-grow flex flex-col items-center justify-center relative">
        <div 
          onClick={!isVerifying ? handleVerify : undefined}
          className={`relative cursor-pointer transition-transform duration-500 ${isVerifying ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
        >
          {/* Particles / Glow effect */}
          <div className={`absolute inset-0 bg-white/20 blur-3xl rounded-full transition-opacity duration-1000 ${isVerifying ? 'opacity-100 animate-pulse' : 'opacity-40'}`}></div>
          
          {/* Fingerprint SVG */}
          <div className="relative z-10 w-40 h-40 flex items-center justify-center">
             <svg viewBox="0 0 24 24" className={`w-32 h-32 fill-none stroke-current stroke-[0.8] transition-colors duration-500 ${isVerifying ? 'text-blue-200' : 'text-white/90'}`}>
                <path d="M12 11c.4 0 .7.1 1 .3.3.2.5.5.6.8.1.3.1.7 0 1-.1.3-.3.6-.5.8m.5-4.8c.6.2 1.1.5 1.5 1 .4.5.7 1.1.8 1.8.1.7 0 1.4-.2 2.1-.2.7-.6 1.3-1.1 1.8M10.5 19.3c.5.4 1.1.6 1.7.7.6.1 1.2 0 1.8-.2s1.1-.5 1.5-.9 1-1 1.3-1.5m-3.8-6.4c-.4 0-.7.1-1 .3-.3.2-.5.5-.6.8-.1.3-.1.7 0 1 .1.3.3.6.5.8m.3-4.8c-.6.2-1.1.5-1.5 1-.4.5-.7 1.1-.8 1.8-.1.7 0 1.4.2 2.1.2.7.6 1.3 1.1 1.8m2-11.2c-1.3-.3-2.7-.4-4-.2s-2.5.6-3.6 1.3c-1.1.7-2 1.6-2.7 2.7-.7 1.1-1.1 2.3-1.2 3.6m3.5-3.5c.8-.7 1.8-1.2 2.9-1.5 1.1-.3 2.2-.4 3.3-.2m6.1 1.3c.9.4 1.7.9 2.4 1.5.7.6 1.3 1.3 1.7 2.1m-2.1-4c.7.4 1.3.9 1.8 1.5.5.6 1 1.3 1.3 2.1" />
                <path d="M12 11v3m0 0v3m0-3h3m-3 0H9" className={isVerifying ? 'opacity-0' : 'opacity-0'} />
                {/* Detailed Fingerprint Lines */}
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" className="opacity-10"/>
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z" className="opacity-20"/>
             </svg>
             {/* Scanning Line */}
             {isVerifying && (
               <div className="absolute top-0 left-0 w-full h-1 bg-white/60 blur-sm shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-scan"></div>
             )}
          </div>

          {/* Floating Status Text */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-full text-center">
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 ${isVerifying ? 'text-white' : 'text-white/40'}`}>
              {isVerifying ? 'Biometric Scan Active' : isSuccess ? 'Identity Verified' : 'Touch to Authenticate'}
            </p>
          </div>
        </div>
      </div>

      {/* Identity Card Section */}
      <div className="flex items-center gap-6 mb-12">
        <div className="w-24 h-24 rounded-full border-4 border-white/80 overflow-hidden shadow-xl bg-white/10 flex-shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200" 
            alt="User" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight leading-none mb-2">Jane Doe</h2>
          <div className="space-y-0.5 opacity-90">
             <p className="text-[10px] font-medium leading-tight">Date of Birth: <span className="font-bold">01/01/1990</span></p>
             <p className="text-[10px] font-medium leading-tight">Nationality: <span className="font-bold">USA</span></p>
             <p className="text-[10px] font-medium leading-tight">ID Number: <span className="font-bold">123/68789</span></p>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex justify-between items-end mb-8">
        {/* QR Code Placeholder */}
        <div className="w-20 h-20 bg-white/95 p-1 rounded-lg flex items-center justify-center">
           <svg viewBox="0 0 24 24" className="w-full h-full fill-black">
              <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm10-2h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm2-4h2v2h-2v-2zm-8-2h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm2-4h2v2h-2v-2z" />
           </svg>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isVerifying || isSuccess}
          className={`flex items-center gap-3 bg-white text-[#1e7c91] px-6 py-3 rounded-full font-black text-sm uppercase shadow-xl transition-all active:scale-95 disabled:opacity-50
            ${isSuccess ? 'bg-green-100 text-green-700' : ''}
          `}
        >
          {isVerifying ? 'VERIFYING...' : isSuccess ? 'VERIFIED' : 'VERIFY'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
