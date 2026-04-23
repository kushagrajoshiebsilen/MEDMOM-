import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PhoneOff, Mic, MicOff, Volume2, User } from 'lucide-react';

interface VoiceCallProps {
  callerName: string;
  isIncoming?: boolean;
  onAnswer?: () => void;
  onDecline: () => void;
  status: 'ringing' | 'connected' | 'ended';
  remoteStream: MediaStream | null;
}

export default function VoiceCall({ 
  callerName, 
  isIncoming, 
  onAnswer, 
  onDecline, 
  status,
  remoteStream 
}: VoiceCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: any;
    if (status === 'connected') {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Audio playback
  useEffect(() => {
    if (remoteStream && status === 'connected') {
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.play().catch(e => console.error("Audio playback failed", e));
    }
  }, [remoteStream, status]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between py-24 px-8 text-white"
    >
      <div className="text-center space-y-6">
        <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/40 shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] animate-pulse">
           <User className="w-16 h-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter">{callerName}</h2>
          <p className="text-primary font-bold uppercase tracking-widest text-xs">
            {status === 'ringing' ? (isIncoming ? 'Incoming Voice Call...' : 'Calling...') : `Connected • ${formatTime(duration)}`}
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-12">
        {status === 'ringing' && isIncoming ? (
          <div className="grid grid-cols-2 gap-6">
            <button 
              onClick={onDecline}
              className="bg-white/10 hover:bg-white/20 p-6 rounded-full flex items-center justify-center transition-all border border-white/10"
            >
              <PhoneOff className="w-8 h-8 text-error" />
            </button>
            <button 
              onClick={onAnswer}
              className="bg-primary hover:scale-105 p-6 rounded-full flex items-center justify-center transition-all shadow-lg shadow-primary/20"
            >
              <Volume2 className="w-8 h-8 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-12">
            <div className="flex gap-8">
              <button 
                onClick={() => {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  import('../services/callService').then(m => m.callService.toggleMute(newMuted));
                }}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border ${isMuted ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white/20'}`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <button 
              onClick={onDecline}
              className="bg-error hover:scale-105 p-8 rounded-full flex items-center justify-center transition-all shadow-2xl shadow-error/20"
            >
              <PhoneOff className="w-10 h-10 text-white" />
            </button>
          </div>
        )}
      </div>

      <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
        End-to-End Encrypted Voice
      </div>
    </motion.div>
  );
}
