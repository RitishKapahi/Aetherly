import test from "node:test";
import assert from "node:assert/strict";
import { normalizeWeather, describeWeather } from "../src/services/weatherService.js";
import { getRecommendations } from "../src/services/recommendationService.js";

test("weather normalization preserves provider values and location timezone", () => {
  const normalized = normalizeWeather({
    latitude: 12.9,
    longitude: 77.5,
    timezone: "Asia/Kolkata",
    utc_offset_seconds: 19800,
    current: { time: "2026-10-26T10:15", temperature_2m: 27, apparent_temperature: 29, relative_humidity_2m: 60, wind_speed_10m: 8, wind_direction_10m: 220, pressure_msl: 1008, weather_code: 2, is_day: 1 },
    current_units: { temperature_2m: "°C", wind_speed_10m: "km/h" },
    hourly: { time: ["2026-10-26T10:00", "2026-10-26T11:00", "2026-10-26T12:00"], temperature_2m: [27, 28, 29], precipitation_probability: [0, 20, 35], weather_code: [2, 2, 1] },
    daily: { time: ["2026-10-26"], temperature_2m_max: [30], temperature_2m_min: [20], precipitation_probability_max: [35], uv_index_max: [5], sunrise: ["2026-10-26T06:10"], sunset: ["2026-10-26T18:02"], weather_code: [2] },
  }, { name: "Bengaluru", country: "India" });
  assert.equal(normalized.location.timezone, "Asia/Kolkata");
  assert.equal(normalized.current.temperature, 27);
  assert.equal(normalized.current.visibility, null);
  assert.equal(normalized.updatedAt, "2026-10-26T10:15+05:30");
  assert.equal(normalized.hourly[0].time, "2026-10-26T11:00+05:30");
  assert.equal(normalized.daily[0].uvIndex, 5);
});

test("unknown weather codes remain unavailable instead of being fabricated", () => {
  assert.deepEqual(describeWeather(777), ["Conditions unavailable", "clouds"]);
  assert.deepEqual(describeWeather(95), ["Thunderstorm", "storm"]);
});

test("weather timestamps use the correct offset after a daylight-saving change", () => {
  const normalized = normalizeWeather({
    latitude: 40.7,
    longitude: -74,
    timezone: "America/New_York",
    utc_offset_seconds: -18000,
    current: { time: "2026-03-08T00:00", temperature_2m: 5, weather_code: 0, is_day: 0 },
    hourly: {
      time: ["2026-03-08T00:00", "2026-03-08T01:00", "2026-03-08T03:00", "2026-03-08T04:00"],
      temperature_2m: [5, 4, 6, 7],
      weather_code: [0, 0, 0, 0],
    },
    daily: {
      time: ["2026-03-08"],
      temperature_2m_max: [8],
      temperature_2m_min: [2],
      sunrise: ["2026-03-08T07:20"],
      sunset: ["2026-03-08T18:55"],
      weather_code: [0],
    },
  }, { name: "New York", country: "United States", timezone: "America/New_York" });

  assert.deepEqual(normalized.hourly.map(({ time }) => time), [
    "2026-03-08T00:00-05:00",
    "2026-03-08T01:00-05:00",
    "2026-03-08T03:00-04:00",
    "2026-03-08T04:00-04:00",
  ]);
  assert.equal(normalized.daily[0].sunrise, "2026-03-08T07:20-04:00");
});

test("recommendations use available forecast thresholds and omit unsupported data", () => {
  const advice = getRecommendations(
    { temperature: 35, windSpeed: 10 },
    [{ precipitationProbability: 58 }],
    [{ uvIndex: 7 }],
  );
  assert.deepEqual(advice.map((item) => item.id), ["rain", "heat", "uv"]);
  assert.equal(getRecommendations({ temperature: null }, [], []).length, 0);
});
