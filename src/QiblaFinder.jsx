import { useState, useEffect, useRef } from "react"
import logoNav from './images/white_moon_icon.png'
import homeIcon from './images/freeiconVector.webp'

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
function useGeolocation() {
  const [coords, setCoords] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)

  useEffect(() => {
    setStatus('loading')
    setError(null)
    setCoords(null)
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.')
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
        if (err.code === 1)
          setError("Permission denied. Please allow location access.")
        else if (err.code === 2)
          setError("Location unavailable.")
        else
          setError("Could not retrieve location.")
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
      setError('Geolocation not supported by your browser.')
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
        if (err.code === 1)
          setError("Permission denied. Please allow location access.")
        else if (err.code === 2)
          setError("Location unavailable.")
        else
          setError("Could not retrieve location.")
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
function QiblaStatusScreen({ status, error, onRetry }) {
  return (
    <div className="qibla-status-screen">
      {status === "idle" && (
        <p className="qibla-status-text qibla-status-text--muted">
          Attempting to detect your location…
        </p>
      )}

      {status === "loading" && (
        <p className="qibla-status-text qibla-status-text--muted">
          Detecting your location…
        </p>
      )}

      {status === "error" && (
        <div className="qibla-status-error">
          <p className="qibla-status-text qibla-status-text--error">{error}</p>
          <button className="qibla-retry-button" onClick={onRetry} type="button">
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

// --- Qibla Result Screen: shows everything if ready ---
function QiblaResults({ coords, bearing }) {
  return (
    <div className="qibla-results">
      <CompassArrow bearing={bearing} />
      <p className="qibla-bearing-title">
        Qibla Bearing: <span className="qibla-accent">{bearing}°</span>{" "}
        <span className="qibla-bearing-from">from north</span>
      </p>

      <p className="qibla-direction">
        Direction: <strong>{bearingToDirection(bearing)}</strong>
      </p>

      {coords && (
        <p className="qibla-location">
          Your Location:{" "}
          <span className="qibla-coords">
            {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </span>
        </p>
      )}

      <p className="qibla-footnote">
        Face this direction when you pray.
        <br />
        <span className="qibla-accent">*</span> Kaaba in Makkah is at 21.4225°N, 39.8262°E
      </p>
    </div>
  )
}

// --- Main QiblaFinder, can be used standalone or imported in App.jsx ---
function QiblaFinder() {
  // Use custom hook
  const { coords, status, error, getLocation } = useGeolocation()
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
                <a href="/">
                  <img
                    src={homeIcon}
                    alt="Home"
                  />
                </a>
              </li>
              {/* Future nav links go here */}
            </ul>
          </div>
        </nav>
        <div className="hero-content">
          <p className="hero-tagline">Mecca Finder</p>
          <h1 className="hero-title"> Your Direction For Prayer</h1>

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
                  />
                ) : (
                  <QiblaResults coords={coords} bearing={bearing} />
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
