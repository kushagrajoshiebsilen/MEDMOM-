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
import { Medication } from '../types';

interface HealthReport {
  id: string;
  title: string;
  analysis: string;
  severity: 'normal' | 'action_needed' | 'urgent';
  createdAt: string;
}

interface ReportsProps {
  meds: Medication[];
  healthReports?: HealthReport[];
}

export default function Reports({ meds, healthReports = [] }: ReportsProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/health-reports/analyze', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageBase64: base64, title: file.name })
        });
        const data = await res.json();
        if (data.success) {
          alert('Report analyzed successfully!');
          window.location.reload(); // Refresh to show new report
        } else {
          alert('Analysis failed: ' + data.error);
        }
      } catch (err) {
        alert('Error connecting to server.');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const takenCount = meds.filter(m => m.status === 'Taken').length;
  const missedCount = meds.filter(m => m.status === 'Missed').length;
  const totalCount = meds.length;
  const adherence = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDate();
  
  // Simplified calendar for dynamic look
  const calendarDays = Array.from({ length: 28 }, (_, i) => ({
    d: i + 1,
    current: i + 1 === today,
    status: (i + 1 < today) ? (Math.random() > 0.1 ? 'taken' : 'missed') : undefined
  }));

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <header className="space-y-1">
        <h2 className="text-4xl font-bold tracking-tight text-on-surface">History & Reports</h2>
        <p className="text-on-surface-variant">Review your adherence and share progress.</p>
      </header>

      {/* Main Score Card */}
      <section className="bg-gradient-to-br from-primary to-primary-container rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-on-primary/10 rounded-full blur-2xl"></div>
        
        <p className="text-lg font-bold opacity-80 mb-2">Weekly Adherence</p>
        <div className="text-7xl font-black mb-2 tracking-tighter">{adherence}%</div>
        <p className="text-sm font-bold bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
          {adherence >= 90 ? 'Excellent progress this week.' : adherence >= 70 ? 'Good consistency!' : 'Keep trying, you can do it!'}
        </p>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center text-center border border-outline/5 transition-transform active:scale-95">
          <CheckCircle2 className="w-8 h-8 text-primary mb-3 fill-primary/10" />
          <span className="text-4xl font-black text-on-surface">{takenCount}</span>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">Taken</span>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center text-center border border-outline/5 transition-transform active:scale-95">
          <XCircle className="w-8 h-8 text-tertiary mb-3 fill-tertiary/10" />
          <span className="text-4xl font-black text-on-surface">{missedCount}</span>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">Missed</span>
        </div>
      </div>

      {/* Calendar View */}
      <section className="bg-white rounded-[3rem] p-8 shadow-ambient border border-outline/5">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-on-surface">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
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
                day.current ? 'text-white' : 'text-on-surface'
              }`}>
                {day.d}
              </span>
              
              {day.current && (
                <div className="absolute inset-0 bg-primary rounded-full w-8 h-8 m-auto shadow-md"></div>
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

      {/* Health Reports History */}
      <section className="space-y-4 px-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-on-surface">Health Reports History</h3>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full active:scale-95 transition-all"
          >
            {isAnalyzing ? 'Analyzing...' : '+ Upload Report'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload} 
          />
        </div>

        <div className="space-y-4">
          {healthReports.map((report) => (
            <div key={report.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-outline/5 relative overflow-hidden group">
               <div className={`absolute top-0 left-0 w-2 h-full ${
                 report.severity === 'urgent' ? 'bg-error' : report.severity === 'action_needed' ? 'bg-amber-500' : 'bg-primary'
               }`}></div>
               
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <h4 className="text-xl font-black text-on-surface leading-tight">{report.title}</h4>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    report.severity === 'urgent' ? 'bg-error text-white' : report.severity === 'action_needed' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
                  }`}>
                    {report.severity.replace('_', ' ')}
                  </div>
               </div>

               <div className="bg-surface/50 p-5 rounded-3xl border border-outline/5">
                  <p className="text-sm font-bold text-on-surface leading-relaxed whitespace-pre-wrap">{report.analysis}</p>
               </div>

               <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant leading-tight">
                    {report.severity === 'urgent' ? 'Immediate consultation required.' : 'Keep monitoring and consult soon.'}
                  </p>
               </div>
            </div>
          ))}
          {healthReports.length === 0 && !isAnalyzing && (
            <div className="text-center py-12 bg-white rounded-[2.5rem] border-2 border-dashed border-outline/10 opacity-40">
               <Droplets className="w-12 h-12 mx-auto mb-4" />
               <p className="text-sm font-bold">No blood reports analyzed yet.</p>
               <p className="text-xs">Upload a photo to see Gemini's analysis.</p>
            </div>
          )}
          {isAnalyzing && (
            <div className="text-center py-12 bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/20">
               <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-sm font-bold text-primary">Gemini is analyzing your report...</p>
               <p className="text-xs text-primary/60">Decoding medical jargon into simple words.</p>
            </div>
          )}
        </div>
      </section>

      {/* Medication Adherence List */}
      <section className="space-y-4 px-2">
        <h3 className="text-xl font-bold text-on-surface">By Medication</h3>
        <div className="space-y-4">
          {meds.map((med) => (
            <div key={med.id} className="bg-white rounded-[2rem] p-5 shadow-sm flex items-center justify-between border border-outline/5 transition-all hover:translate-x-1">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-inner">
                  <Pill className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-on-surface">{med.name}</h4>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-0.5">{med.dose}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xl font-black block tracking-tighter ${med.status === 'Taken' ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                  {med.status === 'Taken' ? '100%' : 'Pending'}
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Status</span>
              </div>
            </div>
          ))}
          {meds.length === 0 && (
            <p className="text-center text-on-surface-variant font-bold opacity-40 py-8">No medication data available to report.</p>
          )}
        </div>
      </section>

      <button className="w-full bg-primary text-white py-5 rounded-full font-bold text-xl shadow-xl hover:scale-[0.98] transition-all flex items-center justify-center gap-3 active:scale-95">
        <Share2 className="w-6 h-6" />
        Share Report with Doctor
      </button>
    </div>
  );
}
