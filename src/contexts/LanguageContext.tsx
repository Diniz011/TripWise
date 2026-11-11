import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LanguageCode = "pt-BR" | "en" | "es";

export const LANGUAGE_OPTIONS: {
  value: LanguageCode;
  title: string;
  nativeTitle: string;
  flag: string;
}[] = [
  {
    value: "pt-BR",
    title: "Português (Brasil)",
    nativeTitle: "Português",
    flag: "🇧🇷",
  },
  {
    value: "en",
    title: "English",
    nativeTitle: "English",
    flag: "🇺🇸",
  },
  {
    value: "es",
    title: "Español",
    nativeTitle: "Español",
    flag: "🇪🇸",
  },
];

const LANGUAGE_STORAGE_KEY = "@tripwise_idioma";

const translations = {
  "pt-BR": {
    profile: "Perfil",
    preferences: "Preferências",
    language: "Idioma",
    appearance: "Aparência",
    currency: "Moeda",
    about: "Sobre o aplicativo",
    save: "Salvar",
    cancel: "Cancelar",
    loading: "Carregando...",
  },
  en: {
    profile: "Profile",
    preferences: "Preferences",
    language: "Language",
    appearance: "Appearance",
    currency: "Currency",
    about: "About the app",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",
  },
  es: {
    profile: "Perfil",
    preferences: "Preferencias",
    language: "Idioma",
    appearance: "Apariencia",
    currency: "Moneda",
    about: "Sobre la aplicación",
    save: "Guardar",
    cancel: "Cancelar",
    loading: "Cargando...",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["pt-BR"];

type LanguageContextData = {
  language: LanguageCode;
  locale: string;
  loadingLanguage: boolean;
  setLanguage: (language: LanguageCode) => Promise<void>;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextData | undefined>(
  undefined,
);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>("pt-BR");
  const [loadingLanguage, setLoadingLanguage] = useState(true);

  // Carrega o idioma salvo no dispositivo.
  useEffect(() => {
    let mounted = true;

    async function loadLanguage() {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

        const isValidLanguage = LANGUAGE_OPTIONS.some(
          (option) => option.value === savedLanguage,
        );

        if (mounted && isValidLanguage) {
          setLanguageState(savedLanguage as LanguageCode);
        }
      } catch (error) {
        console.error("Erro ao carregar idioma:", error);
      } finally {
        if (mounted) {
          setLoadingLanguage(false);
        }
      }
    }

    void loadLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  // Altera e persiste o idioma selecionado.
  const setLanguage = useCallback(
    async (newLanguage: LanguageCode) => {
      if (newLanguage === language) {
        return;
      }

      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
        setLanguageState(newLanguage);
      } catch (error) {
        console.error("Erro ao salvar idioma:", error);
        throw error;
      }
    },
    [language],
  );

  // Retorna a tradução correspondente ao idioma atual.
  const t = useCallback(
    (key: TranslationKey) => {
      return translations[language][key];
    },
    [language],
  );

  // Define o padrão regional para datas e números.
  const locale = useMemo(() => {
    switch (language) {
      case "en":
        return "en-US";
      case "es":
        return "es-ES";
      case "pt-BR":
      default:
        return "pt-BR";
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      locale,
      loadingLanguage,
      setLanguage,
      t,
    }),
    [language, locale, loadingLanguage, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage deve ser utilizado dentro de LanguageProvider.",
    );
  }

  return context;
}
