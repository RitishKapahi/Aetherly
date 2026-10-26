import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.js";

export function useWeather(location) {
  const [state, setState] = useState({ data: null, recommendations: [], loading: true, error: "" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return undefined;
    const controller = new AbortController();
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      name: location.name ?? "Selected location",
      country: location.country ?? "",
      timezone: location.timezone ?? "auto",
    });
    setState({ data: null, recommendations: [], loading: true, error: "" });
    api(`/weather?${params}`, { signal: controller.signal })
      .then((payload) => { if (!controller.signal.aborted) setState({ data: payload.data, recommendations: payload.recommendations ?? [], loading: false, error: "" }); })
      .catch((error) => { if (!controller.signal.aborted) setState({ data: null, recommendations: [], loading: false, error: error.message }); });
    return () => controller.abort();
  }, [location?.latitude, location?.longitude, location?.timezone, location?.name, location?.country, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, retry };
}
