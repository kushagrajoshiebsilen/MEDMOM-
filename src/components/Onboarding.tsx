import React from 'react';
import { motion } from 'motion/react';
import { 
  BellRing, 
  Heart, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

interface OnboardingProps {
  onFinishOnboarding: (user: any) => void;
}

export default function Onboarding({ onFinishOnboarding }: OnboardingProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onFinishOnboarding(data.user);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError("Failed to sign in. Please try again.");
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

      <div className="w-full max-w-sm mb-20 space-y-4 flex flex-col items-center">
        {error && (
          <p className="text-error text-sm font-bold mb-4">{error}</p>
        )}
        
        <div className="w-full flex justify-center py-4">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Login Failed")}
            useOneTap
            theme="filled_blue"
            shape="pill"
            width="320px"
          />
        </div>
        
        <p className="text-center text-on-surface-variant font-bold text-[10px] uppercase tracking-[0.2em] opacity-40 mt-12">
          Secured by Google Identity & MongoDB
        </p>
      </div>
    </div>
  );
}
