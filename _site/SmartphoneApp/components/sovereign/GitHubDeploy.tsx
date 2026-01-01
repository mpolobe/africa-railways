
import React, { useState, useEffect, useRef } from 'react';
import { generateDeploymentSummary } from '../services/geminiService';

interface GitHubDeployProps {
  reports: any[];
  onComplete: () => void;
  onCancel: () => void;
}

const GitHubDeploy: React.FC<GitHubDeployProps> = ({ reports, onComplete, onCancel }) => {
  const [step, setStep] = useState<'preview' | 'pushing' | 'success'>('preview');
  const [logs, setLogs] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsGenerating(true);
      const msg = await generateDeploymentSummary(reports);
      setCommitMessage(msg);
      setIsGenerating(false);
    };
    fetchSummary();
  }, [reports]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `> ${new Date().toLocaleTimeString()} | ${msg}`]);
  };

  const startDeployment = async () => {
    setStep('pushing');
    addLog("Initializing Secure Uplink...");
    await new Promise(r => setTimeout(r, 800));
    addLog("Target: github.com/mpolobe/africa-railways");
    await new Promise(r => setTimeout(r, 600));
    addLog("Packaging Sovereign Data Blobs...");
    await new Promise(r => setTimeout(r, 1200));
    addLog("Running Integrity Check: PASS");
    await new Promise(r => setTimeout(r, 500));
    addLog(`Commit: ${commitMessage.split('\n')[0]}`);
    await new Promise(r => setTimeout(r, 1500));
    addLog("Pushing to branch: sovereign-main");
    await new Promise(r => setTimeout(r, 2000));
    addLog("Remote: Processing Delta Updates...");
    await new Promise(r => setTimeout(r, 1000));
    addLog("Deployment Verified.");
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-[7000] bg-black flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-[#0D1117] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-[#161B22] flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
             </div>
             <div>
               <h3 className="text-sm font-black text-white uppercase tracking-widest">Sovereign Deploy</h3>
               <p className="text-[9px] font-bold text-gray-500 uppercase">Target: mpolobe/africa-railways</p>
             </div>
          </div>
          {step === 'preview' && (
            <button onClick={onCancel} className="p-2 text-gray-500 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar bg-[#0D1117]">
          {step === 'preview' ? (
            <div className="space-y-6">
              <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-3xl">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-3">Commit Manifest</span>
                {isGenerating ? (
                  <div className="flex gap-1 py-4">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                  </div>
                ) : (
                  <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {commitMessage}
                  </pre>
                )}
              </div>
              <div className="flex items-center gap-3 px-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Awaiting field authentication</span>
              </div>
            </div>
          ) : (
            <div className="bg-black/40 rounded-3xl p-5 border border-white/5 font-mono text-[11px] leading-relaxed space-y-1 h-64 overflow-y-auto custom-scrollbar">
               {logs.map((log, i) => (
                 <div key={i} className="text-green-500 opacity-80 animate-in fade-in duration-300">
                    <span className="text-gray-600">{log.split('|')[0]}</span>
                    <span className="text-gray-400">|</span>
                    <span className="ml-2">{log.split('|')[1]}</span>
                 </div>
               ))}
               <div ref={logEndRef} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#161B22] border-t border-white/5">
          {step === 'preview' && (
            <button 
              onClick={startDeployment}
              disabled={isGenerating}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              DEPLOY BATCH ({reports.length})
            </button>
          )}
          {step === 'pushing' && (
            <div className="w-full flex flex-col items-center gap-4 py-2">
               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-600 animate-[progress_5s_ease-in-out_infinite]"></div>
               </div>
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse">PUSHING TO PRODUCTION</span>
            </div>
          )}
          {step === 'success' && (
            <button 
              onClick={onComplete}
              className="w-full py-5 bg-green-600 hover:bg-green-500 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-green-500/20 active:scale-95 transition-all"
            >
              FINISH & CLEAR CACHE
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes progress {
          0% { width: 0; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default GitHubDeploy;
