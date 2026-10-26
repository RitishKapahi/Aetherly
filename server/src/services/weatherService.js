const WEATHER_CODES = {
  0: ["Clear sky", "clear"],
  1: ["Mainly clear", "clear"],
  2: ["Partly cloudy", "clouds"],
  3: ["Overcast", "clouds"],
  45: ["Fog", "fog"],
  48: ["Depositing rime fog", "fog"],
  51: ["Light drizzle", "drizzle"],
  53: ["Moderate drizzle", "drizzle"],
  55: ["Dense drizzle", "drizzle"],
  56: ["Light freezing drizzle", "snow"],
  57: ["Dense freezing drizzle", "snow"],
  61: ["Slight rain", "rain"],
  63: ["Moderate rain", "rain"],
  65: ["Heavy rain", "rain"],
  66: ["Light freezing rain", "snow"],
  67: ["Heavy freezing rain", "snow"],
  71: ["Slight snowfall", "snow"],
  73: ["Moderate snowfall", "snow"],
  75: ["Heavy snowfall", "snow"],
  77: ["Snow grains", "snow"],
  80: ["Slight rain showers", "rain"],
  81: ["Moderate rain showers", "rain"],
  82: ["Violent rain showers", "rain"],
  85: ["Slight snow showers", "snow"],
  86: ["Heavy snow showers", "snow"],
  95: ["Thunderstorm", "storm"],
  96: ["Thunderstorm with light hail", "storm"],
  99: ["Thunderstorm with heavy hail", "storm"],
};

export function describeWeather(code) {
  return WEATHER_CODES[code] ?? ["Conditions unavailable", "clouds"];
}

function valueAt(values, index) {
  const value = values?.[index];
  return Number.isFinite(value) ? value : null;
}

function asNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function withOffset(value, offsetSeconds = 0) {
  if (!value || /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return value;
  const sign = offsetSeconds < 0 ? "-" : "+";
  const absolute = Math.abs(offsetSeconds);
  const hours = String(Math.floor(absolute / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((absolute % 3600) / 60)).padStart(2, "0");
  return `${value}${sign}${hours}:${minutes}`;
}

export function normalizeWeather(payload, location) {
  const validLatitude = Number.isFinite(payload?.latitude) && payload.latitude >= -90 && payload.latitude <= 90;
  const validLongitude = Number.isFinite(payload?.longitude) && payload.longitude >= -180 && payload.longitude <= 180;
  const hourlyValid = Array.isArray(payload?.hourly?.time) && Array.isArray(payload?.hourly?.temperature_2m);
  const dailyValid = Array.isArray(payload?.daily?.time) && Array.isArray(payload?.daily?.temperature_2m_max) && Array.isArray(payload?.daily?.temperature_2m_min);
  if (!payload?.current || !validLatitude || !validLongitude || typeof payload.current.time !== "string" || !Number.isFinite(payload.current.temperature_2m) || !hourlyValid || !dailyValid) {
    throw Object.assign(new Error("The weather provider returned an incomplete forecast."), { status: 502, publicMessage: "The weather provider returned incomplete forecast data." });
  }
  const now = payload.current;
  const utcOffset = Number.isFinite(payload.utc_offset_seconds) ? payload.utc_offset_seconds : 0;
  const hourlyTimes = (payload.hourly.time ?? []).map((time) => withOffset(time, utcOffset));
  const currentTime = withOffset(now.time, utcOffset);
  const [description, condition] = describeWeather(now.weather_code);
  const startIndex = Math.max(0, hourlyTimes.findIndex((time) => new Date(time).getTime() >= new Date(currentTime).getTime()));
  const hourly = hourlyTimes.slice(startIndex, startIndex + 24).map((time, offset) => {
    const index = startIndex + offset;
    const [label, codeCondition] = describeWeather(valueAt(payload.hourly.weather_code, index));
    return {
      time,
      temperature: valueAt(payload.hourly.temperature_2m, index),
      precipitationProbability: valueAt(payload.hourly.precipitation_probability, index),
      weatherCode: valueAt(payload.hourly.weather_code, index),
      description: label,
      condition: codeCondition,
    };
  });
  const dailyTimes = payload.daily.time ?? [];
  const daily = dailyTimes.slice(0, 5).map((date, index) => {
    const [label, codeCondition] = describeWeather(valueAt(payload.daily.weather_code, index));
    return {
      date,
      high: valueAt(payload.daily.temperature_2m_max, index),
      low: valueAt(payload.daily.temperature_2m_min, index),
      precipitationProbability: valueAt(payload.daily.precipitation_probability_max, index),
      uvIndex: valueAt(payload.daily.uv_index_max, index),
      weatherCode: valueAt(payload.daily.weather_code, index),
      description: label,
      condition: codeCondition,
      sunrise: withOffset(payload.daily.sunrise?.[index], utcOffset) ?? null,
      sunset: withOffset(payload.daily.sunset?.[index], utcOffset) ?? null,
    };
  });
  const name = String(location.name ?? "").trim();
  const country = String(location.country ?? "").trim();
  return {
    location: {
      name: name || "Selected location",
      country,
      latitude: payload.latitude,
      longitude: payload.longitude,
      timezone: payload.timezone || location.timezone || "UTC",
    },
    current: {
      time: currentTime,
      temperature: asNumber(now.temperature_2m),
      feelsLike: asNumber(now.apparent_temperature),
      humidity: asNumber(now.relative_humidity_2m),
      windSpeed: asNumber(now.wind_speed_10m),
      windDirection: asNumber(now.wind_direction_10m),
      visibility: asNumber(now.visibility),
      pressure: asNumber(now.pressure_msl ?? now.surface_pressure),
      precipitation: asNumber(now.precipitation),
      weatherCode: asNumber(now.weather_code),
      isDay: Boolean(now.is_day),
      description,
      condition,
    },
    hourly,
    daily,
    units: {
      temperature: payload.current_units?.temperature_2m ?? "°C",
      windSpeed: payload.current_units?.wind_speed_10m ?? "km/h",
      visibility: payload.current_units?.visibility ?? "m",
      pressure: payload.current_units?.pressure_msl ?? "hPa",
      precipitation: payload.current_units?.precipitation ?? "mm",
    },
    updatedAt: currentTime,
    attribution: "Weather data by Open-Meteo · Location data © GeoNames",
  };
}

export async function fetchWeather(location, { signal } = {}) {
  const url = new URL(process.env.OPEN_METEO_BASE_URL || "https://api.open-meteo.com/v1/forecast");
  const params = {
    latitude: location.latitude,
    longitude: location.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,visibility",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
    timezone: location.timezone || "auto",
    forecast_days: 5,
  };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  if (process.env.OPEN_METEO_API_KEY) url.searchParams.set("apikey", process.env.OPEN_METEO_API_KEY);
  let response;
  try {
    response = await fetch(url, { signal: signal ?? AbortSignal.timeout(9000) });
  } catch {
    throw Object.assign(new Error("Weather service is temporarily unavailable."), { status: 502, publicMessage: "Weather service is temporarily unavailable. Check your connection and try again." });
  }
  if (!response.ok) {
    throw Object.assign(new Error(response.status === 429 ? "Weather service is busy. Please try again shortly." : "Weather service is temporarily unavailable."), { status: response.status === 429 ? 503 : 502, publicMessage: response.status === 429 ? "Weather service is busy. Please try again shortly." : "Weather service is temporarily unavailable." });
  }
  let data;
  try { data = await response.json(); }
  catch { throw Object.assign(new Error("Weather provider returned unreadable data."), { status: 502, publicMessage: "Weather provider returned unreadable data." }); }
  return normalizeWeather(data, location);
}
