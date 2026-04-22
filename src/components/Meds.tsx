import React, { useState } from 'react';
import { 
  Plus, 
  Pill, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Trash2,
  Settings2,
  X
} from 'lucide-react';
import { Medication } from '../types';

interface MedsProps {
  onAction: (action: string) => void;
  meds: Medication[];
  onDelete: (id: string) => void;
}

export default function Meds({ onAction, meds, onDelete }: MedsProps) {
  const [isManaging, setIsManaging] = useState(false);

  return (
    <div className="space-y-8 pb-20 animate-in slide-in-from-bottom duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-on-surface">Medications</h2>
          <p className="text-on-surface-variant font-medium">Your active prescriptions</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsManaging(!isManaging)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isManaging ? 'bg-error text-white shadow-lg' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {isManaging ? <X className="w-7 h-7" /> : <Settings2 className="w-7 h-7" />}
          </button>
          <button 
            onClick={() => onAction('add')}
            className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      </header>

      {/* Prescription List */}
      <section className="space-y-4">
        {meds.map((med) => (
          <div key={med.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-outline/5 flex items-center justify-between group hover:border-primary/20 transition-all overflow-hidden relative">
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${
                med.status === 'Taken' ? 'bg-primary/5 text-primary' : 'bg-surface-container text-on-surface-variant'
              }`}>
                <Pill className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface">{med.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black text-on-surface-variant/40 uppercase tracking-widest">{med.dose}</span>
                  <span className="w-1 h-1 rounded-full bg-outline/20"></span>
                  <span className="text-xs font-bold text-primary">{med.time}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isManaging ? (
                <button 
                  onClick={() => onDelete(med.id)}
                  className="bg-error-container text-error p-3 rounded-2xl active:scale-90 transition-all shadow-md animate-in zoom-in duration-300"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              ) : (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-on-surface-variant/20 uppercase tracking-widest">Schedule</p>
                    <p className="font-bold text-sm text-on-surface-variant">{med.schedule}</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-on-surface-variant/20 group-hover:text-primary transition-colors" />
                </>
              )}
            </div>
          </div>
        ))}
        {meds.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-surface-container rounded-full mx-auto flex items-center justify-center text-on-surface-variant/20">
              <Pill className="w-10 h-10" />
            </div>
            <p className="text-on-surface-variant font-bold">No medications added yet.</p>
            <button 
              onClick={() => onAction('add')}
              className="text-primary font-black text-xs uppercase tracking-widest hover:underline"
            >
              Add your first prescription
            </button>
          </div>
        )}
      </section>

      {/* Info Card */}
      <section className="bg-white rounded-[3rem] p-8 shadow-ambient border border-outline/5 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
           <AlertTriangle className="w-32 h-32 rotate-12" />
         </div>
         <h4 className="text-xs font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-4">Medication Safety</h4>
         <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
            MedMom uses AI to help verify your pills, but always double-check the label on your prescription bottle. 
            If you're unsure, consult your doctor or pharmacist.
         </p>
      </section>
    </div>
  );
}
