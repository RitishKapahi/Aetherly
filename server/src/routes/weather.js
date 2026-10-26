import { Router } from "express";
import { fetchWeather } from "../services/weatherService.js";
import { searchLocations } from "../services/locationService.js";
import { getRecommendations } from "../services/recommendationService.js";

const router = Router();
const weatherCache = new Map();
const locationCache = new Map();
const WEATHER_TTL = 10 * 60 * 1000;
const LOCATION_TTL = 60 * 60 * 1000;

function cached(map, key, ttl, fetcher) {
  const entry = map.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.promise;
  const promise = fetcher().catch((error) => {
    map.delete(key);
    throw error;
  });
  map.set(key, { promise, expiresAt: Date.now() + ttl });
  if (map.size > 500) {
    const oldestKey = map.keys().next().value;
    map.delete(oldestKey);
  }
  return promise;
}

function readLocation(query) {
  const latitude = Number(query.latitude);
  const longitude = Number(query.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { error: "Enter valid latitude and longitude coordinates." };
  }
  return {
    latitude,
    longitude,
    name: String(query.name ?? "Selected location").slice(0, 80),
    country: String(query.country ?? "").slice(0, 80),
    timezone: String(query.timezone ?? "auto").slice(0, 80),
  };
}

async function loadWeather(req, res, next) {
  const location = readLocation(req.query);
  if (location.error) return res.status(400).json({ error: { message: location.error } });
  const key = `${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}:${location.timezone}:${location.name}:${location.country}`;
  try {
    const weather = await cached(weatherCache, key, WEATHER_TTL, () => fetchWeather(location, { signal: req.signal }));
    req.weather = weather;
    next();
  } catch (error) {
    next(error);
  }
}

router.get("/weather", loadWeather, (req, res) => res.json({ data: req.weather, recommendations: getRecommendations(req.weather.current, req.weather.hourly, req.weather.daily) }));
router.get("/weather/current", loadWeather, (req, res) => res.json({ data: req.weather.current }));
router.get("/weather/forecast", loadWeather, (req, res) => res.json({ data: { hourly: req.weather.hourly, daily: req.weather.daily } }));
router.get("/recommendations", loadWeather, (req, res) => {
  res.json({ data: getRecommendations(req.weather.current, req.weather.hourly, req.weather.daily) });
});

router.get("/locations/search", async (req, res, next) => {
  const query = String(req.query.q ?? "").trim();
  if (query.length < 2 || query.length > 100) return res.status(400).json({ error: { message: "Search with 2 to 100 characters." } });
  try {
    const results = await cached(locationCache, query.toLocaleLowerCase(), LOCATION_TTL, () => searchLocations(query));
    res.json({ data: results });
  } catch (error) {
    next(error);
  }
});

export default router;
