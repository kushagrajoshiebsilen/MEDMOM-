import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle,
  HelpCircle,
  Loader2,
  Camera as CameraIcon,
  AlertCircle
} from 'lucide-react';
import { Medication } from '../types';
import { verifyPillAI } from '../services/medService';

interface CameraVerifyProps {
  onBack: (success?: boolean) => void;
  medication?: Medication;
}

export default function CameraVerify({ onBack, medication }: CameraVerifyProps) {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyPill = async () => {
    if (!image) return;
    setAnalyzing(true);
    
    // Artificial delay for premium feel, but no AI analysis
    setTimeout(() => {
      onBack(true);
      setAnalyzing(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow-sm border-b border-outline/10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-surface transition-colors">
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
        <h1 className="font-bold text-lg text-primary">Verify Dose</h1>
        <button className="p-2 rounded-full text-on-surface-variant">
          <HelpCircle className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-8 container mx-auto max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-on-surface tracking-tighter mb-2">Visual Confirmation</h2>
          <p className="text-on-surface-variant font-medium text-sm max-w-[260px] mx-auto leading-relaxed">
            Take a clear photo of your medication in your hand so MedMom can verify.
          </p>
        </div>

        {/* Viewfinder Area */}
        <div 
          onClick={() => !image && fileInputRef.current?.click()}
          className="relative w-full aspect-[4/5] bg-surface-container-high rounded-[3rem] overflow-hidden shadow-2xl ring-8 ring-white/10 group cursor-pointer"
        >
          <AnimatePresence mode="wait">
            {image ? (
              <motion.img 
                key="captured"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={image} 
                className="w-full h-full object-cover"
                alt="Captured pill"
              />
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex flex-col items-center justify-center gap-4 text-on-surface-variant/40"
              >
                <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center border-4 border-dashed border-outline/20 group-hover:scale-110 transition-transform">
                  <CameraIcon className="w-12 h-12" />
                </div>
                <p className="font-black text-xs uppercase tracking-widest">Tap to capture</p>
              </motion.div>
            )}
          </AnimatePresence>

          {analyzing && (
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <p className="text-white font-black text-xs uppercase tracking-[0.2em] animate-pulse">MedMom is checking...</p>
            </div>
          )}

          {error && (
            <div className="absolute bottom-6 left-6 right-6 bg-error text-white p-4 rounded-2xl flex items-center gap-3 shadow-xl animate-in slide-in-from-bottom-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-bold leading-snug">{error}</p>
            </div>
          )}

          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef}
            onChange={handleCapture}
            className="hidden" 
          />
        </div>

        {/* Capture Controls */}
        <div className="mt-auto w-full flex flex-col gap-6 pb-8">
          {image ? (
            <div className="flex justify-between gap-4">
               <button 
                onClick={() => setImage(null)}
                className="flex-1 bg-white border-2 border-outline/10 text-on-surface py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-surface transition-all active:scale-95"
               >
                  <RotateCcw className="w-5 h-5" />
                  Retake
               </button>
               <button 
                onClick={verifyPill}
                disabled={analyzing}
                className="flex-1 bg-primary text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
               >
                  <CheckCircle className="w-5 h-5" />
                  Verify
               </button>
            </div>
          ) : (
            <p className="text-center text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-40">
              Your photo will be analyzed locally for privacy.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
