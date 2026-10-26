import { useEffect, useRef, useState } from "react";
import { Clock3, LoaderCircle, MapPin, Search, X } from "lucide-react";
import { useCitySearch } from "../../hooks/useCitySearch.js";

function locationLabel(city) {
  return [city.name, city.admin1, city.country].filter(Boolean).join(", ");
}

export default function SearchBox({ onSelect, recent = [] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const { results, loading, error, retry } = useCitySearch(query);

  useEffect(() => {
    const close = (event) => { if (!wrapper.current?.contains(event.target)) setOpen(false); };
    const key = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); };
  }, []);

  const choose = (city) => {
    onSelect(city);
    setQuery("");
    setOpen(false);
  };

  const options = query.trim().length >= 2 ? results : (open ? recent : []);
  return (
    <div className="search-wrap" ref={wrapper}>
      <form className={`search-box ${open ? "search-focused" : ""}`} role="search" onSubmit={(event) => { event.preventDefault(); if (results[0]) choose(results[0]); }}>
        <Search size={17} aria-hidden="true" />
        <label className="sr-only" htmlFor="city-search">Search for a city</label>
        <input id="city-search" value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} placeholder="Search city or place" autoComplete="off" aria-autocomplete="list" aria-expanded={open && (options.length > 0 || loading || Boolean(error) || query.trim().length < 2)} aria-controls={options.length > 0 ? "city-suggestions" : undefined} />
        {loading ? <LoaderCircle size={16} className="spin muted-icon" aria-label="Searching" /> : query && <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}
      </form>
      {open && (options.length > 0 || error || (query.trim().length >= 2 && !loading)) && (
        <div className="search-popover">
          {query.trim().length < 2 && options.length > 0 && <div className="popover-heading">Recent places</div>}
          {query.trim().length >= 2 && <div className="popover-heading">{loading ? "Searching places…" : "Matching places"}</div>}
          {options.length > 0 && <div className="suggestion-list" id="city-suggestions" role="listbox" aria-label="City suggestions">{options.map((city) => (
            <button type="button" role="option" aria-selected="false" key={city.id} className="suggestion" onClick={() => choose(city)}>
              <span className="suggestion-icon">{query.trim().length >= 2 ? <MapPin size={16} /> : <Clock3 size={16} />}</span>
              <span className="suggestion-copy"><strong>{city.name}</strong><span>{[city.admin1, city.country].filter(Boolean).join(", ")}</span></span>
            </button>
          ))}</div>}
          {error && <div className="search-error-block"><p className="search-message error-text" role="alert">{error}</p><button type="button" className="search-retry" onClick={retry}>Try again</button></div>}
          {query.trim().length >= 2 && !loading && !error && options.length === 0 && <p className="search-message">No places found. Try another spelling.</p>}
          {query.trim().length < 2 && options.length === 0 && <p className="search-message">Type at least two letters to find a place.</p>}
        </div>
      )}
    </div>
  );
}
