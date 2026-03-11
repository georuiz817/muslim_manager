import { useState } from "react"
import logoNav from './images/white_moon_icon.png'
import homeIcon from './images/freeiconVector.webp'



const KAABA_LAT = 21.4225
const KAABA_LON = 39.8262

// Haversine bearing formula
function getQiblaBearing(lat, lon) {
  // Convert degrees to radians
  const toRad = deg => (deg * Math.PI) / 180
  const toDeg = rad => (rad * 180) / Math.PI

  const phi1 = toRad(lat)
  const phi2 = toRad(KAABA_LAT)
  const deltaLambda = toRad(KAABA_LON - lon)

  const y = Math.sin(deltaLambda) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)
  let bearing = Math.atan2(y, x)
  bearing = toDeg(bearing)
  // Normalize to 0–360
  return (bearing + 360) % 360
}

function QiblaFinder() {
  const [coords, setCoords] = useState(null)
  const [bearing, setBearing] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleDetect = () => {
    setLoading(true)
    setError(null)
    setCoords(null)
    setBearing(null)

    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        setCoords({ latitude, longitude })
        const qibla = getQiblaBearing(latitude, longitude)
        setBearing(Math.round(qibla))
        setLoading(false)
      },
      err => {
        if (err.code === 1) {
          setError("Permission denied. Please allow location access.")
        } else if (err.code === 2) {
          setError("Location unavailable.")
        } else {
          setError("Could not retrieve location.")
        }
        setLoading(false)
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="page">
      <header className="hero hero--compact" id="top">
        {/* nav replaced with App.jsx (8-30) */}
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
            মুখ বুঝে নামাজ পড়ুন—আপনার অবস্থান থেকে কাবার (মক্কা) দিক নির্ণয় করুন সহজেই।
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
            }}
          >
            <div className="prayer-summary-header" style={{ gap: 12, flexDirection: "column", alignItems: "center" }}>
              <div style={{ marginBottom: 14, marginTop: 12 }}>
                <button
                  className="method-select"
                  style={{
                    width: 170,
                    fontWeight: 600,
                    fontSize: 16,
                    letterSpacing: 0.03 + "em",
                    background: "#28bc8d",
                    color: "#fff",
                    border: 0,
                    borderRadius: 6,
                    padding: "10px 0",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                  onClick={handleDetect}
                  disabled={loading}
                >
                  {coords ? "Detect Again" : "Detect Qibla"}
                </button>
              </div>

              <div style={{ minHeight: 92, marginBottom: 6 }}>
                {loading && (
                  <span className="prayer-extra" style={{ color: "#555" }}>
                    Detecting your location…
                  </span>
                )}
                {error && (
                  <span className="prayer-extra" style={{ color: "#a33", fontWeight: 500 }}>
                    {error}
                  </span>
                )}
                {bearing !== null && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: 74,
                        height: 74,
                        borderRadius: "50%",
                        background: "#f6fdfc",
                        border: "2px solid #28bc8d",
                        marginBottom: 9,
                        position: "relative",
                        boxShadow: "0 2px 6px rgba(40,188,141,0.06)",
                      }}
                    >
                      <span style={{
                        transition: "transform 0.6s cubic-bezier(.39,1.01,.55,.99)",
                        display: "inline-block",
                        transform: `rotate(${bearing}deg)`,
                        fontSize: 48,
                        color: "#28bc8d",
                        lineHeight: "1",
                        userSelect: "none",
                      }}>
                        {/* Simple north-to-qibla arrow */}
                        <svg
                          width="40"
                          height="42"
                          viewBox="0 0 40 42"
                          style={{ display: "block" }}
                          aria-label="Qibla Arrow"
                        >
                          <polygon points="20,4 32,34 20,28 8,34" fill="#28bc8d" />
                        </svg>
                      </span>
                      <span style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%,-50%)",
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#057446",
                        letterSpacing: 0.015 + "em",
                        pointerEvents: "none",
                        opacity: 0.6,
                        userSelect: "none",
                      }}>
                        N
                      </span>
                    </div>
                    <span className="prayer-summary-title" style={{ fontWeight: 600, fontSize: 19 }}>
                      কিবলা: {bearing}°
                      <span className="prayer-summary-hijri" style={{ color: "#333", fontWeight: 400 }}>
                        {" "}উত্তর থেকে
                      </span>
                    </span>
                    <span className="prayer-extra" style={{ fontSize: 15, color: "#057446", marginTop: 5 }}>
                      Face this direction when you pray.
                    </span>
                  </div>
                )}
                {!loading && !error && bearing === null && (
                  <span className="prayer-extra" style={{ color: "#757575" }}>
                    Click “Detect Qibla” to find direction.
                  </span>
                )}
              </div>
              <div style={{ marginTop: 9 }}>
                <span className="prayer-extra" style={{ color: "#062", fontSize: 13 }}>
                  For best accuracy, stand still and ensure your device location is on. No compass needed.<br />
                  <span style={{ color: "#28bc8d" }}>*</span> Calculates direction to Kaaba in Makkah from your current location.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default QiblaFinder
