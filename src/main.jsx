import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import PrayerTimes from './PrayerTimes.jsx'
import DailyQuran from './DailyQuran.jsx'
import ZakatCalc from './ZakatCalc.jsx'
import QiblaFinder from './QiblaFinder.jsx'
import MosqueFinder from './MosqueFinder.jsx'
import QuranBangla from './QuranBangla.jsx'
import './index.css'


function Router() {
  const path = window.location.pathname

  if (path === '/prayer-times') {
    return <PrayerTimes />
  }
  if (path === '/daily-quran') {
    return <DailyQuran />
  }
  if (path === '/zakat-calc') {
    return <ZakatCalc />
  }

  if (path === '/qibla-finder') {
    return <QiblaFinder />
  }

  if(path === '/mosque-finder'){
    return <MosqueFinder/>
  }

  if(path === '/quran-bangla'){
    return <QuranBangla/>
  }




  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
