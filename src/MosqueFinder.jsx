import { useState } from "react"
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

// --- Custom React hook for geolocation ---
function useGeolocation() {
  const [coords, setCoords] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)

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
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: 88, height: 88, borderRadius: "50%",
        background: "#f6fdfc",
        border: "2px solid #28bc8d",
        marginBottom: 8, position: "relative",
        boxShadow: "0 2px 6px rgba(40,188,141,0.06)",
      }}
    >
      <span style={{
        transition: "transform 0.6s cubic-bezier(.39,1.01,.55,.99)",
        display: "inline-block",
        transform: `rotate(${bearing}deg)`,
        fontSize: 48,
        color: "#28bc8d",
        userSelect: "none"
      }}>
        {/* Arrow points 'north' and rotates to Qibla */}
        <svg width="45" height="48" viewBox="0 0 40 42"
          aria-label="Qibla Arrow" style={{ display: "block" }}>
          <polygon points="20,4 32,34 20,28 8,34" fill="#28bc8d" />
        </svg>
      </span>
      <span style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%,-50%)",
        fontWeight: 700, fontSize: 13,
        color: "#057446", opacity: 0.6,
        pointerEvents: "none",
        userSelect: "none",
      }}>
        N
      </span>
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
    <div style={{
      minHeight: 120, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center"
    }}>
      {status === "idle" &&
        <span className="prayer-extra" style={{ color: "#757575" }}>
          Click &ldquo;Detect Qibla&rdquo; to begin.
        </span>
      }
      {status === "loading" &&
        <span className="prayer-extra" style={{ color: "#555" }}>
          Detecting your location…
        </span>
      }
      {status === "error" &&
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span className="prayer-extra" style={{ color: "#a33", fontWeight: 500 }}>{error}</span>
          <button
            onClick={onRetry}
            style={{
              marginTop: 14,
              fontWeight: 600,
              fontSize: 15,
              background: "#eee",
              color: "#1d273d",
              border: 0,
              borderRadius: 5,
              padding: "8px 22px",
              cursor: "pointer"
            }}>
            Retry
          </button>
        </div>
      }
    </div>
  )
}

// --- Qibla Result Screen: shows everything if ready ---
function QiblaResults({ coords, bearing }) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", width: "100%"
      }}>
      <CompassArrow bearing={bearing} />
      <div className="prayer-summary-title" style={{ fontWeight: 600, fontSize: 20 }}>
        Qibla Bearing: <span style={{ color: "#28bc8d" }}>{bearing}°</span>
        <span style={{ color: "#333", fontWeight: 400 }}>
          {" "}
          from north
        </span>
      </div>
      <div
        className="prayer-extra"
        style={{ marginTop: 0, fontSize: 15, color: "#057446" }}
      >
        Direction: <strong>{bearingToDirection(bearing)}</strong>
      </div>
      {coords &&
        <div className="prayer-extra" style={{ marginTop: 8, color: "#384" }}>
          <span style={{ fontSize: 14 }}>
            Your Location: <code>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</code>
          </span>
        </div>
      }
      <div style={{ marginTop: 12, fontSize: 13 }}>
        <span className="prayer-extra" style={{ color: "#062", fontSize: 13 }}>
          Face this direction when you pray. <br />
          <span style={{ color: "#28bc8d" }}>*</span> Kaaba in Makkah is at 21.4225°N, 39.8262°E
        </span>
      </div>
    </div>
  )
}

// --- Main QiblaFinder, can be used standalone or imported in App.jsx ---
function QiblaFinder() {
  // Use custom hook
  const { coords, status, error, getLocation } = useGeolocation()
  const [bearing, setBearing] = useState(null)

  // Compute bearing whenever coords change
  React.useEffect(() => {
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
                style={{ height: 38, maxHeight: 50, verticalAlign: "middle" }}
              />
            </div>
            <ul className="nav-links">
              <li>
                <a href="/">
                  <img
                    src={homeIcon}
                    alt="Home"
                    style={{ height: 25, maxHeight: 30, verticalAlign: "middle" }}
                  />
                </a>
              </li>
              {/* Future nav links go here */}
            </ul>
          </div>
        </nav>
        <div className="hero-content">
          <p className="hero-tagline">Mecca Finder</p>
          <h1 className="hero-title">Find Your Direction For Prayer</h1>
          <p className="hero-subtitle">
            Easily determine the Qibla from your current location using GPS.
          </p>
        </div>
      </header>
      <main style={{ margin: "0 auto", maxWidth: 340 }}>
        <section className="prayer-section" style={{ padding: 0, marginTop: 0 }}>
          <div
            className="prayer-summary-card"
            style={{
              marginTop: 0,
              marginBottom: 18,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 0,
            }}>
            <div
              className="prayer-summary-header"
              style={{ width: "100%", gap: 12, flexDirection: "column", alignItems: "center" }}
            >
              <div style={{ marginBottom: 14, marginTop: 12 }}>
                <button
                  className="method-select"
                  style={{
                    width: 170,
                    fontWeight: 600,
                    fontSize: 16,
                    letterSpacing: "0.03em",
                    background: "#28bc8d",
                    color: "#fff",
                    border: 0,
                    borderRadius: 6,
                    padding: "10px 0",
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    opacity: status === "loading" ? 0.7 : 1,
                  }}
                  onClick={getLocation}
                  disabled={status === "loading"}
                >
                  {coords ? "Detect Again" : "Detect Qibla"}
                </button>
              </div>
              <div style={{ minHeight: 120, marginBottom: 6, width: "100%" }}>
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
