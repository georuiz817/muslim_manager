import { useState, useEffect } from 'react'
import './App.css'
import homeIcon from './images/freeiconVector.webp'
import logoNav from './images/white_moon_icon.png'

function ZakatCalc() {
  // Asset state variables
  const [cash, setCash] = useState('')
  const [gold, setGold] = useState('')
  const [silver, setSilver] = useState('')
  const [investments, setInvestments] = useState('')
  const [otherAssets, setOtherAssets] = useState('')

  // Liabilities
  const [liabilities, setLiabilities] = useState('')

  // Nisab selection and manual input
  const [nisabType, setNisabType] = useState('gold')
  const [nisabValue, setNisabValue] = useState('')

  // Gold and silver price state (per gram)
  const [goldPricePerGram, setGoldPricePerGram] = useState(null)
  const [silverPricePerGram, setSilverPricePerGram] = useState(null)

  // Fallbacks for convenience (can overwrite with manual input)
  // (matches previous dummy values if fetch fails)
  const FALLBACK_GOLD_GRAMS = 87.48
  const FALLBACK_SILVER_GRAMS = 612.36
  const FALLBACK_GOLD_PRICE_PER_GRAM = 70
  const FALLBACK_SILVER_PRICE_PER_GRAM = 0.9

  // Fetch prices from API on mount
  useEffect(() => {
    // Gold
    fetch('https://api.gold-api.com/price/XAU')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.price === 'number') {
          setGoldPricePerGram(data.price / 31.1035)
        } else {
          setGoldPricePerGram(FALLBACK_GOLD_PRICE_PER_GRAM)
        }
      }).catch(() => {
        setGoldPricePerGram(FALLBACK_GOLD_PRICE_PER_GRAM)
      })

    // Silver
    fetch('https://api.gold-api.com/price/XAG')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.price === 'number') {
          setSilverPricePerGram(data.price / 31.1035)
        } else {
          setSilverPricePerGram(FALLBACK_SILVER_PRICE_PER_GRAM)
        }
      }).catch(() => {
        setSilverPricePerGram(FALLBACK_SILVER_PRICE_PER_GRAM)
      })
  }, [])

  // Parse and sum up inputs safely (zero if blank or invalid)
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

  // Nisab: Gold or Silver
  let goldNisab =
    typeof goldPricePerGram === 'number'
      ? 87.48 * goldPricePerGram
      : FALLBACK_GOLD_GRAMS * FALLBACK_GOLD_PRICE_PER_GRAM
  let silverNisab =
    typeof silverPricePerGram === 'number'
      ? 612.36 * silverPricePerGram
      : FALLBACK_SILVER_GRAMS * FALLBACK_SILVER_PRICE_PER_GRAM

  let nisab =
    nisabValue !== ''
      ? num(nisabValue)
      : nisabType === 'gold'
      ? goldNisab
      : silverNisab

  // Zakat calculation
  const zakatDue =
    netAssets >= nisab && netAssets > 0 ? netAssets * 0.025 : 0

  // Flags for display
  const zakatOwed = netAssets >= nisab && netAssets > 0
  const validCalculation = totalAssets >= 0 && totalLiabilities >= 0 && nisab >= 0

  return (
    <div className="page">
      <header className="hero hero--compact" id="top">
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
                <a href="/">
                  <img
                    src={homeIcon}
                    alt="Home"
                  />
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <div className="hero-content">
          <p className="hero-tagline">Zakat Calculator</p>
          <h1 className="hero-title">See your price</h1>
        </div>
      </header>

      <main className="zakat-main">
        <section className="prayer-section zakat-section">
          {/* Inputs Card */}
          <div className="prayer-summary-card zakat-input-card">
            <div className="prayer-summary-header zakat-header-column">
              <div>
                <p className="prayer-summary-title">Enter Your Amounts</p>
                <table className="zakat-table">
                  <tbody>
                    {/* Zakatable Assets */}
                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="cash">Cash &amp; Savings</label>
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
                          placeholder="0"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="gold">Gold value</label>
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
                          placeholder="0"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="silver">Silver value</label>
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
                          placeholder="0"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="investments">Investments / Business assets</label>
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
                          placeholder="0"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="otherAssets">Other zakatable assets</label>
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
                          placeholder="0"
                        />
                      </td>
                    </tr>

                    {/* Liabilities */}
                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="liabilities">Minus: Short-term debts / bills</label>
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
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Nisab selection */}
              <div className="zakat-nisab-section">
                <span className="prayer-summary-hijri zakat-nisab-label">Nisab:</span>
                <label className="zakat-radio-label">
                  <input
                    type="radio"
                    name="nisabType"
                    value="gold"
                    checked={nisabType === 'gold'}
                    onChange={() => setNisabType('gold')}
                    className="zakat-radio-input"
                  />Gold (87.48g)
                </label>
                <label className="zakat-radio-label">
                  <input
                    type="radio"
                    name="nisabType"
                    value="silver"
                    checked={nisabType === 'silver'}
                    onChange={() => setNisabType('silver')}
                    className="zakat-radio-input"
                  />Silver (612.36g)
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
    (nisabType === 'gold' ? goldNisab : silverNisab)
      ?.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
/>
                  <span className="prayer-summary-hijri zakat-manual-hint">Manual amount</span>
                </span>
              </div>
            </div>
          </div>

          {/* Output card */}
          <div className="prayer-summary-card zakat-output-card">
            <div className="prayer-summary-header zakat-header-column">
              <div>
                <p className="prayer-summary-title zakat-results-title">Results</p>
              </div>
              <div>
                <table className="zakat-results-table">
                  <tbody>
                    <tr>
                      <td className="prayer-summary-hijri">Total Assets</td>
                      <td>{ totalAssets.toLocaleString(undefined, {maximumFractionDigits:2}) }</td>
                    </tr>
                    <tr>
                      <td className="prayer-summary-hijri">Less: Liabilities</td>
                      <td>{ totalLiabilities.toLocaleString(undefined, {maximumFractionDigits:2}) }</td>
                    </tr>
                    <tr className="zakat-net-assets">
                      <td className="prayer-summary-hijri">Net Zakatable Assets</td>
                      <td>{ netAssets.toLocaleString(undefined, {maximumFractionDigits:2}) }</td>
                    </tr>
                    <tr>
                      <td className="prayer-summary-hijri">Nisab threshold</td>
                      <td>{ nisab.toLocaleString(undefined, {maximumFractionDigits:2}) }</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="zakat-result-section">
                { !validCalculation ? (
                  <span className="prayer-extra zakat-error-message">
                    Please check your entries.
                  </span>
                ) : !zakatOwed ? (
                  <span className="prayer-extra zakat-not-due-message">
                    Zakat is not due (below nisab).
                  </span>
                ) : (
                  <div>
                    <span className="prayer-extra zakat-due-message">
                      Zakat due:{" "}
                      <span className="zakat-due-amount">
                        { zakatDue.toLocaleString(undefined, { maximumFractionDigits: 2 }) }
                      </span>
                    </span>
                    <div className="prayer-extra zakat-note">
                      (2.5% of your eligible assets)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  )
}

export default ZakatCalc