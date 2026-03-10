import React, { useEffect, useState } from 'react'
import './app.css' // <-- corrected import; should be lowercase to match actual file system on most OS

// ===============================
// Fetch a RANDOM Quran verse
// Uses AlQuran.cloud (text-safe)
// ===============================
async function fetchRandomVerse() {
  const TOTAL_AYAHS = 6236
  const randomAyah = Math.floor(Math.random() * TOTAL_AYAHS) + 1

  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/ayah/${randomAyah}/editions/quran-uthmani,en.sahih`
    )

    if (!res.ok) throw new Error('API request failed')

    const json = await res.json()
    if (!Array.isArray(json.data)) throw new Error('Invalid response')

    const arabic = json.data.find(d => d.edition.language === 'ar')
    const english = json.data.find(d => d.edition.language === 'en')

    if (!arabic || !english) throw new Error('Missing editions')

    return {
      id: randomAyah,
      surahName: arabic.surah.englishName,
      surahNumber: arabic.surah.number,
      ayahNumber: arabic.numberInSurah,
      arabic: arabic.text,
      translation: english.text
    }
  } catch (error) {
    console.error('Random Quran fetch failed:', error)

    // Safe fallback (never breaks UI)
    return {
      id: 1,
      surahName: 'Al-Fātiḥah',
      surahNumber: 1,
      ayahNumber: 1,
      arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      translation: 'In the name of Allah, the Most Gracious, the Most Merciful.'
    }
  }
}

// ===============================
// Component
// ===============================
import logoNav from './images/logoNav.png'
import homeIcon from './images/freeiconVector.webp'

function DailyQuran() {
  const [verse, setVerse] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadVerse = async () => {
    setLoading(true)
    const v = await fetchRandomVerse()
    setVerse(v)
    setLoading(false)
  }

  useEffect(() => {
    loadVerse()
  }, [])

  return (
    <div className="page">
      <header className="hero hero--compact">
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

        <div className="hero-content quran-hero">
          <p className="hero-tagline">Daily Quran</p>
          <h1 className="hero-title">A Verse to Guide Your Day</h1>
          <p className="hero-subtitle">
            Start each day with a short, inspiring ayah and translation.
          </p>
        </div>
      </header>

      <main>
        <section className="quran-section">
          <div className="prayer-summary-card">
            <div className="prayer-summary-header">
              <div>
                <p className="prayer-summary-title">📖 Random Quran Verse</p>
                <p className="prayer-summary-hijri">
                  {verse
                    ? `${verse.surahName} · ${verse.surahNumber}:${verse.ayahNumber}`
                    : 'Loading...'}
                </p>
              </div>

              <div className="prayer-summary-right">
                <p className="prayer-summary-next">
                  Click to receive another random verse
                </p>
                <button
                  className="qibla-button"
                  onClick={loadVerse}
                  disabled={loading}
                  style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Loading…' : 'New Verse'}
                </button>
              </div>
            </div>
          </div>

          <div className="prayer-list">
            <article className="prayer-row-card">
              <div className="prayer-row-main">
                <div style={{ width: '100%' }}>
                  <h2
                    className="prayer-name"
                    style={{
                      textAlign: 'right',
                      fontFamily: 'Scheherazade, serif',
                      fontSize: '2rem',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      wordBreak: 'break-word'
                    }}
                  >
                    {verse ? verse.arabic : 'Loading...'}
                  </h2>

                  <p
                    className="prayer-time"
                    style={{
                      fontStyle: 'italic',
                      color: '#388e3c',
                      marginTop: 12,
                      marginBottom: 0,
                      wordBreak: 'break-word'
                    }}
                  >
                    {verse ? verse.translation : ''}
                  </p>
                </div>
              </div>

              <div className="prayer-row-actions">
                <button
                  className="prayer-ghost-button"
                  disabled={!verse || loading}
                  style={{
                    cursor: (!verse || loading) ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => {
                    if (!verse) return
                    const text = `${verse.arabic}\n\n${verse.translation}\n\n(${verse.surahName} ${verse.surahNumber}:${verse.ayahNumber})`
                    navigator.clipboard.writeText(text)
                  }}
                >
                  📋 Copy Verse
                </button>

                <button className="prayer-ghost-button" disabled>
                  💡 Tafsir (Coming Soon)
                </button>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DailyQuran
