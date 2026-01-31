export enum ParkingStatus {
  ALLOWED = 'ALLOWED',
  FORBIDDEN = 'FORBIDDEN',
  RESTRICTED = 'RESTRICTED',
  UNKNOWN = 'UNKNOWN'
}

export interface UserProfile {
  id?: string;
  fullName: string;
  email: string;
  hasDisabilityPermit: boolean;
  hasResidentPermit: boolean;
  hasLoadingZonePermit: boolean;
  hasBusinessPermit: boolean;
  hasBusPermit: boolean;
  hasTaxiPermit: boolean;
  residentArea?: string;
  lastSynced?: number;
}

export interface DirectionalResult {
  direction: 'left' | 'right' | 'general';
  status: ParkingStatus;
  canParkNow: boolean;
  explanation: string;
  summary: string;
  rules: string[];
  permitRequired: boolean;
  permitApplied?: string;
  timeRemainingMinutes?: number;
  nextStatusChange?: string;
}

export interface ParkingInterpretation {
  results: DirectionalResult[];
  errorInfo?: {
    code: 'BLURRY' | 'NO_SIGN' | 'MULTIPLE_SIGNS' | 'AMBIGUOUS' | 'SUCCESS';
    message: string;
    suggestion: string;
  };
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  image: string;
  interpretation: ParkingInterpretation;
  feedback?: 'up' | 'down';
}

export interface ParkingReport {
  id?: string;
  userEmail: string;
  issueCategory: string;
  description: string;
  aiSummary: string;
  aiExplanation: string;
  timestamp: number;
  imageAttached: boolean;
  imageData?: string;
  source: 'Original' | 'Re-upload';
}

export interface AppState {
  image: string | null;
  interpretation: ParkingInterpretation | null;
  isLoading: boolean;
  error: string | null;
  history: HistoryItem[];
  profile: UserProfile;
}