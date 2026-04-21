import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Heart,
  Pill,
  Bell,
  ChevronRight,
  Search,
  Loader2
} from 'lucide-react';
import { findUserByEmail, createConnectionRequest } from '../services/medService';
import { auth } from '../lib/firebase';

interface ConnectProps {
  onAddFamilyMember: (name: string) => void;
  onViewMember: (name: string | null) => void;
  trackedMembers: string[];
}

export default function Connect({ onAddFamilyMember, onViewMember, trackedMembers }: ConnectProps) {
  const [email, setEmail] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const isTrackingMom = trackedMembers.includes('Mom');

  const handleConnect = async () => {
    if (!email || !auth.currentUser) return;
    setSearching(true);
    setError(null);
    try {
      const user = await findUserByEmail(email);
      if (user) {
        await createConnectionRequest(auth.currentUser.uid, user.uid, 'Family');
        onAddFamilyMember((user as any).displayName || 'Mom');
        setEmail('');
      } else {
        setError("User not found. Ensure they have signed up for MedMom.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection failed. Try again later.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in slide-in-from-bottom duration-500">
      <header className="text-center space-y-3">
        <h2 className="text-4xl font-bold text-on-surface leading-tight tracking-tight">Family Connections</h2>
        <p className="text-on-surface-variant max-w-sm mx-auto">Sync health journeys with your loved ones for peace of mind.</p>
      </header>

      {/* Tracked Members List */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-on-surface-variant uppercase tracking-[0.2em] px-2">Connected Family</h3>
        {!isTrackingMom ? (
          <button 
            onClick={() => onAddFamilyMember('Mom')}
            className="w-full p-8 rounded-[2.5rem] bg-white border-2 border-dashed border-primary/20 flex items-center justify-between group hover:border-primary transition-all shadow-sm"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                <UserPlus className="w-8 h-8" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xl text-on-surface">Add Mom</p>
                <p className="text-xs text-on-surface-variant font-medium">Track her medicine adherence</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-on-surface-variant/20" />
          </button>
        ) : (
          <div className="p-5 rounded-[2.5rem] bg-white shadow-md flex items-center justify-between border border-outline/5 transition-all">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                   src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOuIt087l2Bq_WZyohOn2jgycszFH09C0VPFo6eg6AhmerSRoXm9WCcR8m_m2bx4mIxiV5hZ_w4qCuUjg1l097qKQkKYYfEk07HoNhijZ2lf3zQwPSFnq9p27YFMKocFDbhtfz45lR8xG3kmr2Vccqyh9q9RJ2MORcJczS9Sidmdh_fv-Vamy0DPIbIb2iBGvfC_6Hrxz6r7hMsg6_DQj3Ikls-b4HHGOTq8_4hNYHiG2r3dwzoOjQyHS69MOIY2mYdcxQneSHmD-7" 
                   className="w-16 h-16 rounded-full object-cover shadow-md" 
                   alt="Mom"
                   referrerPolicy="no-referrer"
                />
                <div className="absolute -right-1 -top-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white"></div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg text-on-surface">Mom (Elena)</p>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Active & Tracked</p>
              </div>
            </div>
            <button 
              onClick={() => onViewMember('Mom')}
              className="bg-primary-container text-primary px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
            >
              View Status
            </button>
          </div>
        )}
      </section>

      {/* Email Search Card */}
      <section className="bg-white rounded-[3rem] shadow-ambient p-10 relative overflow-hidden border border-outline/5 transition-all">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
        <div className="text-center mb-8">
           <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] mb-3">Add Loved One</p>
           <h3 className="text-2xl font-black text-on-surface tracking-tight">Connect by Email</h3>
        </div>
        
        <div className="space-y-4">
           <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="family@example.com"
                className="w-full bg-surface border-2 border-transparent focus:border-primary/20 rounded-[2rem] py-5 pl-14 pr-6 focus:ring-4 focus:ring-primary/5 transition-all font-bold"
              />
           </div>
           
           {error && (
             <p className="text-error text-xs font-bold text-center px-4 animate-in fade-in">{error}</p>
           )}

           <button 
             onClick={handleConnect}
             disabled={searching || !email}
             className="w-full bg-primary text-white py-5 rounded-[2rem] font-black shadow-xl hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
           >
             {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
             Send Connection Invite
           </button>
        </div>

        <p className="mt-8 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest text-center">
           They must have a MedMom account first.
        </p>
      </section>

      {/* Status Card */}
      <div className="bg-tertiary-container/10 rounded-3xl p-6 flex items-center gap-5 border border-tertiary/10">
        <div className="w-14 h-14 rounded-full bg-tertiary text-white flex items-center justify-center shrink-0 shadow-lg">
          <Clock className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-on-surface">Pending Requests</h3>
          <p className="text-on-surface-variant font-medium">No other pending connections.</p>
        </div>
      </div>
    </div>
  );
}
