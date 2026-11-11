import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileIdentityCard from "../../components/ProfileIdentityCard";
import { CurrencyCode, useCurrency } from "../../contexts/CurrencyContext";
import {
  LANGUAGE_OPTIONS,
  LanguageCode,
  useLanguage,
} from "../../contexts/LanguageContext";
import { ThemeMode, useTheme } from "../../contexts/ThemeContext";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
  NotificationPreferences,
  saveNotificationPreferences,
} from "../../services/notifications";

const THEME_OPTIONS: {
  value: ThemeMode;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "light",
    title: "Claro",
    description: "Utilizar sempre o tema claro.",
    icon: "sunny-outline",
  },
  {
    value: "dark",
    title: "Escuro",
    description: "Utilizar sempre o tema escuro.",
    icon: "moon-outline",
  },
  {
    value: "system",
    title: "Automático",
    description: "Acompanhar a aparência do iPhone.",
    icon: "phone-portrait-outline",
  },
];

const CURRENCY_OPTIONS: {
  value: CurrencyCode;
  title: string;
  description: string;
  symbol: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "BRL",
    title: "Real brasileiro",
    description: "Moeda do Brasil",
    symbol: "R$",
    icon: "cash-outline",
  },
  {
    value: "USD",
    title: "Dólar americano",
    description: "Moeda dos Estados Unidos",
    symbol: "US$",
    icon: "logo-usd",
  },
  {
    value: "EUR",
    title: "Euro",
    description: "Moeda da União Europeia",
    symbol: "€",
    icon: "logo-euro",
  },
];

const PROFILE_TRANSLATIONS = {
  "pt-BR": {
    profile: "Perfil",
    subtitle: "Seu espaço no TripWise",
    preferences: "Preferências",
    currency: "Moeda",
    brl: "Real brasileiro",
    brlDesc: "Moeda do Brasil",
    usd: "Dólar americano",
    usdDesc: "Moeda dos Estados Unidos",
    eur: "Euro",
    eurDesc: "Moeda da União Europeia",
    exchange: "Cotação em relação ao Real",
    baseCurrency: "Moeda base",
    unavailable: "Cotação indisponível",
    savingCurrency: "Salvando moeda...",
    language: "Idioma",
    savingLanguage: "Salvando idioma...",
    appearance: "Aparência",
    light: "Claro",
    lightDesc: "Utilizar sempre o tema claro.",
    dark: "Escuro",
    darkDesc: "Utilizar sempre o tema escuro.",
    automatic: "Automático",
    automaticDesc: "Acompanhar a aparência do iPhone.",
    themeLight: "Tema claro",
    themeDark: "Tema escuro",
    applyingTheme: "Aplicando aparência...",
    notifications: "Notificações",
    notificationsDesc: "Personalize os avisos que deseja receber.",
    loadingPreferences: "Carregando preferências...",
    trips: "Viagens",
    tripsDesc: "Acompanhe as mudanças nas suas viagens.",
    tripCreated: "Viagem criada",
    tripCreatedDesc: "Quando uma nova viagem for cadastrada.",
    tripDeleted: "Viagem excluída",
    tripDeletedDesc: "Quando uma viagem for removida.",
    tripUpdated: "Alterações na viagem",
    tripUpdatedDesc: "Quando informações forem atualizadas.",
    tripReminders: "Lembretes de viagem",
    tripRemindersDesc: "Avisos sobre a proximidade da viagem.",
    lodgingTours: "Hospedagem e passeios",
    lodgingToursDesc: "Receba atualizações sobre sua programação.",
    lodging: "Hospedagem",
    lodgingDesc: "Quando uma hospedagem for adicionada ou alterada.",
    tours: "Passeios",
    toursDesc: "Quando passeios forem adicionados ou removidos.",
    finances: "Controle financeiro",
    financesDesc: "Acompanhe o orçamento das suas viagens.",
    budgetWarning: "Atenção ao orçamento",
    budgetWarningDesc: "Quando seus gastos atingirem 80% do orçamento.",
    budgetExceeded: "Orçamento ultrapassado",
    budgetExceededDesc: "Quando seus gastos ultrapassarem o limite.",
    notificationInfo:
      "Essas preferências controlam os avisos exibidos dentro do TripWise. As notificações externas do iPhone serão implementadas posteriormente.",
    about: "Sobre o aplicativo",
    aboutTripWise: "Sobre o TripWise",
    companion: "Seu companheiro de viagens.",
    appVersion: "Versão do aplicativo",
    version: "TripWise · Versão 1.0.2",
    footer: "Planeje suas Viagens. Explore o mundo. Viva!",
    error: "Erro",
    savePreferenceError:
      "Não foi possível salvar essa preferência. Tente novamente.",
    themeError: "Não foi possível alterar a aparência. Tente novamente.",
    currencyError: "Não foi possível alterar a moeda. Tente novamente.",
    languageError: "Não foi possível alterar o idioma. Tente novamente.",
  },

  en: {
    profile: "Profile",
    subtitle: "Your space on TripWise",
    preferences: "Preferences",
    currency: "Currency",
    brl: "Brazilian real",
    brlDesc: "Currency of Brazil",
    usd: "US dollar",
    usdDesc: "Currency of the United States",
    eur: "Euro",
    eurDesc: "Currency of the European Union",
    exchange: "Exchange rate against the Real",
    baseCurrency: "Base currency",
    unavailable: "Exchange rate unavailable",
    savingCurrency: "Saving currency...",
    language: "Language",
    savingLanguage: "Saving language...",
    appearance: "Appearance",
    light: "Light",
    lightDesc: "Always use light mode.",
    dark: "Dark",
    darkDesc: "Always use dark mode.",
    automatic: "Automatic",
    automaticDesc: "Follow your iPhone appearance.",
    themeLight: "Light theme",
    themeDark: "Dark theme",
    applyingTheme: "Applying appearance...",
    notifications: "Notifications",
    notificationsDesc: "Customize the alerts you want to receive.",
    loadingPreferences: "Loading preferences...",
    trips: "Trips",
    tripsDesc: "Keep track of changes to your trips.",
    tripCreated: "Trip created",
    tripCreatedDesc: "When a new trip is added.",
    tripDeleted: "Trip deleted",
    tripDeletedDesc: "When a trip is removed.",
    tripUpdated: "Trip updated",
    tripUpdatedDesc: "When trip information is updated.",
    tripReminders: "Trip reminders",
    tripRemindersDesc: "Alerts as your trip approaches.",
    lodgingTours: "Accommodation and activities",
    lodgingToursDesc: "Get updates about your itinerary.",
    lodging: "Accommodation",
    lodgingDesc: "When accommodation is added or changed.",
    tours: "Activities",
    toursDesc: "When activities are added or removed.",
    finances: "Financial management",
    financesDesc: "Keep track of your trip budget.",
    budgetWarning: "Budget warning",
    budgetWarningDesc: "When your spending reaches 80% of the budget.",
    budgetExceeded: "Budget exceeded",
    budgetExceededDesc: "When your spending exceeds the limit.",
    notificationInfo:
      "These preferences control the alerts displayed within TripWise. External iPhone notifications will be implemented later.",
    about: "About the app",
    aboutTripWise: "About TripWise",
    companion: "Your travel companion.",
    appVersion: "App version",
    version: "TripWise · Version 1.0.2",
    footer: "Plan your trips. Explore the world. Live!",
    error: "Error",
    savePreferenceError: "Could not save this preference. Please try again.",
    themeError: "Could not change the appearance. Please try again.",
    currencyError: "Could not change the currency. Please try again.",
    languageError: "Could not change the language. Please try again.",
  },

  es: {
    profile: "Perfil",
    subtitle: "Tu espacio en TripWise",
    preferences: "Preferencias",
    currency: "Moneda",
    brl: "Real brasileño",
    brlDesc: "Moneda de Brasil",
    usd: "Dólar estadounidense",
    usdDesc: "Moneda de Estados Unidos",
    eur: "Euro",
    eurDesc: "Moneda de la Unión Europea",
    exchange: "Tipo de cambio frente al Real",
    baseCurrency: "Moneda base",
    unavailable: "Tipo de cambio no disponible",
    savingCurrency: "Guardando moneda...",
    language: "Idioma",
    savingLanguage: "Guardando idioma...",
    appearance: "Apariencia",
    light: "Claro",
    lightDesc: "Usar siempre el tema claro.",
    dark: "Oscuro",
    darkDesc: "Usar siempre el tema oscuro.",
    automatic: "Automático",
    automaticDesc: "Seguir la apariencia del iPhone.",
    themeLight: "Tema claro",
    themeDark: "Tema oscuro",
    applyingTheme: "Aplicando apariencia...",
    notifications: "Notificaciones",
    notificationsDesc: "Personaliza los avisos que deseas recibir.",
    loadingPreferences: "Cargando preferencias...",
    trips: "Viajes",
    tripsDesc: "Sigue los cambios en tus viajes.",
    tripCreated: "Viaje creado",
    tripCreatedDesc: "Cuando se registre un nuevo viaje.",
    tripDeleted: "Viaje eliminado",
    tripDeletedDesc: "Cuando se elimine un viaje.",
    tripUpdated: "Cambios en el viaje",
    tripUpdatedDesc: "Cuando se actualice la información.",
    tripReminders: "Recordatorios de viaje",
    tripRemindersDesc: "Avisos sobre la proximidad del viaje.",
    lodgingTours: "Alojamiento y actividades",
    lodgingToursDesc: "Recibe actualizaciones sobre tu itinerario.",
    lodging: "Alojamiento",
    lodgingDesc: "Cuando se añada o modifique un alojamiento.",
    tours: "Actividades",
    toursDesc: "Cuando se añadan o eliminen actividades.",
    finances: "Control financiero",
    financesDesc: "Controla el presupuesto de tus viajes.",
    budgetWarning: "Atención al presupuesto",
    budgetWarningDesc: "Cuando tus gastos alcancen el 80% del presupuesto.",
    budgetExceeded: "Presupuesto excedido",
    budgetExceededDesc: "Cuando tus gastos superen el límite.",
    notificationInfo:
      "Estas preferencias controlan los avisos que se muestran dentro de TripWise. Las notificaciones externas del iPhone se implementarán más adelante.",
    about: "Sobre la aplicación",
    aboutTripWise: "Sobre TripWise",
    companion: "Tu compañero de viajes.",
    appVersion: "Versión de la aplicación",
    version: "TripWise · Versión 1.0.2",
    footer: "Planifica tus viajes. Explora el mundo. ¡Vive!",
    error: "Error",
    savePreferenceError:
      "No se pudo guardar esta preferencia. Inténtalo de nuevo.",
    themeError: "No se pudo cambiar la apariencia. Inténtalo de nuevo.",
    currencyError: "No se pudo cambiar la moneda. Inténtalo de nuevo.",
    languageError: "No se pudo cambiar el idioma. Inténtalo de nuevo.",
  },
} as const;

export default function Perfil() {
  const { theme, isDark, setTheme } = useTheme();

  const { language, setLanguage } = useLanguage();
  const copy = PROFILE_TRANSLATIONS[language];

  const { currency, rates, loadingRates, setCurrency, refreshRates } =
    useCurrency();

  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingPreference, setSavingPreference] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);

  const preferencesRef = useRef<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef(true);

  const colors = {
    background: isDark ? "#121212" : "#F4F6FA",
    card: isDark ? "#1E1E1E" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#202124",
    secondary: isDark ? "#A7A7A7" : "#777D87",
    border: isDark ? "#333333" : "#ECEEF2",
    green: "#8FA255",
    iconBackground: isDark ? "#292D22" : "#F0F3E8",
    selectedBackground: isDark ? "#292D22" : "#F5F7EF",
  };

  const styles = createStyles(colors);

  useEffect(() => {
    mountedRef.current = true;

    async function loadPreferences() {
      try {
        const savedPreferences = await getNotificationPreferences();

        if (mountedRef.current) {
          preferencesRef.current = savedPreferences;
          setPreferences(savedPreferences);
        }
      } catch (error) {
        console.error("Erro ao carregar preferências:", error);
      } finally {
        if (mountedRef.current) {
          setLoadingPreferences(false);
        }
      }
    }

    void loadPreferences();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function togglePreference(
    key: keyof NotificationPreferences,
    value: boolean,
  ) {
    const previousPreferences = preferencesRef.current;

    const updatedPreferences = {
      ...previousPreferences,
      [key]: value,
    };

    preferencesRef.current = updatedPreferences;
    setPreferences(updatedPreferences);
    setSavingPreference(true);

    const saveOperation = saveQueueRef.current.then(async () => {
      await saveNotificationPreferences(updatedPreferences);
    });

    saveQueueRef.current = saveOperation.catch(() => {});

    try {
      await saveOperation;
    } catch (error) {
      console.error("Erro ao salvar preferência:", error);

      if (mountedRef.current) {
        const currentPreferences = preferencesRef.current;

        if (currentPreferences[key] === value) {
          preferencesRef.current = previousPreferences;
          setPreferences(previousPreferences);
        }

        Alert.alert(copy.error, copy.savePreferenceError);
      }
    } finally {
      if (mountedRef.current) {
        setSavingPreference(false);
      }
    }
  }

  async function handleThemeChange(newTheme: ThemeMode) {
    if (newTheme === theme || savingTheme) {
      return;
    }

    setSavingTheme(true);

    try {
      await setTheme(newTheme);
    } catch (error) {
      console.error("Erro ao alterar aparência:", error);

      Alert.alert(copy.error, copy.themeError);
    } finally {
      if (mountedRef.current) {
        setSavingTheme(false);
      }
    }
  }

  async function handleCurrencyChange(newCurrency: CurrencyCode) {
    if (newCurrency === currency || savingCurrency) {
      return;
    }

    setSavingCurrency(true);

    try {
      await setCurrency(newCurrency);
    } catch (error) {
      console.error("Erro ao alterar moeda:", error);

      Alert.alert(copy.error, copy.currencyError);
    } finally {
      if (mountedRef.current) {
        setSavingCurrency(false);
      }
    }
  }

  async function handleRefreshRates() {
    if (loadingRates) {
      return;
    }

    await refreshRates();
  }

  async function handleLanguageChange(newLanguage: LanguageCode) {
    if (newLanguage === language || savingLanguage) {
      return;
    }

    setSavingLanguage(true);

    try {
      await setLanguage(newLanguage);
    } catch (error) {
      console.error("Erro ao alterar idioma:", error);
      Alert.alert(copy.error, copy.languageError);
    } finally {
      if (mountedRef.current) {
        setSavingLanguage(false);
      }
    }
  }

  const notificationGroups = [
    {
      title: copy.trips,
      description: copy.tripsDesc,
      items: [
        {
          key: "viagemCriada" as const,
          title: copy.tripCreated,
          description: copy.tripCreatedDesc,
          icon: "airplane-outline" as const,
        },
        {
          key: "viagemExcluida" as const,
          title: copy.tripDeleted,
          description: copy.tripDeletedDesc,
          icon: "trash-outline" as const,
        },
        {
          key: "viagemAtualizada" as const,
          title: copy.tripUpdated,
          description: copy.tripUpdatedDesc,
          icon: "create-outline" as const,
        },
        {
          key: "lembretesViagem" as const,
          title: copy.tripReminders,
          description: copy.tripRemindersDesc,
          icon: "calendar-outline" as const,
        },
      ],
    },
    {
      title: copy.lodgingTours,
      description: copy.lodgingToursDesc,
      items: [
        {
          key: "hospedagem" as const,
          title: copy.lodging,
          description: copy.lodgingDesc,
          icon: "bed-outline" as const,
        },
        {
          key: "passeios" as const,
          title: copy.tours,
          description: copy.toursDesc,
          icon: "map-outline" as const,
        },
      ],
    },
    {
      title: copy.finances,
      description: copy.financesDesc,
      items: [
        {
          key: "orcamento80" as const,
          title: copy.budgetWarning,
          description: copy.budgetWarningDesc,
          icon: "alert-circle-outline" as const,
        },
        {
          key: "orcamentoExcedido" as const,
          title: copy.budgetExceeded,
          description: copy.budgetExceededDesc,
          icon: "wallet-outline" as const,
        },
      ],
    },
  ];

  const currentThemeLabel =
    theme === "light"
      ? copy.themeLight
      : theme === "dark"
        ? copy.themeDark
        : copy.automatic;

  const currentCurrency = CURRENCY_OPTIONS.find(
    (option) => option.value === currency,
  );

  const selectedRate = rates[currency];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* CABEÇALHO */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{copy.profile}</Text>
              <Text style={styles.subtitle}>{copy.subtitle}</Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons name="person-outline" size={23} color={colors.green} />
            </View>
          </View>

          {/* CARTÃO DE IDENTIDADE DO PERFIL */}
          <ProfileIdentityCard colors={colors} />

          {/* PREFERÊNCIAS */}
          <Text style={styles.sectionTitle}>{copy.preferences}</Text>

          <View style={styles.sectionCard}>
            {/* MOEDA */}
            <View style={styles.currencySection}>
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceIcon}>
                  <Ionicons
                    name="cash-outline"
                    size={21}
                    color={colors.green}
                  />
                </View>

                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceTitle}>{copy.currency}</Text>
                  <Text style={styles.preferenceDescription}>
                    {currency === "BRL"
                      ? copy.brl
                      : currency === "USD"
                        ? copy.usd
                        : copy.eur}{" "}
                    ({currentCurrency?.symbol})
                  </Text>
                </View>
              </View>

              <View style={styles.currencyOptions}>
                {CURRENCY_OPTIONS.map((option) => {
                  const selected = currency === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.currencyOption,
                        selected && styles.currencyOptionSelected,
                      ]}
                      onPress={() => {
                        void handleCurrencyChange(option.value);
                      }}
                      disabled={savingCurrency}
                    >
                      <View style={styles.currencyOptionIcon}>
                        <Ionicons
                          name={option.icon}
                          size={20}
                          color={selected ? colors.green : colors.secondary}
                        />
                      </View>

                      <View style={styles.currencyOptionInfo}>
                        <Text style={styles.currencyOptionTitle}>
                          {option.value === "BRL"
                            ? copy.brl
                            : option.value === "USD"
                              ? copy.usd
                              : copy.eur}
                        </Text>

                        <Text style={styles.currencyOptionDescription}>
                          {option.value === "BRL"
                            ? copy.brlDesc
                            : option.value === "USD"
                              ? copy.usdDesc
                              : copy.eurDesc}
                        </Text>
                      </View>

                      <View style={styles.currencyOptionRight}>
                        <Text style={styles.currencySymbol}>
                          {option.symbol}
                        </Text>

                        <View
                          style={[
                            styles.radioOuter,
                            selected && styles.radioOuterSelected,
                          ]}
                        >
                          {selected && <View style={styles.radioInner} />}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.exchangeRateContainer}>
                <View style={styles.exchangeRateInfo}>
                  <Ionicons
                    name="trending-up-outline"
                    size={17}
                    color={colors.green}
                  />

                  <View style={styles.exchangeRateTextContainer}>
                    <Text style={styles.exchangeRateTitle}>
                      {copy.exchange}
                    </Text>

                    <Text style={styles.exchangeRateValue}>
                      {currency === "BRL"
                        ? copy.baseCurrency
                        : selectedRate > 0
                          ? `1 BRL = ${selectedRate.toFixed(4)} ${currency}`
                          : copy.unavailable}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.refreshRatesButton}
                  onPress={() => {
                    void handleRefreshRates();
                  }}
                  disabled={loadingRates}
                >
                  {loadingRates ? (
                    <ActivityIndicator size="small" color={colors.green} />
                  ) : (
                    <Ionicons
                      name="refresh-outline"
                      size={19}
                      color={colors.green}
                    />
                  )}
                </Pressable>
              </View>

              {savingCurrency && (
                <View style={styles.currencySaving}>
                  <ActivityIndicator size="small" color={colors.green} />
                  <Text style={styles.loadingText}>{copy.savingCurrency}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* IDIOMA */}
            <View style={styles.themeSection}>
              <View style={styles.themeHeader}>
                <View style={styles.preferenceIcon}>
                  <Ionicons
                    name="language-outline"
                    size={21}
                    color={colors.green}
                  />
                </View>

                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceTitle}>{copy.language}</Text>

                  <Text style={styles.preferenceDescription}>
                    {
                      LANGUAGE_OPTIONS.find(
                        (option) => option.value === language,
                      )?.title
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.themeOptions}>
                {LANGUAGE_OPTIONS.map((option) => {
                  const selected = language === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.themeOption,
                        selected && styles.themeOptionSelected,
                      ]}
                      onPress={() => {
                        void handleLanguageChange(option.value);
                      }}
                      disabled={savingLanguage}
                    >
                      <View style={styles.themeOptionIcon}>
                        <Text style={{ fontSize: 21 }}>{option.flag}</Text>
                      </View>

                      <View style={styles.themeOptionInfo}>
                        <Text style={styles.themeOptionTitle}>
                          {option.title}
                        </Text>

                        <Text style={styles.themeOptionDescription}>
                          {option.nativeTitle}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radioOuter,
                          selected && styles.radioOuterSelected,
                        ]}
                      >
                        {selected && <View style={styles.radioInner} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {savingLanguage && (
                <View style={styles.themeSaving}>
                  <ActivityIndicator size="small" color={colors.green} />
                  <Text style={styles.loadingText}>{copy.savingLanguage}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* APARÊNCIA */}
            <View style={styles.themeSection}>
              <View style={styles.themeHeader}>
                <View style={styles.preferenceIcon}>
                  <Ionicons
                    name="color-palette-outline"
                    size={21}
                    color={colors.green}
                  />
                </View>

                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceTitle}>{copy.appearance}</Text>

                  <Text style={styles.preferenceDescription}>
                    {currentThemeLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.themeOptions}>
                {THEME_OPTIONS.map((option) => {
                  const selected = theme === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.themeOption,
                        selected && styles.themeOptionSelected,
                      ]}
                      onPress={() => {
                        void handleThemeChange(option.value);
                      }}
                      disabled={savingTheme}
                    >
                      <View style={styles.themeOptionIcon}>
                        <Ionicons
                          name={option.icon}
                          size={20}
                          color={selected ? colors.green : colors.secondary}
                        />
                      </View>

                      <View style={styles.themeOptionInfo}>
                        <Text style={styles.themeOptionTitle}>
                          {option.value === "light"
                            ? copy.light
                            : option.value === "dark"
                              ? copy.dark
                              : copy.automatic}
                        </Text>

                        <Text style={styles.themeOptionDescription}>
                          {option.value === "light"
                            ? copy.lightDesc
                            : option.value === "dark"
                              ? copy.darkDesc
                              : copy.automaticDesc}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radioOuter,
                          selected && styles.radioOuterSelected,
                        ]}
                      >
                        {selected && <View style={styles.radioInner} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {savingTheme && (
                <View style={styles.themeSaving}>
                  <ActivityIndicator size="small" color={colors.green} />
                  <Text style={styles.loadingText}>{copy.applyingTheme}</Text>
                </View>
              )}
            </View>
          </View>

          {/* NOTIFICAÇÕES */}
          <View style={styles.notificationHeader}>
            <View style={styles.notificationHeaderInfo}>
              <Text style={styles.sectionTitle}>{copy.notifications}</Text>

              <Text style={styles.sectionDescription}>
                {copy.notificationsDesc}
              </Text>
            </View>

            <View style={styles.notificationHeaderIcon}>
              <Ionicons
                name="notifications-outline"
                size={21}
                color={colors.green}
              />
            </View>
          </View>

          {loadingPreferences ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={colors.green} />
              <Text style={styles.loadingText}>{copy.loadingPreferences}</Text>
            </View>
          ) : (
            <>
              {notificationGroups.map((group) => (
                <View key={group.title} style={styles.notificationGroup}>
                  <Text style={styles.groupTitle}>{group.title}</Text>

                  <Text style={styles.groupDescription}>
                    {group.description}
                  </Text>

                  <View style={styles.sectionCard}>
                    {group.items.map((item, index) => (
                      <View key={item.key}>
                        <View style={styles.notificationRow}>
                          <View style={styles.preferenceIcon}>
                            <Ionicons
                              name={item.icon}
                              size={21}
                              color={colors.green}
                            />
                          </View>

                          <View style={styles.preferenceInfo}>
                            <Text style={styles.preferenceTitle}>
                              {item.title}
                            </Text>

                            <Text style={styles.preferenceDescription}>
                              {item.description}
                            </Text>
                          </View>

                          <Switch
                            value={preferences[item.key]}
                            onValueChange={(value) =>
                              togglePreference(item.key, value)
                            }
                            disabled={savingPreference}
                            trackColor={{
                              false: isDark ? "#454545" : "#D9DDE4",
                              true: "#B8C78A",
                            }}
                            thumbColor={
                              preferences[item.key] ? colors.green : "#F4F4F4"
                            }
                            ios_backgroundColor={isDark ? "#454545" : "#D9DDE4"}
                          />
                        </View>

                        {index < group.items.length - 1 && (
                          <View style={styles.divider} />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={styles.notificationInfo}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.secondary}
            />

            <Text style={styles.notificationInfoText}>
              {copy.notificationInfo}
            </Text>
          </View>

          {/* SOBRE O APLICATIVO */}
          <Text style={styles.sectionTitle}>{copy.about}</Text>

          <View style={styles.sectionCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={21}
                  color={colors.green}
                />
              </View>

              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>{copy.aboutTripWise}</Text>

                <Text style={styles.preferenceDescription}>
                  {copy.companion}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIcon}>
                <Ionicons
                  name="code-slash-outline"
                  size={21}
                  color={colors.green}
                />
              </View>

              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>{copy.appVersion}</Text>

                <Text style={styles.preferenceDescription}>{copy.version}</Text>
              </View>
            </View>
          </View>

          {/* RODAPÉ */}
          <View style={styles.footer}>
            <Ionicons name="airplane" size={17} color={colors.green} />

            <Text style={styles.footerText}>TripWise</Text>

            <Text style={styles.footerSubtitle}>{copy.footer}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function createStyles(colors: {
  background: string;
  card: string;
  text: string;
  secondary: string;
  border: string;
  green: string;
  iconBackground: string;
  selectedBackground: string;
}) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 22,
      paddingTop: 16,
      paddingBottom: 180,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 25,
    },
    title: {
      fontSize: 29,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.7,
    },
    subtitle: {
      fontSize: 14,
      color: colors.secondary,
      marginTop: 5,
    },
    headerIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: colors.iconBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 13,
      marginLeft: 2,
    },
    sectionDescription: {
      fontSize: 12,
      color: colors.secondary,
      marginTop: -7,
      marginBottom: 14,
      marginLeft: 2,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 19,
      paddingHorizontal: 16,
      marginBottom: 27,
      borderWidth: 1,
      borderColor: colors.border,
    },
    preferenceRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      gap: 13,
    },
    notificationRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      gap: 11,
    },
    preferenceIcon: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor: colors.iconBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    preferenceInfo: {
      flex: 1,
    },
    preferenceTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    preferenceDescription: {
      fontSize: 12,
      color: colors.secondary,
      marginTop: 4,
      lineHeight: 17,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    currencySection: {
      paddingBottom: 16,
    },
    currencyOptions: {
      gap: 9,
      marginBottom: 15,
    },
    currencyOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 11,
    },
    currencyOptionSelected: {
      backgroundColor: colors.selectedBackground,
      borderColor: colors.green,
    },
    currencyOptionIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: colors.iconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    currencyOptionInfo: {
      flex: 1,
    },
    currencyOptionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    currencyOptionDescription: {
      fontSize: 11,
      color: colors.secondary,
      marginTop: 3,
    },
    currencyOptionRight: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
    },
    currencySymbol: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.secondary,
    },
    exchangeRateContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderRadius: 13,
      backgroundColor: colors.iconBackground,
    },
    exchangeRateInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      flex: 1,
    },
    exchangeRateTextContainer: {
      flex: 1,
    },
    exchangeRateTitle: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
    },
    exchangeRateValue: {
      fontSize: 11,
      color: colors.secondary,
      marginTop: 3,
    },
    refreshRatesButton: {
      width: 35,
      height: 35,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    currencySaving: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 12,
    },
    themeSection: {
      paddingTop: 16,
      paddingBottom: 17,
    },
    themeHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      marginBottom: 15,
    },
    themeOptions: {
      gap: 9,
    },
    themeOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 11,
    },
    themeOptionSelected: {
      backgroundColor: colors.selectedBackground,
      borderColor: colors.green,
    },
    themeOptionIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: colors.iconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    themeOptionInfo: {
      flex: 1,
    },
    themeOptionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    themeOptionDescription: {
      fontSize: 11,
      color: colors.secondary,
      marginTop: 3,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.secondary,
      justifyContent: "center",
      alignItems: "center",
    },
    radioOuterSelected: {
      borderColor: colors.green,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.green,
    },
    themeSaving: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 12,
    },
    notificationHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 13,
    },
    notificationHeaderInfo: {
      flex: 1,
    },
    notificationHeaderIcon: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor: colors.iconBackground,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 13,
    },
    notificationGroup: {
      marginBottom: 5,
    },
    groupTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
      marginLeft: 2,
    },
    groupDescription: {
      fontSize: 12,
      color: colors.secondary,
      marginBottom: 12,
      marginLeft: 2,
    },
    loadingCard: {
      backgroundColor: colors.card,
      borderRadius: 19,
      padding: 25,
      alignItems: "center",
      marginBottom: 25,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    loadingText: {
      color: colors.secondary,
      fontSize: 12,
    },
    notificationInfo: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 9,
      marginTop: -10,
      marginBottom: 28,
      paddingHorizontal: 3,
    },
    notificationInfoText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 17,
      color: colors.secondary,
    },
    footer: {
      alignItems: "center",
      marginTop: 5,
      gap: 7,
    },
    footerText: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
    },
    footerSubtitle: {
      fontSize: 12,
      color: colors.secondary,
    },
  });
}
