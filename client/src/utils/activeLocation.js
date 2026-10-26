const STORAGE_KEY = "aetherly.activeLocation";

function normalizeLocation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.name !== "string" || !value.name.trim()) return null;
  if (!Number.isFinite(value.latitude) || value.latitude < -90 || value.latitude > 90) return null;
  if (!Number.isFinite(value.longitude) || value.longitude < -180 || value.longitude > 180) return null;

  return {
    id: String(value.id ?? `${value.latitude.toFixed(3)}:${value.longitude.toFixed(3)}`),
    name: value.name.trim().slice(0, 80),
    admin1: typeof value.admin1 === "string" ? value.admin1.slice(0, 80) : "",
    country: typeof value.country === "string" ? value.country.slice(0, 80) : "",
    countryCode: typeof value.countryCode === "string" ? value.countryCode.slice(0, 8) : "",
    latitude: value.latitude,
    longitude: value.longitude,
    timezone: typeof value.timezone === "string" && value.timezone ? value.timezone.slice(0, 80) : "auto",
  };
}

export function readActiveLocation() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const location = normalizeLocation(JSON.parse(saved));
    if (!location) localStorage.removeItem(STORAGE_KEY);
    return location;
  } catch {
    return null;
  }
}

export function saveActiveLocation(value) {
  const location = normalizeLocation(value);
  if (!location) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    return true;
  } catch {
    return false;
  }
}
