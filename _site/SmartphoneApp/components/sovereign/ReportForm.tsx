
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icons, CITIES } from '../constants';
import { ReportType, RailReport } from '../types';
import VoiceModal from './VoiceModal';
import MapView from './MapView';
import GitHubDeploy from './GitHubDeploy';
import { askAI } from '../services/geminiService';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const STORAGE_KEY = 'africa_railways_pending_reports';

interface ReportFormProps {
  onLogout: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onLogout }) => {
  const [activeNav, setActiveNav] = useState('terminal');
  const [cityIndex, setCityIndex] = useState(19); // Default to Addis Ababa
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Help Center State
  const [helpMessages, setHelpMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Sovereign Hub AI active. How can I assist your field operations today?' }
  ]);
  const [helpInput, setHelpInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const city = CITIES[cityIndex];

  const refreshCache = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPendingReports(JSON.parse(saved));
    } else {
      setPendingReports([]);
    }
  }, []);

  useEffect(() => {
    refreshCache();
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => console.log("Location denied"),
        { enableHighAccuracy: true }
      );
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshCache]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [helpMessages]);

  const [formData, setFormData] = useState<Partial<RailReport>>({
    delayHours: 3.5,
    observations: '',
    infraCondition: 4,
    type: ReportType.RAIL_LEG_TRIP
  });

  const handleDeploymentComplete = () => {
    localStorage.removeItem(STORAGE_KEY);
    refreshCache();
    setIsDeployOpen(false);
    setActiveNav('terminal');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.observations || formData.observations.length < 10) {
      alert("Please provide detailed observations.");
      return;
    }
    const payload = { 
      ...formData, 
      id: crypto.randomUUID(), 
      timestamp: Date.now(), 
      location: `${city.name}, ${city.country}` 
    };
    const reports = [...pendingReports, payload];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    setPendingReports(reports);
    setFormData({ ...formData, observations: '' });
    alert("Report Cached Locally. Ready for Master Deployment.");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpInput.trim() || isAiThinking) return;

    const userMsg = helpInput;
    setHelpInput('');
    setHelpMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiThinking(true);

    try {
      const response = await askAI(userMsg, helpMessages);
      setHelpMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setHelpMessages(prev => [...prev, { role: 'model', text: "Uplink failure. Please check terminal connection." }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      {/* Dynamic Navigation Header */}
      <div className="pt-2 px-6 pb-4 shrink-0 flex items-center justify-between border-b border-white/5 bg-[#121212]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Sovereign Layer 01</span>
        </div>
        <button onClick={onLogout} className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">Secure Exit</button>
      </div>

      {/* Main Viewport Content */}
      <div className="flex-grow overflow-y-auto no-scrollbar pb-24">
        {activeNav === 'terminal' && (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
              <h1 className="text-3xl font-black tracking-tight leading-none mb-2">FIELD REPORT</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Observation Terminal v2.5</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Deployment Sector</label>
                <div className="relative">
                  <select 
                    value={cityIndex} 
                    onChange={(e) => setCityIndex(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold appearance-none outline-none focus:border-blue-500/50 transition-colors"
                  >
                    {CITIES.map((c, i) => (
                      <option key={c.name} value={i}>{c.name}, {c.country}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Operational Delay</label>
                  <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-xl font-black">{formData.delayHours}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Hours</span>
                  </div>
                  <input 
                    type="range" min="0" max="24" step="0.5" 
                    value={formData.delayHours} 
                    onChange={(e) => setFormData({...formData, delayHours: Number(e.target.value)})}
                    className="w-full mt-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Infra Integrity</label>
                  <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <div 
                        key={star} 
                        onClick={() => setFormData({...formData, infraCondition: star})}
                        className={`w-4 h-4 rounded-sm cursor-pointer transition-colors ${formData.infraCondition! >= star ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'bg-white/5'}`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Raw Observations</label>
                  <button 
                    type="button" 
                    onClick={() => setIsVoiceOpen(true)}
                    className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
                  >
                    <Icons.Mic />
                    Voice Sync
                  </button>
                </div>
                <textarea 
                  value={formData.observations}
                  onChange={(e) => setFormData({...formData, observations: e.target.value})}
                  placeholder="Record technical details, track conditions, or incident logs..."
                  className="w-full h-32 bg-[#1A1A1A] border border-white/10 rounded-[2rem] p-6 text-sm font-medium leading-relaxed outline-none focus:border-blue-500/50 transition-colors placeholder:text-gray-700 resize-none no-scrollbar"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-white text-black font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all"
              >
                COMMIT TO CACHE
              </button>
            </form>
          </div>
        )}

        {activeNav === 'map' && (
          <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <header className="mb-8">
              <h1 className="text-3xl font-black tracking-tight leading-none mb-2">INFRA MAP</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Network Node Visualizer</p>
            </header>
            <MapView city={city} userLocation={userLocation} />
            <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Node Metadata</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-bold text-gray-500">Sector</span>
                  <span className="text-xs font-bold">{city.name}, {city.country}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-bold text-gray-500">Sync Frequency</span>
                  <span className="text-xs font-bold text-green-500">60Hz Real-time</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-gray-500">Uplink Quality</span>
                  <span className="text-xs font-bold">{isOnline ? '98.4% (Optimal)' : 'Offline (Edge Mode)'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'cache' && (
          <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <header>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-black tracking-tight leading-none mb-2">CACHE</h1>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Sovereign Data Storage</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${isOnline ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                  {isOnline ? 'Uplink Established' : 'Offline Buffer'}
                </div>
              </div>
            </header>

            <div className="space-y-4">
              {pendingReports.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-gray-600">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 12V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9m1-20v4m-8-4v4m-4 4h16m-1 8 2 2 4-4"/></svg>
                  </div>
                  <h3 className="text-lg font-bold mb-1">Cache Empty</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">New observations will be buffered here until you trigger a master deployment.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                    {pendingReports.map((report, idx) => (
                      <div key={report.id} className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 flex gap-4 animate-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 100}ms` }}>
                         <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                           <Icons.Train />
                         </div>
                         <div className="flex-grow">
                           <div className="flex justify-between mb-1">
                             <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{report.location}</span>
                             <span className="text-[9px] text-gray-600 font-bold">{new Date(report.timestamp).toLocaleTimeString()}</span>
                           </div>
                           <p className="text-xs font-medium text-gray-300 line-clamp-2">{report.observations}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setIsDeployOpen(true)}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    DEPLOY TO GITHUB MASTER
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeNav === 'help' && (
          <div className="flex flex-col h-[600px] animate-in fade-in duration-500 p-6">
            <header className="mb-8">
              <h1 className="text-3xl font-black tracking-tight leading-none mb-2">HELP CENTER</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Sovereign AI Assistant</p>
            </header>

            <div className="flex-grow overflow-y-auto no-scrollbar space-y-6 mb-6">
              {helpMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl text-xs font-medium leading-relaxed ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-3xl">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="relative">
              <input 
                value={helpInput}
                onChange={(e) => setHelpInput(e.target.value)}
                placeholder="Ask about operational protocols..."
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-500/50 transition-colors"
              />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Persistent Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#121212]/95 backdrop-blur-xl border-t border-white/5 pt-3 pb-8 px-8 flex justify-between items-center z-[100]">
        {[
          { id: 'terminal', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 17l6-6-6-6M12 19h8"/></svg> },
          { id: 'map', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
          { id: 'cache', icon: <div className="relative"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 8v13H3V8M21 8l-9-5-9 5M21 8l-9 5-9-5m9 5v8"/></svg>{pendingReports.length > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#121212]"></div>}</div> },
          { id: 'help', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`transition-all duration-300 ${activeNav === item.id ? 'text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'text-gray-600 hover:text-gray-400'}`}
          >
            {item.icon}
          </button>
        ))}
      </nav>

      <VoiceModal 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)} 
        onTranscript={(text) => setFormData({...formData, observations: formData.observations + (formData.observations ? ' ' : '') + text})} 
      />

      {isDeployOpen && (
        <GitHubDeploy 
          reports={pendingReports} 
          onComplete={handleDeploymentComplete} 
          onCancel={() => setIsDeployOpen(false)} 
        />
      )}
    </div>
  );
};

export default ReportForm;
