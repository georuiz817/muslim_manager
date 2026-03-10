import React, { useState, useRef } from 'react'

// --- Util: Haversine formula to calculate distance (km) ---
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// --- Modular Component: Mosque Card ---
function MosqueCard({ mosque }) {
  const {
    name,
    address,
    distance,
    lat,
    lon,
    website,
  } = mosque

  // Prefer external website, otherwise "Open in Google Maps"
  let linkUrl = website
  let linkText = "Website"
  if (!website) {
    linkUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    linkText = "Open in Google Maps"
  }

  return (
    <div
      className="prayer-summary-card"
      role="button"
      tabIndex={0}
      style={{
        marginBottom: 18,
        padding: 16,
        borderRadius: 10,
        boxShadow: '0 1px 4px 0 #ddd',
        background: '#fff',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 18, color: '#222', marginBottom: 4, wordBreak: 'break-word' }}>
        {name || 'Unnamed Mosque'}
      </span>
      <span style={{ color: '#28bc8d', fontSize: 16, marginBottom: 3 }}>
        🕌 {Number(distance).toFixed(2)} km
      </span>
      <span style={{ fontSize: 15, color: '#444', marginBottom: 8, wordBreak: 'break-word' }}>
        {address || '—'}
      </span>
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="prayer-ghost-button"
        style={{
          display: 'inline-block',
          fontWeight: 600,
          color: '#28bc8d',
          fontSize: 15,
          marginTop: 4,
          padding: '10px 0',
          border: '1px solid #28bc8d',
          borderRadius: 6,
          background: 'white',
          textAlign: 'center',
          minWidth: 0,
        }}
      >
        <span role="img" aria-label="link" style={{ marginRight: 7, verticalAlign: '-0.15em' }}>
          <svg width="22" height="22" style={{ verticalAlign: 'middle' }} viewBox="0 0 22 22">
            <g fill="none" stroke="#28bc8d" strokeWidth="2">
              <circle cx="11" cy="11" r="10" />
              <path d="M8.5 11l2.2 2.2M8.5 11l2.2-2.2M8.5 11h5.2" />
            </g>
          </svg>
        </span>
        {linkText}
      </a>
    </div>
  )
}

// --- Modular Component: Mosque List ---
function MosqueList({ mosques }) {
  if (!mosques.length) return null
  return (
    <div style={{ marginTop: 8 }}>
      {mosques.map((mosque, idx) => (
        <MosqueCard mosque={mosque} key={mosque.id || `${mosque.lat},${mosque.lon},${idx}`} />
      ))}
    </div>
  )
}

// --- Mosque Finder (Location-First) Page ---
function MosqueFinder() {
  // STATE
  const [coords, setCoords] = useState(null) // { lat, lon }
  const [mosques, setMosques] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [empty, setEmpty] = useState(false)
  const [locState, setLocState] = useState('idle') // idle | requesting | granted | denied

  // Cache (in-memory), also use localStorage where possible
  const cache = useRef({})
  const localStorageKey = 'mosqueFinderCacheV2'

  // Load cache from localStorage once
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(localStorageKey)
      if (raw) cache.current = JSON.parse(raw)
    } catch (e) {}
  }, [])

  // Cache by coordinate, rounded to 4 decimals = ~11m precision
  function coordsCacheKey(lat, lon) {
    return `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`
  }

  // Helper: cache results to localStorage
  function updateCache(key, value) {
    cache.current[key] = value
    try {
      window.localStorage.setItem(localStorageKey, JSON.stringify(cache.current))
    } catch (e) {}
  }

  // --- Fetch nearby mosques given coords ---
  async function fetchMosquesNearby(lat, lon) {
    setLoading(true)
    setError('')
    setEmpty(false)
    setMosques([])

    const cacheKey = coordsCacheKey(lat, lon)
    if (cache.current[cacheKey]) {
      const cached = cache.current[cacheKey]
      setMosques(cached.mosques)
      setLoading(false)
      setEmpty(cached.mosques.length === 0)
      setCoords({ lat, lon })
      return
    }

    // Build Overpass QL for all relevant tags, within 4000m radius
    // Includes: amenity=place_of_worship + religion=muslim; fallback building=mosque
    const overpassQuery = `
      [out:json][timeout:20];
      (
        node["amenity"="place_of_worship"]["religion"="muslim"](around:4000,${lat},${lon});
        way["amenity"="place_of_worship"]["religion"="muslim"](around:4000,${lat},${lon});
        relation["amenity"="place_of_worship"]["religion"="muslim"](around:4000,${lat},${lon});

        node["building"="mosque"](around:4000,${lat},${lon});
        way["building"="mosque"](around:4000,${lat},${lon});
        relation["building"="mosque"](around:4000,${lat},${lon});
      );
      out center;
    `.replace(/\s+/g, ' ')

    try {
      const response = await fetch(
        'https://overpass-api.de/api/interpreter',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: `data=${encodeURIComponent(overpassQuery)}`,
        }
      )
      if (!response.ok) throw new Error('Could not reach Overpass API. Too many requests?')
      const overpass = await response.json()
      const elements = overpass && overpass.elements ? overpass.elements : []

      // Parse, filter, map & enrich
      let mosqueList = elements
        .map((el) => {
          const lat_ = el.type === 'node'
            ? el.lat
            : el.center && el.center.lat
          const lon_ = el.type === 'node'
            ? el.lon
            : el.center && el.center.lon
          if (!lat_ || !lon_) return null
          const tags = el.tags || {}

          let name = tags.name || tags['name:en'] || ''
          if (!name && tags['name:bn']) name = tags['name:bn']
          // Address or area
          let addr =
            tags['addr:street'] ||
            tags['addr:place'] ||
            tags['addr:district'] ||
            tags['addr:city'] ||
            tags['addr:suburb'] ||
            tags['addr:neighbourhood'] ||
            tags['name:en'] ||
            tags['name:bn'] ||
            ''
          // Try full address
          if (tags['addr:full']) addr = tags['addr:full']
          // Prefer shorter, Bengali if available
          if (tags['addr:place:bn']) addr = tags['addr:place:bn']
          // Website if present
          let website = tags['website'] || tags['contact:website'] || ''
          return {
            id: el.id,
            name,
            address: addr,
            website,
            lat: lat_,
            lon: lon_,
            distance: haversine(Number(lat), Number(lon), Number(lat_), Number(lon_))
          }
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance)

      // Deduplicate by lat/lon
      const uniqueMap = {}
      mosqueList = mosqueList.filter((m) => {
        const sig = `${m.lat},${m.lon}`
        if (uniqueMap[sig]) return false
        uniqueMap[sig] = true
        return true
      })

      setMosques(mosqueList)
      setCoords({ lat, lon })
      setLoading(false)
      setEmpty(mosqueList.length === 0)
      updateCache(cacheKey, { mosques: mosqueList })
    } catch (err) {
      setLoading(false)
      setMosques([])
      setError('Network error, or service unavailable. Try again later.')
    }
  }

  // --- Location Request Handler ---
  function handleFindMyLocation() {
    setError('')
    setEmpty(false)
    setLocState('requesting')
    setLoading(false)
    setMosques([])
    setCoords(null)

    if (!window.navigator.geolocation) {
      setError('Geolocation is not supported by your device or browser.')
      setLocState('denied')
      return
    }

    window.navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocState('granted')
        fetchMosquesNearby(latitude, longitude)
      },
      (err) => {
        setLocState('denied')
        if (err.code === 1) {
          setError('Location permission denied. Please allow access to search for nearby mosques.')
        } else if (err.code === 2) {
          setError('Location not found. Please try again from another area.')
        } else {
          setError('Could not access your location. Please allow location permission and try again.')
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 0,
      }
    )
  }

  // --- Optionally: Auto-prompt on initial page load, commented out for stricter privacy UX
  // React.useEffect(() => {
  //   handleFindMyLocation()
  // }, [])

  // --- RENDER ---
  return (
    <div className="page">
      <header className="hero hero--compact" id="top">
        <nav className="nav">
          <div className="nav-inner">
            <div className="nav-logo">Muslim Manager</div>
            <ul className="nav-links">
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </div>
        </nav>
        <div className="hero-content">
          <p className="hero-tagline">Mosque Finder</p>
          <h1 className="hero-title">Find Nearby Mosques</h1>
          <p className="hero-subtitle">
            Quickly locate mosques near you, anywhere in Bangladesh.<br />
            Your location is required to use this feature.
          </p>
        </div>
      </header>
      <main style={{
        maxWidth: 390,
        margin: "0 auto",
        padding: "0 0 20px 0"
      }}>
        <section
          className="prayer-section"
          style={{
            marginTop: 8,
            padding: "8px 0",
            width: "100%",
            maxWidth: 390,
            minHeight: 250,
          }}
        >
          <div
            className="prayer-summary-card"
            style={{
              background: '#fff',
              marginBottom: 16,
              minWidth: 0,
            }}
          >
            {locState === 'idle' && (
              <button
                className="prayer-ghost-button"
                style={{
                  width: '100%',
                  fontSize: 19,
                  fontWeight: 600,
                  color: '#28bc8d',
                  background: '#eafaf4',
                  border: '1px solid #28bc8d',
                  borderRadius: 8,
                  padding: '18px 0',
                  cursor: 'pointer',
                  marginTop: 10
                }}
                aria-label="Find mosques near me"
                onClick={handleFindMyLocation}
              >
                <span role="img" aria-label="gps" style={{ marginRight: 9, verticalAlign: '-0.18em', fontSize: 22 }}>📍</span>
                Find mosques near me
              </button>
            )}
            {locState === 'requesting' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '25px 0 10px 0'
              }}>
                <span className="prayer-ghost-button" style={{
                  color: '#28bc8d',
                  fontWeight: 600,
                  fontSize: 17,
                  padding: '14px 18px',
                  background: '#eafaf4',
                  borderRadius: 6,
                  border: '1px solid #c8f2e4',
                  marginBottom: 10
                }}>
                  <svg width="22" height="22" viewBox="0 0 50 50" style={{verticalAlign:'middle'}}>
                    <circle cx="25" cy="25" r="21" fill="none" stroke="#28bc8d" strokeWidth="6" style={{ opacity: 0.15 }}/>
                    <path fill="#28bc8d" d="M47 25c0-12.1-9.9-22-22-22v6c8.8 0 16 7.2 16 16h6z">
                      <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                    </path>
                  </svg>
                  <span style={{marginLeft:10}}>Requesting your location…</span>
                </span>
                <div style={{
                  color: '#555',
                  fontSize: 15,
                  textAlign: 'center',
                  marginTop: 7
                }}>
                  Please allow location access if prompted.
                </div>
              </div>
            )}
          </div>

          {/* Loading mosques */}
          {locState === 'granted' && loading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
              <span className="prayer-ghost-button" style={{cursor:'wait', color:'#28bc8d', fontWeight:600, fontSize:17, padding: '14px 18px', background: '#eafaf4', borderRadius:6, border: '1px solid #c8f2e4' }}>
                <svg width="22" height="22" viewBox="0 0 50 50" style={{verticalAlign:'middle'}}>
                  <circle cx="25" cy="25" r="21" fill="none" stroke="#28bc8d" strokeWidth="6" style={{ opacity: 0.15 }}/>
                  <path fill="#28bc8d" d="M47 25c0-12.1-9.9-22-22-22v6c8.8 0 16 7.2 16 16h6z">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                  </path>
                </svg>
                <span style={{marginLeft:10}}>Loading mosques…</span>
              </span>
            </div>
          )}

          {/* Error states */}
          {(locState === 'denied' || (locState === 'granted' && error)) && (
            <div style={{ color: '#d72638', fontWeight: 600, margin: "18px 0", textAlign:'center' }}>
              {error || 'Unable to use location.'}
            </div>
          )}

          {/* No mosques found */}
          {locState === 'granted' && !loading && empty && !error && (
            <div style={{ color: '#444', fontWeight: 500, margin: "18px 0", textAlign:'center' }}>
              No mosques found near your location.
            </div>
          )}

          {/* Mosque List */}
          {locState === 'granted' && !loading && !error && mosques.length > 0 && (
            <MosqueList mosques={mosques} />
          )}
        </section>
      </main>
    </div>
  )
}

export default MosqueFinder
