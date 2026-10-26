import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Dashboard from "./Dashboard.jsx";
import { PreferencesProvider } from "../context/PreferencesContext.jsx";

afterEach(() => vi.unstubAllGlobals());

describe("Dashboard request states", () => {
  it("shows loading and recoverable error states when weather is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (String(url).includes("/auth/me")) return { ok: true, json: async () => ({ data: { authenticated: false } }) };
      throw new TypeError("network failure");
    }));
    render(<PreferencesProvider><Dashboard location={{ id: "test", name: "Test City", latitude: 1, longitude: 1, timezone: "UTC" }} onSelectLocation={() => {}} /></PreferencesProvider>);
    expect(screen.getByText(/gathering the latest forecast/i)).toBeInTheDocument();
    expect(await screen.findByText(/weather is taking a moment/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(screen.getByText(/weather is taking a moment/i)).toBeInTheDocument());
  });

  it("renders current weather and forecast details after a successful response", async () => {
    const weather = {
      location: { name: "Test City", country: "Testland", latitude: 20, longitude: 30, timezone: "UTC" },
      current: { time: "2026-10-26T12:00:00Z", temperature: 22, feelsLike: 23, humidity: 45, windSpeed: 10, windDirection: 90, visibility: 10000, pressure: 1012, isDay: true, weatherCode: 0, description: "Clear sky", condition: "clear" },
      hourly: [{ time: "2026-10-26T12:00:00Z", temperature: 22, precipitationProbability: 5, condition: "clear", description: "Clear sky" }],
      daily: [{ date: "2026-10-26", high: 24, low: 16, precipitationProbability: 5, uvIndex: 3, sunrise: "2026-10-26T06:30:00Z", sunset: "2026-10-26T18:00:00Z", condition: "clear" }],
      updatedAt: "2026-10-26T12:00:00Z",
      attribution: "Weather data by Open-Meteo",
    };
    vi.stubGlobal("fetch", vi.fn(async (url) => String(url).includes("/auth/me")
      ? { ok: true, json: async () => ({ data: { authenticated: false } }) }
      : { ok: true, json: async () => ({ data: weather, recommendations: [] }) }));
    render(<PreferencesProvider><Dashboard location={{ id: "test", name: "Test City", latitude: 20, longitude: 30, timezone: "UTC" }} onSelectLocation={() => {}} /></PreferencesProvider>);
    expect(await screen.findByText("Clear sky")).toBeInTheDocument();
    expect(screen.getByText("Five-day forecast")).toBeInTheDocument();
    expect(screen.getByText("1012 hPa")).toBeInTheDocument();
  });
});
