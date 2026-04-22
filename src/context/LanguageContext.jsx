import { createContext, useContext, useEffect, useState } from "react";
import en from "../locales/en.json";
import bn from "../locales/bn.json";

const translations = { en, bn };
const LanguageContext = createContext();
const STORAGE_KEY = "muslimManager.lang";

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "bn" ? "bn" : "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage failures (private mode, etc)
    }
  }, [lang]);

  const t = (key) => {
    return key.split(".").reduce((obj, k) => obj?.[k], translations[lang]) ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);