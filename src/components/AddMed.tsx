import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Camera, 
  Calendar, 
  Clock,
  Plus, 
  Save,
  CheckCircle2
} from 'lucide-react';
import { Medication } from '../types';
import { motion, AnimatePresence } from 'motion/react';

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
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [showTimeGrid, setShowTimeGrid] = useState<'hour' | 'minute' | null>(null);

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
      reader.onloadend = () => setReferenceImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name || !dose || !hour || !minute) return;
    const formattedTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} ${ampm}`;
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 rounded-full bg-white shadow-sm text-primary active:scale-90 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black text-on-surface tracking-tighter">New Script</h2>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest opacity-60">Schedule a medication</p>
        </div>
      </header>

      {/* Basic Info */}
      <div className="bg-white rounded-[3rem] p-8 shadow-ambient border border-outline/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Medicine Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Advil" 
                className="w-full bg-surface border-2 border-transparent rounded-3xl py-6 px-6 focus:border-primary transition-all text-xl font-bold placeholder:opacity-20 shadow-inner" 
              />
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Dosage</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="50" 
                  className="flex-1 bg-surface border-2 border-transparent rounded-3xl py-6 px-6 focus:border-primary transition-all text-2xl font-black text-center shadow-inner" 
                />
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="bg-surface border-2 border-transparent rounded-3xl px-6 font-black text-on-surface-variant shadow-inner"
                >
                  <option>mg</option><option>ml</option><option>pills</option>
                </select>
              </div>
           </div>
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-24 border-4 border-dashed border-outline/10 rounded-[2.5rem] flex items-center justify-between px-8 hover:bg-surface transition-all active:scale-[0.98] overflow-hidden group"
        >
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Camera className="w-6 h-6" />
             </div>
             <div className="text-left">
                <p className="font-black text-on-surface">Reference Photo</p>
                <p className="text-xs text-on-surface-variant font-bold opacity-40">Helps AI verify your dose</p>
             </div>
          </div>
          {referenceImageUrl && <CheckCircle2 className="w-8 h-8 text-primary" />}
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleCapture} />
        </button>
      </div>

      {/* Tactical Schedule */}
      <div className="bg-white rounded-[3rem] p-8 shadow-ambient border border-outline/5 space-y-10">
        <div className="space-y-6">
           <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Frequency</label>
           <div className="flex justify-between">
              {days.map((day, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`w-12 h-12 rounded-2xl font-black text-sm transition-all border-2 ${
                    selectedDays.includes(i) ? 'bg-primary text-white border-primary shadow-lg scale-110' : 'bg-surface border-transparent text-on-surface-variant opacity-40'
                  }`}
                >
                  {day}
                </button>
              ))}
           </div>
        </div>

        {/* PREMIUM CLOCK UI */}
        <div className="space-y-6">
           <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Alarm Time</label>
           
              <div className="flex items-center justify-center gap-12 bg-surface rounded-[3rem] p-12 border-2 border-primary/5 shadow-inner">
                 {/* Hours Dial */}
                 <div className="flex flex-col items-center gap-4">
                    <button 
                      onClick={() => setHour(prev => (parseInt(prev) % 12 + 1).toString().padStart(2, '0'))}
                      className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary active:scale-90 transition-all"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                    <input 
                      type="text" 
                      value={hour} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                        if (val !== '' && parseInt(val) > 12) setHour('12');
                        else setHour(val);
                      }}
                      onBlur={() => {
                        if (!hour || parseInt(hour) === 0) setHour('12');
                        else setHour(hour.padStart(2, '0'));
                      }}
                      className="w-32 text-center text-8xl font-black text-on-surface tracking-tighter tabular-nums bg-transparent border-none focus:ring-0 focus:outline-none p-0" 
                    />
                    <button 
                      onClick={() => setHour(prev => (parseInt(prev) === 1 ? 12 : parseInt(prev) - 1).toString().padStart(2, '0'))}
                      className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary active:scale-90 transition-all"
                    >
                      <div className="w-6 h-1 bg-primary rounded-full"></div>
                    </button>
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Hours</label>
                 </div>

                 <span className="text-5xl font-black text-on-surface-variant/20 mb-8">:</span>

                 {/* Minutes Dial */}
                 <div className="flex flex-col items-center gap-4">
                    <button 
                      onClick={() => setMinute(prev => ((parseInt(prev) + 5) % 60).toString().padStart(2, '0'))}
                      className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary active:scale-90 transition-all"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                    <input 
                      type="text" 
                      value={minute} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                        if (val !== '' && parseInt(val) > 59) setMinute('59');
                        else setMinute(val);
                      }}
                      onBlur={() => {
                        if (!minute) setMinute('00');
                        else setMinute(minute.padStart(2, '0'));
                      }}
                      className="w-32 text-center text-8xl font-black text-on-surface tracking-tighter tabular-nums bg-transparent border-none focus:ring-0 focus:outline-none p-0" 
                    />
                    <button 
                      onClick={() => setMinute(prev => (parseInt(prev) === 0 ? 55 : parseInt(prev) - 5).toString().padStart(2, '0'))}
                      className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary active:scale-90 transition-all"
                    >
                      <div className="w-6 h-1 bg-primary rounded-full"></div>
                    </button>
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Minutes</label>
                 </div>
                 
                 <div className="flex flex-col gap-4">
                    {['AM', 'PM'].map(p => (
                      <button
                        key={p}
                        onClick={() => setAmpm(p)}
                        className={`px-8 py-5 rounded-[1.5rem] font-black text-lg transition-all ${ampm === p ? 'bg-primary text-white shadow-xl scale-110' : 'bg-white text-on-surface-variant opacity-40 shadow-sm'}`}
                      >
                        {p}
                      </button>
                    ))}
                 </div>
              </div>
        </div>

        <div className="space-y-4">
           <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Instructions</label>
           <textarea 
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take with food" 
              className="w-full bg-surface border-none rounded-3xl py-6 px-8 min-h-[120px] focus:ring-4 focus:ring-primary/10 font-bold text-lg" 
           />
        </div>
      </div>

      <button 
        onClick={handleSave} 
        disabled={!name || !dose}
        className="w-full py-8 rounded-[2.5rem] bg-primary text-white font-black text-2xl shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-20"
      >
        Save Medication
      </button>
    </div>
  );
}
