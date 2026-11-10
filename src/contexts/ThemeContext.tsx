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
import { Appearance, useColorScheme } from "react-native";

const THEME_STORAGE_KEY = "@tripwise_aparencia";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextData = {
  theme: ThemeMode;
  colorScheme: "light" | "dark";
  isDark: boolean;
  loadingTheme: boolean;
  setTheme: (theme: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();

  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [loadingTheme, setLoadingTheme] = useState(true);

  // Carrega a preferência salva.
  useEffect(() => {
    let active = true;

    async function loadTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (
          active &&
          (savedTheme === "light" ||
            savedTheme === "dark" ||
            savedTheme === "system")
        ) {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error("Erro ao carregar aparência:", error);
      } finally {
        if (active) {
          setLoadingTheme(false);
        }
      }
    }

    void loadTheme();

    return () => {
      active = false;
    };
  }, []);

  // Aplica a aparência escolhida em todo o aplicativo.
  useEffect(() => {
    Appearance.setColorScheme(theme === "system" ? "unspecified" : theme);
  }, [theme]);

  // Atualiza e salva a preferência.
  const setTheme = useCallback(async (newTheme: ThemeMode) => {
    setThemeState(newTheme);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error("Erro ao salvar aparência:", error);
    }
  }, []);

  const colorScheme =
    theme === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : theme;

  const value = useMemo(
    () => ({
      theme,
      colorScheme,
      isDark: colorScheme === "dark",
      loadingTheme,
      setTheme,
    }),
    [theme, colorScheme, loadingTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser utilizado dentro de ThemeProvider.");
  }

  return context;
}
