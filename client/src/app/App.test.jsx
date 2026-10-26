import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";
import { PreferencesProvider } from "../context/PreferencesContext.jsx";

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function weatherResponse(name) {
  return {
    data: {
      location: { name, country: "", latitude: 0, longitude: 0, timezone: "UTC" },
      current: { time: "2026-10-26T12:00:00Z", temperature: 20, feelsLike: 20, humidity: 45, windSpeed: 8, windDirection: 0, visibility: 10000, pressure: 1012, isDay: true, weatherCode: 0, condition: "clear", description: "Clear sky" },
      hourly: [],
      daily: [{ date: "2026-10-26", high: 22, low: 14, precipitationProbability: 0, uvIndex: 2, sunrise: "2026-10-26T06:30:00Z", sunset: "2026-10-26T18:00:00Z", condition: "clear" }],
      updatedAt: "2026-10-26T12:00:00Z",
      attribution: "Weather data by Open-Meteo",
    },
    recommendations: [],
  };
}

function mockAppFetch() {
  vi.stubGlobal("fetch", vi.fn(async (input) => {
    const url = new URL(String(input), "http://localhost");
    if (url.pathname.endsWith("/auth/me")) return { ok: true, json: async () => ({ data: { authenticated: false } }) };
    if (url.pathname.endsWith("/locations/search")) {
      return { ok: true, json: async () => ({ data: [{ id: "london-1", name: "London", admin1: "England", country: "United Kingdom", latitude: 51.5, longitude: -0.12, timezone: "Europe/London" }] }) };
    }
    return { ok: true, json: async () => weatherResponse(url.searchParams.get("name") || "Default city") };
  }));
}

describe("active city persistence", () => {
  it("restores the previous city and saves the next selected city", async () => {
    localStorage.setItem("aetherly.activeLocation", JSON.stringify({
      id: "auckland-1", name: "Auckland", country: "New Zealand", latitude: -36.85, longitude: 174.76, timezone: "Pacific/Auckland",
    }));
    mockAppFetch();

    render(<MemoryRouter initialEntries={["/"]}><PreferencesProvider><App /></PreferencesProvider></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Auckland" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Search for a city" }), { target: { value: "London" } });
    fireEvent.click(await screen.findByRole("option", { name: /London.*United Kingdom/ }));

    await waitFor(() => expect(JSON.parse(localStorage.getItem("aetherly.activeLocation"))).toMatchObject({ id: "london-1", name: "London" }));
    expect(await screen.findByRole("heading", { name: "London" })).toBeInTheDocument();
  });
});
