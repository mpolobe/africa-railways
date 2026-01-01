
import React, { useState, useRef, useEffect } from 'react';
import { Screen } from '../types';
import { ChevronLeft, Send, Sparkles, User, Train } from 'lucide-react';
import { getRailAssistantResponse } from '../services/geminiService';

interface Message {
  text: string;
  sender: 'USER' | 'AI';
  timestamp: string;
}

interface Props {
  onNavigate: (screen: Screen) => void;
}

const AIAssistantScreen: React.FC<Props> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I am your Africa Railways Smart Assistant. How can I help with your journey today?", sender: 'AI', timestamp: 'Now' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { text: input, sender: 'USER', timestamp: 'Now' };
    setMessages(prev => [...prev, userMsg]);
    const query = input;
    setInput('');
    setIsTyping(true);

    const response = await getRailAssistantResponse(query);
    const aiMsg: Message = { text: response, sender: 'AI', timestamp: 'Now' };
    
    setIsTyping(false);
    setMessages(prev => [...prev, aiMsg]);
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-6 pt-12 pb-4 bg-blue-600 flex items-center gap-4 text-white">
        <button onClick={() => onNavigate('DASHBOARD')} className="p-2 bg-white/10 rounded-lg">
          <ChevronLeft />
        </button>
        <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-400" />
            <h2 className="text-lg font-bold">Smart Rail Assistant</h2>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end gap-2 max-w-[85%]`}>
              {m.sender === 'AI' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Train size={16} className="text-blue-600" />
                </div>
              )}
              <div className={`p-4 rounded-2xl text-sm ${
                m.sender === 'USER' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-100 text-slate-800 rounded-bl-none'
              }`}>
                {m.text}
              </div>
              {m.sender === 'USER' && (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <User size={16} className="text-slate-600" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none">
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100 pb-28">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-white border border-slate-200 rounded-full py-4 px-6 text-sm text-slate-800 outline-none focus:border-blue-400"
            placeholder="Ask about routes, wallet, or safety..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantScreen;
