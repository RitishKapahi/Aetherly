import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PreferencesProvider, usePreferences } from "./PreferencesContext.jsx";

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.unstubAllGlobals();
});

function PreferenceControls() {
  const { preferences, setPreference, favorites, addFavorite, removeFavorite } = usePreferences();
  const city = { id: "tokyo", name: "Tokyo", country: "Japan", latitude: 35.68, longitude: 139.69, timezone: "Asia/Tokyo" };
  return <>
    <button onClick={() => addFavorite(city)}>Save Tokyo</button>
    <button onClick={() => removeFavorite("tokyo")}>Remove Tokyo</button>
    <button onClick={() => setPreference("unit", "fahrenheit")}>Use Fahrenheit</button>
    <output aria-label="Saved count">{favorites.length}</output>
    <output aria-label="Temperature unit">{preferences.unit}</output>
  </>;
}

function SyncedPreferenceControls() {
  const { account, favorites, preferences, signOut } = usePreferences();
  return <>
    <output aria-label="Signed-in account">{account ?? "anonymous"}</output>
    <output aria-label="Favorite ids">{favorites.map((city) => city.id).join(",")}</output>
    <output aria-label="Synced unit">{preferences.unit}</output>
    <button onClick={signOut}>Sign out</button>
  </>;
}

describe("shared preferences and favourite persistence", () => {
  it("stores local preferences and saved places", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { authenticated: false } }) }));
    render(<PreferencesProvider><PreferenceControls /></PreferencesProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Save Tokyo" }));
    fireEvent.click(screen.getByRole("button", { name: "Use Fahrenheit" }));
    expect(await screen.findByLabelText("Saved count")).toHaveTextContent("1");
    await waitFor(() => expect(JSON.parse(localStorage.getItem("aetherly.favorites"))).toMatchObject([{ id: "tokyo", name: "Tokyo" }]));
    expect(JSON.parse(localStorage.getItem("aetherly.preferences")).unit).toBe("fahrenheit");
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
  });

  it("preserves device-only saves while signed in and restores them on sign out", async () => {
    const localCity = { id: "local-city", name: "Local City", latitude: 1, longitude: 1, timezone: "UTC" };
    localStorage.setItem("aetherly.favorites", JSON.stringify([localCity]));
    localStorage.setItem("aetherly.preferences", JSON.stringify({ unit: "celsius", theme: "light" }));
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (String(url).includes("/auth/me")) {
        return { ok: true, json: async () => ({ data: { authenticated: true, email: "user@example.com", favorites: [{ id: "cloud-city", name: "Cloud City" }], preferences: { unit: "fahrenheit", theme: "dark" } } }) };
      }
      return { status: 204, ok: true, json: async () => null };
    }));

    render(<PreferencesProvider><SyncedPreferenceControls /></PreferencesProvider>);
    expect(await screen.findByLabelText("Signed-in account")).toHaveTextContent("user@example.com");
    expect(screen.getByLabelText("Favorite ids")).toHaveTextContent("cloud-city");
    expect(JSON.parse(localStorage.getItem("aetherly.favorites"))).toEqual([localCity]);
    expect(JSON.parse(localStorage.getItem("aetherly.preferences"))).toEqual({ unit: "celsius", theme: "light" });

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(screen.getByLabelText("Favorite ids")).toHaveTextContent("local-city"));
    expect(screen.getByLabelText("Synced unit")).toHaveTextContent("celsius");
  });
});
