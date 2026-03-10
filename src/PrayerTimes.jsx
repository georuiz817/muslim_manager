import { useEffect, useMemo, useState } from 'react'
import './App.css'
import homeIcon from './images/freeiconVector.webp'
import logoNav from './images/logoNav.png'


const FORCE_RAMADAN = true // 🔧 dev-only: set false in production




const METHODS = [
  { id: 3, label: 'Muslim World League' },
  { id: 5, label: 'Egyptian General Authority of Survey' },
  { id: 2, label: 'Islamic Society of North America' },
  { id: 12, label: 'Shia Ithna Ashari (Leva Research Institute, Qum)' },
  { id: 1, label: 'University of Islamic Sciences, Karachi' },
  { id: 4, label: 'Umm al-Qura, Makkah' },
  { id: 7, label: 'Institute of Geophysics, University of Tehran' },
]

const ASR_SCHOOLS = [
  { id: 0, label: 'Standard (Shafii)' },
  { id: 1, label: 'Hanafi juristic' },
]

const ORDERED_PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

function formatCountdown(from, to) {
  const diffMs = to - from
  if (diffMs <= 0) return 'Passed'
  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours === 0 && minutes === 0) return 'Now'
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function PrayerTimes() {
  const [methodId, setMethodId] = useState(3) // Muslim World League default
  const [asrSchool, setAsrSchool] = useState(0) // Standard
  const [now, setNow] = useState(() => new Date())
  const [coords, setCoords] = useState(null)
  const [timings, setTimings] = useState(null)
  const [hijriInfo, setHijriInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Keep a live ticking clock for countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Try to get user coordinates once
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setCoords({ lat: 21.4225, lon: 39.8262 }) // Fallback to Makkah
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
      },
      () => {
        setCoords({ lat: 21.4225, lon: 39.8262 }) // Fallback to Makkah
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  // Fetch daily timings whenever coords / method / asrSchool change
  useEffect(() => {
    if (!coords) return

    async function fetchTimings() {
      try {
        setLoading(true)
        setError(null)

        const url = `https://api.aladhan.com/v1/timings?latitude=${coords.lat}&longitude=${coords.lon}&method=${methodId}&school=${asrSchool}`
        const response = await fetch(url)
        const json = await response.json()

        if (json.code !== 200) {
          throw new Error(json.data || 'Failed to load prayer times')
        }

        setTimings(json.data.timings)
        const hijri = json.data.date?.hijri

        if (FORCE_RAMADAN && hijri) {
          hijri.month = { ...hijri.month, number: 9, en: 'Ramadan' }
        }
        
        setHijriInfo(hijri)      } catch (err) {
        setError(err.message || 'Unable to load prayer times right now.')
      } finally {
        setLoading(false)
      }
    }

    fetchTimings()
  }, [coords, methodId, asrSchool])

  // --- Ramadan logic helpers ---
  // Is today Ramadan? (Hijri month 9 is Ramadan)
  const isRamadan = hijriInfo && hijriInfo.month && Number(hijriInfo.month.number) === 9

  // For quick lookup of specific prayer times by name
  const prayerTimesByName = useMemo(() => {
    const map = {}
    if (!timings) return map
    const today = new Date()
    const [year, month, date] = [today.getFullYear(), today.getMonth(), today.getDate()]
    for (const name of ORDERED_PRAYERS) {
      const timeStr = timings[name]
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number)
        map[name] = new Date(year, month, date, hours, minutes, 0)
      }
    }
    return map
  }, [timings])

  // Ramadan suhoor (Fajr) and iftar (Maghrib) times
  const fajrTime = prayerTimesByName['Fajr']
  const maghribTime = prayerTimesByName['Maghrib']

  // Ramadan fasting status and countdown
  let ramadanFastStatus = null
  let ramadanFastCountdown = null
  if (isRamadan && fajrTime && maghribTime) {
    if (now < fajrTime) {
      // Before suhoor ends
      ramadanFastStatus = "Fasting begins in"
      ramadanFastCountdown = formatCountdown(now, fajrTime)
    } else if (now >= fajrTime && now < maghribTime) {
      // Fasting in progress
      ramadanFastStatus = "Iftar in"
      ramadanFastCountdown = formatCountdown(now, maghribTime)
    } else if (now >= maghribTime) {
      ramadanFastStatus = "Fasting completed for today"
      ramadanFastCountdown = null
    }
  }

  const parsedPrayers = useMemo(() => {
    if (!timings) return []

    const today = new Date()
    const [year, month, date] = [today.getFullYear(), today.getMonth(), today.getDate()]

    return ORDERED_PRAYERS.map((name) => {
      const timeString = timings[name]
      if (!timeString) return null
      const [hours, minutes] = timeString.split(':').map(Number)
      const at = new Date(year, month, date, hours, minutes, 0)
      return { name, timeString, at }
    }).filter(Boolean)
  }, [timings])

  const nextPrayer = useMemo(() => {
    if (!parsedPrayers.length) return null
    const upcoming = parsedPrayers.find((p) => p.at > now)
    return upcoming || null
  }, [parsedPrayers, now])

  const nextCountdown = nextPrayer ? formatCountdown(now, nextPrayer.at) : null

  const orderedForDisplay = useMemo(() => {
    if (!parsedPrayers.length) return []
    const upcoming = parsedPrayers.filter((p) => p.at > now)
    const past = parsedPrayers.filter((p) => p.at <= now)
    // Show upcoming first (soonest to latest), then past (most recent first)
    return [...upcoming, ...past.reverse()]
  }, [parsedPrayers, now])

  const hijriDisplay = hijriInfo
    ? `${hijriInfo.day} ${hijriInfo.month?.en} ${hijriInfo.year} AH`
    : 'Hijri date loading...'

  const nextSummaryLabel = !parsedPrayers.length
    ? 'Loading next prayer...'
    : !nextPrayer || nextCountdown === 'Passed'
    ? 'All prayers for today completed.'
    : `Next: ${nextPrayer.name} in ${nextCountdown || ''}`

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

        <div className="hero-content prayer-hero">
          <p className="hero-tagline">Prayer Times</p>
          <h1 className="hero-title">Daily Salah schedule</h1>
        </div>
      </header>

      <main>
        <section className="prayer-section">
 

          <div className="method-row">
            <div className="method-group">
              <label className="method-label" htmlFor="method-select">
                Source
              </label>
              <select
                id="method-select"
                className="method-select"
                value={methodId}
                onChange={(event) => setMethodId(Number(event.target.value))}
              >
                {METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="method-group">
              <label className="method-label" htmlFor="asr-select">
                ASR
              </label>
              <select
                id="asr-select"
                className="method-select"
                value={asrSchool}
                onChange={(event) => setAsrSchool(Number(event.target.value))}
              >
                {ASR_SCHOOLS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>


   {/* --- Ramadan banner if active --- */}
   {isRamadan && (
            <div className="prayer-summary-card" style={{ background: '#f7efd8', color: '#7d5c15', marginBottom: 18, borderLeft: '5px solid #d6b402' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 700 }}>
                  🌙 Ramadan Mubarak
                </span>
                <span style={{ fontSize: 15 }}>
                  {hijriDisplay}
                </span>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 18,
                  flexWrap: 'wrap',
                  marginTop: 3,
                  marginBottom: 3
                }}>
                  <div>
                    <strong>Fast Start (Suhoor ends):</strong> {fajrTime ? fajrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
                  </div>
                  <div>
                    <strong>Fast Break (Iftar):</strong> {maghribTime ? maghribTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
                  </div>
                </div>
                {/* Ramadan fasting countdown logic */}
                <div style={{ marginTop: 2 }}>
                  {ramadanFastStatus && (
                    <span className="prayer-status" style={{ color: '#7d5c15', fontWeight: 500 }}>
                      {ramadanFastStatus}
                      {ramadanFastCountdown && <> <span style={{ fontWeight: 700 }}>{ramadanFastCountdown}</span></>}
                    </span>
                  )}
                  {/* Fasting completed message? */}
                  {isRamadan && fajrTime && maghribTime && now >= maghribTime && (
                    <span className="prayer-status" style={{ color: '#7d5c15', fontWeight: 500 }}>
                      Fasting completed for today
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}







          <div className="prayer-list">
            {loading && <p className="prayer-status">Loading prayer times…</p>}
            {error && !loading && <p className="prayer-status prayer-status-error">{error}</p>}

            {!loading &&
              !error &&
              orderedForDisplay.map((p) => {
                const countdown = formatCountdown(now, p.at)

                // -- Enhanced prayer list Ramadan logic: add Ramadan labels under Fajr, Maghrib, and Isha --
                let ramadanExtra = null;
                if (isRamadan) {
                  if (p.name === 'Fajr') {
                    ramadanExtra = <span className="prayer-extra" style={{  fontWeight: 500, fontSize: 14, display: 'block', marginTop: 2 }}>🕊️ Start of fasting</span>
                  } else if (p.name === 'Maghrib') {
                    ramadanExtra = <span className="prayer-extra" style={{   fontWeight: 500, fontSize: 14, display: 'block', marginTop: 2 }}>🍽️ Time to break fast (Iftar)</span>
                  } else if (p.name === 'Isha') {
                    ramadanExtra = <span className="prayer-extra" style={{ fontWeight: 500, fontSize: 14, display: 'block', marginTop: 2 }}>🌙 Taraweeh prayer after Isha</span>
                  }
                }

                const extra =
  p.name === 'Sunrise'
    ? '🌅 Not obligatory'
    : p.name === 'Fajr'
    ? isRamadan
      ? 'Remember to perform Wudu.'
      : 'Remember to perform Wudu.'
    : p.name === 'Dhuhr'
    ? 'Daily Hadith: “Prayer is light for the believer.”'
    : p.name === 'Asr'
    ? null  // Removed placeholder
    : p.name === 'Isha'
    ? null
    : null

 
                return (
                  <article key={p.name} className="prayer-row-card">
                    <div className="prayer-row-main">
                      <div>
                        <h2 className="prayer-name">{p.name}</h2>
                        <p className="prayer-time">{p.timeString}</p>
                      </div>
                      <div className="prayer-countdown-block">
                        {p.name !== 'Sunrise' && (
                          <p className="prayer-countdown-label">Countdown</p>
                        )}
                        <p className="prayer-countdown-value">
                          {p.name === 'Sunrise' ? '—' : countdown}
                        </p>
                      </div>
                    </div>

                    {/* The action buttons for Play Adhan and Nearby Mosque have been removed */}

                    {/* Ramadan extras */}
                    {ramadanExtra}
                    {/* Standard extras (hidden for Isha in Ramadan to avoid double message) */}
                    {extra && <p className="prayer-extra">{extra}</p>}
                  </article>
                )
              })}
          </div>
        </section>
      </main>
    </div>
  )
}

export default PrayerTimes
