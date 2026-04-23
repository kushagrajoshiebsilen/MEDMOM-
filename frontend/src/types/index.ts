export type AlertPreference = 'loud' | 'notification' | 'vibration';

export interface Medication {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  time: string;
  status: 'Taken' | 'Pending' | 'Upcoming' | 'Missed';
  type: string;
  days?: number[];
  referenceImageUrl?: string;
}

export interface AppSettings {
  alertPreference: AlertPreference;
  collegeMode: boolean; // Reminders every 10 min instead of loud alarm
  vibrationEnabled: boolean;
}

export interface User {
  uid: string;
  id: string;
  displayName: string;
  email: string;
  role: 'standard' | 'parent' | 'child';
  pairingCode?: string;
  picture?: string;
  connectedMembers?: string[];
  activeCall?: {
    callerId: string;
    callerName: string;
    status: 'ringing' | 'connected' | 'ended' | null;
  };
  notifications?: Array<{
    id: string;
    fromName: string;
    message: string;
    type: string;
    createdAt: string;
  }>;
}
