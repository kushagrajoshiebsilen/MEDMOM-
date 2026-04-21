import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Share2,
  Pill,
  Droplets
} from 'lucide-react';

export default function Reports() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const calendarDays = [
    { d: 27, muted: true }, { d: 28, muted: true }, { d: 29, muted: true }, { d: 30, muted: true }, { d: 31, muted: true },
    { d: 1, status: 'taken' }, { d: 2, status: 'taken' },
    { d: 3, status: 'taken' }, { d: 4, status: 'taken' }, { d: 5, status: 'missed' }, { d: 6, status: 'taken' }, { d: 7, status: 'taken' }, { d: 8, status: 'taken' }, { d: 9, status: 'taken' },
    { d: 10, status: 'taken' }, { d: 11, status: 'taken' }, { d: 12, status: 'taken' }, { d: 13, status: 'taken' }, { d: 14, status: 'missed' }, { d: 15, current: true }, { d: 16 },
    { d: 17 }, { d: 18 }, { d: 19 }, { d: 20 }, { d: 21 }, { d: 22 }, { d: 23 },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="space-y-1">
        <h2 className="text-4xl font-bold tracking-tight text-on-surface">History & Reports</h2>
        <p className="text-on-surface-variant">Review your adherence and share progress.</p>
      </header>

      {/* Main Score Card */}
      <section className="bg-gradient-to-br from-primary to-primary-container rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-on-primary/10 rounded-full blur-2xl"></div>
        
        <p className="text-lg font-bold opacity-80 mb-2">Weekly Adherence</p>
        <div className="text-7xl font-black mb-2 tracking-tighter">94%</div>
        <p className="text-sm font-bold bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">Excellent progress this week.</p>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center text-center border border-outline/5 transition-transform active:scale-95">
          <CheckCircle2 className="w-8 h-8 text-primary mb-3 fill-primary/10" />
          <span className="text-4xl font-black text-on-surface">28</span>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">Taken</span>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center text-center border border-outline/5 transition-transform active:scale-95">
          <XCircle className="w-8 h-8 text-tertiary mb-3 fill-tertiary/10" />
          <span className="text-4xl font-black text-on-surface">2</span>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">Missed</span>
        </div>
      </div>

      {/* Calendar View */}
      <section className="bg-white rounded-[3rem] p-8 shadow-ambient border border-outline/5">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-on-surface">September 2023</h3>
          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-surface transition-colors">
              <ChevronLeft className="w-5 h-5 text-on-surface-variant" />
            </button>
            <button className="p-2 rounded-full hover:bg-surface transition-colors">
              <ChevronRight className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-6">
          {days.map((d, i) => <div key={`${d}-${i}`}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-y-6 gap-x-2 text-center">
          {calendarDays.map((day, i) => (
            <div key={i} className="relative flex flex-col items-center justify-center p-1">
              <span className={`text-sm font-bold z-10 ${
                day.muted ? 'text-on-surface-variant/20' : 
                day.current ? 'text-white' : 'text-on-surface'
              }`}>
                {day.d}
              </span>
              
              {day.current && (
                <div className="absolute inset-0 bg-primary rounded-full w-8 h-8 m-auto"></div>
              )}
              
              {day.status === 'taken' && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full"></div>
              )}
              {day.status === 'missed' && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 bg-tertiary rounded-full"></div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-6 mt-10">
          <div className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
            <div className="w-2.5 h-2.5 bg-primary rounded-full"></div> Taken
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
            <div className="w-2.5 h-2.5 bg-tertiary rounded-full"></div> Missed
          </div>
        </div>
      </section>

      {/* Medication Adherence List */}
      <section className="space-y-4 px-2">
        <h3 className="text-xl font-bold text-on-surface">By Medication</h3>
        <div className="space-y-4">
          <div className="bg-white rounded-[2rem] p-5 shadow-sm flex items-center justify-between border border-outline/5 transition-all hover:translate-x-1">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-inner">
                <Pill className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-on-surface">Lisinopril</h4>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-0.5">10mg • Daily</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-primary block tracking-tighter">100%</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">This week</span>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-5 shadow-sm flex items-center justify-between border border-outline/5 transition-all hover:translate-x-1">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-inner">
                <Droplets className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-on-surface">Metformin</h4>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-0.5">500mg • Twice Daily</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-tertiary block tracking-tighter">85%</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">This week</span>
            </div>
          </div>
        </div>
      </section>

      <button className="w-full bg-primary text-white py-5 rounded-full font-bold text-xl shadow-xl hover:scale-[0.98] transition-all flex items-center justify-center gap-3">
        <Share2 className="w-6 h-6" />
        Share Report with Doctor
      </button>
    </div>
  );
}
