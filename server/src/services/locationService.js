export async function searchLocations(query) {
  const url = new URL(process.env.OPEN_METEO_GEOCODING_URL || "https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "6");
  url.searchParams.set("language", "en");
  if (process.env.OPEN_METEO_API_KEY) url.searchParams.set("apikey", process.env.OPEN_METEO_API_KEY);
  let response;
  try { response = await fetch(url, { signal: AbortSignal.timeout(7000) }); }
  catch { throw Object.assign(new Error("Location search is temporarily unavailable."), { status: 502, publicMessage: "Location search is temporarily unavailable. Check your connection and try again." }); }
  if (!response.ok) throw Object.assign(new Error("Location search is temporarily unavailable."), { status: 502, publicMessage: "Location search is temporarily unavailable." });
  let data;
  try { data = await response.json(); }
  catch { throw Object.assign(new Error("The location provider returned unreadable data."), { status: 502, publicMessage: "Location search returned unreadable data." }); }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw Object.assign(new Error("The location provider returned an invalid response."), { status: 502, publicMessage: "Location search returned invalid data." });
  }
  if (data.results !== undefined && !Array.isArray(data.results)) {
    throw Object.assign(new Error("The location provider returned an invalid response."), { status: 502, publicMessage: "Location search returned invalid data." });
  }
  return (data.results ?? []).filter((item) => typeof item?.name === "string" && item.name.trim() && Number.isFinite(item.latitude) && item.latitude >= -90 && item.latitude <= 90 && Number.isFinite(item.longitude) && item.longitude >= -180 && item.longitude <= 180).map((item) => ({
    id: String(item.id),
    name: item.name,
    admin1: item.admin1 ?? "",
    country: item.country ?? "",
    countryCode: item.country_code ?? "",
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone || "UTC",
  }));
}
