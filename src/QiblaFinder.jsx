import { useState, useEffect, useRef } from "react"
import logoNav from './images/white_moon_icon.png'
import homeIcon from './images/freeiconVector.webp'
import { useLanguage } from './context/LanguageContext.jsx'

// --- Qibla utility: bearing formula (great-circle) ---
const KAABA_LAT = 21.4225
const KAABA_LON = 39.8262
function getQiblaBearing(lat, lon) {
  // spherical formula
  const toRad = deg => (deg * Math.PI) / 180
  const toDeg = rad => (rad * 180) / Math.PI

  const φ1 = toRad(lat)
  const φ2 = toRad(KAABA_LAT)
  const Δλ = toRad(KAABA_LON - lon)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  let θ = Math.atan2(y, x)
  θ = toDeg(θ)
  return (θ + 360) % 360 // compass-style bearing from North
}

// --- Custom React hook for geolocation, now triggers automatically ---
function useGeolocation(t) {
  const [coords, setCoords] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)

  useEffect(() => {
    setStatus('loading')
    setError(null)
    setCoords(null)
    if (!navigator.geolocation) {
      setError(t('qiblaFinder.errors.unsupported'))
      setStatus('error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        })
        setStatus('success')
      },
      err => {
        if (err.code === 1) setError(t('qiblaFinder.errors.permissionDenied'))
        else if (err.code === 2) setError(t('qiblaFinder.errors.unavailable'))
        else setError(t('qiblaFinder.errors.unknown'))
        setStatus('error')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    )
    // Only try to get location once at mount, unless explicitly retried
    // eslint-disable-next-line
  }, [])

  // Manual retry support (for "Retry" button on error)
  const getLocation = () => {
    setStatus('loading')
    setError(null)
    setCoords(null)
    if (!navigator.geolocation) {
      setError(t('qiblaFinder.errors.unsupported'))
      setStatus('error')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        })
        setStatus('success')
      },
      err => {
        if (err.code === 1) setError(t('qiblaFinder.errors.permissionDenied'))
        else if (err.code === 2) setError(t('qiblaFinder.errors.unavailable'))
        else setError(t('qiblaFinder.errors.unknown'))
        setStatus('error')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    )
  }

  return { coords, status, error, getLocation }
}

// --- Compass Arrow SVG, rotates by given bearing (deg) ---
function CompassArrow({ bearing = 0 }) {
  const needleRef = useRef(null)

  useEffect(() => {
    if (!needleRef.current) return
    needleRef.current.style.setProperty('--qibla-rotation', `${bearing}deg`)
  }, [bearing])

  return (
    <div className="qibla-compass">
      <span
        className="qibla-compass-needle"
        ref={needleRef}
      >
        <svg
          className="qibla-compass-svg"
          width="45"
          height="48"
          viewBox="0 0 40 42"
          aria-label="Qibla Arrow"
        >
          <polygon points="20,4 32,34 20,28 8,34" className="qibla-compass-polygon" />
        </svg>
      </span>
      <span className="qibla-compass-north">N</span>
    </div>
  )
}

// --- Readable compass direction ("East-Northeast", etc) ---
function bearingToDirection(bearing) {
  const directions = [
    "North", "North-East", "East", "South-East",
    "South", "South-West", "West", "North-West", "North"
  ]
  const idx = Math.round(bearing / 45) % 8
  return directions[idx]
}

// --- Status/Error Screen component ---
function QiblaStatusScreen({ status, error, onRetry, t }) {
  return (
    <div className="qibla-status-screen">
      {status === "idle" && (
        <p className="qibla-status-text qibla-status-text--muted">
          {t('qiblaFinder.status.idle')}
        </p>
      )}

      {status === "loading" && (
        <p className="qibla-status-text qibla-status-text--muted">
          {t('qiblaFinder.status.loading')}
        </p>
      )}

      {status === "error" && (
        <div className="qibla-status-error">
          <p className="qibla-status-text qibla-status-text--error">{error}</p>
          <button className="qibla-retry-button" onClick={onRetry} type="button">
            {t('qiblaFinder.status.retry')}
          </button>
        </div>
      )}
    </div>
  )
}

// --- Qibla Result Screen: shows everything if ready ---
function QiblaResults({ coords, bearing, t }) {
  return (
    <div className="qibla-results">
      <CompassArrow bearing={bearing} />
      <p className="qibla-bearing-title">
        {t('qiblaFinder.results.bearingLabel')}{' '}
        <span className="qibla-accent">{bearing}°</span>{' '}
        <span className="qibla-bearing-from">{t('qiblaFinder.results.fromNorth')}</span>
      </p>

      <p className="qibla-direction">
        {t('qiblaFinder.results.directionLabel')}{' '}
        <strong>{bearingToDirection(bearing)}</strong>
      </p>

      {coords && (
        <p className="qibla-location">
          {t('qiblaFinder.results.yourLocationLabel')}{' '}
          <span className="qibla-coords">
            {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </span>
        </p>
      )}

      <p className="qibla-footnote">
        {t('qiblaFinder.results.footnoteLine1')}
        <br />
        <span className="qibla-accent">*</span> {t('qiblaFinder.results.footnoteLine2')}
      </p>
    </div>
  )
}

// --- Main QiblaFinder, can be used standalone or imported in App.jsx ---
function QiblaFinder() {
  const { t, lang, setLang } = useLanguage()
  // Use custom hook
  const { coords, status, error, getLocation } = useGeolocation(t)
  const [bearing, setBearing] = useState(null)

  // Compute bearing whenever coords change
  useEffect(() => {
    if (coords) {
      setBearing(Math.round(getQiblaBearing(coords.latitude, coords.longitude)))
    } else {
      setBearing(null)
    }
  }, [coords])

  return (
    <div className="page">
      <header className="hero hero--compact" id="top">
        <nav className="nav">
          <div className="nav-inner">
            <div className="nav-logo">
              <img
                src={logoNav}
                alt="Muslim Manager logo"
              />
            </div>
            <ul className="nav-links">
              <li>
                <select
                  className="lang-toggle"
                  aria-label="Language"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="bn">🇧🇩 বাংলা</option>
                </select>
              </li>
              <li>
                <a href="/">
                  <img
                    src={homeIcon}
                    alt={t('nav.homeAlt')}
                  />
                </a>
              </li>
              {/* Future nav links go here */}
            </ul>
          </div>
        </nav>
        <div className="hero-content">
          <p className="hero-tagline">{t('qiblaFinder.heroTagline')}</p>
          <h1 className="hero-title">{t('qiblaFinder.heroTitle')}</h1>

        </div>
      </header>
      <main className="qibla-main">
        <section className="qibla-section">
          <div
            className="prayer-summary-card qibla-card"
          >
            <div
              className="qibla-card-inner"
            >
              {/* Remove manual "Detect Qibla" button, attempt detection on mount */}
              {/* Provide a retry button only if error */}
              <div className="qibla-results-wrap">
                {(!coords || bearing == null) ? (
                  <QiblaStatusScreen
                    status={status}
                    error={error}
                    onRetry={getLocation}
                    t={t}
                  />
                ) : (
                  <QiblaResults coords={coords} bearing={bearing} t={t} />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default QiblaFinder
