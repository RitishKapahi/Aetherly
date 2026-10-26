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
});
