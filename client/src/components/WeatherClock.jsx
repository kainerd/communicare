/**
 * WeatherClock
 * Displays a live clock, today's date, and current weather conditions.
 * Uses:
 *   - Open-Meteo  (https://open-meteo.com/)  – free, no API key required
 *   - OpenStreetMap Nominatim                – reverse geocoding, free
 *   - Browser Geolocation API
 *
 * Prop `compact`  (bool, default false) – renders a single-line mini version
 * for the Navbar.
 */

import { useState, useEffect, useRef } from 'react';

/* ── Weather code → emoji + label mapping (WMO standard) ── */
const WMO = {
  0:  { icon: '☀️',  label: 'Clear sky' },
  1:  { icon: '🌤️', label: 'Mainly clear' },
  2:  { icon: '⛅',  label: 'Partly cloudy' },
  3:  { icon: '☁️',  label: 'Overcast' },
  45: { icon: '🌫️', label: 'Foggy' },
  48: { icon: '🌫️', label: 'Icy fog' },
  51: { icon: '🌦️', label: 'Light drizzle' },
  53: { icon: '🌦️', label: 'Drizzle' },
  55: { icon: '🌧️', label: 'Heavy drizzle' },
  61: { icon: '🌧️', label: 'Light rain' },
  63: { icon: '🌧️', label: 'Rain' },
  65: { icon: '🌧️', label: 'Heavy rain' },
  71: { icon: '🌨️', label: 'Light snow' },
  73: { icon: '🌨️', label: 'Snow' },
  75: { icon: '❄️',  label: 'Heavy snow' },
  77: { icon: '🌨️', label: 'Snow grains' },
  80: { icon: '🌦️', label: 'Rain showers' },
  81: { icon: '🌧️', label: 'Heavy showers' },
  82: { icon: '⛈️',  label: 'Violent showers' },
  85: { icon: '🌨️', label: 'Snow showers' },
  86: { icon: '❄️',  label: 'Heavy snow showers' },
  95: { icon: '⛈️',  label: 'Thunderstorm' },
  96: { icon: '⛈️',  label: 'Thunderstorm + hail' },
  99: { icon: '⛈️',  label: 'Thunderstorm + hail' },
};

function wmoLookup(code) {
  return WMO[code] ?? { icon: '🌡️', label: 'Unknown' };
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatTime(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${pad(h % 12 || 12)}:${pad(m)}:${pad(s)} ${ampm}`;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatDateShort(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

/* ─────────────────────────────────────────────────────── */

export default function WeatherClock({ compact = false }) {
  const [now, setNow]         = useState(new Date());
  const [weather, setWeather] = useState(null);   // { temp, code, unit }
  const [city, setCity]       = useState('');
  const [status, setStatus]   = useState('locating'); // locating | loading | ok | denied | error

  const coordsRef = useRef(null);

  /* Live clock — ticks every second */
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* Geolocation → weather + city */
  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords;
        coordsRef.current = { lat, lon };
        setStatus('loading');

        try {
          // Fetch weather and city name in parallel
          const [weatherRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
              `&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=auto`
            ),
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            ),
          ]);

          const weatherJson = await weatherRes.json();
          const geoJson     = await geoRes.json();

          const cur  = weatherJson.current;
          const addr = geoJson.address;

          setWeather({
            temp: Math.round(cur.temperature_2m),
            code: cur.weather_code,
            unit: '°C',
          });

          // Pick most specific available place name
          setCity(
            addr.city       ||
            addr.town       ||
            addr.village    ||
            addr.county     ||
            addr.state      ||
            'Your location'
          );

          setStatus('ok');
        } catch {
          setStatus('error');
        }
      },
      () => setStatus('denied'),
      { timeout: 10000 }
    );
  }, []);

  /* ── Compact view (for Navbar) ── */
  if (compact) {
    const wmo = weather ? wmoLookup(weather.code) : null;
    return (
      <div style={cs.wrap}>
        <span style={cs.time}>{formatTime(now)}</span>
        <span style={cs.sep} className="wc-date">·</span>
        <span style={cs.date} className="wc-date">{formatDateShort(now)}</span>
        {status === 'ok' && weather && (
          <>
            <span style={cs.sep}>·</span>
            <span style={cs.weather}>{wmo.icon} {weather.temp}{weather.unit}</span>
            {city && <span style={cs.city} className="wc-city">{city}</span>}
          </>
        )}
        {status === 'loading' && <span style={cs.sep}>· 🌡️ …</span>}
        {status === 'denied'  && <span style={cs.sep}>· 📍 off</span>}
      </div>
    );
  }

  /* ── Full card view (for Dashboard) ── */
  const wmo = weather ? wmoLookup(weather.code) : null;

  return (
    <div style={fs.card} className="wc-full-card">
      {/* Left: clock */}
      <div style={fs.clockSide}>
        <p style={fs.time}>{formatTime(now)}</p>
        <p style={fs.date}>{formatDate(now)}</p>
      </div>

      {/* Divider */}
      <div style={fs.divider} className="wc-divider" />

      {/* Right: weather */}
      <div style={fs.weatherSide}>
        {status === 'locating' && (
          <p style={fs.statusMsg}>📍 Requesting location…</p>
        )}
        {status === 'loading' && (
          <p style={fs.statusMsg}>🌡️ Fetching weather…</p>
        )}
        {status === 'denied' && (
          <div>
            <p style={fs.statusMsg}>📍 Location access denied</p>
            <p style={fs.statusSub}>Enable location in your browser to see live weather.</p>
          </div>
        )}
        {status === 'error' && (
          <p style={fs.statusMsg}>⚠️ Weather unavailable</p>
        )}
        {status === 'ok' && weather && wmo && (
          <div style={fs.weatherInfo}>
            <span style={fs.weatherIcon}>{wmo.icon}</span>
            <div>
              <p style={fs.temp}>{weather.temp}{weather.unit}</p>
              <p style={fs.condition}>{wmo.label}</p>
              {city && <p style={fs.cityName}>📍 {city}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Compact (Navbar) styles ── */
const cs = {
  wrap:    { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', opacity: 0.9 },
  time:    { fontWeight: '700', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' },
  sep:     { opacity: 0.5 },
  date:    { opacity: 0.8 },
  weather: { fontWeight: '600' },
  city:    { opacity: 0.7, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};

/* ── Full card styles ── */
const fs = {
  card: {
    background: 'linear-gradient(135deg, #1e3a5f 0%, #1e4976 100%)',
    borderRadius: '16px', padding: '24px 28px',
    display: 'flex', alignItems: 'center', gap: '28px',
    color: '#fff', marginBottom: '28px',
    boxShadow: '0 4px 20px rgba(30,58,95,0.25)',
    flexWrap: 'wrap',
  },
  clockSide: { flex: 1, minWidth: '200px' },
  time: {
    fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: '800',
    fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
    margin: 0, lineHeight: 1,
  },
  date: {
    fontSize: '0.9rem', opacity: 0.75, marginTop: '8px',
    fontWeight: '500', margin: '8px 0 0',
  },
  divider: {
    width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.2)',
    flexShrink: 0,
  },
  weatherSide: { flex: 1, minWidth: '160px' },
  weatherInfo: { display: 'flex', alignItems: 'center', gap: '14px' },
  weatherIcon: { fontSize: '3.2rem', lineHeight: 1 },
  temp: { fontSize: '2rem', fontWeight: '800', margin: 0, lineHeight: 1 },
  condition: { fontSize: '0.9rem', opacity: 0.8, margin: '4px 0 0', fontWeight: '500' },
  cityName:  { fontSize: '0.8rem', opacity: 0.65, margin: '4px 0 0' },
  statusMsg: { fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500' },
  statusSub: { fontSize: '0.78rem', opacity: 0.6, margin: '4px 0 0' },
};
