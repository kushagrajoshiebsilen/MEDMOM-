import React from 'react';
import { 
  BellRing, 
  Volume2, 
  VolumeX, 
  UserPlus, 
  Phone, 
  ChevronRight,
  ShieldAlert,
  SwitchCamera,
  School,
  Zap,
  Bell,
  UserCog
} from 'lucide-react';
import { AppSettings, AlertPreference } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function Settings({ settings, onUpdateSettings }: SettingsProps) {
  const updatePref = (pref: AlertPreference) => {
    onUpdateSettings({ ...settings, alertPreference: pref });
  };

  const toggleCollegeMode = () => {
    onUpdateSettings({ ...settings, collegeMode: !settings.collegeMode });
  };

  const handleRoleChange = async (role: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });
      // Optionally update local user state if needed, but for now we just save
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...user, role }));
      window.location.reload(); // Refresh to apply role-based UI changes
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="space-y-8 pb-32 animate-in slide-in-from-bottom duration-500">
      <header className="px-2 space-y-2">
        <h2 className="text-4xl font-bold tracking-tight text-on-surface">Settings & Safety</h2>
        <p className="text-on-surface-variant max-w-lg font-medium">Customize how MedMom nudges you and manage safety protocols.</p>
      </header>

      {/* Role Management */}
      <section className="bg-white rounded-[3rem] p-8 shadow-ambient border border-outline/5 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
            <UserCog className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-on-surface">User Profile Role</h3>
        </div>
        
        <div className="flex gap-2 p-1 bg-surface rounded-2xl">
          {['standard', 'parent', 'child'].map((r) => (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                currentUser.role === r ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="text-[10px] font-medium text-on-surface-variant opacity-60 px-2 leading-relaxed">
          Switching roles changes your dashboard view and available family tracking features.
        </p>
      </section>

      {/* Alarm Preference Section */}
      <section className="bg-white rounded-[3rem] p-8 shadow-ambient border border-outline/5 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <Zap className="w-6 h-6 fill-primary/20" />
          </div>
          <h3 className="text-xl font-bold text-on-surface">Alarm Sensitivity</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => updatePref('loud')}
            className={`p-6 rounded-[2rem] border-2 transition-all text-left flex items-center gap-5 ${
              settings.alertPreference === 'loud' ? 'border-primary bg-primary/5 shadow-md ring-4 ring-primary/5' : 'border-transparent bg-surface hover:bg-surface-container-low'
            }`}
          >
            <div className={`p-4 rounded-2xl ${settings.alertPreference === 'loud' ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
              <Volume2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-black text-on-surface tracking-tight">Standard Alarm</p>
              <p className="text-xs text-on-surface-variant font-bold leading-tight">Loud ringstone for those who forget easy.</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${settings.alertPreference === 'loud' ? 'bg-primary border-primary' : 'border-outline/20'}`}>
              {settings.alertPreference === 'loud' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
            </div>
          </button>

          <button 
            onClick={() => updatePref('notification')}
            className={`p-6 rounded-[2rem] border-2 transition-all text-left flex items-center gap-5 ${
              settings.alertPreference === 'notification' ? 'border-primary bg-primary/5 shadow-md ring-4 ring-primary/5' : 'border-transparent bg-surface hover:bg-surface-container-low'
            }`}
          >
            <div className={`p-4 rounded-2xl ${settings.alertPreference === 'notification' ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
              <Bell className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-black text-on-surface tracking-tight">The "Little Push"</p>
              <p className="text-xs text-on-surface-variant font-bold leading-tight">Silent notification or vibration only nudge.</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${settings.alertPreference === 'notification' ? 'border-primary border-primary' : 'border-outline/20'}`}>
              {settings.alertPreference === 'notification' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
            </div>
          </button>
        </div>

        {/* College Mode Toggle */}
        <div 
          onClick={toggleCollegeMode}
          className={`p-6 rounded-[2rem] transition-all flex items-center gap-5 cursor-pointer group ${
            settings.collegeMode ? 'bg-secondary-container/20 border-2 border-secondary/20 shadow-md transform scale-[1.02]' : 'bg-surface border-2 border-transparent'
          }`}
        >
          <div className={`p-4 rounded-2xl transition-all ${settings.collegeMode ? 'bg-secondary text-white ring-4 ring-secondary/20' : 'bg-surface-container-high text-on-surface-variant'}`}>
            <School className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-black text-on-surface tracking-tight text-lg">College Mode</p>
              {settings.collegeMode && <span className="bg-secondary text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Active</span>}
            </div>
            <p className="text-xs text-on-surface-variant font-bold leading-tight">
              Quiet reminders every 10 min. No loud alarms while you're in class.
            </p>
          </div>
          <div className={`w-14 h-8 rounded-full p-1 transition-all flex items-center ${settings.collegeMode ? 'bg-secondary justify-end' : 'bg-surface-container-high justify-start'}`}>
            <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
          </div>
        </div>

        {/* Test Alarm Sound */}
        <button 
          onClick={() => {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3");
            audio.play().catch(e => alert("Please allow sound in your browser settings."));
          }}
          className="w-full bg-surface-container-low text-primary py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 transition-all active:scale-95"
        >
          <Volume2 className="w-4 h-4" />
          Test Alarm Sound
        </button>
      </section>

      {/* Emergency Contacts */}
      <section className="bg-white rounded-[3rem] p-8 shadow-ambient border border-outline/5 space-y-8">
         <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-error-container/20 rounded-2xl text-error shadow-inner">
                  <ShieldAlert className="w-6 h-6 fill-error/20" />
               </div>
               <h3 className="text-xl font-bold text-on-surface">Emergency Trusted</h3>
            </div>
            <button className="bg-primary-container text-primary px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm">
               Add
            </button>
         </div>

         <div className="space-y-4">
            <div className="bg-surface p-5 rounded-[2rem] flex items-center justify-between border border-outline/5 group hover:bg-white hover:border-primary/20 transition-all cursor-pointer shadow-sm">
               <div className="flex items-center gap-4">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB82XzdxCufjxYE35SyBaopVj6xboaCyIQQXZgW-TWz1_bYXLDZfeBltSA2RMzQdbqYTlrwB1X66lXc9E1-ir9SWNIsFFOrghf4lJjylw6GidZm5o3OZ4Uh5_8h5kI-QifGoImv3PlnFidsPt1XXZze-GL4WUZsK6gHdeJBQcWKJ49udjRAazbjAzmlQ8RuELp_YtkRjp98ielFJx-orEZYNpdz8mi2fqZlRBGxwlJalu7JHaZQLNWKW_fGG238EgrRCThRS64LYHQe" className="w-14 h-14 rounded-full object-cover shadow-md ring-2 ring-white" alt="Son" referrerPolicy="no-referrer" />
                  <div>
                     <p className="font-bold text-lg text-on-surface">David Chen</p>
                     <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Primary • Son</p>
                  </div>
               </div>
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                 <Phone className="w-5 h-5" />
               </div>
            </div>
         </div>
      </section>

      <div className="flex flex-col gap-4 px-4 pt-10">
         <p className="text-center text-[10px] font-black text-on-surface-variant/20 uppercase tracking-[0.2em] mb-4">You are protected by MedMom Secure 2.0</p>
      </div>
    </div>
  );
}
