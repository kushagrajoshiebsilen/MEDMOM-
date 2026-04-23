import React, { useState, useEffect } from 'react';
import { 
  Users, QrCode, CheckCircle2, Heart, Smartphone, ShieldCheck, 
  Zap, Loader2, RefreshCw, AlertCircle, Pill, Clock, 
  TrendingUp, ChevronRight, Star, MoreVertical, PhoneCall, Mic
} from 'lucide-react';
import { pairWithCode } from '../services/medService';

interface FamilyMember {
  uid: string;
  displayName: string;
  picture: string | null;
  email: string;
}

interface MemberStats {
  takenToday: number;
  totalToday: number;
  adherencePct: number | null;
  nextDue: { name: string; time: string; dose: string } | null;
  allDone: boolean;
  noMeds: boolean;
}

interface EnrichedConnection {
  connectionId: string;
  status: string;
  member: FamilyMember;
  stats: MemberStats;
}

interface ConnectProps {
  connections: EnrichedConnection[];
  onViewDashboard: (memberId: string, memberName: string) => void;
}

export default function Connect({ connections, onViewDashboard }: ConnectProps) {
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingCode, setFetchingCode] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [myCode, setMyCode] = useState('');
  const [myName, setMyName] = useState('');
  const [calling, setCalling] = useState<FamilyMember | null>(null);
  const [callStatus, setCallStatus] = useState<'dialing' | 'connected'>('dialing');

  const startCall = async (member: FamilyMember) => {
    setCalling(member);
    setCallStatus('dialing');
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/calls/${member.uid}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert(`Calling ${member.displayName}... They will auto-answer on speaker.`);
    } catch (e) {
      console.error('Call failed', e);
      alert('Failed to initiate call. Is the server running?');
    }
  };

  const endCall = async () => {
    setCalling(null);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/calls/end', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
  };

  // Poll for call status while dialing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (calling && callStatus === 'dialing') {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/calls/status/${calling.uid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.status === 'connected') {
            setCallStatus('connected');
          }
        } catch (e) {}
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [calling, callStatus]);

  const fetchMyProfile = async () => {
    setFetchingCode(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFeedback({ type: 'error', msg: 'Not logged in. Please log out and back in.' });
        return;
      }
      const res = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.pairingCode) {
          setMyCode(data.pairingCode);
          setMyName(data.displayName || '');
          localStorage.setItem('user', JSON.stringify(data));
        } else {
          setFeedback({ type: 'error', msg: 'Profile loaded but pairing code is missing. Tap ↺ to retry.' });
        }
      } else {
        setFeedback({ type: 'error', msg: data.error || `Server Error: ${res.status}` });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error. Is the server running?' });
    } finally {
      setFetchingCode(false);
    }
  };

  useEffect(() => { fetchMyProfile(); }, []);

  const handlePair = async () => {
    if (pairingCodeInput.length !== 6) {
      setFeedback({ type: 'error', msg: 'Please enter a valid 6-digit code' });
      return;
    }
    setLoading(true);
    setFeedback(null);
    const res = await pairWithCode(pairingCodeInput);
    setLoading(false);
    if (res.success) {
      const msg = res.alreadyConnected
        ? `Already connected with ${res.targetUser.displayName}!`
        : `Successfully connected with ${res.targetUser.displayName}!`;
      setFeedback({ type: 'success', msg });
      setPairingCodeInput('');
    } else {
      setFeedback({ type: 'error', msg: res.error || 'Failed to connect. Check the code and try again.' });
    }
  };

  const getAdherenceColor = (pct: number | null) => {
    if (pct === null) return 'text-on-surface-variant';
    if (pct >= 80) return 'text-primary';
    if (pct >= 50) return 'text-amber-500';
    return 'text-error';
  };

  const getAdherenceBg = (pct: number | null) => {
    if (pct === null) return 'bg-surface-container';
    if (pct >= 80) return 'bg-primary/10';
    if (pct >= 50) return 'bg-amber-500/10';
    return 'bg-error/10';
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="text-center space-y-3 px-4">
        <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-2">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-on-surface">Family Care</h2>
        <p className="text-on-surface-variant max-w-xs mx-auto font-medium leading-relaxed">
          Monitor your family's health and connect new members.
        </p>
      </header>

      {/* Summary Banner */}
      {connections.length > 0 && (
        <div className="bg-on-surface text-white rounded-[2.5rem] p-6 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Family Network</p>
            <p className="text-3xl font-black">{connections.length} Member{connections.length > 1 ? 's' : ''} Connected</p>
          </div>
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
            <Heart className="w-7 h-7 fill-white/30 text-white" />
          </div>
        </div>
      )}

      {/* Calling Overlay (Simulated Auto-Answer) */}
      {calling && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-between py-20 px-8">
           <div className="text-center space-y-4 w-full mt-10">
              <div className="w-32 h-32 mx-auto rounded-full bg-white/10 p-2 mb-8 relative">
                 {calling.picture ? (
                   <img src={calling.picture} className="w-full h-full rounded-full object-cover" />
                 ) : (
                   <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-4xl font-black text-white">
                     {calling.displayName[0]}
                   </div>
                 )}
                 {callStatus === 'connected' && (
                   <div className="absolute inset-0 border-4 border-primary rounded-full animate-pulse"></div>
                 )}
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter">{calling.displayName}</h2>
              <p className="text-xl font-medium text-white/60">
                 {callStatus === 'dialing' ? 'Dialing...' : 'Connected on Speaker'}
              </p>
              {callStatus === 'connected' && (
                 <div className="flex justify-center items-center gap-2 text-primary font-bold bg-primary/20 w-fit mx-auto px-4 py-2 rounded-full mt-4">
                    <Mic className="w-5 h-5 animate-pulse" /> Auto-Answered
                 </div>
              )}
           </div>
           
           <button 
             onClick={endCall}
             className="w-20 h-20 bg-error rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all"
           >
             <PhoneCall className="w-8 h-8 text-white rotate-[135deg]" />
           </button>
        </div>
      )}

      {/* Connected Family Members */}
      {connections.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-on-surface px-1">Your Circle</h3>
          {connections.map((conn, i) => {
            const { member, stats } = conn;
            const pct = stats.adherencePct ?? 0;
            const initials = member.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const needsCall = stats.nextDue !== null; // If they have a pending med, they might need a call

            return (
              <div key={i} className="bg-[#dcf7f3] rounded-[2.5rem] p-6 shadow-sm border border-primary/5 relative">
                <button className="absolute top-6 right-6 text-primary/40 hover:text-primary transition-colors">
                  <MoreVertical className="w-6 h-6" />
                </button>
                
                <div 
                  onClick={() => onViewDashboard(member.uid, member.displayName)}
                  className="flex flex-col items-start gap-4 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {member.picture ? (
                    <img 
                      src={member.picture} 
                      alt={member.displayName}
                      className="w-16 h-16 rounded-full object-cover shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-black text-xl shadow-md">
                      {initials}
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-2xl font-black text-on-surface tracking-tight leading-none mb-2">{member.displayName}</h4>
                    <div className="inline-flex items-center gap-1.5 bg-[#fce5c3] px-3 py-1 rounded-full">
                       <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                       <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Active Now</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-xs font-bold text-primary/60">Daily Meds</span>
                     <span className="text-xs font-black text-primary">{pct}% Complete</span>
                  </div>
                  <div className="h-3 bg-primary/20 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-primary rounded-full transition-all duration-1000"
                       style={{ width: `${pct}%` }}
                     />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => onViewDashboard(member.uid, member.displayName)}
                    className="w-full bg-[#0d5952] text-white py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md active:scale-95"
                  >
                    View Dashboard <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Your Pairing Code Card */}
      <section className="bg-white rounded-[3rem] p-8 shadow-ambient border border-outline/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-60">Your Unique Code</p>
            {myName && <p className="text-sm font-bold text-on-surface mt-1">{myName}</p>}
          </div>
          <button 
            onClick={fetchMyProfile} 
            disabled={fetchingCode}
            className="p-2 hover:bg-surface rounded-full transition-all text-primary disabled:opacity-40"
            title="Refresh Code"
          >
            <RefreshCw className={`w-5 h-5 ${fetchingCode ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-2 mb-6">
          {fetchingCode ? (
            <div className="flex items-center gap-3 py-8">
               <Loader2 className="w-8 h-8 text-primary animate-spin" />
               <span className="font-bold text-on-surface-variant/60 text-sm">Loading your secure ID...</span>
            </div>
          ) : myCode ? (
            <div className="bg-surface-container/50 px-10 py-8 rounded-[2.5rem] border-2 border-primary/10 shadow-inner w-full text-center">
               <span className="text-6xl font-black text-primary tracking-[0.15em]">
                 {myCode.slice(0, 3)}-{myCode.slice(3)}
               </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-6 text-error">
               <AlertCircle className="w-6 h-6 shrink-0" />
               <span className="font-bold text-sm">Could not load code. Tap ↺ to retry.</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
           <div className="w-36 h-36 bg-surface p-3 rounded-[2rem] border border-outline/5 flex items-center justify-center">
              <QrCode className="w-24 h-24 text-on-surface/8" />
           </div>
           <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-30">Share this code with family</p>
        </div>
      </section>

      {/* Enter Family Code */}
      <section>
        <div className="bg-white rounded-[3rem] p-8 shadow-ambient border border-outline/5">
          <h3 className="text-xl font-bold text-on-surface mb-1 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Add Family Member
          </h3>
          <p className="text-xs text-on-surface-variant mb-6 font-medium">Enter their 6-digit pairing code</p>
          
          <input 
            type="text" 
            inputMode="numeric"
            maxLength={6}
            value={pairingCodeInput}
            onChange={(e) => setPairingCodeInput(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full bg-surface border-2 border-transparent focus:border-primary/30 focus:bg-white p-6 rounded-[2rem] text-center text-4xl font-black tracking-[0.5em] transition-all outline-none shadow-inner"
          />

          {feedback && (
            <div className={`mt-4 p-4 rounded-2xl flex items-start gap-3 ${
              feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-error-container/20 text-error'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <Zap className="w-5 h-5 mt-0.5 shrink-0" />}
              <p className="text-xs font-bold">{feedback.msg}</p>
            </div>
          )}

          <button 
            onClick={handlePair}
            disabled={loading || pairingCodeInput.length !== 6}
            className="w-full mt-6 bg-on-surface text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-25 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Linking...
              </span>
            ) : 'Connect Family Member'}
          </button>
        </div>
      </section>

      {connections.length === 0 && !fetchingCode && (
        <div className="text-center py-8 opacity-40 space-y-2">
          <Users className="w-10 h-10 mx-auto text-on-surface-variant" />
          <p className="text-sm font-bold text-on-surface-variant">No family members connected yet.</p>
          <p className="text-xs text-on-surface-variant">Enter a family member's 6-digit code above to get started.</p>
        </div>
      )}
    </div>
  );
}
