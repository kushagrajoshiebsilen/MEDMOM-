import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Connect from './components/Connect';
import Reports from './components/Reports';
import Settings from './components/Settings';
import AddMed from './components/AddMed';
import CameraVerify from './components/CameraVerify';
import Meds from './components/Meds';
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
  const [targetHealthReports, setTargetHealthReports] = useState<any[]>([]);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string, callerName: string } | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    alertPreference: 'loud',
    collegeMode: false,
    vibrationEnabled: true
  });

  // Auth Session Restoration
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Meds Sync
  useEffect(() => {
    if (currentUser) {
      return subscribeToMeds(currentUser.uid, setMeds);
    }
  }, [currentUser]);

  // Connections Sync
  useEffect(() => {
    if (currentUser) {
      return subscribeToConnections(currentUser.uid, setConnections);
    }
  }, [currentUser]);

  // Target Meds Sync (for View-Only Mode)
  useEffect(() => {
    if (viewingFamilyId) {
      return subscribeToMeds(viewingFamilyId, setTargetMeds);
    }
  }, [viewingFamilyId]);

  // Poll for Incoming Calls
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        // Handle Call
        if (data.activeCall && data.activeCall.status === 'ringing') {
          setIncomingCall({ callerId: data.activeCall.callerId, callerName: data.activeCall.callerName });
          await fetch('/api/calls/answer', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } else if (!data.activeCall || data.activeCall.status === 'ended') {
          setIncomingCall(null);
        }

        // Handle Notifications
        if (data.notifications) {
          setNotifications(data.notifications);
        }

        // Handle Health Reports
        if (data.healthReports) {
          setHealthReports(data.healthReports);
        }
      } catch (e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleFinishOnboarding = async (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleAction = async (action: string) => {
    if (action === 'add') setView('add');
    if (action === 'upload') setView('camera');
    
    if (action.startsWith('call:')) {
      if (viewingFamilyId) {
        // Trigger call for the currently viewed member
        const member = connections.find(c => c.member.uid === viewingFamilyId)?.member;
        if (member) {
          try {
            const token = localStorage.getItem('token');
            await fetch(`/api/calls/${member.uid}/start`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            // We can show a toast or alert here
            alert(`Calling ${member.displayName}... They will auto-answer on speaker.`);
          } catch (e) {
            console.error('Call failed', e);
          }
        }
      }
    }

    if (action.startsWith('remind:')) {
      const name = action.split(':')[1];
      if (viewingFamilyId) {
        try {
          const token = localStorage.getItem('token');
          await fetch(`/api/remind/${viewingFamilyId}`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: `Please take your medication. Your family is checking in on you!` })
          });
          alert(`Reminder sent to ${name}!`);
        } catch (e) {
          console.error('Reminder failed', e);
        }
      }
    }
  };

  const handleBack = () => {
    setView('main');
    setViewingFamilyName(null);
    setViewingFamilyId(null);
  };

  const handleDeleteMed = async (id: string) => {
    if (currentUser) {
      await deleteMedication(currentUser.uid, id);
    }
  };

  const handleVerifySuccess = async () => {
    const firstPending = meds.find(m => m.status === 'Pending');
    if (firstPending && currentUser) {
      await updateMedicationStatus(currentUser.uid, firstPending.id, 'Taken');
    }
    setView('main');
  };

  const handleAddMed = async (med: Medication) => {
    if (currentUser) {
      const { id, ...medData } = med;
      await addMedication(currentUser.uid, medData);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setCurrentUser(null);
    window.location.reload();
  };

  // Alarm System Logic (Checks IST Time)
  useEffect(() => {
    if (!isAuthenticated || meds.length === 0 || view !== 'main') return;

    const interval = setInterval(() => {
      // Get current time in Indian Standard Time (IST)
      const now = new Date();
      const currentIST = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Check if any pending medication matches the current minute exactly
      const isDueNow = meds.some(m => m.status === 'Pending' && m.time === currentIST);

      if (isDueNow && !settings.collegeMode && settings.alertPreference === 'loud') {
        setView('alarm');
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [meds, view, settings, isAuthenticated]);

  const clearNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications([]);
    } catch (e) {}
  };

  if (!isAuthenticated) {
    return <Onboarding onFinishOnboarding={handleFinishOnboarding} />;
  }

  if (view === 'add') {
    return <AddMed onBack={handleBack} onAdd={handleAddMed} />;
  }

  if (view === 'camera') {
    const pendingMed = meds.find(m => m.status === 'Pending');
    return <CameraVerify medication={pendingMed} onBack={(success) => success ? handleVerifySuccess() : handleBack()} />;
  }

  if (view === 'alarm') {
    return (
      <div className="fixed inset-0 z-[100] bg-error flex flex-col items-center justify-center p-8 text-center text-white">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 border-4 border-white/40"
        >
          <Bell className="w-12 h-12 fill-white shrink-0" />
        </motion.div>
        
        <h2 className="text-4xl font-black mb-4">CRITICAL DOSE DUE</h2>
        <p className="text-xl mb-12 opacity-90 max-w-xs">
          Your medication is now due. <br />
          <span className="font-bold underline">Snooze is disabled.</span> <br />
          Verify with photo to stop alarm.
        </p>

        <button 
          onClick={() => setView('camera')}
          className="w-full bg-white text-error py-6 rounded-[2rem] text-xl font-black flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
        >
          <Camera className="w-8 h-8" />
          VERIFY NOW
        </button>
        
        <p className="mt-12 text-sm font-bold opacity-60 flex items-center gap-2">
          <X className="w-4 h-4" /> NO OTHER WAY TO DISMISS
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Global Incoming Call Overlay */}
      {incomingCall && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-between py-20 px-8">
           <div className="text-center space-y-4 w-full mt-10">
              <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)] animate-pulse mb-8">
                <Bell className="w-16 h-16 text-primary" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter">{incomingCall.callerName}</h2>
              <p className="text-xl font-medium text-white/60">Connected on Speaker</p>
              
              <div className="flex justify-center items-center gap-2 text-primary font-bold bg-primary/20 w-fit mx-auto px-4 py-2 rounded-full mt-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> Auto-Answered
              </div>
           </div>
           
           <button 
             onClick={async () => {
                setIncomingCall(null);
                const token = localStorage.getItem('token');
                await fetch('/api/calls/end', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
             }}
             className="w-20 h-20 bg-error rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all"
           >
             <X className="w-8 h-8 text-white" />
           </button>
        </div>
      )}

      {/* Global Notifications Tray */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[400] px-4 pointer-events-none"
          >
            <div className="max-w-md mx-auto bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-primary/10 p-6 pointer-events-auto relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
               <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Bell className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">New Message from {notifications[0].fromName}</p>
                    <p className="text-on-surface font-bold leading-tight">{notifications[0].message}</p>
                  </div>
                  <button 
                    onClick={clearNotifications}
                    className="p-2 hover:bg-surface rounded-full transition-colors text-on-surface-variant/40"
                  >
                    <X className="w-5 h-5" />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Layout 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'home') {
            setViewingFamilyName(null);
            setViewingFamilyId(null);
          }
        }} 
        userRole={currentUser?.role || 'standard'} 
        onShowEmergency={() => alert('Emergency Alert Sent!')}
        onLogout={handleLogout}
      >
        {activeTab === 'home' && (
          <Dashboard 
            role={currentUser?.role || 'standard'} 
            onAction={handleAction}
            trackedFamilyName={viewingFamilyName}
            meds={viewingFamilyId ? targetMeds : meds}
            settings={settings}
            healthReports={viewingFamilyId ? (connections.find(c => c.member.uid === viewingFamilyId)?.healthReports || []) : healthReports}
          />
        )}
        {activeTab === 'meds' && (
          <Meds 
            onAction={handleAction} 
            meds={meds} 
            onDelete={handleDeleteMed}
          />
        )}
        {activeTab === 'connect' && (
          <Connect 
            connections={connections} 
            onViewDashboard={(id, name) => {
              setViewingFamilyId(id);
              setViewingFamilyName(name);
              setActiveTab('home');
            }}
          />
        )}
        {activeTab === 'reports' && <Reports meds={meds} healthReports={healthReports} />}
        {activeTab === 'settings' && (
          <Settings 
            settings={settings}
            onUpdateSettings={setSettings}
          />
        )}
      </Layout>
    </>
  );
}
