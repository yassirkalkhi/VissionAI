import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/LanguageContext"
import { Globe, ChevronDown } from "lucide-react"
import { translations, type Language } from "@/translations"

const languageNames: Record<Language, string> = {
    en: 'English',
    ar: 'العربية',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    zh: '中文'
}

const languageFlags: Record<Language, string> = {
    en: '🇬🇧',
    ar: '🇸🇦',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    zh: '🇨🇳'
}

export function LanguageSelector() {
    const { language, setLanguage, t } = useLanguage()

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang)
        // Reload the page to ensure all translations are applied
        window.location.reload()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                    <div className="flex items-center gap-2">       
                        <span className="text-md me-2">{languageFlags[language]}</span>
                        <span className="text-sm dark:text-white/90">{languageNames[language]}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
                {(Object.keys(translations) as Language[]).map((lang) => (
                    <DropdownMenuItem
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={lang === language ? "bg-accent" : ""}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{languageFlags[lang]}</span>
                            <span>{languageNames[lang]}</span>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}