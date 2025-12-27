
export type Screen = 'LOGIN' | 'DASHBOARD' | 'TRIP_DETAILS' | 'REPORT' | 'AI_ASSISTANT';

export interface User {
  phone: string;
  balance: number;
  currency: string;
}

export interface Trip {
  from: string;
  to: string;
  status: 'On Time' | 'Delayed' | 'Departed';
  eta: string;
  speed: string;
  nextStop: string;
}

export interface Report {
  id: string;
  type: string;
  description: string;
  status: 'Pending' | 'Resolved';
  timestamp: string;
}
