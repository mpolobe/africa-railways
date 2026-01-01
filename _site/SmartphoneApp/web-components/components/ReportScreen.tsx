
import React, { useState } from 'react';
import { Screen } from '../types';
import { ChevronLeft, Send, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import { analyzeReport } from '../services/geminiService';

interface Props {
  onNavigate: (screen: Screen) => void;
}

const ReportScreen: React.FC<Props> = ({ onNavigate }) => {
  const [reportText, setReportText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{category: string, priority: string, summary: string} | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reportText) return;
    setIsAnalyzing(true);
    const analysis = await analyzeReport(reportText);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
    setTimeout(() => {
        setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="text-green-600 w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Submitted</h2>
        <p className="text-slate-500 mb-8">Our team has received your report. AI analysis classified it as <b>{aiAnalysis?.category} ({aiAnalysis?.priority} Priority)</b>.</p>
        <button 
          onClick={() => onNavigate('DASHBOARD')}
          className="bg-blue-600 text-white font-bold py-4 px-10 rounded-xl shadow-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white border-b border-slate-100">
        <button onClick={() => onNavigate('DASHBOARD')} className="p-2 bg-slate-50 rounded-lg">
          <ChevronLeft className="text-slate-800" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Report Issue</h2>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-6 flex gap-3">
          <ShieldAlert className="text-orange-500 shrink-0" />
          <p className="text-orange-700 text-xs">
            Use this tool to report maintenance, security, or service delays. Your report will be analyzed by our Smart Rail AI.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <label className="text-slate-800 font-bold block mb-4">What's the problem?</label>
          <textarea
            className="w-full h-40 bg-slate-50 rounded-xl p-4 text-slate-700 outline-none border border-slate-100 focus:border-blue-300 resize-none"
            placeholder="E.g. The AC in Coach 5 is not working..."
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
          />
          
          <button 
            onClick={handleSubmit}
            disabled={!reportText || isAnalyzing}
            className={`w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              !reportText || isAnalyzing ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg active:scale-95'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" />
                <span>AI ANALYZING...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>SUBMIT REPORT</span>
              </>
            )}
          </button>
        </div>

        {isAnalyzing && (
            <div className="mt-8 flex flex-col items-center">
                <p className="text-slate-400 text-sm animate-pulse">Scanning keywords and evaluating priority...</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ReportScreen;
