import { useEffect, useMemo, useState } from 'react'
import './App.css'
import homeIcon from './images/freeiconVector.webp'
import logoNav from './images/white_moon_icon.png'
import { useLanguage } from './context/LanguageContext.jsx'

// 🔧 dev-only: set false in production
const FORCE_RAMADAN = false

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
  { id: 0, label: "Standard (Shafi'i)" },
  { id: 1, label: 'Hanafi juristic' },
]

const ORDERED_PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

// Dhaka, Bangladesh fallback coordinates
const DHAKA_COORDS = { lat: 23.8103, lon: 90.4125 }

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
  const { t, lang, setLang } = useLanguage()
  const [methodId, setMethodId] = useState(3)
  const [asrSchool, setAsrSchool] = useState(0)
  const [now, setNow] = useState(() => new Date())
  // Default to the Dhaka fallback silently; do not request geolocation here.
  // Geolocation prompts should only occur on the Qibla Finder page.
  const [coords, setCoords] = useState(DHAKA_COORDS)
  const [usingFallback, setUsingFallback] = useState(false)
  const [locating, setLocating] = useState(false)
  const [timings, setTimings] = useState(null)
  const [hijriInfo, setHijriInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Keep a live ticking clock for countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // NOTE: We intentionally do NOT request navigator.geolocation here.
  // QiblaFinder (and any other feature that explicitly needs user location)
  // should prompt the user when they interact with that feature.

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
          throw new Error(json.data || t('prayerTimes.errors.failedToLoad'))
        }

        setTimings(json.data.timings)
        const hijri = json.data.date?.hijri

        if (FORCE_RAMADAN && hijri) {
          // NOTE: only patches the month label — day/year remain as-is for dev testing
          hijri.month = { ...hijri.month, number: 9, en: 'Ramadan' }
        }

        setHijriInfo(hijri)
      } catch (err) {
        setError(err?.message || t('prayerTimes.errors.unableToLoad'))
      } finally {
        setLoading(false)
      }
    }

    fetchTimings()
  }, [coords, methodId, asrSchool])

  // Parse all prayer times into Date objects (single source of truth)
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

  // Derive individual prayer times directly from parsedPrayers (no duplicate memo)
  const fajrTime = parsedPrayers.find((p) => p.name === 'Fajr')?.at ?? null
  const maghribTime = parsedPrayers.find((p) => p.name === 'Maghrib')?.at ?? null

  // Ramadan helpers
  const isRamadan = hijriInfo && hijriInfo.month && Number(hijriInfo.month.number) === 9

  let ramadanFastStatus = null
  let ramadanFastCountdown = null
  if (isRamadan && fajrTime && maghribTime) {
    if (now < fajrTime) {
      ramadanFastStatus = t('prayerTimes.ramadan.status.beginsIn')
      ramadanFastCountdown = formatCountdown(now, fajrTime)
    } else if (now >= fajrTime && now < maghribTime) {
      ramadanFastStatus = t('prayerTimes.ramadan.status.iftarIn')
      ramadanFastCountdown = formatCountdown(now, maghribTime)
    } else {
      // now >= maghribTime — fasting done for today
      ramadanFastStatus = t('prayerTimes.ramadan.status.completed')
      ramadanFastCountdown = null
    }
  }

  const nextPrayer = useMemo(() => {
    if (!parsedPrayers.length) return null
    return parsedPrayers.find((p) => p.at > now) || null
  }, [parsedPrayers, now])

  const nextCountdown = nextPrayer ? formatCountdown(now, nextPrayer.at) : null

  const orderedForDisplay = useMemo(() => {
    if (!parsedPrayers.length) return []
    const upcoming = parsedPrayers.filter((p) => p.at > now)
    const past = parsedPrayers.filter((p) => p.at <= now)
    // Avoid mutating in place — spread before reversing
    return [...upcoming, ...[...past].reverse()]
  }, [parsedPrayers, now])

  const hijriDisplay = hijriInfo
    ? `${hijriInfo.day} ${hijriInfo.month?.en} ${hijriInfo.year} AH`
    : t('prayerTimes.hijriLoading')

  const nextSummaryLabel = !parsedPrayers.length
    ? t('prayerTimes.next.loading')
    : !nextPrayer || nextCountdown === 'Passed'
    ? t('prayerTimes.next.done')
    : `${t('prayerTimes.next.nextPrefix')} ${nextPrayer.name} ${t('prayerTimes.next.in')} ${nextCountdown || ''}`

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
                <a href="/">
                  <img src={homeIcon} alt={t('nav.homeAlt')} />
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <div className="hero-content prayer-hero">
          <p className="hero-tagline">{t('prayerTimes.heroTagline')}</p>
          <h1 className="hero-title">{t('prayerTimes.heroTitle')}</h1>
        </div>
      </header>

      <main>
        <section className="prayer-section">

          {/* Location notice when using fallback */}
          {usingFallback && !locating && (
            <p className="prayer-status prayer-status-warning">
              {t('prayerTimes.fallbackNotice')}
            </p>
          )}

          <div className="method-row">
            <div className="method-group">
              <label className="method-label" htmlFor="method-select">
                {t('prayerTimes.filters.source')}
              </label>
              <select
                id="method-select"
                className="method-select"
                value={methodId}
                onChange={(e) => setMethodId(Number(e.target.value))}
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
                {t('prayerTimes.filters.asr')}
              </label>
              <select
                id="asr-select"
                className="method-select"
                value={asrSchool}
                onChange={(e) => setAsrSchool(Number(e.target.value))}
              >
                {ASR_SCHOOLS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ramadan banner */}
          {isRamadan && (
            <div className="prayer-summary-card ramadan-banner">
              <div className="ramadan-banner-content">
                <span className="ramadan-banner-title">{t('prayerTimes.ramadan.title')}</span>
                <span className="ramadan-banner-date">{hijriDisplay}</span>
                <div className="ramadan-banner-times">
                  <div>
                    <strong>{t('prayerTimes.ramadan.fastStartLabel')}</strong>{' '}
                    {fajrTime
                      ? fajrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--'}
                  </div>
                  <div>
                    <strong>{t('prayerTimes.ramadan.fastBreakLabel')}</strong>{' '}
                    {maghribTime
                      ? maghribTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--'}
                  </div>
                </div>
                {/* FIX: single status block — no duplicate render */}
                {ramadanFastStatus && (
                  <div className="ramadan-banner-status">
                    <span className="prayer-status">
                      {ramadanFastStatus}
                      {ramadanFastCountdown && (
                        <>
                          {' '}
                          <strong>{ramadanFastCountdown}</strong>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="prayer-list">
            {(locating || loading) && (
              <p className="prayer-status">
                {locating ? t('prayerTimes.status.locating') : t('prayerTimes.status.loading')}
              </p>
            )}
            {error && !loading && (
              <p className="prayer-status prayer-status-error">{error}</p>
            )}

            {!locating &&
              !loading &&
              !error &&
              orderedForDisplay.map((p) => {
                const countdown = formatCountdown(now, p.at)

                let ramadanExtra = null
                if (isRamadan) {
                  if (p.name === 'Fajr') {
                    ramadanExtra = (
                      <span className="prayer-extra-ramadan-fajr">{t('prayerTimes.ramadan.extras.startFasting')}</span>
                    )
                  } else if (p.name === 'Maghrib') {
                    ramadanExtra = (
                      <span className="prayer-extra-ramadan-maghrib">
                        {t('prayerTimes.ramadan.extras.breakFast')}
                      </span>
                    )
                  } else if (p.name === 'Isha') {
                    ramadanExtra = (
                      <span className="prayer-extra-ramadan-isha">
                        {t('prayerTimes.ramadan.extras.taraweeh')}
                      </span>
                    )
                  }
                }

                const extra =
                  p.name === 'Sunrise'
                    ? t('prayerTimes.extras.sunrise')
                    : p.name === 'Fajr'
                    ? t('prayerTimes.extras.fajr')
                    : p.name === 'Dhuhr'
                    ? t('prayerTimes.extras.dhuhr')
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
                          <p className="prayer-countdown-label">{t('prayerTimes.countdownLabel')}</p>
                        )}
                        <p className="prayer-countdown-value">
                          {p.name === 'Sunrise' ? t('prayerTimes.sunrisePlaceholder') : countdown}
                        </p>
                      </div>
                    </div>

                    {ramadanExtra}
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