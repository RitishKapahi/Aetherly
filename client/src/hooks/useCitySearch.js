import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.js";

export function useCitySearch(query) {
  const [state, setState] = useState({ key: "", results: [], loading: false, error: "" });
  const [attempt, setAttempt] = useState(0);
  const value = query.trim();
  const key = `${value}:${attempt}`;

  useEffect(() => {
    if (value.length < 2) {
      setState({ key, results: [], loading: false, error: "" });
      return undefined;
    }
    setState({ key, results: [], loading: true, error: "" });
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      api(`/locations/search?q=${encodeURIComponent(value)}`, { signal: controller.signal })
        .then((payload) => { if (!controller.signal.aborted) setState({ key, results: payload.data ?? [], loading: false, error: "" }); })
        .catch((reason) => { if (!controller.signal.aborted) setState({ key, results: [], loading: false, error: reason.message }); });
    }, 260);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [value, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const visibleState = state.key === key ? state : { results: [], loading: value.length >= 2, error: "" };
  return { ...visibleState, retry };
}
