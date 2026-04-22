import './App.css'
import logoNav from './images/white_moon_icon.png'
import homeIcon from './images/freeiconVector.webp'
import { useLanguage } from './context/LanguageContext.jsx'

function App() {
  const { t, lang, setLang } = useLanguage()

  return (
    <div className="page page--home">
      <header className="hero hero--home" id="top">
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
                    alt={t("nav.homeAlt")}
                  />
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <div className="hero-content">
          <p className="hero-tagline">{t("header.title")}</p>
          <h1 className="hero-title">{t("header.subtitle")}</h1>
          <div className="cards-grid">
            <a className="feature-card feature-card-link" href="/prayer-times">
              <h2>{t("features.prayer.title")}</h2>
            </a>

            <a className="feature-card feature-card-link" href="/qibla-finder">
              <h2>{t("features.qibla.title")}</h2>
            </a>

            <a className="feature-card feature-card-link" href="/zakat-calc">
              <h2>{t("features.zakat.title")}</h2>
            </a>
          </div>
        </div>
      </header>
    </div>
  )
}

export default App