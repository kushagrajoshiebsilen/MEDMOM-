import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Pill, 
  Users, 
  BarChart3, 
  Settings,
  AlertCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: 'parent' | 'child' | null;
  onShowEmergency: () => void;
}

export default function Layout({ 
  children, 
  activeTab, 
  onTabChange, 
  userRole,
  onShowEmergency 
}: LayoutProps) {
  const tabs = [
    { id: 'home', icon: LayoutDashboard, label: 'Home' },
    { id: 'meds', icon: Pill, label: 'Meds' },
    { id: 'connect', icon: Users, label: 'Connect' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  if (!userRole) return <>{children}</>;

  const profileImage = userRole === 'child' 
    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuBOuIt087l2Bq_WZyohOn2jgycszFH09C0VPFo6eg6AhmerSRoXm9WCcR8m_m2bx4mIxiV5hZ_w4qCuUjg1l097qKQkKYYfEk07HoNhijZ2lf3zQwPSFnq9p27YFMKocFDbhtfz45lR8xG3kmr2Vccqyh9q9RJ2MORcJczS9Sidmdh_fv-Vamy0DPIbIb2iBGvfC_6Hrxz6r7hMsg6_DQj3Ikls-b4HHGOTq8_4hNYHiG2r3dwzoOjQyHS69MOIY2mYdcxQneSHmD-7"
    : "https://lh3.googleusercontent.com/aida-public/AB6AXuAcClWMCVpgMsHn_ty4EM4p-v3Lrwsm-VEeuLQAP9CH7xmylIKiWGCdvyLAxoV7-MR7FHfuE7rqGgW-6alXppceEQrN7TBYi682PuZIXSDiPMbzQEJT2xxPm0rF9KToFwt5qBYonwKK5_J1Vs-jrousbar8esj--phCxcd91j8V2KvXYGMuM3GMRGSGHU5adTXJysAB04GMRTY4spIVuapC4yDTboWozk8kKhkw6oPiou92BbU7_tvsG6gn_zCGkqV5MynJJkjLBHdo";

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-outline/10 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-2xl">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-outline/20 bg-surface-container">
            <img 
              src={profileImage}
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <h1 className="text-primary font-bold italic text-xl tracking-tight">MedMom</h1>
          
          <button 
            onClick={onShowEmergency}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-error-container text-white hover:bg-error transition-all active:scale-95 shadow-md"
          >
            <AlertCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-32 container mx-auto px-6 max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-md border-t border-outline/10 px-4 pb-8 pt-3 rounded-t-3xl shadow-ambient">
        <div className="container mx-auto max-w-2xl flex justify-around items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-primary/10 text-primary scale-110' 
                  : 'text-on-surface-variant/40 hover:text-primary/60'
              }`}
            >
              <tab.icon className={`w-6 h-6 mb-1 ${activeTab === tab.id ? 'fill-primary/20' : ''}`} />
              <span className="text-[10px] font-semibold tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
