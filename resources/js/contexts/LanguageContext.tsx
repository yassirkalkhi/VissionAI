import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { translations, type Language } from '@/translations'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: typeof translations.en
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('language') as Language
        return saved && Object.keys(translations).includes(saved) ? saved : 'en'
    })

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem('language', lang)
    }, [])

    // Use useMemo to ensure the value is recalculated when language changes
    const value = useMemo(() => ({
        language,
        setLanguage,
        t: translations[language]
    }), [language, setLanguage])

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
} 