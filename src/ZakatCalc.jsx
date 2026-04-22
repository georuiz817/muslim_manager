import { useState, useEffect } from 'react'
import './App.css'
import homeIcon from './images/freeiconVector.webp'
import logoNav from './images/white_moon_icon.png'
import { useLanguage } from './context/LanguageContext.jsx'

function ZakatCalc() {
  const { t, lang, setLang } = useLanguage()

  const [cash, setCash] = useState('')
  const [gold, setGold] = useState('')
  const [silver, setSilver] = useState('')
  const [investments, setInvestments] = useState('')
  const [otherAssets, setOtherAssets] = useState('')

  const [liabilities, setLiabilities] = useState('')

  const [nisabType, setNisabType] = useState('gold')
  const [nisabValue, setNisabValue] = useState('')

  const [goldPricePerGram, setGoldPricePerGram] = useState(null)
  const [silverPricePerGram, setSilverPricePerGram] = useState(null)

  const FALLBACK_GOLD_GRAMS = 87.48
  const FALLBACK_SILVER_GRAMS = 612.36
  const FALLBACK_GOLD_PRICE_PER_GRAM = 70
  const FALLBACK_SILVER_PRICE_PER_GRAM = 0.9

  useEffect(() => {

    fetch('https://api.gold-api.com/price/XAU')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.price === 'number') {
          setGoldPricePerGram(data.price / 31.1035)
        } else {
          setGoldPricePerGram(FALLBACK_GOLD_PRICE_PER_GRAM)
        }
      })
      .catch(() => {
        setGoldPricePerGram(FALLBACK_GOLD_PRICE_PER_GRAM)
      })

    fetch('https://api.gold-api.com/price/XAG')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.price === 'number') {
          setSilverPricePerGram(data.price / 31.1035)
        } else {
          setSilverPricePerGram(FALLBACK_SILVER_PRICE_PER_GRAM)
        }
      })
      .catch(() => {
        setSilverPricePerGram(FALLBACK_SILVER_PRICE_PER_GRAM)
      })

  }, [])

  const pricesLoaded =
    typeof goldPricePerGram === 'number' &&
    typeof silverPricePerGram === 'number'

  const num = v => {
    const val = parseFloat(v)
    return isNaN(val) ? 0 : val
  }

  const totalAssets =
    num(cash) +
    num(gold) +
    num(silver) +
    num(investments) +
    num(otherAssets)

  const totalLiabilities = num(liabilities)
  const netAssets = totalAssets - totalLiabilities


  let goldNisab =
    pricesLoaded
      ? 87.48 * goldPricePerGram
      : FALLBACK_GOLD_GRAMS * FALLBACK_GOLD_PRICE_PER_GRAM

  let silverNisab =
    pricesLoaded
      ? 612.36 * silverPricePerGram
      : FALLBACK_SILVER_GRAMS * FALLBACK_SILVER_PRICE_PER_GRAM

  let nisab =
    nisabValue !== ''
      ? num(nisabValue)
      : nisabType === 'gold'
      ? goldNisab
      : silverNisab

  const zakatDue =
    netAssets >= nisab && netAssets > 0
      ? netAssets * 0.025
      : 0

  const zakatOwed = netAssets >= nisab && netAssets > 0
  const validCalculation =
    totalAssets >= 0 &&
    totalLiabilities >= 0 &&
    nisab >= 0

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

        <div className="hero-content">
          <p className="hero-tagline">{t('zakatCalc.heroTagline')}</p>
          <h1 className="hero-title">{t('zakatCalc.heroTitle')}</h1>
        </div>
      </header>


      <main className="zakat-main">

        <section className="prayer-section zakat-section">


          <div className="prayer-summary-card zakat-input-card">

            <div className="prayer-summary-header zakat-header-column">

              <div>

                <p className="prayer-summary-title">
                  {t('zakatCalc.input.title')}
                </p>

                <div className="prayer-summary-hijri zakat-market-prices">
                  {t('zakatCalc.marketPrices.goldLabel')}
                  {
                    typeof goldPricePerGram === 'number'
                      ? ` $${goldPricePerGram.toFixed(2)}`
                      : ' ...'
                  }
                  {t('zakatCalc.marketPrices.perGramSuffix')}
                  &nbsp;&nbsp;
                  {t('zakatCalc.marketPrices.silverLabel')}
                  {
                    typeof silverPricePerGram === 'number'
                      ? ` $${silverPricePerGram.toFixed(2)}`
                      : ' ...'
                  }
                  {t('zakatCalc.marketPrices.perGramSuffix')}
                </div>


                <table className="zakat-table">
                  <tbody>

                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="cash">
                          {t('zakatCalc.input.cash')}
                        </label>
                      </td>
                      <td>
                        <input
                          id="cash"
                          className="method-select zakat-input"
                          type="number"
                          min="0"
                          inputMode="decimal"
                          value={cash}
                          onChange={e => setCash(e.target.value)}
                          placeholder={t('zakatCalc.input.placeholder')}
                        />
                      </td>
                    </tr>


                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="gold">
                          {t('zakatCalc.input.gold')}
                        </label>
                      </td>
                      <td>
                        <input
                          id="gold"
                          className="method-select zakat-input"
                          type="number"
                          min="0"
                          inputMode="decimal"
                          value={gold}
                          onChange={e => setGold(e.target.value)}
                          placeholder={t('zakatCalc.input.placeholder')}
                        />
                      </td>
                    </tr>


                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="silver">
                          {t('zakatCalc.input.silver')}
                        </label>
                      </td>
                      <td>
                        <input
                          id="silver"
                          className="method-select zakat-input"
                          type="number"
                          min="0"
                          inputMode="decimal"
                          value={silver}
                          onChange={e => setSilver(e.target.value)}
                          placeholder={t('zakatCalc.input.placeholder')}
                        />
                      </td>
                    </tr>


                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="investments">
                          {t('zakatCalc.input.investments')}
                        </label>
                      </td>
                      <td>
                        <input
                          id="investments"
                          className="method-select zakat-input"
                          type="number"
                          min="0"
                          inputMode="decimal"
                          value={investments}
                          onChange={e => setInvestments(e.target.value)}
                          placeholder={t('zakatCalc.input.placeholder')}
                        />
                      </td>
                    </tr>


                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="otherAssets">
                          {t('zakatCalc.input.otherAssets')}
                        </label>
                      </td>
                      <td>
                        <input
                          id="otherAssets"
                          className="method-select zakat-input"
                          type="number"
                          min="0"
                          inputMode="decimal"
                          value={otherAssets}
                          onChange={e => setOtherAssets(e.target.value)}
                          placeholder={t('zakatCalc.input.placeholder')}
                        />
                      </td>
                    </tr>


                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="liabilities">
                          {t('zakatCalc.input.liabilities')}
                        </label>
                      </td>
                      <td>
                        <input
                          id="liabilities"
                          className="method-select zakat-input"
                          type="number"
                          min="0"
                          inputMode="decimal"
                          value={liabilities}
                          onChange={e => setLiabilities(e.target.value)}
                          placeholder={t('zakatCalc.input.placeholder')}
                        />
                      </td>
                    </tr>

                  </tbody>
                </table>

              </div>


              <div className="zakat-nisab-section">

                <span className="prayer-summary-hijri zakat-nisab-label">
                  {t('zakatCalc.nisab.label')}
                </span>


                <label className="zakat-radio-label">
                  <input
                    type="radio"
                    name="nisabType"
                    value="gold"
                    checked={nisabType === 'gold'}
                    onChange={() => setNisabType('gold')}
                    className="zakat-radio-input"
                  />
                  {t('zakatCalc.nisab.goldOption')}
                </label>


                <label className="zakat-radio-label">
                  <input
                    type="radio"
                    name="nisabType"
                    value="silver"
                    checked={nisabType === 'silver'}
                    onChange={() => setNisabType('silver')}
                    className="zakat-radio-input"
                  />
                  {t('zakatCalc.nisab.silverOption')}
                </label>


                <span className="zakat-manual-section">

                  <input
                    className="method-select zakat-manual-input"
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={nisabValue}
                    onChange={e => setNisabValue(e.target.value)}
                    placeholder={
                      (nisabType === 'gold'
                        ? goldNisab
                        : silverNisab)
                        ?.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    }
                  />

                  <span className="prayer-summary-hijri zakat-manual-hint">
                    {t('zakatCalc.nisab.manualHint')}
                  </span>

                </span>

              </div>

            </div>

          </div>


          <div className="prayer-summary-card zakat-output-card">

            <div className="prayer-summary-header zakat-header-column">

              <div>
                <p className="prayer-summary-title zakat-results-title">
                  {t('zakatCalc.results.title')}
                </p>
              </div>


              <div>

                <table className="zakat-results-table">

                  <tbody>

                    <tr>
                      <td className="prayer-summary-hijri">{t('zakatCalc.results.totalAssets')}</td>
                      <td>{totalAssets.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                    </tr>

                    <tr>
                      <td className="prayer-summary-hijri">{t('zakatCalc.results.lessLiabilities')}</td>
                      <td>{totalLiabilities.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                    </tr>

                    <tr className="zakat-net-assets">
                      <td className="prayer-summary-hijri">{t('zakatCalc.results.netAssets')}</td>
                      <td>{netAssets.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                    </tr>

                    <tr>
                      <td className="prayer-summary-hijri">{t('zakatCalc.results.nisabThreshold')}</td>
                      <td>{nisab.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                    </tr>

                  </tbody>

                </table>

              </div>


              <div className="zakat-result-section">

                {
                  !validCalculation
                    ? (
                      <span className="prayer-extra zakat-error-message">
                        {t('zakatCalc.messages.invalid')}
                      </span>
                    )
                    : !zakatOwed
                    ? (
                      <span className="prayer-extra zakat-not-due-message">
                        {t('zakatCalc.messages.notDue')}
                      </span>
                    )
                    : (
                      <div>

                        <span className="prayer-extra zakat-due-message">
                          {t('zakatCalc.messages.dueLabel')}
                          <span className="zakat-due-amount">
                            {zakatDue.toLocaleString(undefined,{maximumFractionDigits:2})}
                          </span>
                        </span>

                        <div className="prayer-extra zakat-note">
                          {t('zakatCalc.messages.note')}
                        </div>

                      </div>
                    )
                }

              </div>

            </div>

          </div>


        </section>

      </main>

    </div>
  )
}

export default ZakatCalc