import { createContext, useContext, useState } from "react";
import en from "../locales/en.json";
import bn from "../locales/bn.json";

const translations = { en, bn };
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

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