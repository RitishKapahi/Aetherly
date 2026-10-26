import { useState } from "react";

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const locate = () => new Promise((resolve) => {
    if (!navigator.geolocation) {
      setError("This browser does not support location access. You can still search for a city.");
      resolve(null);
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLoading(false);
        resolve({ id: `location:${coords.latitude.toFixed(3)}:${coords.longitude.toFixed(3)}`, name: "Current location", country: "", latitude: coords.latitude, longitude: coords.longitude, timezone: "auto" });
      },
      (reason) => {
        setLoading(false);
        setError(reason.code === 1 ? "Location access was declined. Search for a city instead." : "Could not determine your location. Please try again or search for a city.");
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });

  return { locate, loading, error, clearError: () => setError("") };
}
