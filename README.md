# Aetherly

**Weather, with perspective.** A React-first weather dashboard for current conditions, hourly and five-day forecasts, city search, saved places, and clear, rule-based day-planning suggestions.

## What it does

- Shows current conditions, feels-like temperature, humidity, wind, visibility, pressure, sunrise, and sunset.
- Plots the next 24 hours and lists the five-day high/low forecast with precipitation probability when supplied.
- Searches city names and uses browser geolocation only after the user presses the location control.
- Saves recent searches, favourite locations, theme, and units in the browser.
- Offers optional email accounts to sync favourites and preferences through MongoDB Atlas.
- Gives transparent suggestions from forecast thresholds. It does not present suggestions as medical advice or official alerts.
- Uses responsive layouts, dark and light themes, keyboard focus states, and reduced-motion support.

Weather data comes from Open-Meteo and location names from its GeoNames-backed geocoding service. The app requests data from the backend, normalizes it, caches weather for ten minutes and search results for one hour, and displays provider attribution. The free Open-Meteo endpoint is restricted to non-commercial use and has request limits; see [Open-Meteo terms](https://open-meteo.com/en/terms) and [pricing](https://open-meteo.com/en/pricing) before public or commercial use. Paid plans provide a commercial license and customer API endpoint. Official severe weather alerts are omitted because this provider integration does not supply them.

## Requirements

- Node.js 20 or newer and npm
- MongoDB Atlas connection string only if account sync is needed

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The Vite app runs at `http://localhost:5173`; Express runs at `http://localhost:4000`. Vite forwards `/api` requests to Express. Weather and city search work without an API key. Set `MONGODB_URI` and a random `JWT_SECRET` of at least 32 characters in `.env` to enable registration and cross-device sync. Set `OPEN_METEO_API_KEY` only when using a paid Open-Meteo endpoint; keep it server-side. For example, generate a secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Create an Atlas database and database user, configure its network access for your development and production environments, and use the connection string for `MONGODB_URI`. Keep `.env` private; it is ignored by Git. If MongoDB is not configured, accounts return a clear unavailable message and browser-local preferences remain usable.

## Commands

```bash
npm run dev      # Vite + Express development servers
npm run build    # production Vite build
npm test         # client and backend automated tests
npm start        # Express server (set PORT if needed)
```

## API

All endpoints are served by Express under `/api`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Service and persistence status |
| GET | `/locations/search?q=...` | Geocoded city suggestions |
| GET | `/weather?latitude=…&longitude=…&timezone=…` | Normalized current weather, hourly and daily forecast, and suggestions |
| GET | `/weather/current` | Current weather for a coordinate pair |
| GET | `/weather/forecast` | Hourly and five-day forecast for a coordinate pair |
| GET | `/auth/me` | Current account session |
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | Account session management |
| GET/POST/DELETE | `/profile/favorites` | List, save, or remove saved places |
| GET/PUT | `/profile/preferences` | Read or update account preferences |

Account routes use a bcrypt password hash, a short-lived httpOnly cookie, and per-user MongoDB data. Account creation is rate-limited. MongoDB is optional for the weather dashboard.

## Deployment

The root `vercel.json` defines two Vercel Services: `client` builds the Vite app from `client/` and serves `/`, while `server` runs the Express app from `server/` and receives public `/api/*` requests. The Express app retains its `/api` route prefix, matching the frontend's same-origin API requests. The `client` service rewrites `/saved` to the SPA entry document. The Vite proxy to `localhost:4000` is only for the standard local development command.

No service binding is configured: the browser calls the API through the public same-origin `/api/*` rewrite, and the Express service calls Open-Meteo directly. There is no server-side call from one Vercel service to another. Use `vercel dev -L` to exercise the Services routing locally. Add `MONGODB_URI` and a unique `JWT_SECRET` as Vercel project environment variables to enable account sync; keep them out of the client service bundle.

The source is published at [RitishKapahi/Aetherly](https://github.com/RitishKapahi/Aetherly) on the `main` branch. No Vercel project or live deployment is currently configured. The weather dashboard can run without MongoDB; cross-device account sync needs production MongoDB credentials, and deploying requires access to the project owner's Vercel account.

## Project structure

```text
api/                 Legacy single-service Express adapter (unused in Vercel Services mode)
client/src/app/      Router and shared application layout
client/src/components/  Search, shell, and weather display components
client/src/context/  Shared theme, units, favourites, and account state
client/src/hooks/    Weather, search, and geolocation hooks
client/src/pages/    Dashboard and saved places
client/src/services/ API client
server/src/config/   MongoDB connection
server/src/models/   Mongoose user model
server/src/routes/   Weather, account, and profile endpoints
server/src/services/ Provider normalization and recommendation rules
vercel.json          Vercel client/server services and public routing
```

## Known limitations

- Public severe weather alerts are not available in this provider integration.
- Free Open-Meteo use is non-commercial only. Confirm licensing, shared-host rate limits, and a paid plan before monetizing or moving to commercial use.
- MongoDB Atlas, GitHub, and Vercel accounts and credentials must be supplied by the project owner before cross-device sync or live deployment can be verified.
- The recommendation rules are intentionally simple thresholds and should be treated as planning hints.
