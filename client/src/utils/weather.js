export function toFahrenheit(celsius) {
  return Number.isFinite(celsius) ? (celsius * 9) / 5 + 32 : null;
}

export function formatTemperature(celsius, unit = "celsius") {
  if (!Number.isFinite(celsius)) return "—";
  const value = unit === "fahrenheit" ? toFahrenheit(celsius) : celsius;
  return `${Math.round(value)}°`;
}

export function formatWind(speed, unit = "celsius") {
  if (!Number.isFinite(speed)) return "—";
  const value = unit === "fahrenheit" ? speed * 0.621371 : speed;
  return `${Math.round(value)} ${unit === "fahrenheit" ? "mph" : "km/h"}`;
}

export function compassDirection(degrees) {
  if (!Number.isFinite(degrees)) return null;
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(degrees / 45) % 8];
}

export function formatClock(isoTime, timezone, options = {}) {
  if (!isoTime) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone || "UTC",
      hour: "numeric",
      minute: options.minutes === false ? undefined : "2-digit",
      ...options,
    }).format(new Date(isoTime));
  } catch {
    return "—";
  }
}

export function formatDay(isoDate, timezone, options = {}) {
  if (!isoDate) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { timeZone: "UTC", weekday: "short", ...options }).format(new Date(`${isoDate}T12:00:00Z`));
  } catch {
    return "—";
  }
}

export function formatUpdate(isoTime, timezone) {
  if (!isoTime) return "";
  try {
    return `${new Intl.DateTimeFormat(undefined, { timeZone: timezone || "UTC", hour: "numeric", minute: "2-digit" }).format(new Date(isoTime))} local time`;
  } catch {
    return "";
  }
}
