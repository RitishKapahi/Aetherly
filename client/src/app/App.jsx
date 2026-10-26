import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "../components/layout/Sidebar.jsx";
import SearchBox from "../components/common/SearchBox.jsx";
import AccountDialog from "../components/common/AccountDialog.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import SavedPlaces from "../pages/SavedPlaces.jsx";
import { usePreferences } from "../context/PreferencesContext.jsx";
import { useGeolocation } from "../hooks/useGeolocation.js";
import { readActiveLocation, saveActiveLocation } from "../utils/activeLocation.js";
import { Sun, Moon, MapPinned, UserRound, LogOut } from "lucide-react";

function AppLayout() {
  const { preferences, setPreference, recent, account, signOut, addRecent } = usePreferences();
  const { locate, loading: locating, error: locationError, clearError } = useGeolocation();
  const [selectedCity, setSelectedCity] = useState(readActiveLocation);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const selectCity = (city) => {
    const selected = { ...city, id: String(city.id ?? `${city.latitude.toFixed(3)}:${city.longitude.toFixed(3)}`) };
    setSelectedCity(selected);
    saveActiveLocation(selected);
    addRecent(selected);
    clearError();
  };

  const selectCurrentLocation = async () => {
    const city = await locate();
    if (city) selectCity(city);
  };

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-start">
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <div className="page-context"><span className="context-overline">YOUR WEATHER, AT A GLANCE</span><h1>Good to see you<span className="context-period">.</span></h1></div>
          </div>
          <div className="topbar-tools">
            <SearchBox onSelect={selectCity} recent={recent} />
            <button className={`icon-button location-button ${locating ? "is-loading" : ""}`} onClick={selectCurrentLocation} disabled={locating} title="Use your location for local weather" aria-label={locating ? "Finding your location" : "Use your current location for local weather"}><MapPinned size={18} /></button>
            <div className="unit-switch" role="group" aria-label="Temperature units">
              <button onClick={() => setPreference("unit", "celsius")} aria-pressed={preferences.unit === "celsius"}>°C</button>
              <span aria-hidden="true" />
              <button onClick={() => setPreference("unit", "fahrenheit")} aria-pressed={preferences.unit === "fahrenheit"}>°F</button>
            </div>
            <button className="icon-button theme-button" onClick={() => setPreference("theme", preferences.theme === "light" ? "dark" : "light")} title={`Switch to ${preferences.theme === "light" ? "dark" : "light"} theme`} aria-label={`Switch to ${preferences.theme === "light" ? "dark" : "light"} theme`}>{preferences.theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
            <div className="account-control">
              <button className={`account-button ${account ? "has-account" : ""}`} onClick={() => account ? setAccountMenuOpen((value) => !value) : setAccountOpen(true)} aria-label={account ? `Account: ${account}` : "Sign in to sync preferences"} title={account ?? "Sign in to sync preferences"}>
                <UserRound size={17} />{account && <span className="account-label">{account.split("@")[0]}</span>}
              </button>
              {accountMenuOpen && account && <div className="account-menu"><span className="account-menu-email">{account}</span><button onClick={() => { setAccountMenuOpen(false); signOut(); }}><LogOut size={15} />Sign out</button></div>}
            </div>
          </div>
        </header>
        {locationError && <div className="location-notice" role="status"><MapPinned size={16} /><span>{locationError}</span><button className="notice-dismiss" onClick={clearError} aria-label="Dismiss location message">×</button></div>}
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard location={selectedCity} onSelectLocation={selectCity} onRequestLocation={selectCurrentLocation} locating={locating} />} />
            <Route path="/saved" element={<SavedPlaces onSelectLocation={selectCity} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      {accountOpen && <AccountDialog onClose={() => setAccountOpen(false)} />}
    </div>
  );
}

export default function App() { return <AppLayout />; }
