import { Bookmark, CloudSun, Home, MapPin, X } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <button className={`sidebar-scrim ${open ? "is-visible" : ""}`} onClick={onClose} aria-label="Close navigation" tabIndex={open ? 0 : -1} />
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand-row">
          <span className="brand-mark"><CloudSun size={21} strokeWidth={1.8} /></span>
          <span className="brand-name">aetherly<span>.</span></span>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={19} /></button>
        </div>
        <div className="sidebar-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <NavLink to="/" end onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Home size={18} /><span>Overview</span><span className="nav-dot" /></NavLink>
          <NavLink to="/saved" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Bookmark size={18} /><span>Saved places</span></NavLink>
        </nav>
        <div className="sidebar-note">
          <div className="sidebar-note-icon"><MapPin size={16} /></div>
          <p>Weather that helps you plan a little better.</p>
        </div>
        <div className="sidebar-footer"><span className="status-indicator" /> Live conditions <span>·</span> Forecast</div>
      </aside>
    </>
  );
}
