import './App.css'
import logoNav from './images/logoNav.png'
import homeIcon from './images/freeiconVector.webp'
function App() {
  return (
    <div className="page">
      <header className="hero" id="top">
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
          <p className="hero-tagline">Muslim Manager</p>
          <h1 className="hero-title">
            Manage Your Faith
          </h1>
          <p className="hero-subtitle">
    
          </p>
          <div className="cards-grid">
            <a className="feature-card feature-card-link" href="/prayer-times">
              <h2>Prayer Times</h2>
              <p>Accurate daily salah times tailored to your location, always up to date.</p>
            </a>

            <a className="feature-card feature-card-link" href="/zakat-calc">
              <h2>Zakat Calculator</h2>
              <p>Quickly calculate your Zakat—simple, fast, and accurate.</p>
            </a>



            <a className="feature-card feature-card-link" href="/qibla-finder">
              <h2>Mecca Finder</h2>
              <p>Quickly find the Qibla direction from wherever you are in the world.</p>
            </a>
 
 

 


          </div>
        </div>
      </header>
    </div>
  )
}

export default App
