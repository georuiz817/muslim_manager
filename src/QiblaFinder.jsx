import { useState, useEffect, useRef } from "react"
import logoNav from './images/white_moon_icon.png'
import homeIcon from './images/freeiconVector.webp'
import { useLanguage } from './context/LanguageContext.jsx'

const KAABA_LAT = 21.4225
const KAABA_LON = 39.8262
function getQiblaBearing(lat, lon) {
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
  return (θ + 360) % 360
}

function useGeolocation(t) {
  const [coords, setCoords] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const runGeolocate = (onError) => {
    if (!navigator.geolocation) {
      setError(t('qiblaFinder.errors.unsupported'))
      setStatus('error')
      return
    }
    const onSuccess = (pos) => {
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      setStatus('success')
    }
    const handleError = (err) => {
      if (onError) return onError(err)
      if (err.code === 1) setError(t('qiblaFinder.errors.permissionDenied'))
      else if (err.code === 2) setError(t('qiblaFinder.errors.unavailable'))
      else setError(t('qiblaFinder.errors.unknown'))
      setStatus('error')
    }
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        if (err.code === 3 || err.code === 2) {
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            handleError,
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
          )
          return
        }
        handleError(err)
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    )
  }

  useEffect(() => {
    setStatus('loading')
    setError(null)
    setCoords(null)
    runGeolocate()
    // eslint-disable-next-line
  }, [])

  const getLocation = () => {
    setStatus('loading')
    setError(null)
    setCoords(null)
    runGeolocate()
  }

  return { coords, status, error, getLocation }
}

function shortestPath(prevAccumulated, newTarget) {
  const diff = ((newTarget - prevAccumulated % 360) + 540) % 360 - 180
  return prevAccumulated + diff
}

function CompassRose({ deviceHeading, qiblaBearing }) {
  const roseRef = useRef(null)
  const markerRef = useRef(null)
  const prevRoseRot = useRef(null)
  const prevMarkerRot = useRef(null)

  useEffect(() => {
    if (!roseRef.current) return
    if (typeof deviceHeading !== 'number') {
      roseRef.current.style.setProperty('--qibla-rose-rotation', '0deg')
      prevRoseRot.current = null
      return
    }
    const target = (-deviceHeading + 360) % 360
    if (prevRoseRot.current === null) {
      prevRoseRot.current = target
    } else {
      prevRoseRot.current = shortestPath(prevRoseRot.current, target)
    }
    roseRef.current.style.setProperty('--qibla-rose-rotation', `${prevRoseRot.current}deg`)
  }, [deviceHeading])

  useEffect(() => {
    if (!markerRef.current) return
    if (typeof qiblaBearing !== 'number') {
      markerRef.current.style.setProperty('--qibla-marker-rotation', '0deg')
      prevMarkerRot.current = null
      return
    }
    const target =
      typeof deviceHeading === 'number'
        ? (qiblaBearing - deviceHeading + 360) % 360
        : qiblaBearing
    if (prevMarkerRot.current === null) {
      prevMarkerRot.current = target
    } else {
      prevMarkerRot.current = shortestPath(prevMarkerRot.current, target)
    }
    markerRef.current.style.setProperty('--qibla-marker-rotation', `${prevMarkerRot.current}deg`)
  }, [qiblaBearing, deviceHeading])

  return (
    <div className="qibla-compass" aria-label="Qibla compass">
      <div className="qibla-compass-rose" ref={roseRef} aria-hidden="true">
        <span className="qibla-compass-label qibla-compass-label--n">N</span>
        <span className="qibla-compass-label qibla-compass-label--e">E</span>
        <span className="qibla-compass-label qibla-compass-label--s">S</span>
        <span className="qibla-compass-label qibla-compass-label--w">W</span>
        <span className="qibla-compass-center" />
      </div>
      <div className="qibla-mecca-marker" ref={markerRef} aria-hidden="true">
        <span className="qibla-mecca-crescent" aria-hidden="true" />
      </div>
    </div>
  )
}

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

function QiblaResults({ bearing, deviceHeading, coords, t }) {
  return (
    <div className="qibla-results">
      <CompassRose deviceHeading={deviceHeading} qiblaBearing={bearing} />
      <p className="qibla-footnote">{t('qiblaFinder.results.faceMecca')}</p>
      {coords && (
        <div className="qibla-coords">
          <span className="qibla-coords-label">
            {t('qiblaFinder.results.yourLocationLabel')}
          </span>
          <span className="qibla-coords-value">
            {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  )
}

function QiblaFinder() {
  const { t, lang, setLang } = useLanguage()
  const { coords, status, error, getLocation } = useGeolocation(t)
  const [bearing, setBearing] = useState(null)
  const [deviceHeading, setDeviceHeading] = useState(null)
  const [compassPermissionGranted, setCompassPermissionGranted] = useState(false)
  const [showEnableCompass, setShowEnableCompass] = useState(false)

  useEffect(() => {
    if (coords) {
      setBearing(Math.round(getQiblaBearing(coords.latitude, coords.longitude)))
    } else {
      setBearing(null)
    }
  }, [coords])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const supportsAbsolute = 'ondeviceorientationabsolute' in window
    if (!supportsAbsolute) { setDeviceHeading(null); return }
    const needsPermission =
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    if (needsPermission && !compassPermissionGranted) { setDeviceHeading(null); return }

    const onOrientationAbsolute = (e) => {
      if (!e || e.absolute !== true) { setDeviceHeading(null); return }
      if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
        setDeviceHeading(e.webkitCompassHeading)
        return
      }
      const alpha = typeof e.alpha === 'number' ? e.alpha : null
      if (alpha == null || Number.isNaN(alpha)) { setDeviceHeading(null); return }
      setDeviceHeading((360 - alpha) % 360)
    }

    window.addEventListener('deviceorientationabsolute', onOrientationAbsolute, true)
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrientationAbsolute, true)
      setDeviceHeading(null)
    }
  }, [compassPermissionGranted])

  useEffect(() => {
    const supportsAbsolute = typeof window !== 'undefined' && 'ondeviceorientationabsolute' in window
    const needsPermission =
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    setShowEnableCompass(Boolean(supportsAbsolute && needsPermission && !compassPermissionGranted))
  }, [compassPermissionGranted])

  const requestCompassPermission = async () => {
    if (typeof DeviceOrientationEvent === 'undefined') return
    if (typeof DeviceOrientationEvent.requestPermission !== 'function') return
    try {
      const result = await DeviceOrientationEvent.requestPermission()
      if (result === 'granted') {
        setCompassPermissionGranted(true)
        setShowEnableCompass(false)
      }
    } catch {
      // fall back to static bearing
    }
  }

  return (
    <div className="page">
      <header className="hero hero--compact" id="top">
        <nav className="nav">
          <div className="nav-inner">
            <div className="nav-logo">
              <img src={logoNav} alt="Muslim Manager logo" />
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
                <a href="/"><img src={homeIcon} alt={t('nav.homeAlt')} /></a>
              </li>
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
          <div className="prayer-summary-card qibla-card">
            <div className="qibla-card-inner">
              <div className="qibla-results-wrap">
                <div className="qibla-actions">
                  {showEnableCompass && (
                    <button className="qibla-retry-button" type="button" onClick={requestCompassPermission}>
                      Enable Live Compass
                    </button>
                  )}
                  <button
                    className="qibla-retry-button qibla-detect-button"
                    type="button"
                    onClick={getLocation}
                    disabled={status === 'loading'}
                  >
                    {coords ? 'Detect Again' : 'Detect Qibla'}
                  </button>
                </div>
                {(!coords || bearing == null) ? (
                  <QiblaStatusScreen status={status} error={error} onRetry={getLocation} t={t} />
                ) : (
                  <QiblaResults bearing={bearing} deviceHeading={deviceHeading} coords={coords} t={t} />
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