import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.js";

export function useCitySearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      api(`/locations/search?q=${encodeURIComponent(value)}`, { signal: controller.signal })
        .then((payload) => { if (!controller.signal.aborted) setResults(payload.data ?? []); })
        .catch((reason) => { if (!controller.signal.aborted) { setError(reason.message); setResults([]); } })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 260);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { results, loading, error, retry };
}
