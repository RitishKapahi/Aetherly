import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

test("health endpoint reports weather API availability without requiring MongoDB", async (context) => {
  const server = app.listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.status, "ok");
});

test("weather query rejects out-of-range coordinates before calling provider", async (context) => {
  const server = app.listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/weather?latitude=95&longitude=181`);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error.message, /valid latitude and longitude/i);
});

test("location search validates short and oversized input", async (context) => {
  const server = app.listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const short = await fetch(`${base}/api/locations/search?q=a`);
  assert.equal(short.status, 400);
  const long = await fetch(`${base}/api/locations/search?q=${"a".repeat(101)}`);
  assert.equal(long.status, 400);
});

test("weather endpoint normalizes provider data and reuses a cached response", async (context) => {
  const server = app.listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = globalThis.fetch.bind(globalThis);
  const originalProviderFetch = globalThis.fetch;
  const originalBaseUrl = process.env.OPEN_METEO_BASE_URL;
  let providerCalls = 0;
  process.env.OPEN_METEO_BASE_URL = "https://weather-provider.test/v1/forecast";
  globalThis.fetch = async () => {
    providerCalls += 1;
    return {
      ok: true,
      json: async () => ({
        latitude: 12.9,
        longitude: 77.5,
        timezone: "Asia/Kolkata",
        utc_offset_seconds: 19800,
        current: { time: "2026-10-26T10:15", temperature_2m: 27, apparent_temperature: 29, relative_humidity_2m: 60, wind_speed_10m: 8, wind_direction_10m: 220, pressure_msl: 1008, weather_code: 2, is_day: 1 },
        current_units: { temperature_2m: "°C", wind_speed_10m: "km/h" },
        hourly: { time: ["2026-10-26T10:00", "2026-10-26T11:00"], temperature_2m: [27, 28], precipitation_probability: [0, 20], weather_code: [2, 2] },
        daily: { time: ["2026-10-26"], temperature_2m_max: [30], temperature_2m_min: [20], precipitation_probability_max: [35], uv_index_max: [5], sunrise: ["2026-10-26T06:10"], sunset: ["2026-10-26T18:02"], weather_code: [2] },
      }),
    };
  };
  context.after(() => {
    globalThis.fetch = originalProviderFetch;
    if (originalBaseUrl === undefined) delete process.env.OPEN_METEO_BASE_URL;
    else process.env.OPEN_METEO_BASE_URL = originalBaseUrl;
  });

  const url = `${base}/api/weather?latitude=12.9&longitude=77.5&name=Bengaluru&country=India&timezone=Asia%2FKolkata`;
  const first = await request(url);
  assert.equal(first.status, 200);
  const firstPayload = await first.json();
  assert.equal(firstPayload.data.current.temperature, 27);
  assert.equal(firstPayload.data.location.timezone, "Asia/Kolkata");
  const second = await request(url);
  assert.equal(second.status, 200);
  assert.equal(providerCalls, 1);
});

test("account registration reports that MongoDB is required when persistence is unconfigured", async (context) => {
  const server = app.listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const originalMongoUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  context.after(() => {
    if (originalMongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = originalMongoUri;
  });

  const response = await fetch(`${base}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "user@example.com", password: "a-long-test-password" }) });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error.message, /MongoDB connection/i);
});
