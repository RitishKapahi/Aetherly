import { lazy, Suspense } from "react";
import { ArrowDownRight, ArrowUpRight, Compass, Droplets, Eye, Heart, LoaderCircle, MapPin, RefreshCw, Shirt, Sparkles, Sunrise, Sunset, Thermometer, Umbrella, Wind } from "lucide-react";
import { usePreferences } from "../context/PreferencesContext.jsx";
import { useWeather } from "../hooks/useWeather.js";
import { formatClock, formatDay, formatTemperature, formatUpdate, formatWind } from "../utils/weather.js";
import WeatherIcon from "../components/weather/WeatherIcon.jsx";

const HourlyForecast = lazy(() => import("../components/weather/HourlyChart.jsx"));

function MetricCard({ icon: Icon, label, value, detail }) {
  return <article className="metric-card"><div className="metric-top"><span className="metric-icon"><Icon size={17} strokeWidth={1.7} /></span><span className="metric-label">{label}</span></div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></article>;
}

function WeatherHero({ data, unit, isFavorite, onFavorite }) {
  const { location, current, daily } = data;
  const today = daily?.[0];
  return (
    <section className={`weather-hero ${current.isDay ? "hero-day" : "hero-night"}`} aria-label="Current weather">
      <div className="hero-atmosphere"><span className="hero-orbit" /><span className="hero-orbit hero-orbit-two" /><WeatherIcon condition={current.condition} isDay={current.isDay} size={72} className="hero-sky-icon" /></div>
      <div className="hero-topline"><span className="current-live"><span className="live-dot" />CURRENT CONDITIONS</span><button className={`favorite-toggle ${isFavorite ? "saved" : ""}`} onClick={onFavorite} aria-pressed={isFavorite} aria-label={isFavorite ? "Remove from saved places" : "Save this place"}><Heart size={18} fill={isFavorite ? "currentColor" : "none"} />{isFavorite ? "Saved" : "Save place"}</button></div>
      <div className="hero-location"><h2>{location.name}</h2>{location.country && <span>{location.country}</span>}</div>
      <div className="hero-condition-row"><div className="hero-temperature">{formatTemperature(current.temperature, unit)}</div><div className="hero-condition-copy"><WeatherIcon condition={current.condition} isDay={current.isDay} size={28} /><span>{current.description}</span></div></div>
      <div className="hero-bottom"><span>Feels like {formatTemperature(current.feelsLike, unit)}</span><span className="hero-range"><ArrowUpRight size={14} />{formatTemperature(today?.high, unit)} <i>·</i> <ArrowDownRight size={14} />{formatTemperature(today?.low, unit)}</span><span className="hero-updated">Updated {formatUpdate(data.updatedAt, location.timezone)}</span></div>
    </section>
  );
}

function DailyForecast({ days, unit, timezone }) {
  return (
    <section className="panel daily-panel">
      <div className="section-heading"><div><span className="section-kicker">A LITTLE FURTHER OUT</span><h2>Five-day forecast</h2></div></div>
      <div className="daily-list">
        {days.map((day, index) => <div className="daily-row" key={day.date}>
          <div className="daily-day"><strong>{index === 0 ? "Today" : formatDay(day.date)}</strong><span>{new Intl.DateTimeFormat(undefined, { timeZone: "UTC", month: "short", day: "numeric" }).format(new Date(`${day.date}T12:00:00Z`))}</span></div>
          <WeatherIcon condition={day.condition} size={21} className="daily-weather-icon" />
          <div className="daily-temps"><strong>{formatTemperature(day.high, unit)}</strong><span>{formatTemperature(day.low, unit)}</span></div>
          {Number.isFinite(day.precipitationProbability) && day.precipitationProbability > 0 && <span className="daily-rain"><Droplets size={12} />{day.precipitationProbability}%</span>}
        </div>)}
      </div>
      <p className="forecast-footnote">Forecasts can change as new model data arrives.</p>
    </section>
  );
}

const recommendationIcons = { umbrella: Umbrella, walk: Compass, sun: Sunrise, jacket: Shirt, wind: Wind };
function Recommendations({ items, loading }) {
  return (
    <section className="panel advice-panel">
      <div className="section-heading"><div><span className="section-kicker">A SMALL HEADS-UP</span><h2>Plan your day</h2></div><Sparkles className="advice-sparkle" size={17} /> </div>
      {loading ? <div className="advice-loading"><LoaderCircle size={16} className="spin" /> Reading the forecast…</div> : items.length > 0 ? <div className="advice-list">{items.map((item) => {
        const Icon = recommendationIcons[item.icon] ?? Compass;
        return <article className={`advice-item tone-${item.tone}`} key={item.id}><span className="advice-icon"><Icon size={17} /></span><div><h3>{item.title}</h3><p>{item.detail}</p></div></article>;
      })}</div> : <div className="advice-empty"><span className="advice-empty-icon"><Compass size={20} /></span><p>No extra notes for these conditions.</p><span>Suggestions are based on the forecast values available for this place.</span></div>}
      <p className="advice-disclaimer">Simple forecast guidance, not an official alert or medical advice.</p>
    </section>
  );
}

function WeatherLoading() {
  return <div className="loading-state"><div className="loading-icon"><LoaderCircle size={24} className="spin" /></div><strong>Gathering the latest forecast</strong><span>Connecting to live weather data…</span><div className="loading-skeleton" /></div>;
}

function WeatherError({ message, retry }) {
  return <div className="error-state" role="alert"><div className="error-badge"><RefreshCw size={19} /></div><h2>Weather is taking a moment</h2><p>{message}</p><button className="button button-primary" onClick={retry}><RefreshCw size={15} />Try again</button><span>Make sure your connection is working, then try once more.</span></div>;
}

export default function Dashboard({ location, onSelectLocation }) {
  const { defaultCity, preferences, favorites, addFavorite, removeFavorite, addRecent } = usePreferences();
  const activeLocation = location ?? defaultCity;
  const weather = useWeather(activeLocation);
  const data = weather.data;
  const isFavorite = favorites.some((city) => city.id === activeLocation.id);

  const toggleFavorite = () => isFavorite ? removeFavorite(activeLocation.id) : addFavorite(activeLocation);
  const handleLocation = (city) => { onSelectLocation(city); addRecent(city); };

  const localDate = data?.current?.time ? new Intl.DateTimeFormat(undefined, { timeZone: data.location.timezone, weekday: "long", month: "long", day: "numeric" }).format(new Date(data.current.time)) : new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="dashboard-page">
      <div className="dashboard-intro"><div><span className="date-line">{localDate}</span><h2>The day, <em>in perspective.</em></h2><p>A clearer sense of what’s outside and what’s ahead.</p></div><button className="subtle-location" onClick={() => handleLocation(defaultCity)}><MapPin size={14} />Default city</button></div>
      {weather.loading && !data ? <WeatherLoading /> : weather.error ? <WeatherError message={weather.error} retry={weather.retry} /> : data && <>
        <div className="dashboard-top-grid">
          <WeatherHero data={data} unit={preferences.unit} isFavorite={isFavorite} onFavorite={toggleFavorite} />
          <Recommendations items={weather.recommendations} loading={weather.loading} />
        </div>
        <section className="metrics-grid" aria-label="Current conditions details">
          <MetricCard icon={Thermometer} label="Feels like" value={formatTemperature(data.current.feelsLike, preferences.unit)} detail="Perceived temperature" />
          <MetricCard icon={Droplets} label="Humidity" value={Number.isFinite(data.current.humidity) ? `${Math.round(data.current.humidity)}%` : "—"} detail="Relative humidity" />
          <MetricCard icon={Wind} label="Wind" value={formatWind(data.current.windSpeed, preferences.unit)} detail={Number.isFinite(data.current.windDirection) ? `From ${compassLabel(data.current.windDirection)}` : "At 10 metres"} />
          <MetricCard icon={Eye} label="Visibility" value={Number.isFinite(data.current.visibility) ? preferences.unit === "fahrenheit" ? `${(data.current.visibility / 1609.344).toFixed(1)} mi` : `${(data.current.visibility / 1000).toFixed(1)} km` : "—"} detail="Horizontal range" />
          <MetricCard icon={Compass} label="Pressure" value={Number.isFinite(data.current.pressure) ? `${Math.round(data.current.pressure)} hPa` : "—"} detail="Sea-level pressure" />
          <MetricCard icon={Sunrise} label="Sunrise & sunset" value={`${formatClock(data.daily?.[0]?.sunrise, data.location.timezone, { minute: undefined })} / ${formatClock(data.daily?.[0]?.sunset, data.location.timezone, { minute: undefined })}`} detail={<span className="sunrise-detail"><Sunrise size={13} /> Sunrise <Sunset size={13} /> Sunset</span>} />
        </section>
        <div className="forecast-grid">
          <Suspense fallback={<section className="panel chart-panel chart-fallback" aria-label="Loading hourly chart"><div className="section-heading"><div><span className="section-kicker">THE NEXT 24 HOURS</span><h2>Hourly outlook</h2></div></div><LoaderCircle size={18} className="spin" /></section>}>
            <HourlyForecast data={data.hourly} unit={preferences.unit} timezone={data.location.timezone} />
          </Suspense>
          <DailyForecast days={data.daily} unit={preferences.unit} timezone={data.location.timezone} />
        </div>
        <footer className="dashboard-footer"><span>{data.attribution}</span><span>Updated {formatUpdate(data.updatedAt, data.location.timezone)}</span></footer>
      </>}
    </div>
  );
}

function compassLabel(degrees) {
  const parts = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return parts[Math.round(degrees / 45) % 8];
}

