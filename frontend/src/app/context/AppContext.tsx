import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ShipmentViewModel,
  UserRoleView,
  AuthUser,
  applyShipmentRoute,
  createShipment,
  exchangeFirebaseToken,
  fetchMe,
  fetchShipments,
  refreshShipment,
  login as loginRequest,
} from '../lib/api';
import { getLanguageByCode, INDIAN_LANGUAGES } from '../constants/languages';
import { firebaseEnabled, logoutFirebase, subscribeToFirebaseAuth } from '../lib/firebase';

const LANG_STORAGE_KEY = 'clearpath-preferred-language';
const AUTH_TOKEN_STORAGE_KEY = 'clearpath-auth-token';
const USER_ROLE_STORAGE_KEY = 'clearpath-user-role';
const HIGH_CONTRAST_STORAGE_KEY = 'clearpath-high-contrast';
const VOICE_ALERTS_STORAGE_KEY = 'clearpath-voice-alerts';

interface AppContextType {
  authToken: string | null;
  userRole: UserRoleView | null;
  setUserRole: (role: UserRoleView | null) => void;
  shipments: ShipmentViewModel[];
  updateShipmentRoute: (shipmentId: string, routeId: string) => Promise<void>;
  addShipment: (shipment: { source: string; destination: string }) => Promise<void>;
  refreshShipment: (shipmentId: string) => Promise<void>;
  preferredLanguage: string;
  setPreferredLanguage: (code: string) => void;
  authUser: AuthUser | null;
  authLoading: boolean;
  login: (username: string, password: string, role: UserRoleView) => Promise<void>;
  loginWithFirebaseIdToken: (idToken: string, role: UserRoleView) => Promise<void>;
  logout: () => void;
  authError: string;
  shipmentsLoading: boolean;
  firebaseEnabled: boolean;
  highContrastEnabled: boolean;
  setHighContrastEnabled: (enabled: boolean) => void;
  voiceAlertsEnabled: boolean;
  setVoiceAlertsEnabled: (enabled: boolean) => void;
  liveAnnouncement: string;
  demoMode: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

function readStoredLanguage(): string {
  try {
    const value = localStorage.getItem(LANG_STORAGE_KEY);
    if (value && INDIAN_LANGUAGES.some((language) => language.code === value)) return value;
  } catch {
    // Ignore storage failures.
  }
  return 'en';
}

function readStoredRole(): UserRoleView | null {
  try {
    const value = localStorage.getItem(USER_ROLE_STORAGE_KEY);
    return value === 'supplier' || value === 'company' ? value : null;
  } catch {
    return null;
  }
}

function readStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function readStoredBoolean(key: string, fallback: boolean) {
  try {
    const value = localStorage.getItem(key);
    if (value === 'true') return true;
    if (value === 'false') return false;
  } catch {
    // Ignore storage failures.
  }
  return fallback;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRoleState] = useState<UserRoleView | null>(readStoredRole);
  const [shipments, setShipments] = useState<ShipmentViewModel[]>([]);
  const [preferredLanguage, setPreferredLanguageState] = useState<string>(readStoredLanguage);
  const [authToken, setAuthToken] = useState<string | null>(readStoredToken);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [highContrastEnabled, setHighContrastEnabledState] = useState<boolean>(() => readStoredBoolean(HIGH_CONTRAST_STORAGE_KEY, false));
  const [voiceAlertsEnabled, setVoiceAlertsEnabledState] = useState<boolean>(() => readStoredBoolean(VOICE_ALERTS_STORAGE_KEY, true));
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const lastAnnouncementRef = useRef('');

  const setPreferredLanguage = (code: string) => {
    const next = getLanguageByCode(code).code;
    setPreferredLanguageState(next);
  };

  const setUserRole = (role: UserRoleView | null) => {
    setUserRoleState(role);
    try {
      if (role) {
        localStorage.setItem(USER_ROLE_STORAGE_KEY, role);
      } else {
        localStorage.removeItem(USER_ROLE_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures.
    }
  };

  const loadShipments = async (token: string) => {
    setShipmentsLoading(true);
    try {
      const nextShipments = await fetchShipments(token);
      setShipments(nextShipments);
    } finally {
      setShipmentsLoading(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, preferredLanguage);
    } catch {
      // Ignore storage failures.
    }
  }, [preferredLanguage]);

  useEffect(() => {
    try {
      localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(highContrastEnabled));
    } catch {
      // Ignore storage failures.
    }
  }, [highContrastEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(VOICE_ALERTS_STORAGE_KEY, String(voiceAlertsEnabled));
    } catch {
      // Ignore storage failures.
    }
  }, [voiceAlertsEnabled]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token = readStoredToken();
      if (!token) {
        if (!cancelled) {
          setAuthToken(null);
          setAuthUser(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const user = await fetchMe(token);
        if (cancelled) return;
        setAuthToken(token);
        setAuthUser(user);
        await loadShipments(token);
      } catch (error) {
        if (cancelled) return;
        try {
          localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        } catch {
          // Ignore storage failures.
        }
        setAuthToken(null);
        setAuthUser(null);
        setShipments([]);
        setAuthError(error instanceof Error ? error.message : 'Session expired.');
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    restoreSession();

    const unsubscribe = subscribeToFirebaseAuth(async (firebaseUser) => {
      if (!firebaseUser) return;
      if (readStoredToken()) return;
      try {
        const idToken = await firebaseUser.getIdToken();
        const payload = await exchangeFirebaseToken(idToken);
        if (cancelled) return;
        setAuthToken(payload.accessToken);
        setAuthUser(payload.user);
        try {
          localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, payload.accessToken);
        } catch {
          // Ignore storage failures.
        }
        await loadShipments(payload.accessToken);
      } catch (error) {
        if (!cancelled) {
          setAuthError(error instanceof Error ? error.message : 'Firebase sign in failed.');
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string, role: UserRoleView) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const payload = await loginRequest(username, password);
      setAuthToken(payload.accessToken);
      setAuthUser(payload.user);
      setUserRole(role);
      try {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, payload.accessToken);
      } catch {
        // Ignore storage failures.
      }
      await loadShipments(payload.accessToken);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign in failed.');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setAuthUser(null);
    setShipments([]);
    setAuthError('');
    setUserRole(null);
    try {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
    void logoutFirebase();
  };

  const loginWithFirebaseIdToken = async (idToken: string, role: UserRoleView) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const payload = await exchangeFirebaseToken(idToken);
      setAuthToken(payload.accessToken);
      setAuthUser(payload.user);
      setUserRole(role);
      try {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, payload.accessToken);
      } catch {
        // Ignore storage failures.
      }
      await loadShipments(payload.accessToken);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Firebase sign in failed.');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const addShipmentToState = (nextShipment: ShipmentViewModel) => {
    setShipments((current) => {
      const filtered = current.filter((shipment) => shipment.id !== nextShipment.id);
      return [nextShipment, ...filtered];
    });
  };

  useEffect(() => {
    const criticalShipment = shipments.find((shipment) => shipment.riskLevel === 'high' && shipment.alert);
    if (!criticalShipment) return;

    const nextAnnouncement = `High risk detected for ${criticalShipment.name}. ${criticalShipment.backend.decision.recommendedAction || 'Review the shipment now.'}`;
    if (lastAnnouncementRef.current === nextAnnouncement) return;
    lastAnnouncementRef.current = nextAnnouncement;
    setLiveAnnouncement(nextAnnouncement);

  }, [shipments]);

  const setHighContrastEnabled = (enabled: boolean) => {
    setHighContrastEnabledState(enabled);
  };

  const setVoiceAlertsEnabled = (enabled: boolean) => {
    setVoiceAlertsEnabledState(enabled);
  };

  const addShipment = async (shipment: { source: string; destination: string }) => {
    if (!authToken) throw new Error('Authentication required.');
    const nextShipment = await createShipment(authToken, shipment.source, shipment.destination);
    addShipmentToState(nextShipment);
  };

  const updateShipmentRoute = async (shipmentId: string, routeId: string) => {
    if (!authToken) throw new Error('Authentication required.');
    const updated = await applyShipmentRoute(authToken, shipmentId, routeId);
    addShipmentToState(updated);
  };

  const refreshShipmentById = async (shipmentId: string) => {
    if (!authToken) throw new Error('Authentication required.');
    const updated = await refreshShipment(authToken, shipmentId);
    addShipmentToState(updated);
  };

  const demoMode = useMemo(() => shipments.some((shipment) => shipment.backend.usedFallbackData), [shipments]);

  const value = useMemo<AppContextType>(
    () => ({
      authToken,
      userRole,
      setUserRole,
      shipments,
      updateShipmentRoute,
      addShipment,
      refreshShipment: refreshShipmentById,
      preferredLanguage,
      setPreferredLanguage,
      authUser,
      authLoading,
      login,
      loginWithFirebaseIdToken,
      logout,
      authError,
      shipmentsLoading,
      firebaseEnabled,
      highContrastEnabled,
      setHighContrastEnabled,
      voiceAlertsEnabled,
      setVoiceAlertsEnabled,
      liveAnnouncement,
      demoMode,
    }),
    [authToken, userRole, shipments, preferredLanguage, authUser, authLoading, authError, shipmentsLoading, highContrastEnabled, voiceAlertsEnabled, liveAnnouncement, demoMode],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
