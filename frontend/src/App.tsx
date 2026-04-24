import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Connect from './components/Connect';
import Reports from './components/Reports';
import Settings from './components/Settings';
import AddMed from './components/AddMed';
import CameraVerify from './components/CameraVerify';
import Meds from './components/Meds';
import VoiceCall from './components/VoiceCall';
import { Medication, User, AppSettings } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Camera, X } from 'lucide-react';
import { 
  subscribeToMeds, 
  addMedication, 
  updateMedicationStatus, 
  deleteMedication,
  subscribeToConnections 
} from './services/medService';
import { callService } from './services/callService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [view, setView] = useState<'main' | 'add' | 'camera' | 'alarm'>('main');
  const [viewingFamilyName, setViewingFamilyName] = useState<string | null>(null);
  const [viewingFamilyId, setViewingFamilyId] = useState<string | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [targetMeds, setTargetMeds] = useState<Medication[]>([]);
  const [healthReports, setHealthReports] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    alertPreference: 'loud',
    collegeMode: false,
    vibrationEnabled: true
  });

  // Call State
  const [callSession, setCallSession] = useState<{
    status: 'idle' | 'ringing' | 'connected';
    callerName: string;
    targetUid: string;
    isIncoming: boolean;
    remoteStream: MediaStream | null;
  }>({ status: 'idle', callerName: '', targetUid: '', isIncoming: false, remoteStream: null });

  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const [lastTriggeredTime, setLastTriggeredTime] = useState<string | null>(null);

  // Sound Management & Autoplay Unlock
  useEffect(() => {
    const unlockAudio = () => {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.play().then(() => alarmAudioRef.current?.pause()).catch(() => {});
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    const playAlarm = async () => {
      if (view === 'alarm') {
        try {
          if (alarmAudioRef.current) {
            alarmAudioRef.current.volume = 1.0;
            await alarmAudioRef.current.play();
          }
        } catch (e) { console.log('Autoplay blocked'); }
      } else {
        if (alarmAudioRef.current) {
          alarmAudioRef.current.pause();
          alarmAudioRef.current.currentTime = 0;
        }
      }
    };
    playAlarm();
  }, [view]);

  // Auth Restoration & Sync
  useEffect(() => {
    const syncProfile = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setCurrentUser(data);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(data));
          }
        } catch (e) {
          // Fallback to local storage if offline
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
          }
        }
      }
    };
    syncProfile();
  }, []);

  // Initialize Call Service
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      callService.init(currentUser.uid);

      callService.onIncomingCall(({ callerId, callerName }) => {
        setCallSession({ status: 'ringing', callerName, targetUid: callerId, isIncoming: true, remoteStream: null });
      });

      callService.onCallAccepted(() => {
        setCallSession(prev => ({ ...prev, status: 'connected' }));
        callService.createOffer();
      });

      callService.onRemoteStream((stream) => {
        setCallSession(prev => ({ ...prev, remoteStream: stream }));
      });

      callService.onCallEnded(() => {
        setCallSession({ status: 'idle', callerName: '', targetUid: '', isIncoming: false, remoteStream: null });
      });
    }
  }, [isAuthenticated, currentUser]);

  // Sync Data
  useEffect(() => {
    if (currentUser) {
      subscribeToMeds(currentUser.uid, setMeds);
      subscribeToConnections(currentUser.uid, setConnections);
    }
  }, [currentUser]);

  useEffect(() => {
    if (viewingFamilyId) subscribeToMeds(viewingFamilyId, setTargetMeds);
  }, [viewingFamilyId]);

  // Notification Polling (Keep for alerts, remove for calls)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.notifications) setNotifications(data.notifications);
      } catch (e) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Alarm Loop
  useEffect(() => {
    if (!isAuthenticated || meds.length === 0 || view !== 'main') return;
    const interval = setInterval(() => {
      const now = new Date();
      const currentIST = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      const isDueNow = meds.some(m => m.status === 'Pending' && m.time === currentIST);
      if (isDueNow && currentIST !== lastTriggeredTime && !settings.collegeMode && settings.alertPreference === 'loud') {
        setLastTriggeredTime(currentIST);
        setView('alarm');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [meds, view, settings, isAuthenticated, lastTriggeredTime]);

  const handleAction = async (type: string, id?: string, name?: string) => {
    try {
      if (type === 'add') { setView('add'); return; }
      if (type === 'verify') { setView('camera'); return; }
      
      if (type === 'remind' && currentUser) {
        if (!id) { alert('No family member selected.'); return; }
        alert(`Nudge sent to ${name}!`); // Immediate feedback
        const token = localStorage.getItem('token');
        fetch(`/api/remind/${id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Time for your medicine, ${name}!` })
        }).catch(e => console.error("Remind error:", e));
        return;
      }
      
      if (type === 'call') {
        if (id && currentUser) {
          setCallSession({ status: 'ringing', callerName: name || 'Loved One', targetUid: id, isIncoming: false, remoteStream: null });
          callService.startCall(id, currentUser.uid, currentUser.displayName).catch(e => {
            console.error("Call error:", e);
            alert("Could not start call: Please ensure microphone permissions are granted.");
            setCallSession({ status: 'idle', callerName: '', targetUid: '', isIncoming: false, remoteStream: null });
          });
        } else {
          alert('Could not start call. Please select a family member.');
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Action failed: ' + err.message);
    }
  };

  const handleAnswerCall = () => {
    setCallSession(prev => ({ ...prev, status: 'connected' }));
    callService.acceptCall(callSession.targetUid);
  };

  const handleEndCall = () => {
    callService.endCall(callSession.targetUid);
    setCallSession({ status: 'idle', callerName: '', targetUid: '', isIncoming: false, remoteStream: null });
  };

  if (!isAuthenticated) return <Onboarding onFinishOnboarding={(u) => { setCurrentUser(u); setIsAuthenticated(true); }} />;
  if (view === 'add') return (
    <AddMed 
      onBack={() => setView('main')} 
      onAdd={async (m) => { 
        if (currentUser) {
          // Optimistic Add
          setMeds(prev => [...prev, m]);
          await addMedication(currentUser.uid, m);
        }
        setView('main');
      }} 
    />
  );
  if (view === 'camera') return (
    <CameraVerify 
      medication={meds.find(m => m.status === 'Pending')} 
      onBack={(s) => { 
        if (s && currentUser) {
          const medId = meds.find(m => m.status === 'Pending')!.id;
          // Optimistic Update
          setMeds(prev => prev.map(m => m.id === medId ? { ...m, status: 'Taken' } : m));
          updateMedicationStatus(currentUser.uid, medId, 'Taken');
        }
        setView('main');
      }} 
    />
  );

  return (
    <>
      {/* Audio Engine for Alarms */}
      <audio ref={alarmAudioRef} src="https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3" loop preload="auto" />
      {view === 'alarm' && (
        <div className="fixed inset-0 z-[100] bg-error flex flex-col items-center justify-center p-8 text-center text-white">
          <h2 className="text-4xl font-black mb-4">CRITICAL DOSE DUE</h2>
          <button onClick={() => setView('camera')} className="bg-white text-error py-6 px-12 rounded-full text-xl font-black shadow-2xl">VERIFY NOW</button>
        </div>
      )}

      {/* Real-Time Voice Call UI */}
      {callSession.status !== 'idle' && (
        <VoiceCall 
          callerName={callSession.callerName}
          isIncoming={callSession.isIncoming}
          status={callSession.status}
          remoteStream={callSession.remoteStream}
          onAnswer={handleAnswerCall}
          onDecline={handleEndCall}
        />
      )}

      {/* Notifications */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div initial={{ y: -100 }} animate={{ y: 20 }} exit={{ y: -100 }} className="fixed top-0 left-0 right-0 z-[400] px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 border-l-8 border-primary flex justify-between items-center">
              <p className="font-bold text-on-surface">{notifications[0].message}</p>
              <button onClick={async () => { const token = localStorage.getItem('token'); await fetch('/api/notifications/clear', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); setNotifications([]); }}><X /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Layout 
        activeTab={activeTab} 
        onTabChange={(t) => { setActiveTab(t); if (t !== 'home') { setViewingFamilyId(null); setViewingFamilyName(null); } }} 
        userRole={currentUser?.role || 'standard'} 
        onShowEmergency={() => alert('SOS Sent!')}
        onLogout={() => { localStorage.clear(); window.location.reload(); }}
      >
        {activeTab === 'home' && (
          <Dashboard 
            role={currentUser?.role || 'standard'} 
            onAction={handleAction}
            trackedFamilyName={viewingFamilyName}
            trackedFamilyId={viewingFamilyId}
            meds={viewingFamilyId ? targetMeds : meds}
            settings={settings}
          />
        )}
        {activeTab === 'meds' && <Meds onAction={handleAction} meds={meds} onDelete={(id) => currentUser && deleteMedication(currentUser.uid, id)} />}
        {activeTab === 'connect' && <Connect connections={connections} onViewDashboard={(id, name) => { setViewingFamilyId(id); setViewingFamilyName(name); setActiveTab('home'); }} />}
        {activeTab === 'reports' && <Reports meds={meds} healthReports={currentUser?.healthReports || []} />}
        {activeTab === 'settings' && <Settings settings={settings} onUpdateSettings={setSettings} />}
      </Layout>
    </>
  );
}
