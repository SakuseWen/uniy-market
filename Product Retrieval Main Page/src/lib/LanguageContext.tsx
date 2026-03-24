import { createContext, useContext, useState } from 'react';
import { Language } from './i18n';

// 从 localStorage 读取持久化的语言偏好 / Read persisted language preference from localStorage
function getInitialLanguage(): Language {
  const saved = localStorage.getItem('preferredLanguage');
  if (saved === 'zh' || saved === 'th' || saved === 'en') return saved;
  return 'en';
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// 全局语言 Context / Global language Context
const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
});

// 全局语言 Provider，包裹整个应用 / Global language Provider, wraps the entire app
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // 切换语言并同步写入 localStorage / Switch language and sync to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// 便捷 Hook，任意组件调用即可获取全局语言状态 / Convenience hook for any component to access global language state
export function useLanguage() {
  return useContext(LanguageContext);
}
