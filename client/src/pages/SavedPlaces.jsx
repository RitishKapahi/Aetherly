import { useNavigate } from "react-router-dom";
import { ArrowRight, Bookmark, Heart, MapPin, Plus, Trash2 } from "lucide-react";
import { usePreferences } from "../context/PreferencesContext.jsx";
import { useWeather } from "../hooks/useWeather.js";
import { formatTemperature } from "../utils/weather.js";
import WeatherIcon from "../components/weather/WeatherIcon.jsx";

function SavedWeather({ city, unit }) {
  const { data, loading, error } = useWeather(city);
  if (loading) return <div className="saved-current saved-loading">Checking conditions…</div>;
  if (error || !data) return <div className="saved-current saved-unavailable">Current conditions unavailable</div>;
  return <div className="saved-current"><WeatherIcon condition={data.current.condition} isDay={data.current.isDay} size={25} /><strong>{formatTemperature(data.current.temperature, unit)}</strong><span>{data.current.description}</span></div>;
}

function SavedCityCard({ city, unit, onOpen, onRemove }) {
  return <article className="saved-city-card">
    <div className="saved-card-top"><span className="saved-card-place"><MapPin size={15} /> SAVED PLACE</span><button className="icon-button remove-city" onClick={() => onRemove(city.id)} aria-label={`Remove ${city.name} from saved places`} title="Remove saved place"><Trash2 size={16} /></button></div>
    <div className="saved-city-name"><h3>{city.name}</h3><span>{[city.admin1, city.country].filter(Boolean).join(", ") || city.country || ""}</span></div>
    <SavedWeather city={city} unit={unit} />
    <button className="saved-open" onClick={() => onOpen(city)}>View forecast <ArrowRight size={15} /></button>
  </article>;
}

export default function SavedPlaces({ onSelectLocation }) {
  const { favorites, removeFavorite, preferences } = usePreferences();
  const navigate = useNavigate();
  const open = (city) => { onSelectLocation(city); navigate("/"); };

  return <div className="saved-page">
    <div className="dashboard-intro"><div><span className="date-line">YOUR PERSONAL WEATHER LIST</span><h2>Places that <em>matter.</em></h2><p>Keep the places you care about a little closer.</p></div><span className="saved-count"><Bookmark size={15} />{favorites.length} saved</span></div>
    {favorites.length ? <div className="saved-city-grid">{favorites.map((city) => <SavedCityCard key={city.id} city={city} unit={preferences.unit} onOpen={open} onRemove={removeFavorite} />)}</div> : <section className="empty-saved">
      <div className="empty-saved-icon"><Heart size={22} /></div>
      <span className="section-kicker">YOUR SHORTLIST</span>
      <h3>No saved places yet</h3>
      <p>Search for a city and tap “Save place” on its weather card. Your list will be ready here next time you need it.</p>
      <button className="button button-primary" onClick={() => navigate("/")}><Plus size={16} />Explore the weather</button>
    </section>}
    <div className="saved-sync-note"><span className="saved-sync-mark"><Bookmark size={14} /></span><p>Saved on this device. Sign in from the profile menu to sync your places across devices.</p></div>
  </div>;
}
