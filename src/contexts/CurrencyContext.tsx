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
import { useLanguage } from "./LanguageContext";

const CURRENCY_STORAGE_KEY = "@tripwise_moeda";
const RATES_STORAGE_KEY = "@tripwise_cotacoes";

const EXCHANGE_API_URL = "https://open.er-api.com/v6/latest/BRL";

export type CurrencyCode = "BRL" | "USD" | "EUR";

type ExchangeRates = {
  BRL: number;
  USD: number;
  EUR: number;
};

type CurrencyContextData = {
  currency: CurrencyCode;
  rates: ExchangeRates;
  loadingCurrency: boolean;
  loadingRates: boolean;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  refreshRates: () => Promise<void>;
  convertFromBRL: (amount: number) => number;
  formatAmount: (amountInBRL: number) => string;
};

type CurrencyProviderProps = {
  children: ReactNode;
};

type ExchangeApiResponse = {
  result: string;
  rates?: Record<string, number>;
};

const DEFAULT_RATES: ExchangeRates = {
  BRL: 1,
  USD: 0,
  EUR: 0,
};

const CurrencyContext = createContext<CurrencyContextData | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { language } = useLanguage();

  const [currency, setCurrencyState] = useState<CurrencyCode>("BRL");

  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_RATES);

  const [loadingCurrency, setLoadingCurrency] = useState(true);
  const [loadingRates, setLoadingRates] = useState(true);

  // Define o padrão regional de acordo com o idioma selecionado.
  const numberLocale = useMemo(() => {
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

  // Carrega a moeda e as cotações salvas.
  useEffect(() => {
    let active = true;

    async function loadCurrencyData() {
      try {
        const [savedCurrency, savedRates] = await Promise.all([
          AsyncStorage.getItem(CURRENCY_STORAGE_KEY),
          AsyncStorage.getItem(RATES_STORAGE_KEY),
        ]);

        if (
          active &&
          (savedCurrency === "BRL" ||
            savedCurrency === "USD" ||
            savedCurrency === "EUR")
        ) {
          setCurrencyState(savedCurrency);
        }

        if (active && savedRates) {
          const parsedRates = JSON.parse(savedRates) as ExchangeRates;

          if (
            typeof parsedRates.BRL === "number" &&
            parsedRates.BRL === 1 &&
            typeof parsedRates.USD === "number" &&
            typeof parsedRates.EUR === "number"
          ) {
            setRates(parsedRates);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de moeda:", error);
      } finally {
        if (active) {
          setLoadingCurrency(false);
        }
      }
    }

    void loadCurrencyData();

    return () => {
      active = false;
    };
  }, []);

  // Consulta e salva as cotações atuais.
  const fetchAndStoreRates = useCallback(async () => {
    try {
      const response = await fetch(EXCHANGE_API_URL);

      if (!response.ok) {
        throw new Error("Não foi possível consultar as cotações.");
      }

      const data = (await response.json()) as ExchangeApiResponse;

      if (
        data.result !== "success" ||
        !data.rates ||
        typeof data.rates.USD !== "number" ||
        typeof data.rates.EUR !== "number"
      ) {
        throw new Error("Resposta inválida do serviço de câmbio.");
      }

      const updatedRates: ExchangeRates = {
        BRL: 1,
        USD: data.rates.USD,
        EUR: data.rates.EUR,
      };

      setRates(updatedRates);

      await AsyncStorage.setItem(
        RATES_STORAGE_KEY,
        JSON.stringify(updatedRates),
      );
    } catch (error) {
      console.error("Erro ao atualizar cotações:", error);
    } finally {
      setLoadingRates(false);
    }
  }, []);

  // Atualiza as cotações ao iniciar o contexto.
  useEffect(() => {
    let active = true;

    async function loadRates() {
      await Promise.resolve();

      if (active) {
        await fetchAndStoreRates();
      }
    }

    void loadRates();

    return () => {
      active = false;
    };
  }, [fetchAndStoreRates]);

  // Permite atualizar as cotações manualmente.
  const refreshRates = useCallback(async () => {
    setLoadingRates(true);
    await fetchAndStoreRates();
  }, [fetchAndStoreRates]);

  // Salva a moeda escolhida.
  const setCurrency = useCallback(async (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);

    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    } catch (error) {
      console.error("Erro ao salvar moeda:", error);
    }
  }, []);

  // Converte um valor original em BRL para a moeda selecionada.
  const convertFromBRL = useCallback(
    (amount: number) => {
      if (!Number.isFinite(amount)) {
        return 0;
      }

      if (currency === "BRL") {
        return amount;
      }

      const rate = rates[currency];

      if (!rate || !Number.isFinite(rate)) {
        return amount;
      }

      return amount * rate;
    },
    [currency, rates],
  );

  // Formata o valor de acordo com o idioma e a moeda selecionados.
  const formatAmount = useCallback(
    (amountInBRL: number) => {
      const convertedAmount = convertFromBRL(amountInBRL);

      return new Intl.NumberFormat(numberLocale, {
        style: "currency",
        currency,
      }).format(convertedAmount);
    },
    [convertFromBRL, currency, numberLocale],
  );

  const value = useMemo(
    () => ({
      currency,
      rates,
      loadingCurrency,
      loadingRates,
      setCurrency,
      refreshRates,
      convertFromBRL,
      formatAmount,
    }),
    [
      currency,
      rates,
      loadingCurrency,
      loadingRates,
      setCurrency,
      refreshRates,
      convertFromBRL,
      formatAmount,
    ],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error(
      "useCurrency deve ser utilizado dentro de CurrencyProvider.",
    );
  }

  return context;
}
