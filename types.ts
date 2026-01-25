
export enum ParkingStatus {
  ALLOWED = 'ALLOWED',
  FORBIDDEN = 'FORBIDDEN',
  RESTRICTED = 'RESTRICTED',
  UNKNOWN = 'UNKNOWN'
}

export interface UserProfile {
  hasDisabilityPermit: boolean;
  hasResidentPermit: boolean;
  residentArea?: string;
  hasLoadingZonePermit: boolean;
  hasBusinessPermit: boolean;
}

export interface ParkingInterpretation {
  status: ParkingStatus;
  canParkNow: boolean;
  explanation: string;
  summary: string;
  rules: string[];
  permitRequired: boolean;
  permitApplied?: string; // Which user permit allowed this?
  timeRemainingMinutes?: number;
  nextStatusChange?: string; 
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  image: string;
  interpretation: ParkingInterpretation;
}

export interface AppState {
  image: string | null;
  interpretation: ParkingInterpretation | null;
  isLoading: boolean;
  error: string | null;
  history: HistoryItem[];
  profile: UserProfile;
}
