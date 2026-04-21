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
