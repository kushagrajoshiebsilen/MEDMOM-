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

      // Check if the response is JSON before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         const text = await res.text();
         console.error("Non-JSON response from server:", text);
         throw new Error("Backend server is currently unreachable. Please ensure the server is running (npm run dev).");
      }

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
      setError(err.message || "Failed to sign in. Please try again.");
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
    <div className="min-h-screen bg-transparent flex flex-col items-center pt-20 px-6 overflow-x-hidden relative">
      
      {/* Decorative ambient blobs behind the glass */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-container opacity-20 blur-[80px] animate-pulse-soft"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-tertiary-container opacity-20 blur-[100px] animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
      </div>

      <header className="mb-12 text-center animate-fade-in-up">
        <h1 className="text-primary font-bold italic text-4xl tracking-tight mb-8 animate-float drop-shadow-md">MedMom</h1>
        <h2 className="text-4xl font-bold tracking-tight text-on-surface mb-4 drop-shadow-sm">
          Your medicine,<br />safely managed.
        </h2>
        <p className="text-on-surface-variant max-w-sm mb-12 font-medium">
          MedMom brings clarity and peace of mind to daily health routines.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 w-full max-w-2xl">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
            className={`glass-card rounded-3xl p-6 flex flex-col ${i === 2 ? 'md:col-span-2' : ''}`}
          >
            <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-5 text-on-surface shadow-inner`}>
              <f.icon className="w-7 h-7 drop-shadow-sm" />
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-2">{f.title}</h3>
            <p className="text-on-surface-variant font-medium">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="w-full max-w-sm mb-20 space-y-4 flex flex-col items-center animate-fade-in-up stagger-4 glass-panel p-8 rounded-3xl">
        {error && (
          <p className="text-error text-sm font-bold mb-4 bg-error-container/20 px-4 py-2 rounded-lg text-center w-full">{error}</p>
        )}
        
        <div className="w-full flex justify-center py-2 transition-transform duration-300 hover:scale-[1.02]">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Login Failed")}
            useOneTap
            theme="filled_blue"
            shape="pill"
            width="320px"
          />
        </div>
        
        <p className="text-center text-on-surface-variant font-bold text-[10px] uppercase tracking-[0.2em] opacity-50 mt-8">
          Secured by Google Identity
        </p>
      </div>
    </div>
  );
}
