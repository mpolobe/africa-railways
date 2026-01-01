
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icons } from '../constants';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

// Audio helper functions as required by the Live API implementation
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [status, setStatus] = useState('Ready to record');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptionBuffer = useRef<string>('');

  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      // Session cleanup if needed, though sessionPromise is used for sending
      sessionRef.current = null;
    }
    setIsRecording(false);
    setIsConnecting(false);
  }, []);

  const startLiveTranscription = async () => {
    setIsConnecting(true);
    setStatus('Connecting to Sovereign Engine...');
    transcriptionBuffer.current = '';
    setLiveTranscript('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = inputAudioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsRecording(true);
            setStatus('Listening...');
            
            // Stream audio to model
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Visualization
              drawWaveform(inputData);

              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              transcriptionBuffer.current += text;
              setLiveTranscript(transcriptionBuffer.current);
            }
          },
          onerror: (e) => {
            console.error('Live API Error:', e);
            setStatus('Connection Error');
            stopAudio();
          },
          onclose: () => {
            console.log('Live API Closed');
            stopAudio();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: 'You are an expert rail infrastructure transcription service. Transcribe the user audio accurately into technical reports. If they speak a local African language, translate it to English. Focus on technical details like track conditions, delays, and infrastructure ratings.',
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error('Failed to start live transcription', err);
      setStatus('Microphone Access Denied');
      setIsConnecting(false);
    }
  };

  const drawWaveform = (data: Float32Array) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3B82F6';
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] * 2; // amplify for visualization
      const y = (v * height / 2) + (height / 2);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const handleFinish = () => {
    if (liveTranscript) {
      onTranscript(liveTranscript);
    }
    stopAudio();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
    }
  }, [isOpen, stopAudio]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#1E1E1E] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl transition-opacity duration-1000 ${isRecording ? 'opacity-100' : 'opacity-0'}`}></div>
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl transition-colors duration-500 ${isRecording ? 'bg-blue-500/20 text-blue-400' : 'bg-[#2D2D2D] text-gray-500'}`}>
              <Icons.Mic />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Live Observation</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gemini Sovereign Transcription</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Waveform Visualization */}
          <div className="relative h-24 bg-black/40 rounded-3xl border border-white/5 overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} width={400} height={100} className="w-full h-full opacity-80" />
            {!isRecording && !isConnecting && (
               <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs font-medium uppercase tracking-widest">
                 System Standby
               </div>
            )}
            {isConnecting && (
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                 </div>
               </div>
            )}
          </div>

          {/* Transcript Area */}
          <div className="bg-black/20 rounded-[2rem] p-6 border border-white/5 min-h-[160px] max-h-[240px] overflow-y-auto custom-scrollbar">
            <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block mb-3">Real-time Stream</label>
            <div className="text-sm leading-relaxed text-gray-300 font-medium">
              {liveTranscript || (isRecording ? <span className="text-gray-600 italic">Wait for stream...</span> : <span className="text-gray-700 italic">Audio data will appear here word-by-word as you speak...</span>)}
              {isRecording && <span className="inline-block w-1.5 h-4 bg-blue-500 ml-1 animate-pulse align-middle"></span>}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            {!isRecording && !isConnecting ? (
              <button
                onClick={startLiveTranscription}
                className="w-full py-5 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
              >
                <div className="w-2 h-2 rounded-full bg-white group-hover:scale-125 transition-transform"></div>
                START RECORDING
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="w-full py-5 rounded-2xl font-black text-white bg-[#FF5C39] hover:bg-[#FF4D24] shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 animate-pulse"
              >
                FINISH & APPEND
              </button>
            )}
            
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                Status: <span className={isRecording ? 'text-green-500' : 'text-gray-500'}>{status}</span>
              </span>
              <div className="flex gap-1.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-1 h-1 rounded-full ${isRecording ? 'bg-blue-500' : 'bg-gray-800'}`} style={{ opacity: 1 - (i * 0.2) }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceModal;
