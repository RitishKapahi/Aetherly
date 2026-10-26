import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const PreferencesContext = createContext(null);
const DEFAULTS = { unit: "celsius", theme: "light" };
const DEFAULT_CITY = {
  id: "city-1277333",
  name: "Bengaluru",
  country: "India",
  latitude: 12.9716,
  longitude: 77.5946,
  timezone: "Asia/Kolkata",
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be disabled by the browser. */ }
}

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(() => ({ ...DEFAULTS, ...readStorage("aetherly.preferences", {}) }));
  const [favorites, setFavorites] = useState(() => readStorage("aetherly.favorites", []));
  const [recent, setRecent] = useState(() => readStorage("aetherly.recent", []));
  const [account, setAccount] = useState(null);
  const [accountChecked, setAccountChecked] = useState(false);

  useEffect(() => { document.documentElement.dataset.theme = preferences.theme; }, [preferences.theme]);
  useEffect(() => { persist("aetherly.preferences", preferences); }, [preferences]);
  useEffect(() => { persist("aetherly.favorites", favorites); }, [favorites]);
  useEffect(() => { persist("aetherly.recent", recent); }, [recent]);

  useEffect(() => {
    api("/auth/me").then(({ data }) => {
      if (data.authenticated) {
        setAccount(data.email);
        if (Array.isArray(data.favorites)) setFavorites(data.favorites);
        if (data.preferences) setPreferences((current) => ({ ...current, ...data.preferences }));
      }
    }).catch(() => {}).finally(() => setAccountChecked(true));
  }, []);

  const setPreference = (key, value) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    if (account) api("/profile/preferences", { method: "PUT", body: JSON.stringify(next) }).catch(() => {});
  };

  const addFavorite = (city) => {
    const normalized = { ...city, id: String(city.id ?? `${city.latitude.toFixed(3)}:${city.longitude.toFixed(3)}`) };
    setFavorites((current) => current.some((item) => item.id === normalized.id) ? current : [normalized, ...current]);
    if (account) api("/profile/favorites", { method: "POST", body: JSON.stringify({ city: normalized }) }).catch(() => {});
  };

  const removeFavorite = (id) => {
    setFavorites((current) => current.filter((item) => item.id !== id));
    if (account) api(`/profile/favorites/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
  };

  const addRecent = (city) => setRecent((current) => {
    const normalized = { ...city, id: String(city.id ?? `${city.latitude.toFixed(3)}:${city.longitude.toFixed(3)}`) };
    return [normalized, ...current.filter((item) => item.id !== normalized.id)].slice(0, 6);
  });

  const signIn = async (email, password, register = false) => {
    const result = await api(`/auth/${register ? "register" : "login"}`, { method: "POST", body: JSON.stringify({ email, password }) });
    setAccount(result.data.email);
    setFavorites(result.data.favorites ?? []);
    if (result.data.preferences) setPreferences((current) => ({ ...current, ...result.data.preferences }));
    return result.data;
  };

  const signOut = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setAccount(null);
    setFavorites(readStorage("aetherly.favorites", []));
    setPreferences({ ...DEFAULTS, ...readStorage("aetherly.preferences", {}) });
  };

  const value = useMemo(() => ({
    preferences, setPreference, favorites, addFavorite, removeFavorite,
    recent, addRecent, account, accountChecked, signIn, signOut, defaultCity: DEFAULT_CITY,
  }), [preferences, favorites, recent, account, accountChecked]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
}
