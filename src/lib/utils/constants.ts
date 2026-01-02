// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://infirmerie-api.onrender.com';
export const API_TIMEOUT = 30000; // 30 seconds

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'infirmerie_auth_token',
  USER: 'infirmerie_user',
  LAST_SYNC: 'infirmerie_last_sync',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  PATIENT_DETAIL: '/patients/:id',
  PATIENT_EDIT: '/patients/:id/edit',
  PATIENT_NEW: '/patients/new',
  CONSULTATIONS: '/consultations',
  CONSULTATION_DETAIL: '/consultations/:id',
  CONSULTATION_NEW: '/consultations/new',
  MEDICAMENTS: '/medicaments',
  MEDICAMENT_DETAIL: '/medicaments/:id',
  MEDICAMENT_NEW: '/medicaments/new',
  STOCKS: '/stocks',
  VACCINATIONS: '/vaccinations',
  VACCINATION_NEW: '/vaccinations/new',
  RENDEZ_VOUS: '/rendez-vous',
  RENDEZ_VOUS_NEW: '/rendez-vous/new',
  RAPPORTS: '/rapports',
} as const;

// Sync Configuration
export const SYNC_CONFIG = {
  AUTO_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
  DATA_EXPIRY_DAYS: 3,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;
