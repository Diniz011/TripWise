import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../../contexts/LanguageContext";

const TRIPS_STORAGE_KEY = "@viagens";

type Trip = {
  id: string;
  nome: string;
  destino: string;
  transporte: string;
  data: string;
  dataFim?: string;
  [key: string]: unknown;
};

type TimelineSelectionTranslations = {
  headerSubtitle: string;
  title: string;
  titleAccent: string;
  description: string;
  loading: string;
  error: string;
  loadError: string;
  invalidData: string;
  emptyTitle: string;
  emptyDescription: string;
  createTrip: string;
  selectTitle: string;
  selectDescription: string;
  ongoing: string;
  planned: string;
  completed: string;
};

const TIMELINE_SELECTION_TRANSLATIONS: Record<
  "pt-BR" | "en" | "es",
  TimelineSelectionTranslations
> = {
  "pt-BR": {
    headerSubtitle: "ORGANIZE SUA JORNADA",
    title: "Sua viagem.",
    titleAccent: "Sua timeline.",
    description:
      "Acompanhe os momentos mais importantes da sua experiência em um só lugar.",
    loading: "Carregando suas viagens...",
    error: "Erro",
    loadError: "Não foi possível carregar suas viagens.",
    invalidData: "Os dados armazenados das viagens são inválidos.",
    emptyTitle: "Sua próxima história começa aqui",
    emptyDescription:
      "Você ainda não possui viagens cadastradas. Crie sua primeira viagem para acompanhar cada momento da sua jornada.",
    createTrip: "Cadastrar viagem",
    selectTitle: "Escolha sua viagem",
    selectDescription:
      "Selecione uma viagem para acompanhar sua programação e seus principais acontecimentos.",
    ongoing: "Em andamento",
    planned: "Planejada",
    completed: "Concluída",
  },

  en: {
    headerSubtitle: "ORGANIZE YOUR JOURNEY",
    title: "Your trip.",
    titleAccent: "Your timeline.",
    description:
      "Follow the most important moments of your experience in one place.",
    loading: "Loading your trips...",
    error: "Error",
    loadError: "Could not load your trips.",
    invalidData: "The stored trip data is invalid.",
    emptyTitle: "Your next story starts here",
    emptyDescription:
      "You don't have any trips yet. Create your first trip to follow every moment of your journey.",
    createTrip: "Add a trip",
    selectTitle: "Choose your trip",
    selectDescription:
      "Select a trip to follow its schedule and most important events.",
    ongoing: "In progress",
    planned: "Planned",
    completed: "Completed",
  },

  es: {
    headerSubtitle: "ORGANIZA TU VIAJE",
    title: "Tu viaje.",
    titleAccent: "Tu cronología.",
    description:
      "Sigue los momentos más importantes de tu experiencia en un solo lugar.",
    loading: "Cargando tus viajes...",
    error: "Error",
    loadError: "No se pudieron cargar tus viajes.",
    invalidData: "Los datos almacenados de los viajes no son válidos.",
    emptyTitle: "Tu próxima historia comienza aquí",
    emptyDescription:
      "Todavía no tienes viajes registrados. Crea tu primer viaje para seguir cada momento de tu aventura.",
    createTrip: "Registrar viaje",
    selectTitle: "Elige tu viaje",
    selectDescription:
      "Selecciona un viaje para seguir su programación y sus acontecimientos más importantes.",
    ongoing: "En curso",
    planned: "Planificado",
    completed: "Finalizado",
  },
};

// Valida individualmente cada viagem antes de exibi-la.
const isTrip = (value: unknown): value is Trip => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const trip = value as Record<string, unknown>;

  return (
    typeof trip.id === "string" &&
    trip.id.trim().length > 0 &&
    typeof trip.nome === "string" &&
    trip.nome.trim().length > 0 &&
    typeof trip.destino === "string" &&
    trip.destino.trim().length > 0 &&
    typeof trip.transporte === "string" &&
    trip.transporte.trim().length > 0 &&
    typeof trip.data === "string" &&
    trip.data.trim().length > 0 &&
    (trip.dataFim === undefined || typeof trip.dataFim === "string")
  );
};

const isTripList = (value: unknown): value is Trip[] => {
  if (!Array.isArray(value) || !value.every(isTrip)) {
    return false;
  }

  const ids = new Set(value.map((trip) => trip.id));

  return ids.size === value.length;
};

// Converte datas conhecidas em datas locais, sem conversão UTC.
const parseLocalDate = (value: string): Date | null => {
  const normalized = value.trim();

  let day: number;
  let month: number;
  let year: number;

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const fullMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (fullMatch) {
    day = Number(fullMatch[1]);
    month = Number(fullMatch[2]);
    year = Number(fullMatch[3]);
  } else {
    return null;
  }

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    year < 1000 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  return date;
};

const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const formatDate = (value: string, locale: string): string => {
  const date = parseLocalDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getTripStatus = (
  trip: Trip,
  today: Date,
): "ongoing" | "planned" | "completed" => {
  const startDate = parseLocalDate(trip.data);

  if (!startDate) {
    return "planned";
  }

  const endDate = trip.dataFim ? parseLocalDate(trip.dataFim) : startDate;

  if (!endDate || endDate.getTime() < startDate.getTime()) {
    return "planned";
  }

  if (today.getTime() < startDate.getTime()) {
    return "planned";
  }

  if (today.getTime() > endDate.getTime()) {
    return "completed";
  }

  return "ongoing";
};

export default function TimelineSelection() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { language, locale } = useLanguage();
  const copy = TIMELINE_SELECTION_TRANSLATIONS[language];

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const hasLoadedTripsRef = useRef(false);

  const today = getToday();

  const background = isDark ? "#121212" : "#F4F6FA";
  const cardBackground = isDark ? "#1E1E1E" : "#FFFFFF";
  const primaryText = isDark ? "#FFFFFF" : "#172033";
  const secondaryText = isDark ? "#A0A0A0" : "#7B8495";
  const borderColor = isDark ? "#333333" : "#E9ECF2";
  const accent = "#8FA255";
  const mutedBackground = isDark ? "#293021" : "#EDF2E5";

  const carregarViagens = useCallback(async () => {
    // O indicador aparece somente no carregamento inicial ou na primeira tentativa após falha.
    if (!hasLoadedTripsRef.current) {
      setLoading(true);
      setLoadFailed(false);
    }

    try {
      const saved = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);

      if (saved === null) {
        setTrips([]);
        hasLoadedTripsRef.current = true;
        setLoadFailed(false);
        return;
      }

      const parsed: unknown = JSON.parse(saved);

      if (!isTripList(parsed)) {
        throw new Error(copy.invalidData);
      }

      setTrips(parsed);
      hasLoadedTripsRef.current = true;
      setLoadFailed(false);
    } catch (error) {
      console.error("Erro ao carregar viagens para a Timeline:", error);

      // Se a tela já carregou anteriormente, mantém os dados visíveis
      // quando uma atualização em segundo plano falhar.
      if (!hasLoadedTripsRef.current) {
        setTrips([]);
        setLoadFailed(true);
        Alert.alert(copy.error, copy.loadError);
      }
    } finally {
      setLoading(false);
    }
  }, [copy.error, copy.invalidData, copy.loadError]);

  useFocusEffect(
    useCallback(() => {
      void carregarViagens();
    }, [carregarViagens]),
  );

  const getStatusLabel = (trip: Trip) => {
    const status = getTripStatus(trip, today);

    if (status === "ongoing") {
      return copy.ongoing;
    }

    if (status === "completed") {
      return copy.completed;
    }

    return copy.planned;
  };

  const getStatusColor = (trip: Trip) => {
    const status = getTripStatus(trip, today);

    if (status === "ongoing") {
      return accent;
    }

    if (status === "completed") {
      return isDark ? "#8E8E93" : "#8A91A0";
    }

    return "#D69B45";
  };

  const selecionarViagem = (trip: Trip) => {
    router.push({
      pathname: "/(tabs)/timeline/detalhes",
      params: {
        tripId: trip.id,
      },
    });
  };

  const abrirCadastro = () => {
    router.navigate("/");
  };

  const renderTripCard = (trip: Trip) => {
    const statusColor = getStatusColor(trip);

    return (
      <Pressable
        key={trip.id}
        style={({ pressed }) => [
          styles.tripCard,
          {
            backgroundColor: cardBackground,
            borderColor,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => selecionarViagem(trip)}
        accessibilityRole="button"
        accessibilityLabel={`${trip.nome}, ${trip.destino}, ${getStatusLabel(trip)}`}
      >
        <View style={styles.tripCardTop}>
          <View style={[styles.tripIcon, { backgroundColor: mutedBackground }]}>
            <Ionicons name="airplane" size={23} color={accent} />
          </View>

          <View style={styles.tripCardInfo}>
            <Text
              style={[styles.tripName, { color: primaryText }]}
              numberOfLines={1}
            >
              {trip.nome}
            </Text>

            <View style={styles.destinationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={secondaryText}
              />
              <Text
                style={[styles.destinationText, { color: secondaryText }]}
                numberOfLines={1}
              >
                {trip.destino}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={21} color={secondaryText} />
        </View>

        <View style={styles.tripCardBottom}>
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={14} color={secondaryText} />
            <Text style={[styles.dateText, { color: secondaryText }]}>
              {formatDate(trip.data, locale)}
              {trip.dataFim ? ` – ${formatDate(trip.dataFim, locale)}` : ""}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(trip)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: background }]}
        edges={["top"]}
      >
        <View style={[styles.topBar, { borderBottomColor: borderColor }]}>
          <View>
            <Text style={[styles.topBarTitle, { color: primaryText }]}>
              Timeline
            </Text>
            <Text style={[styles.topBarSubtitle, { color: secondaryText }]}>
              {copy.headerSubtitle}
            </Text>
          </View>

          <View
            style={[styles.topBarIcon, { backgroundColor: mutedBackground }]}
          >
            <Ionicons name="map-outline" size={22} color={accent} />
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={accent} />
            <Text style={[styles.loadingText, { color: secondaryText }]}>
              {copy.loading}
            </Text>
          </View>
        ) : loadFailed ? (
          <View style={styles.centerContent}>
            <View
              style={[styles.emptyIcon, { backgroundColor: mutedBackground }]}
            >
              <Ionicons name="alert-circle-outline" size={34} color={accent} />
            </View>

            <Text style={[styles.emptyTitle, { color: primaryText }]}>
              {copy.error}
            </Text>

            <Text style={[styles.emptyDescription, { color: secondaryText }]}>
              {copy.loadError}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: accent, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => void carregarViagens()}
              accessibilityRole="button"
            >
              <Ionicons name="refresh-outline" size={19} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {language === "en"
                  ? "Try again"
                  : language === "es"
                    ? "Intentar de nuevo"
                    : "Tentar novamente"}
              </Text>
            </Pressable>
          </View>
        ) : trips.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[styles.heroIcon, { backgroundColor: mutedBackground }]}
            >
              <Ionicons name="map-outline" size={42} color={accent} />
            </View>

            <Text style={[styles.heroTitle, { color: primaryText }]}>
              {copy.title}
            </Text>

            <Text style={[styles.heroTitleAccent, { color: accent }]}>
              {copy.titleAccent}
            </Text>

            <Text style={[styles.heroDescription, { color: secondaryText }]}>
              {copy.description}
            </Text>

            <View
              style={[styles.emptyCard, { backgroundColor: cardBackground }]}
            >
              <View
                style={[styles.emptyIcon, { backgroundColor: mutedBackground }]}
              >
                <Ionicons name="airplane-outline" size={34} color={accent} />
              </View>

              <Text style={[styles.emptyTitle, { color: primaryText }]}>
                {copy.emptyTitle}
              </Text>

              <Text style={[styles.emptyDescription, { color: secondaryText }]}>
                {copy.emptyDescription}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: accent, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={abrirCadastro}
                accessibilityRole="button"
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>{copy.createTrip}</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroHeader}>
              <Text style={[styles.heroTitle, { color: primaryText }]}>
                {copy.title}
              </Text>

              <Text style={[styles.heroTitleAccent, { color: accent }]}>
                {copy.titleAccent}
              </Text>

              <Text style={[styles.heroDescription, { color: secondaryText }]}>
                {copy.description}
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: primaryText }]}>
                  {copy.selectTitle}
                </Text>

                <Text
                  style={[styles.sectionDescription, { color: secondaryText }]}
                >
                  {copy.selectDescription}
                </Text>
              </View>

              <View
                style={[styles.tripCount, { backgroundColor: mutedBackground }]}
              >
                <Text style={[styles.tripCountText, { color: accent }]}>
                  {trips.length}
                </Text>
              </View>
            </View>

            {trips.map(renderTripCard)}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    minHeight: 68,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarTitle: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  topBarSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 3,
  },
  topBarIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 140,
  },
  emptyScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 140,
    justifyContent: "center",
  },
  heroHeader: {
    marginBottom: 28,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 22,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  heroTitleAccent: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 2,
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 15,
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
  },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 22,
    alignSelf: "stretch",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  sectionDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  tripCount: {
    minWidth: 35,
    height: 35,
    paddingHorizontal: 10,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tripCountText: {
    fontSize: 13,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  tripCard: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
  },
  tripCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tripIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  tripCardInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  destinationText: {
    fontSize: 11,
    flexShrink: 1,
  },
  tripCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#8A8A8A35",
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  dateText: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
