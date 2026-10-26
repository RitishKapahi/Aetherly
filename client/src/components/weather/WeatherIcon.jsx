import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Moon, Snowflake, Sun, Wind } from "lucide-react";

const icons = {
  clear: Sun,
  clouds: CloudSun,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  moon: Moon,
  wind: Wind,
  frost: Snowflake,
  fallback: Cloud,
};

export default function WeatherIcon({ condition, isDay = true, size = 28, className = "" }) {
  const Icon = condition === "clear" && !isDay ? icons.moon : (icons[condition] ?? icons.fallback);
  return <Icon aria-hidden="true" className={`weather-icon ${className}`} size={size} strokeWidth={1.65} />;
}
