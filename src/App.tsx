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
import { Medication, AlertPreference, AppSettings } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Camera, X } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  subscribeToMeds, 
  addMedication, 
  updateMedicationStatus, 
  deleteMedication,
  ensureUserProfile 
} from './services/medService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [view, setView] = useState<'main' | 'add' | 'camera' | 'alarm'>('main');
  const [trackedFamilyMembers, setTrackedFamilyMembers] = useState<string[]>([]);
  const [viewingFamilyName, setViewingFamilyName] = useState<string | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    alertPreference: 'loud',
    collegeMode: false,
    vibrationEnabled: true
  });

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        await ensureUserProfile(user);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });
  }, []);

  // Meds Sync
  useEffect(() => {
    if (currentUser) {
      return subscribeToMeds(currentUser.uid, setMeds);
    }
  }, [currentUser]);

  const handleFinishOnboarding = () => {
    // Auth is handled via onAuthStateChanged
  };

  const handleAction = (action: string) => {
    if (action === 'add') setView('add');
    if (action === 'upload') setView('camera');
  };

  const handleBack = () => {
    setView('main');
    setViewingFamilyName(null);
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

  const handleAddFamilyMember = (name: string) => {
    if (!trackedFamilyMembers.includes(name)) {
      setTrackedFamilyMembers([...trackedFamilyMembers, name]);
    }
  };

  const handleViewMember = (name: string | null) => {
    setViewingFamilyName(name);
    setActiveTab('home'); // Switch to home tab to show their dashboard
  };

  // Mock Alarm Logic
  useEffect(() => {
    const checkAlarm = () => {
      // If we have a pending med and it's 9:00 AM (mock trigger)
      const hasPending = meds.some(m => m.status === 'Pending');
      if (hasPending && view === 'main' && !settings.collegeMode && settings.alertPreference === 'loud') {
        // Only trigger "No Snooze" alarm if not in college mode
        // setView('alarm'); // Temporarily commented out to prevent immediate lockdown during dev
      }
    };
    const interval = setInterval(checkAlarm, 30000);
    return () => clearInterval(interval);
  }, [meds, view, settings]);

  if (!isAuthenticated) {
    return <Onboarding onFinishOnboarding={handleFinishOnboarding} />;
  }

  if (view === 'add') {
    return (
      <div className="bg-surface min-h-screen pt-24 pb-20 container mx-auto px-6 max-w-2xl animate-in slide-in-from-right duration-500">
        <AddMed onBack={handleBack} onAdd={handleAddMed} />
      </div>
    );
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
          Your Lisinopril 10mg is now due. <br />
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
    <Layout 
      activeTab={activeTab} 
      onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab !== 'home') setViewingFamilyName(null);
      }} 
      userRole={trackedFamilyMembers.length > 0 ? 'parent' : 'child'} 
      onShowEmergency={() => alert('Emergency Alert Sent!')}
    >
      {activeTab === 'home' && (
        <Dashboard 
          role={trackedFamilyMembers.length > 0 ? 'parent' : 'child'} 
          onAction={handleAction}
          trackedFamilyName={viewingFamilyName}
          meds={meds}
          settings={settings}
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
          onAddFamilyMember={handleAddFamilyMember} 
          onViewMember={handleViewMember}
          trackedMembers={trackedFamilyMembers} 
        />
      )}
      {activeTab === 'reports' && <Reports />}
      {activeTab === 'settings' && (
        <Settings 
          settings={settings}
          onUpdateSettings={setSettings}
        />
      )}
    </Layout>
  );
}
