import React, { useState, useEffect } from 'react'

// QuranBangla: Displays the full Quran in Bengali with translator & surah selector
function QuranBangla() {
  // Translator options
  const translators = [
    { id: 'bn.muhiuddinkhan', label: 'মুহিউদ্দিন খান (Muhiuddin Khan)' },
    { id: 'bn.taisirulquran', label: 'তাসীরুল কুরআন (Taisirul Quran)' }
  ]

  // Surah names can be localized or fetched from API, but for lightness, partial hardcode for dropdown
  // (If you wish to fetch names, you could do so with https://api.alquran.cloud/v1/surah)
  const surahNames = [
    "সূরা ফাতিহা",
    "সূরা বাকারা",
    "সূরা আলে-ইমরান",
    "সূরা নিসা",
    "সূরা মায়েদা",
    "সূরা আন’আম",
    "সূরা আরাফ",
    "সূরা আনফাল",
    "সূরা তওবা",
    "সূরা ইউনুস",
    "সূরা হূদ",
    "সূরা ইউসুফ",
    "সূরা র‘আদ",
    "সূরা ইবরাহিম",
    "সূরা হিজর",
    "সূরা নাহল",
    "সূরা বনী ইসরাঈল",
    "সূরা কাহফ",
    "সূরা মরি‍য়াম",
    "সূরা তা-হা",
    "সূরা আম্বিয়া",
    "সূরা হজ্জ",
    "সূরা মু’মিনূন",
    "সূরা নূর",
    "সূরা ফুরকান",
    "সূরা আশ-শু’আরা",
    "সূরা নামল",
    "সূরা কাসাস",
    "সূরা আনকাবুত",
    "সূরা রূম",
    "সূরা লুকমান",
    "সূরা সাজদাহ",
    "সূরা আহযাব",
    "সূরা সাবা",
    "সূরা ফাতির",
    "সূরা ইয়াসীন",
    "সূরা আস-সাফফাত",
    "সূরা স্বাদ",
    "সূরা জুমার",
    "সূরা গাফির",
    "সূরা fussilat",
    "সূরা আশ-শুরা",
    "সূরা যুখরুফ",
    "সূরা দোখান",
    "সূরা জাথিয়া",
    "সূরা আহক্বাফ",
    "সূরা মুহাম্মদ",
    "সূরা ফাতহ",
    "সূরা হুজরাত",
    "সূরা ক্বাফ",
    "সূরা যারিয়াত",
    "সূরা তূর",
    "সূরা নজম",
    "সূরা ক্বামার",
    "সূরা রহমান",
    "সূরা ওয়াকিয়া",
    "সূরা হাদীদ",
    "সূরা মুজাদালা",
    "সূরা হাশর",
    "সূরা মুমতাহিনা",
    "সূরা সফ",
    "সূরা জুমুআ",
    "সূরা মুনাফিকুন",
    "সূরা তাগাবুন",
    "সূরা তালাক",
    "সূরা তাহরীম",
    "সূরা মুল্ক",
    "সূরা কলম",
    "সূরা হাক্কা",
    "সূরা মা'আরিজ",
    "সূরা নূহ",
    "সূরা জিন",
    "সূরা মুযাম্মিল",
    "সূরা মুদ্দাসসির",
    "সূরা কেয়ামাহ",
    "সূরা الانسان",
    "সূরা মুরসালাত",
    "সূরা নাবা",
    "সূরা নাযিয়াত",
    "সূরা আবাসা",
    "সূরা তাকভীর",
    "সূরা ইনফিতার",
    "সূরা মুতাফফিফিন",
    "সূরা ইনশিকাক",
    "সূরা বরুজ",
    "সূরা তারিক",
    "সূরা আ'লা",
    "সূরা গাশিয়া",
    "সূরা ফজর",
    "সূরা বালাদ",
    "সূরা শামস",
    "সূরা লাইল",
    "সূরা দুহা",
    "সূরা ইনশিরাহ",
    "সূরা তীন",
    "সূরা আলাক",
    "সূরা কদর",
    "সূরা বাইয়্যেনা",
    "সূরা যিলযাল",
    "সূরা আদিয়াত",
    "সূরা কারিয়া",
    "সূরা তাকাসুর",
    "সূরা আস্-র",
    "সূরা হুমাজাহ",
    "সূরা ফীল",
    "সূরা কুরাইশ",
    "সূরা মাউন",
    "সূরা কাওসার",
    "সূরা কাফিরুন",
    "সূরা নাসর",
    "সূরা লাহাব",
    "সূরা ইখলাস",
    "সূরা ফালাক",
    "সূরা নাস",
  ];

  // State
  const [surah, setSurah] = useState(1) // Surah number (1-based)
  const [translator, setTranslator] = useState(translators[0].id) // API id, default: muhiuddinkhan
  const [ayahs, setAyahs] = useState([]) // Array of {number, text}
  const [surahMeta, setSurahMeta] = useState({}) // Surah info: name, etc.
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch Quran on surah/translator change
  useEffect(() => {
    async function fetchSurah() {
      setLoading(true)
      setError('')
      setAyahs([])
 
      try {
        // API docs: https://alquran.cloud/api
        // Example: https://api.alquran.cloud/v1/surah/1/bn.muhiuddinkhan
        const resp = await fetch(  `https://api.alquran.cloud/v1/surah/${surah}/editions/ar,bn.bengali`
        )
        if (!resp.ok) throw new Error('API Error')
        const data = await resp.json()

        if (data.status !== "OK" || !data.data || !data.data.ayahs) {
          throw new Error('API returned incomplete data')
        }
        const banglaEdition = data.data.find(e => e.edition.language === 'bn')

        setAyahs(banglaEdition.ayahs)
        setSurahMeta({
          englishName: data.data.englishName,
          name: data.data.name,
          number: data.data.number,
          numberOfAyahs: data.data.numberOfAyahs,
        })
      } catch (e) {
        setError("দুঃখিত, সংযোগে সমস্যা হয়েছে বা সার্ভার পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।")
      } finally {
        setLoading(false)
      }
    }

    fetchSurah()
  }, [surah, translator])

  // Styling: simple, readable, friendly to Android/Bangla
  return (
    <div
      className="page"
      style={{
        maxWidth: 400,
        margin: "0 auto",
        padding: 0,
        fontFamily: "Noto Sans Bengali, SolaimanLipi, Kalpurush, sans-serif",
        background: "#f9fbfb",
        minHeight: "100vh"
      }}
    >
      <header className="hero hero--compact" style={{ background: "#e9f7fa" }}>
        <nav className="nav" style={{ background: "none" }}>
          <div className="nav-inner">
            <div className="nav-logo" style={{ fontWeight: 700, color: "#32a89e" }}>Muslim Manager</div>
            <ul className="nav-links" style={{ display: 'none' }}></ul>
          </div>
        </nav>
        <div className="hero-content">
          <p className="hero-tagline" style={{ fontSize: 19, color: "#2b6663" }}>হোলি কোরআন (বাংলা অনুবাদ)</p>
          <h1 className="hero-title" style={{
            fontSize: 24,
            color: "#272c2b",
            fontWeight: 800,
            marginBottom: 4
          }}>
            {surahMeta.name ? surahMeta.name : surahNames[surah - 1] || `সূরা ${surah}`}
          </h1>
          <p className="hero-subtitle" style={{ fontSize: 16, color: "#279a81" }}>
            সম্পূর্ণ কোরআনের নির্ভরযোগ্য বাংলা অনুবাদ।
          </p>
        </div>
      </header>
      <main style={{
        margin: "0 auto",
        background: "#fff",
        borderRadius: 8,
        boxShadow: '0 1px 6px #e6ebe4',
        maxWidth: 400,
        padding: "12px 0 30px 0"
      }}>
        <section className="prayer-section" style={{
          maxWidth: 380, margin: "0 auto"
        }}>
          {/* Controls */}
          <div
            style={{
              margin: "10px 0 18px 0",
              display: "flex",
              flexDirection: "column",
              gap: 7
            }}
          >
            {/* Surah Selector */}
            <label
              htmlFor="surah-selector"
              style={{
                fontWeight: 600,
                marginBottom: 3,
                color: "#24897e",
                fontSize: 15,
                letterSpacing: 0.1
              }}
            >
              সুরা নির্বাচন করুন
            </label>
            <select
              id="surah-selector"
              className="prayer-ghost-button"
              style={{
                border: "1px solid #17b89f",
                fontSize: 17,
                padding: "8px 10px",
                borderRadius: 7,
                background: "#f4faf8",
                color: "#225c52",
                fontFamily: "inherit",
                marginBottom: 4,
                outline: "none"
              }}
              value={surah}
              onChange={e => setSurah(Number(e.target.value))}
            >
              {surahNames.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {idx + 1}. {name}
                </option>
              ))}
            </select>

            {/* Translator Selector */}
            <label
              htmlFor="translator-selector"
              style={{
                fontWeight: 600,
                marginBottom: 3,
                color: "#24897e",
                fontSize: 15
              }}
            >
              অনুবাদক নির্বাচন করুন
            </label>
            <select
              id="translator-selector"
              className="prayer-ghost-button"
              style={{
                border: "1px solid #17b89f",
                fontSize: 16,
                padding: "8px 10px",
                borderRadius: 7,
                background: "#f4faf8",
                color: "#245f5b",
                fontFamily: "inherit",
                outline: "none"
              }}
              value={translator}
              onChange={e => setTranslator(e.target.value)}
            >
              {translators.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div style={{
              textAlign: "center", color: "#34987d", fontSize: 17, margin: "28px 0"
            }}>
              <span role="img" aria-label="spinner">⏳</span> লোড হচ্ছে...
            </div>
          )}
          {error && (
            <div style={{
              background: "#fff8dc",
              color: "#ab2626",
              borderRadius: 8,
              padding: "12px 8px",
              margin: "10px 0",
              textAlign: "center",
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {/* Ayah list */}
          <div>
            {!loading && ayahs.length === 0 && !error && (
              <div style={{
                textAlign: "center",
                color: "#888",
                fontSize: 15,
                marginTop: 24
              }}>
                কোন আয়াত পাওয়া যায়নি।
              </div>
            )}
            {/* Ayah cards */}
            {ayahs.map(a => (
              <div
                key={a.number}
                className="prayer-summary-card"
                style={{
                  background: "#f4faf8",
                  border: "1px solid #c1ece7",
                  borderRadius: 8,
                  margin: "0 0 15px 0",
                  padding: "14px 13px 10px 13px",
                  boxShadow: '0 0.5px 2px #e5f4f3',
                  lineHeight: 1.77,
                  display: "flex",
                  gap: 11,
                  alignItems: "flex-start"
                }}
              >
                {/* Ayah number badge */}
                <span style={{
                  minWidth: 28,
                  minHeight: 28,
                  background: "#17b89f",
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#fff",
                  fontSize: 17,
                  marginRight: 6,
                  marginTop: 1,
                  flexShrink: 0,
                  letterSpacing: 0.02
                }}>
                  {a.numberInSurah}
                </span>
                {/* Bengali translation text */}
                <span style={{
                  fontFamily: "Noto Sans Bengali, SolaimanLipi, Kalpurush, sans-serif",
                  fontSize: "1.18rem",
                  color: "#143c31"
                }}>
                  {a.text}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default QuranBangla

