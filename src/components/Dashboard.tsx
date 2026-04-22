import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Pill, 
  Heart, 
  Bell, 
  Plus, 
  Camera, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { Medication, AppSettings } from '../types';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  role: 'parent' | 'child' | 'standard';
  onAction: (action: string) => void;
  trackedFamilyName?: string | null;
  meds: Medication[];
  settings: AppSettings;
  healthReports?: any[];
}

export default function Dashboard({ role, onAction, trackedFamilyName, meds, settings, healthReports = [] }: DashboardProps) {
  const [aiTip, setAiTip] = useState<string | null>(null);
  const isViewOnly = !!trackedFamilyName;

  // Personal med progress
  const takenCount = meds.filter(m => m.status === 'Taken').length;
  const totalCount = meds.length;
  const progressRatio = totalCount > 0 ? takenCount / totalCount : 0;

  // Find next due med
  const nextMed = meds
    .filter(m => m.status === 'Pending')
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  useEffect(() => {
    async function getHealthTip() {
       try {
         const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
         const response = await ai.models.generateContent({
           model: "gemini-1.5-flash-latest",
           contents: "Provide a very short (max 10 words) supportive and empathetic healthcare tip for a medication management app called MedMom. Make it warm and personal.",
         });
         setAiTip(response.text || "Staying consistent is an act of self-love.");
       } catch (err) {
         setAiTip("Staying consistent is an act of self-love.");
       }
    }
    if (!aiTip) getHealthTip();
  }, [aiTip]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Greeting */}
      <section className="space-y-1">
        <h2 className="text-4xl font-bold tracking-tight text-on-surface">
          {isViewOnly ? (
             <>{trackedFamilyName}'s Status</>
          ) : (
             <>Good Morning,<br /><span className="text-primary tracking-tighter">You</span></>
          )}
        </h2>
        <div className="flex items-center gap-2 mt-2">
           <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
           <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest leading-none">
             Daily Goal: Be consistent
           </p>
        </div>
      </section>

      {/* AI Healthy Tip */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/5 border border-primary/10 p-5 rounded-[2rem] flex items-start gap-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 text-primary/5">
           <Sparkles className="w-20 h-20 rotate-12" />
        </div>
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg ring-4 ring-white">
           <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
           <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">MedMom Inspiration</p>
           <p className="text-on-surface font-bold text-base leading-snug italic">"{aiTip || "Loading your daily nudge..."}"</p>
        </div>
      </motion.div>

      {/* Progress & Next Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Card */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-outline/5 flex flex-col items-center justify-center min-h-[240px] relative">
          <h3 className="text-xs font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-6 w-full text-center">
            {isViewOnly ? `${trackedFamilyName}'s Adherence` : "Your Progress Today"}
          </h3>
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="88" cy="88" r="78" className="stroke-surface-container-low fill-none" strokeWidth="14" />
              <circle 
                cx="88" cy="88" r="78" 
                className="stroke-primary fill-none transition-all duration-1000" 
                strokeWidth="14"
                strokeDasharray="490"
                strokeDashoffset={490 - (490 * progressRatio)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black text-on-surface tracking-tighter">
                {totalCount > 0 ? `${Math.round(progressRatio * 100)}%` : '0%'}
              </span>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
                {totalCount > 0 ? `${takenCount}/${totalCount} Taken` : 'No Meds'}
              </span>
            </div>
          </div>
        </div>

        {/* Status/Next Dose Card */}
        {isViewOnly ? (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-outline/5 space-y-6 flex flex-col justify-center">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-tertiary-container/10 text-tertiary flex items-center justify-center shrink-0 border border-tertiary/20">
                   <Heart className="w-8 h-8 fill-current" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-1">Vitality Status</p>
                   <p className="text-2xl font-black text-on-surface">{trackedFamilyName} is Active</p>
                </div>
             </div>
             {nextMed ? (
               <div className="bg-surface p-5 rounded-3xl border border-outline/5 shadow-inner">
                  <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-2">Next Med Due</p>
                  <div className="flex items-center justify-between">
                     <span className="text-3xl font-black text-primary tracking-tighter">{nextMed.time}</span>
                     <span className="text-xs font-black bg-primary-container/30 text-primary px-3 py-1 rounded-full uppercase tracking-widest truncate max-w-[100px]">{nextMed.name}</span>
                  </div>
               </div>
             ) : (
               <p className="text-center text-xs font-bold text-on-surface-variant opacity-40">All caught up!</p>
             )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary to-primary-container rounded-[2.5rem] p-8 text-on-primary shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
             <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-primary-container/20 rounded-full blur-xl"></div>
             {nextMed ? (
               <>
                 <div className="flex justify-between items-start z-10">
                    <div>
                      <p className="text-primary-container font-black text-[10px] tracking-widest uppercase mb-1">Your Next Dose</p>
                      <h3 className="text-5xl font-black tracking-tighter">{nextMed.time}</h3>
                    </div>
                    <Pill className="w-10 h-10 opacity-30 rotate-12" />
                 </div>
                 <div className="z-10 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10">
                    <p className="text-2xl font-bold font-sans">{nextMed.name}</p>
                    <p className="text-sm opacity-80 font-medium">{nextMed.dose}</p>
                 </div>
               </>
             ) : (
               <div className="flex flex-col items-center justify-center h-full z-10 text-center">
                  <CheckCircle2 className="w-12 h-12 mb-4 opacity-40" />
                  <p className="font-bold">All doses taken for today!</p>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {!isViewOnly ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button 
            onClick={() => onAction('upload')}
            className="bg-secondary-container text-on-secondary-container p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:opacity-95 active:scale-[0.98] transition-all shadow-sm border border-outline/5 group"
          >
            <Camera className="w-9 h-9 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">Verify Dose</span>
          </button>
          <div 
            className={`p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 border shadow-sm group transition-all ${
              settings.collegeMode ? 'bg-secondary text-white border-secondary' : 'bg-white text-on-surface border-outline/5 hover:bg-surface'
            }`}
          >
            <Clock className={`w-9 h-9 group-hover:scale-110 transition-transform ${settings.collegeMode ? 'text-white' : 'text-on-surface-variant'}`} />
            <span className="font-bold text-sm">{settings.collegeMode ? 'College Active' : 'Quiet Mode'}</span>
          </div>
          <button 
            onClick={() => onAction('add')}
            className="bg-primary text-white p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:opacity-95 active:scale-[0.98] transition-all shadow-md md:col-span-1 col-span-2 group"
          >
            <Plus className="w-9 h-9 group-hover:rotate-90 transition-transform" />
            <span className="font-bold text-sm">New Script</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onAction(`call:${trackedFamilyName}`)}
              className="bg-primary text-white p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all shadow-lg active:ring-4 ring-primary/20"
            >
              <Phone className="w-8 h-8" />
              <span className="font-bold">Call {trackedFamilyName}</span>
            </button>
            <button 
              onClick={() => onAction(`remind:${trackedFamilyName}`)}
              className="bg-white text-on-surface p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 shadow-sm border border-outline/5 active:scale-95 transition-all active:bg-surface"
            >
              <Bell className="w-8 h-8 text-primary shadow-sm" />
              <span className="font-bold">Send Reminder</span>
            </button>
        </div>
      )}

      {/* Latest Health Report Analysis (Gemini) */}
      {healthReports && healthReports.length > 0 && (
        <section className="bg-white rounded-[2.5rem] p-8 shadow-ambient border border-outline/5 relative overflow-hidden">
           <div className={`absolute top-0 right-0 w-2 h-full ${
             healthReports[0].severity === 'urgent' ? 'bg-error' : healthReports[0].severity === 'action_needed' ? 'bg-amber-500' : 'bg-primary'
           }`}></div>
           
           <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Latest Health Analysis</p>
                <h3 className="text-2xl font-black text-on-surface tracking-tight">{healthReports[0].title}</h3>
              </div>
              <div className={`p-3 rounded-2xl ${
                healthReports[0].severity === 'urgent' ? 'bg-error/10 text-error' : healthReports[0].severity === 'action_needed' ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'
              }`}>
                <Sparkles className="w-6 h-6" />
              </div>
           </div>

           <div className="bg-surface/30 p-6 rounded-3xl border border-outline/5 mb-4">
              <p className="text-sm font-bold text-on-surface leading-relaxed line-clamp-3 italic opacity-80">
                "{healthReports[0].analysis}"
              </p>
           </div>

           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${
                   healthReports[0].severity === 'urgent' ? 'bg-error animate-pulse' : healthReports[0].severity === 'action_needed' ? 'bg-amber-500' : 'bg-primary'
                 }`}></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                   {healthReports[0].severity === 'urgent' ? 'Urgent Action Recommended' : healthReports[0].severity === 'action_needed' ? 'Doctor Consult Advised' : 'Everything looks normal'}
                 </span>
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant/40 italic">
                Decoded by Gemini AI
              </p>
           </div>
        </section>
      )}

      {/* Today's Meds List */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-ambient border border-outline/5">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-2xl font-black text-on-surface tracking-tight">
            {isViewOnly ? `${trackedFamilyName}'s Schedule` : "Your Schedule Today"}
          </h3>
          <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">Today</p>
        </div>

        <div className="space-y-6">
          {meds.map((med) => (
             <div key={med.id} className={`p-5 rounded-[2rem] flex items-center justify-between group transition-all ${
               med.status === 'Taken' ? 'bg-surface/50 opacity-80' : 'bg-white border-2 border-primary/10 shadow-sm hover:border-primary/40'
             }`}>
                <div className="flex items-center gap-4">
                   <div className={`p-4 rounded-2xl shadow-inner transition-colors ${
                     med.status === 'Taken' ? 'bg-primary/10 text-primary' : 'bg-primary text-white shadow-lg'
                   }`}>
                      {med.status === 'Taken' ? <CheckCircle2 className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
                   </div>
                   <div>
                      <h4 className="font-bold text-on-surface text-lg leading-none">{med.name}</h4>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${
                        med.status === 'Taken' ? 'text-on-surface-variant/60' : 'text-primary'
                      }`}>
                         {med.time} • {med.dose}
                      </p>
                   </div>
                </div>
                <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                  med.status === 'Taken' ? 'border-primary/10 text-primary' : 'bg-primary text-white border-transparent shadow-sm'
                }`}>
                   {med.status === 'Taken' ? 'Taken' : 'Due Now'}
                </div>
             </div>
          ))}
          {meds.length === 0 && (
             <p className="text-center text-on-surface-variant font-bold opacity-40 py-4">No medication schedule found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
