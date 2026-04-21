import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserCircle2, 
  BellRing, 
  Heart, 
  CheckCircle2, 
  ArrowRight,
  LogIn
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface OnboardingProps {
  onFinishOnboarding: () => void;
}

export default function Onboarding({ onFinishOnboarding }: OnboardingProps) {
  const [loading, setLoading] = React.useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onFinishOnboarding();
    } catch (err) {
      console.error("Auth Error:", err);
      // Fallback for dev/demo if needed, but we have real Firebase now
      alert("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { 
      icon: BellRing, 
      color: 'bg-primary-container', 
      title: 'Gentle Nudges', 
      desc: 'Never miss a dose with clear, calm reminders.' 
    },
    { 
      icon: Heart, 
      color: 'bg-tertiary-container', 
      title: 'Shared Care', 
      desc: 'Syncs perfectly between parent and child devices.' 
    },
    { 
      icon: CheckCircle2, 
      color: 'bg-secondary-container', 
      title: 'Total Security', 
      desc: 'Your health data is private and securely encrypted.' 
    },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center pt-20 px-6 overflow-x-hidden">
      <header className="mb-12 text-center">
        <h1 className="text-primary font-bold italic text-3xl tracking-tight mb-8">MedMom</h1>
        <h2 className="text-4xl font-bold tracking-tight text-on-surface mb-4">
          Your medicine,<br />safely managed.
        </h2>
        <p className="text-on-surface-variant max-w-sm mb-12">
          MedMom brings clarity and peace of mind to daily health routines.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16 w-full max-w-2xl">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white rounded-3xl p-6 shadow-ambient flex flex-col ${i === 2 ? 'md:col-span-2' : ''}`}
          >
            <div className={`w-12 h-12 rounded-full ${f.color} flex items-center justify-center mb-4 text-on-surface`}>
              <f.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">{f.title}</h3>
            <p className="text-on-surface-variant text-sm">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="w-full max-w-sm mb-20 space-y-4">
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-primary text-white rounded-[2rem] py-5 px-8 text-xl font-black shadow-2xl hover:scale-[0.98] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Entering...' : 'Get Started'}
          <ArrowRight className="w-6 h-6" />
        </button>
        
        <p className="text-center text-on-surface-variant font-bold text-xs uppercase tracking-widest opacity-40">
          Powered by Secure Cloud Auth
        </p>
      </div>
    </div>
  );
}
