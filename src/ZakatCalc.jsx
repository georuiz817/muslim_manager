import { useState } from 'react'
import './App.css'
import homeIcon from './images/freeiconVector.webp'
import logoNav from './images/logoNav.png'

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

  // Defaults for convenience (can overwrite with manual input)
  const defaultNisabGold = 85 * 70 // 85g gold x $70/g (dummy default)
  const defaultNisabSilver = 595 * 0.9 // 595g silver x $0.90/g (dummy default)

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
  let nisab =
    nisabValue !== ''
      ? num(nisabValue)
      : nisabType === 'gold'
      ? defaultNisabGold
      : defaultNisabSilver

  // Zakat calculation
  const zakatDue =
    netAssets >= nisab && netAssets > 0 ? netAssets * 0.025 : 0

  // Flags for display
  const zakatOwed = netAssets >= nisab && netAssets > 0
  const validCalculation = totalAssets >= 0 && totalLiabilities >= 0 && nisab >= 0

  return (
    <div className="page">
      <header className="hero hero--compact" id="top">
        {/* New nav code borrowed from App.jsx (8-30) */}
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
          <p className="hero-tagline">Zakat Calculator</p>
          <h1 className="hero-title">Zakat Calculation, Simplified.</h1>
        </div>
      </header>

      <main style={{ maxWidth: 480, margin: "0 auto", marginTop: 0 }}>
        <section className="prayer-section" style={{ padding: 0, marginTop: 0 }}>
          {/* Inputs Card */}
          <div className="prayer-summary-card" style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="prayer-summary-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
              <div>
                <p className="prayer-summary-title" style={{ marginBottom: 8 }}>Enter Your Amounts</p>
                <table style={{ width: '100%', border: 0, background: 'none', margin: 0 }}>
                  <tbody>
                    {/* Zakatable Assets */}
                    <tr>
                      <td>
                        <label className="prayer-summary-hijri" htmlFor="cash">Cash &amp; Savings</label>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input
                          id="cash"
                          className="method-select"
                          style={{ width: 110 }}
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
                      <td style={{ textAlign: 'right' }}>
                        <input
                          id="gold"
                          className="method-select"
                          style={{ width: 110 }}
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
                      <td style={{ textAlign: 'right' }}>
                        <input
                          id="silver"
                          className="method-select"
                          style={{ width: 110 }}
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
                      <td style={{ textAlign: 'right' }}>
                        <input
                          id="investments"
                          className="method-select"
                          style={{ width: 110 }}
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
                      <td style={{ textAlign: 'right' }}>
                        <input
                          id="otherAssets"
                          className="method-select"
                          style={{ width: 110 }}
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
                      <td style={{ textAlign: 'right' }}>
                        <input
                          id="liabilities"
                          className="method-select"
                          style={{ width: 110 }}
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
              <div style={{ marginTop: 16 }}>
                <span className="prayer-summary-hijri" style={{ fontWeight: 600, marginRight: 8 }}>Nisab:</span>
                <label style={{ marginRight: 13 }}>
                  <input
                    type="radio"
                    name="nisabType"
                    value="gold"
                    checked={nisabType === 'gold'}
                    onChange={() => setNisabType('gold')}
                    style={{ marginRight: 4 }}
                  />Gold (85g)
                </label>
                <label style={{ marginRight: 13 }}>
                  <input
                    type="radio"
                    name="nisabType"
                    value="silver"
                    checked={nisabType === 'silver'}
                    onChange={() => setNisabType('silver')}
                    style={{ marginRight: 4 }}
                  />Silver (595g)
                </label>
                <span style={{ marginLeft: 16 }}>
                  <input
                    className="method-select"
                    style={{ width: 85 }}
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={nisabValue}
                    onChange={e => setNisabValue(e.target.value)}
                    placeholder={nisabType === 'gold' ? defaultNisabGold : defaultNisabSilver}
                  />
                  <span className="prayer-summary-hijri" style={{ marginLeft: 4, fontSize: 13, color: "#666" }}>Manual amount</span>
                </span>
              </div>
            </div>
          </div>

          {/* Output card */}
          <div className="prayer-summary-card" style={{ marginTop: 0 }}>
            <div className="prayer-summary-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <div>
                <p className="prayer-summary-title" style={{ marginBottom: 7 }}>Results</p>
              </div>
              <div>
                <table style={{ width: '100%', background: 'none', border: 0, margin: 0 }}>
                  <tbody>
                    <tr>
                      <td className="prayer-summary-hijri">Total Assets</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{ totalAssets.toLocaleString(undefined, {maximumFractionDigits:2}) }</td>
                    </tr>
                    <tr>
                      <td className="prayer-summary-hijri">Less: Liabilities</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{ totalLiabilities.toLocaleString(undefined, {maximumFractionDigits:2}) }</td>
                    </tr>
                    <tr>
                      <td className="prayer-summary-hijri" style={{ fontWeight: 700, color: "#222" }}>Net Zakatable Assets</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: "#222" }}>{ netAssets.toLocaleString(undefined, {maximumFractionDigits:2}) }</td>
                    </tr>
                    <tr>
                      <td className="prayer-summary-hijri">Nisab threshold</td>
                      <td style={{ textAlign: 'right' }}>
                        { nisab.toLocaleString(undefined, {maximumFractionDigits:2}) }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12 }}>
                { !validCalculation ? (
                  <span className="prayer-extra" style={{ color: '#a33', fontWeight: 500 }}>
                    Please check your entries.
                  </span>
                ) : !zakatOwed ? (
                  <span className="prayer-extra" style={{ color: '#999', fontWeight: 500 }}>
                    Zakat is not due (below nisab).
                  </span>
                ) : (
                  <div>
                    <span className="prayer-extra" style={{ color: '#057446', fontWeight: 600 }}>
                      Zakat due:{" "}
                      <span style={{ color: '#28bc8d', fontWeight: 700, fontSize: 22 }}>
                        { zakatDue.toLocaleString(undefined, { maximumFractionDigits: 2 }) }
                      </span>
                    </span>
                    <div className="prayer-extra" style={{ color: "#062", fontSize: 14, marginTop: 5 }}>
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

