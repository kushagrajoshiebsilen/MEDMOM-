import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Camera, 
  Calendar, 
  Clock,
  Plus, 
  X, 
  Save 
} from 'lucide-react';
import { Medication } from '../types';

interface AddMedProps {
  onBack: () => void;
  onAdd: (med: Medication) => void;
}

export default function AddMed({ onBack, onAdd }: AddMedProps) {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('mg');
  const [instructions, setInstructions] = useState('');
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Indices: M, T, W, T, F
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const toggleDay = (index: number) => {
    setSelectedDays(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name || !dose || !hour || !minute) return;
    
    // Explicitly format into 12h time string 'hh:mm A'
    const formattedHour = hour.padStart(2, '0');
    const formattedMinute = minute.padStart(2, '0');
    const formattedTime = `${formattedHour}:${formattedMinute} ${ampm}`;

    const newMed: Medication = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      dose: `${dose}${unit}`,
      schedule: selectedDays.length === 7 ? 'Daily' : 'Custom Days',
      time: formattedTime,
      status: 'Pending',
      type: 'Pill',
      days: selectedDays,
      referenceImageUrl: referenceImageUrl || undefined
    };
    
    onAdd(newMed);
    onBack();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white transition-colors text-primary">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">New Prescription</h2>
          <p className="text-on-surface-variant font-medium">Add a new medication to the schedule.</p>
        </div>
      </header>

      {/* Manual Entry */}
      <div className="bg-white rounded-[3rem] p-8 shadow-ambient border border-outline/5 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-primary-container"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-3">
              <label className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">Medicine Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lisinopril" 
                className="w-full bg-surface border-2 border-transparent rounded-[2rem] py-5 px-6 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-lg font-bold" 
              />
           </div>
           <div className="space-y-3">
              <label className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">Dosage Amount</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="10" 
                  className="flex-1 bg-surface border-2 border-transparent rounded-[2rem] py-5 px-6 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-xl font-black text-center" 
                />
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="bg-surface border-2 border-transparent rounded-[2rem] px-6 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-black text-on-surface-variant"
                >
                  <option>mg</option>
                  <option>ml</option>
                  <option>pills</option>
                </select>
              </div>
           </div>
        </div>

        <div className="space-y-4">
           <label className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">Visual Scan (Optional)</label>
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full border-4 border-dashed border-outline/10 rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-4 hover:bg-surface hover:border-primary/20 transition-all group scale-100 hover:scale-[1.01] active:scale-95 overflow-hidden relative"
           >
              {referenceImageUrl ? (
                <img src={referenceImageUrl} alt="Reference" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              ) : null}
              <div className="w-16 h-16 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform shadow-inner relative z-10">
                <Camera className="w-8 h-8" />
              </div>
              <div className="text-center relative z-10">
                 <p className="font-black text-xl text-on-surface tracking-tight">
                   {referenceImageUrl ? 'Change Pill Photo' : 'Capture Pill Appearance'}
                 </p>
                 <p className="text-sm text-on-surface-variant font-bold max-w-[200px] mx-auto mt-1">
                   Helps MedMom verify you're taking the right one.
                 </p>
              </div>
           </button>
           <input 
             type="file" 
             accept="image/*" 
             capture="environment" 
             className="hidden" 
             ref={fileInputRef}
             onChange={handleCapture}
           />
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-[3rem] p-10 shadow-ambient border border-outline/5 space-y-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black text-on-surface tracking-tight">Dosing Schedule</h3>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">Frequency</label>
          <div className="flex justify-between">
            {days.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`w-12 h-12 rounded-2xl font-black text-sm transition-all border-2 ${
                  selectedDays.includes(i) 
                    ? 'bg-primary text-white shadow-xl border-primary scale-110 ring-4 ring-primary/10 z-10' 
                    : 'bg-surface border-transparent text-on-surface-variant'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
           <label className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">Set Time</label>
           <div className="flex flex-col gap-4">
              <div className="bg-surface p-5 rounded-[2rem] flex items-center justify-between border-2 border-transparent focus-within:border-primary/20 transition-all shadow-inner">
                 <div className="flex items-center gap-2">
                    <Clock className="w-7 h-7 text-primary mr-2" />
                    <select 
                      value={hour} 
                      onChange={(e) => setHour(e.target.value)}
                      className="bg-transparent border-none p-0 focus:ring-0 text-3xl font-black text-on-surface tracking-tighter w-16 text-center cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                    <span className="text-3xl font-black text-on-surface-variant">:</span>
                    <select 
                      value={minute} 
                      onChange={(e) => setMinute(e.target.value)}
                      className="bg-transparent border-none p-0 focus:ring-0 text-3xl font-black text-on-surface tracking-tighter w-16 text-center cursor-pointer"
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map(m => (
                        <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                 </div>
                 <div className="flex bg-white rounded-full p-1 shadow-sm border border-outline/10">
                    <button 
                      onClick={() => setAmpm('AM')}
                      className={`px-4 py-2 rounded-full text-sm font-black transition-all ${ampm === 'AM' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:bg-surface'}`}
                    >
                      AM
                    </button>
                    <button 
                      onClick={() => setAmpm('PM')}
                      className={`px-4 py-2 rounded-full text-sm font-black transition-all ${ampm === 'PM' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:bg-surface'}`}
                    >
                      PM
                    </button>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">Notes</label>
          <textarea 
             value={instructions}
             onChange={(e) => setInstructions(e.target.value)}
             placeholder="e.g. Take with a large glass of water after breakfast..." 
             className="w-full bg-surface border-none rounded-[2rem] py-6 px-8 min-h-[120px] focus:ring-4 focus:ring-primary/10 transition-all font-medium text-lg leading-relaxed" 
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 pt-4 pb-20 px-2">
         <button onClick={onBack} className="flex-1 py-6 rounded-[2rem] bg-white text-on-surface font-black text-lg hover:bg-surface transition-all shadow-sm border border-outline/5 active:scale-95">
            Dismiss
         </button>
         <button 
           onClick={handleSave} 
           disabled={!name || !dose}
           className="flex-[2] py-6 rounded-[2rem] bg-primary text-white font-black text-xl shadow-2xl hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
         >
            <Save className="w-7 h-7" />
            Complete Setup
         </button>
      </div>
    </div>
  );
}
