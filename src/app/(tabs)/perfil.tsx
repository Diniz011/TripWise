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
import { CurrencyCode, useCurrency } from "../../contexts/CurrencyContext";
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

export default function Perfil() {
  const { theme, isDark, setTheme } = useTheme();

  const { currency, rates, loadingRates, setCurrency, refreshRates } =
    useCurrency();

  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingPreference, setSavingPreference] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);

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

        Alert.alert(
          "Erro",
          "Não foi possível salvar essa preferência. Tente novamente.",
        );
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

      Alert.alert(
        "Erro",
        "Não foi possível alterar a aparência. Tente novamente.",
      );
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

      Alert.alert("Erro", "Não foi possível alterar a moeda. Tente novamente.");
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

  const notificationGroups = [
    {
      title: "Viagens",
      description: "Acompanhe as mudanças nas suas viagens.",
      items: [
        {
          key: "viagemCriada" as const,
          title: "Viagem criada",
          description: "Quando uma nova viagem for cadastrada.",
          icon: "airplane-outline" as const,
        },
        {
          key: "viagemExcluida" as const,
          title: "Viagem excluída",
          description: "Quando uma viagem for removida.",
          icon: "trash-outline" as const,
        },
        {
          key: "viagemAtualizada" as const,
          title: "Alterações na viagem",
          description: "Quando informações forem atualizadas.",
          icon: "create-outline" as const,
        },
        {
          key: "lembretesViagem" as const,
          title: "Lembretes de viagem",
          description: "Avisos sobre a proximidade da viagem.",
          icon: "calendar-outline" as const,
        },
      ],
    },
    {
      title: "Hospedagem e passeios",
      description: "Receba atualizações sobre sua programação.",
      items: [
        {
          key: "hospedagem" as const,
          title: "Hospedagem",
          description: "Quando uma hospedagem for adicionada ou alterada.",
          icon: "bed-outline" as const,
        },
        {
          key: "passeios" as const,
          title: "Passeios",
          description: "Quando passeios forem adicionados ou removidos.",
          icon: "map-outline" as const,
        },
      ],
    },
    {
      title: "Controle financeiro",
      description: "Acompanhe o orçamento das suas viagens.",
      items: [
        {
          key: "orcamento80" as const,
          title: "Atenção ao orçamento",
          description: "Quando seus gastos atingirem 80% do orçamento.",
          icon: "alert-circle-outline" as const,
        },
        {
          key: "orcamentoExcedido" as const,
          title: "Orçamento ultrapassado",
          description: "Quando seus gastos ultrapassarem o limite.",
          icon: "wallet-outline" as const,
        },
      ],
    },
  ];

  const currentThemeLabel =
    theme === "light"
      ? "Tema claro"
      : theme === "dark"
        ? "Tema escuro"
        : "Automático";

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
              <Text style={styles.title}>Perfil</Text>
              <Text style={styles.subtitle}>Seu espaço no TripWise</Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons name="person-outline" size={23} color={colors.green} />
            </View>
          </View>

          {/* CARTÃO DO PERFIL */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={38} color="#FFFFFF" />
            </View>

            <Text style={styles.profileName}>Viajante</Text>
            <Text style={styles.profileDescription}>
              Sua próxima aventura começa aqui.
            </Text>

            <View style={styles.profileDivider} />

            <View style={styles.profileFooter}>
              <Ionicons
                name="airplane-outline"
                size={18}
                color={colors.green}
              />
              <Text style={styles.profileFooterText}>
                Explore o mundo com TripWise
              </Text>
            </View>
          </View>

          {/* PREFERÊNCIAS */}
          <Text style={styles.sectionTitle}>Preferências</Text>

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
                  <Text style={styles.preferenceTitle}>Moeda</Text>
                  <Text style={styles.preferenceDescription}>
                    {currentCurrency?.title} ({currentCurrency?.symbol})
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
                          {option.title}
                        </Text>
                        <Text style={styles.currencyOptionDescription}>
                          {option.description}
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
                      Cotação em relação ao Real
                    </Text>

                    <Text style={styles.exchangeRateValue}>
                      {currency === "BRL"
                        ? "Moeda base"
                        : selectedRate > 0
                          ? `1 BRL = ${selectedRate.toFixed(4)} ${currency}`
                          : "Cotação indisponível"}
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
                  <Text style={styles.loadingText}>Salvando moeda...</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* IDIOMA */}
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIcon}>
                <Ionicons
                  name="language-outline"
                  size={21}
                  color={colors.green}
                />
              </View>

              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Idioma</Text>
                <Text style={styles.preferenceDescription}>
                  Português (Brasil)
                </Text>
              </View>
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
                  <Text style={styles.preferenceTitle}>Aparência</Text>
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
                          {option.title}
                        </Text>
                        <Text style={styles.themeOptionDescription}>
                          {option.description}
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
                  <Text style={styles.loadingText}>Aplicando aparência...</Text>
                </View>
              )}
            </View>
          </View>

          {/* NOTIFICAÇÕES */}
          <View style={styles.notificationHeader}>
            <View style={styles.notificationHeaderInfo}>
              <Text style={styles.sectionTitle}>Notificações</Text>
              <Text style={styles.sectionDescription}>
                Personalize os avisos que deseja receber.
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
              <Text style={styles.loadingText}>Carregando preferências...</Text>
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
              Essas preferências controlam os avisos exibidos dentro do
              TripWise. As notificações externas do iPhone serão implementadas
              posteriormente.
            </Text>
          </View>

          {/* SOBRE O APLICATIVO */}
          <Text style={styles.sectionTitle}>Sobre o aplicativo</Text>

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
                <Text style={styles.preferenceTitle}>Sobre o TripWise</Text>
                <Text style={styles.preferenceDescription}>
                  Seu companheiro de viagens.
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
                <Text style={styles.preferenceTitle}>Versão do aplicativo</Text>
                <Text style={styles.preferenceDescription}>
                  TripWise · Versão 1.0.2
                </Text>
              </View>
            </View>
          </View>

          {/* RODAPÉ */}
          <View style={styles.footer}>
            <Ionicons name="airplane" size={17} color={colors.green} />
            <Text style={styles.footerText}>TripWise</Text>
            <Text style={styles.footerSubtitle}>
              Planeje suas Viagens. Explore o mundo. Viva!
            </Text>
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
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 23,
      padding: 25,
      alignItems: "center",
      marginBottom: 29,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: colors.green,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
    },
    profileName: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
    },
    profileDescription: {
      fontSize: 13,
      color: colors.secondary,
      marginTop: 6,
    },
    profileDivider: {
      height: 1,
      backgroundColor: colors.border,
      width: "100%",
      marginVertical: 20,
    },
    profileFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    profileFooterText: {
      fontSize: 13,
      color: colors.secondary,
      fontWeight: "500",
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
