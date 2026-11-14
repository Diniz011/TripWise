import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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
const WALLET_STORAGE_PREFIX = "@tripwise_carteira_";
const COMPLETED_STORAGE_PREFIX = "@tripwise_timeline_completed_";

type Trip = {
  id: string;
  nome: string;
  destino: string;
  transporte: string;
  data: string;
  dataFim?: string;
  hotelNome?: string;
  hotelEndereco?: string;
  hotelData?: string;
  passeios?: string | string[];
  roteiro?: ItineraryDay[];
  [key: string]: unknown;
};

type ItineraryActivity = {
  id: string;
  time: string;
  title: string;
  place: string;
  notes: string;
  completed?: boolean;
};

type ItineraryDay = {
  date: string;
  activities: ItineraryActivity[];
};

type WalletRecord = {
  id: string;
  categoria: "documentos" | "passagens" | "reservas";
  titulo: string;
  detalhe: string;
  data: string;
  local: string;
  observacoes: string;
};

type EventCategory = "activity" | "accommodation" | "transport" | "reservation";

type TimelineEvent = {
  id: string;
  title: string;
  subtitle: string;
  notes: string;
  location: string;
  date: Date;
  time: string | null;
  category: EventCategory;
  completed: boolean;
  canComplete: boolean;
};

type UndatedEvent = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  notes: string;
  category: EventCategory | "sightseeing";
};

type FilterType =
  | "all"
  | "activities"
  | "accommodation"
  | "transport"
  | "reservations";

type TimelineTranslations = {
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
  startDate: string;
  endDate: string;
  transport: string;
  selectedTrip: string;
  changeTrip: string;
  noEndDate: string;
  retry: string;
  dashboard: string;
  elapsed: string;
  days: string;
  activities: string;
  completedActivities: string;
  progress: string;
  day: string;
  all: string;
  accommodation: string;
  reservations: string;
  noEvents: string;
  noEventsDescription: string;
  noTime: string;
  unscheduled: string;
  sightseeing: string;
  checkIn: string;
  checkOut: string;
  completedLabel: string;
  markCompleted: string;
  markPending: string;
  mapTitle: string;
  mapDescription: string;
  mapFuture: string;
  locationNotProvided: string;
  notes: string;
  itinerary: string;
  ticket: string;
  reservation: string;
  dateNotAvailable: string;
  tripOverview: string;
  daysRemaining: string;
  tripFinished: string;
  filterActivities: string;
  filterAccommodation: string;
  filterTransport: string;
  filterReservations: string;
  saveError: string;
};

const TIMELINE_TRANSLATIONS: Record<
  "pt-BR" | "en" | "es",
  TimelineTranslations
> = {
  "pt-BR": {
    headerSubtitle: "ORGANIZE SUA JORNADA",
    title: "Sua viagem.",
    titleAccent: "Sua timeline.",
    description:
      "Acompanhe os momentos mais importantes da sua experiência em um só lugar.",
    loading: "Carregando sua viagem...",
    error: "Erro",
    loadError: "Não foi possível carregar os dados desta viagem.",
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
    startDate: "Início",
    endDate: "Término",
    transport: "Transporte",
    selectedTrip: "Viagem selecionada",
    changeTrip: "Trocar viagem",
    noEndDate: "Não informado",
    retry: "Tentar novamente",
    dashboard: "RESUMO DA VIAGEM",
    elapsed: "Dias transcorridos",
    days: "dias",
    activities: "Atividades",
    completedActivities: "Concluídas",
    progress: "Progresso",
    day: "Dia",
    all: "Todos",
    accommodation: "Hospedagem",
    reservations: "Reservas",
    noEvents: "Nenhum acontecimento neste dia",
    noEventsDescription:
      "Os eventos cadastrados para esta data aparecerão aqui.",
    noTime: "Sem horário",
    unscheduled: "SEM DATA OU HORÁRIO DEFINIDO",
    sightseeing: "Pontos de interesse",
    checkIn: "Check-in",
    checkOut: "Check-out",
    completedLabel: "Concluída",
    markCompleted: "Marcar como concluída",
    markPending: "Reabrir atividade",
    mapTitle: "Mapa da viagem",
    mapDescription:
      "Os locais cadastrados no roteiro, nas reservas e na hospedagem poderão ser visualizados aqui.",
    mapFuture: "Visualização de mapa disponível em uma próxima atualização",
    locationNotProvided: "Local não informado",
    notes: "Observações",
    itinerary: "Atividade do roteiro",
    ticket: "Passagem",
    reservation: "Reserva",
    dateNotAvailable: "Data não identificada",
    tripOverview: "Visão geral",
    daysRemaining: "dias restantes",
    tripFinished: "Viagem finalizada",
    filterActivities: "Passeios",
    filterAccommodation: "Hospedagem",
    filterTransport: "Transporte",
    filterReservations: "Reservas",
    saveError: "Não foi possível salvar o status da atividade.",
  },

  en: {
    headerSubtitle: "ORGANIZE YOUR JOURNEY",
    title: "Your trip.",
    titleAccent: "Your timeline.",
    description:
      "Follow the most important moments of your experience in one place.",
    loading: "Loading your trip...",
    error: "Error",
    loadError: "Could not load this trip's data.",
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
    startDate: "Start",
    endDate: "End",
    transport: "Transport",
    selectedTrip: "Selected trip",
    changeTrip: "Change trip",
    noEndDate: "Not provided",
    retry: "Try again",
    dashboard: "TRIP OVERVIEW",
    elapsed: "Elapsed days",
    days: "days",
    activities: "Activities",
    completedActivities: "Completed",
    progress: "Progress",
    day: "Day",
    all: "All",
    accommodation: "Accommodation",
    reservations: "Reservations",
    noEvents: "No events on this day",
    noEventsDescription: "Events registered for this date will appear here.",
    noTime: "No time",
    unscheduled: "NO DATE OR TIME PROVIDED",
    sightseeing: "Points of interest",
    checkIn: "Check-in",
    checkOut: "Check-out",
    completedLabel: "Completed",
    markCompleted: "Mark as completed",
    markPending: "Reopen activity",
    mapTitle: "Trip map",
    mapDescription:
      "Places registered in your itinerary, reservations and accommodation will be displayed here.",
    mapFuture: "Map visualization will be available in a future update",
    locationNotProvided: "Location not provided",
    notes: "Notes",
    itinerary: "Itinerary activity",
    ticket: "Ticket",
    reservation: "Reservation",
    dateNotAvailable: "Date not identified",
    tripOverview: "Overview",
    daysRemaining: "days remaining",
    tripFinished: "Trip finished",
    filterActivities: "Activities",
    filterAccommodation: "Accommodation",
    filterTransport: "Transport",
    filterReservations: "Reservations",
    saveError: "Could not save the activity status.",
  },

  es: {
    headerSubtitle: "ORGANIZA TU VIAJE",
    title: "Tu viaje.",
    titleAccent: "Tu cronología.",
    description:
      "Sigue los momentos más importantes de tu experiencia en un solo lugar.",
    loading: "Cargando tu viaje...",
    error: "Error",
    loadError: "No se pudieron cargar los datos de este viaje.",
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
    startDate: "Inicio",
    endDate: "Fin",
    transport: "Transporte",
    selectedTrip: "Viaje seleccionado",
    changeTrip: "Cambiar viaje",
    noEndDate: "No informado",
    retry: "Intentar de nuevo",
    dashboard: "RESUMEN DEL VIAJE",
    elapsed: "Días transcurridos",
    days: "días",
    activities: "Actividades",
    completedActivities: "Completadas",
    progress: "Progreso",
    day: "Día",
    all: "Todos",
    accommodation: "Alojamiento",
    reservations: "Reservas",
    noEvents: "No hay eventos en este día",
    noEventsDescription:
      "Los eventos registrados para esta fecha aparecerán aquí.",
    noTime: "Sin horario",
    unscheduled: "SIN FECHA U HORARIO DEFINIDO",
    sightseeing: "Puntos de interés",
    checkIn: "Check-in",
    checkOut: "Check-out",
    completedLabel: "Completada",
    markCompleted: "Marcar como completada",
    markPending: "Reabrir actividad",
    mapTitle: "Mapa del viaje",
    mapDescription:
      "Los lugares registrados en el itinerario, las reservas y el alojamiento aparecerán aquí.",
    mapFuture: "Visualización del mapa disponible en una próxima actualización",
    locationNotProvided: "Lugar no informado",
    notes: "Observaciones",
    itinerary: "Actividad del itinerario",
    ticket: "Billete",
    reservation: "Reserva",
    dateNotAvailable: "Fecha no identificada",
    tripOverview: "Resumen",
    daysRemaining: "días restantes",
    tripFinished: "Viaje finalizado",
    filterActivities: "Actividades",
    filterAccommodation: "Alojamiento",
    filterTransport: "Transporte",
    filterReservations: "Reservas",
    saveError: "No se pudo guardar el estado de la actividad.",
  },
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isTrip = (value: unknown): value is Trip => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.nome === "string" &&
    value.nome.trim().length > 0 &&
    typeof value.destino === "string" &&
    value.destino.trim().length > 0 &&
    typeof value.transporte === "string" &&
    value.transporte.trim().length > 0 &&
    typeof value.data === "string" &&
    value.data.trim().length > 0 &&
    (value.dataFim === undefined || typeof value.dataFim === "string")
  );
};

const parseLocalDate = (value: string, referenceYear?: number): Date | null => {
  const normalized = value.trim();

  let day: number;
  let month: number;
  let year: number;

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const fullMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const shortMatch = normalized.match(/^(\d{2})\/(\d{2})$/);

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (fullMatch) {
    day = Number(fullMatch[1]);
    month = Number(fullMatch[2]);
    year = Number(fullMatch[3]);
  } else if (shortMatch && referenceYear) {
    day = Number(shortMatch[1]);
    month = Number(shortMatch[2]);
    year = referenceYear;
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

const dateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, amount: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getDayDifference = (start: Date, end: Date): number =>
  Math.round((end.getTime() - start.getTime()) / 86400000);

const formatDay = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);

const formatFullDate = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

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

const parseTime = (value: string): string | null => {
  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match ? value.trim() : null;
};

const getTripYear = (trip: Trip): number | undefined =>
  parseLocalDate(trip.data)?.getFullYear();

const readSightseeing = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        );
      }
    } catch {
      return [value.trim()];
    }
  }

  return [];
};

const readWalletRecords = (value: unknown): WalletRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is WalletRecord => {
    if (!isObject(item)) {
      return false;
    }

    return (
      typeof item.id === "string" &&
      typeof item.categoria === "string" &&
      ["documentos", "passagens", "reservas"].includes(item.categoria) &&
      typeof item.titulo === "string" &&
      typeof item.detalhe === "string" &&
      typeof item.data === "string" &&
      typeof item.local === "string" &&
      typeof item.observacoes === "string"
    );
  });
};

const readCompletedIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

const getEventIcon = (category: EventCategory) => {
  switch (category) {
    case "activity":
      return "walk-outline";
    case "accommodation":
      return "bed-outline";
    case "transport":
      return "airplane-outline";
    case "reservation":
      return "bookmark-outline";
  }
};

const getFilterForCategory = (category: EventCategory): FilterType => {
  switch (category) {
    case "activity":
      return "activities";
    case "accommodation":
      return "accommodation";
    case "transport":
      return "transport";
    case "reservation":
      return "reservations";
  }
};

export default function TimelineDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string | string[] }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { language, locale } = useLanguage();
  const copy = TIMELINE_TRANSLATIONS[language];

  const tripId = Array.isArray(params.tripId)
    ? params.tripId[0]
    : params.tripId;

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [walletRecords, setWalletRecords] = useState<WalletRecord[]>([]);
  const [completedActivityIds, setCompletedActivityIds] = useState<string[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [mapExpanded, setMapExpanded] = useState(false);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const loadedTripIdRef = useRef<string | null>(null);

  const today = getToday();

  const background = isDark ? "#121212" : "#F4F6FA";
  const cardBackground = isDark ? "#1E1E1E" : "#FFFFFF";
  const primaryText = isDark ? "#FFFFFF" : "#172033";
  const secondaryText = isDark ? "#A0A0A0" : "#7B8495";
  const borderColor = isDark ? "#333333" : "#E9ECF2";
  const accent = "#8FA255";
  const mutedBackground = isDark ? "#293021" : "#EDF2E5";

  const carregarDadosDaViagem = useCallback(async () => {
    if (!tripId) {
      setLoadFailed(true);
      setLoading(false);
      return;
    }

    // Exibe o carregamento apenas na primeira abertura desta viagem.
    if (loadedTripIdRef.current !== tripId) {
      setLoading(true);
    }

    setLoadFailed(false);

    try {
      const [savedTrips, walletSaved, completedSaved] = await Promise.all([
        AsyncStorage.getItem(TRIPS_STORAGE_KEY),
        AsyncStorage.getItem(`${WALLET_STORAGE_PREFIX}${tripId}`),
        AsyncStorage.getItem(`${COMPLETED_STORAGE_PREFIX}${tripId}`),
      ]);

      if (!savedTrips) {
        throw new Error(copy.loadError);
      }

      const parsedTrips: unknown = JSON.parse(savedTrips);

      if (!Array.isArray(parsedTrips)) {
        throw new Error(copy.invalidData);
      }

      const trip = parsedTrips.find(
        (item): item is Trip => isTrip(item) && item.id === tripId,
      );

      if (!trip) {
        throw new Error(copy.loadError);
      }

      setSelectedTrip(trip);

      if (walletSaved) {
        try {
          const parsedWallet: unknown = JSON.parse(walletSaved);
          setWalletRecords(readWalletRecords(parsedWallet));
        } catch {
          setWalletRecords([]);
        }
      } else {
        setWalletRecords([]);
      }

      if (completedSaved) {
        try {
          const parsedCompleted: unknown = JSON.parse(completedSaved);
          setCompletedActivityIds(readCompletedIds(parsedCompleted));
        } catch {
          setCompletedActivityIds([]);
        }
      } else {
        setCompletedActivityIds([]);
      }

      // Registra que esta viagem já foi carregada com sucesso.
      loadedTripIdRef.current = tripId;
    } catch (error) {
      console.error("Erro ao carregar dados da Timeline:", error);

      // Preserva os dados existentes se uma atualização em segundo plano falhar.
      if (loadedTripIdRef.current !== tripId) {
        setSelectedTrip(null);
        setWalletRecords([]);
        setCompletedActivityIds([]);
        setLoadFailed(true);
      }
    } finally {
      setLoading(false);
    }
  }, [tripId, copy.loadError, copy.invalidData]);
  useFocusEffect(
    useCallback(() => {
      void carregarDadosDaViagem();
    }, [carregarDadosDaViagem]),
  );

  const tripStartDate = selectedTrip ? parseLocalDate(selectedTrip.data) : null;

  const tripEndDate = selectedTrip
    ? selectedTrip.dataFim
      ? parseLocalDate(selectedTrip.dataFim)
      : tripStartDate
    : null;

  const events = useMemo<TimelineEvent[]>(() => {
    if (!selectedTrip) {
      return [];
    }

    const result: TimelineEvent[] = [];
    const referenceYear = getTripYear(selectedTrip);

    const itinerary = Array.isArray(selectedTrip.roteiro)
      ? selectedTrip.roteiro
      : [];

    itinerary.forEach((day, dayIndex) => {
      if (!day || typeof day.date !== "string") {
        return;
      }

      const date = parseLocalDate(day.date, referenceYear);

      if (!date || !Array.isArray(day.activities)) {
        return;
      }

      day.activities.forEach((activity, activityIndex) => {
        if (
          !activity ||
          typeof activity.id !== "string" ||
          typeof activity.title !== "string"
        ) {
          return;
        }

        const time = parseTime(
          typeof activity.time === "string" ? activity.time : "",
        );

        result.push({
          id: `activity-${activity.id || `${dayIndex}-${activityIndex}`}`,
          title: activity.title,
          subtitle: copy.itinerary,
          notes: typeof activity.notes === "string" ? activity.notes : "",
          location: typeof activity.place === "string" ? activity.place : "",
          date,
          time,
          category: "activity",
          completed: completedActivityIds.includes(activity.id),
          canComplete: true,
        });
      });
    });

    if (
      typeof selectedTrip.hotelData === "string" &&
      selectedTrip.hotelData.trim()
    ) {
      const hotelDates = selectedTrip.hotelData
        .split(/\s+a\s+/i)
        .map((item) => item.trim());

      const checkInDate = parseLocalDate(hotelDates[0] ?? "", referenceYear);

      const checkOutDate = parseLocalDate(hotelDates[1] ?? "", referenceYear);

      const hotelName =
        typeof selectedTrip.hotelNome === "string"
          ? selectedTrip.hotelNome
          : copy.accommodation;

      const hotelLocation =
        typeof selectedTrip.hotelEndereco === "string"
          ? selectedTrip.hotelEndereco
          : "";

      if (checkInDate) {
        result.push({
          id: "accommodation-checkin",
          title: copy.checkIn,
          subtitle: hotelName,
          notes: "",
          location: hotelLocation,
          date: checkInDate,
          time: null,
          category: "accommodation",
          completed: false,
          canComplete: false,
        });
      }

      if (checkOutDate) {
        result.push({
          id: "accommodation-checkout",
          title: copy.checkOut,
          subtitle: hotelName,
          notes: "",
          location: hotelLocation,
          date: checkOutDate,
          time: null,
          category: "accommodation",
          completed: false,
          canComplete: false,
        });
      }
    }

    walletRecords.forEach((record) => {
      if (record.categoria !== "passagens" && record.categoria !== "reservas") {
        return;
      }

      const date = parseLocalDate(record.data, referenceYear);

      if (!date) {
        return;
      }

      const isTransport = record.categoria === "passagens";

      result.push({
        id: `wallet-${record.id}`,
        title: record.titulo,
        subtitle: isTransport ? copy.ticket : copy.reservation,
        notes: record.observacoes,
        location: record.local,
        date,
        time: null,
        category: isTransport ? "transport" : "reservation",
        completed: false,
        canComplete: false,
      });
    });

    return result.sort((a, b) => {
      const dateDifference = a.date.getTime() - b.date.getTime();

      if (dateDifference !== 0) {
        return dateDifference;
      }

      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }

      if (a.time) {
        return -1;
      }

      if (b.time) {
        return 1;
      }

      return a.title.localeCompare(b.title);
    });
  }, [
    selectedTrip,
    walletRecords,
    completedActivityIds,
    copy.accommodation,
    copy.checkIn,
    copy.checkOut,
    copy.itinerary,
    copy.reservation,
    copy.ticket,
  ]);

  const undatedEvents = useMemo<UndatedEvent[]>(() => {
    if (!selectedTrip) {
      return [];
    }

    const result: UndatedEvent[] = [];
    const referenceYear = getTripYear(selectedTrip);

    walletRecords.forEach((record) => {
      if (record.categoria !== "passagens" && record.categoria !== "reservas") {
        return;
      }

      if (parseLocalDate(record.data, referenceYear)) {
        return;
      }

      result.push({
        id: `undated-wallet-${record.id}`,
        title: record.titulo,
        subtitle:
          record.categoria === "passagens" ? copy.ticket : copy.reservation,
        location: record.local,
        notes: record.observacoes,
        category:
          record.categoria === "passagens" ? "transport" : "reservation",
      });
    });

    readSightseeing(selectedTrip.passeios).forEach((place, index) => {
      result.push({
        id: `sightseeing-${index}-${place}`,
        title: place,
        subtitle: copy.sightseeing,
        location: place,
        notes: "",
        category: "sightseeing",
      });
    });

    return result;
  }, [
    selectedTrip,
    walletRecords,
    copy.ticket,
    copy.reservation,
    copy.sightseeing,
  ]);

  const tripDays = useMemo(() => {
    if (!tripStartDate || !tripEndDate) {
      return events
        .map((event) => event.date)
        .filter(
          (date, index, array) =>
            array.findIndex((item) => dateKey(item) === dateKey(date)) ===
            index,
        )
        .sort((a, b) => a.getTime() - b.getTime());
    }

    if (tripEndDate.getTime() < tripStartDate.getTime()) {
      return [tripStartDate];
    }

    const totalDays = getDayDifference(tripStartDate, tripEndDate) + 1;

    if (totalDays > 120) {
      return [tripStartDate, tripEndDate];
    }

    const days: Date[] = [];

    for (let index = 0; index < totalDays; index += 1) {
      days.push(addDays(tripStartDate, index));
    }

    events.forEach((event) => {
      if (!days.some((day) => dateKey(day) === dateKey(event.date))) {
        days.push(event.date);
      }
    });

    return days.sort((a, b) => a.getTime() - b.getTime());
  }, [tripStartDate, tripEndDate, events]);

  const effectiveSelectedDateKey = tripDays.some(
    (day) => dateKey(day) === selectedDateKey,
  )
    ? selectedDateKey
    : tripDays.length > 0
      ? dateKey(
          tripDays.find((day) => dateKey(day) === dateKey(today)) ??
            tripDays[0],
        )
      : null;

  const selectedDate =
    tripDays.find((day) => dateKey(day) === effectiveSelectedDateKey) ?? null;

  const visibleEvents = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    return events.filter((event) => {
      const sameDay = dateKey(event.date) === dateKey(selectedDate);

      if (!sameDay) {
        return false;
      }

      if (activeFilter === "all") {
        return true;
      }

      return getFilterForCategory(event.category) === activeFilter;
    });
  }, [events, selectedDate, activeFilter]);

  const totalActivities = events.filter(
    (event) => event.category === "activity",
  ).length;

  const completedActivities = events.filter(
    (event) => event.category === "activity" && event.completed,
  ).length;

  const activityProgress =
    totalActivities > 0
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

  const totalTripDays =
    tripStartDate && tripEndDate
      ? Math.max(1, getDayDifference(tripStartDate, tripEndDate) + 1)
      : 1;

  const elapsedDays = tripStartDate
    ? Math.max(
        0,
        Math.min(totalTripDays, getDayDifference(tripStartDate, today) + 1),
      )
    : 0;

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

  const voltarParaSelecao = () => {
    router.back();
  };

  const toggleActivityCompletion = async (event: TimelineEvent) => {
    if (!selectedTrip || !event.canComplete || savingCompletion) {
      return;
    }

    const activityId = event.id.replace(/^activity-/, "");
    const wasCompleted = completedActivityIds.includes(activityId);

    const nextCompletedIds = wasCompleted
      ? completedActivityIds.filter((id) => id !== activityId)
      : [...completedActivityIds, activityId];

    setSavingCompletion(true);

    try {
      await AsyncStorage.setItem(
        `${COMPLETED_STORAGE_PREFIX}${selectedTrip.id}`,
        JSON.stringify(nextCompletedIds),
      );

      setCompletedActivityIds(nextCompletedIds);
    } catch (error) {
      console.error("Erro ao salvar conclusão da atividade:", error);
      Alert.alert(copy.error, copy.saveError);
    } finally {
      setSavingCompletion(false);
    }
  };

  const renderProgressDots = () => {
    const activeDots = Math.round((activityProgress / 100) * 12);

    return (
      <View style={styles.progressCircle}>
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index * Math.PI) / 6;
          const left = 50 + 39 * Math.sin(angle) - 4;
          const top = 50 - 39 * Math.cos(angle) - 4;

          return (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  left,
                  top,
                  backgroundColor:
                    index < activeDots
                      ? accent
                      : isDark
                        ? "#414141"
                        : "#E4E8DD",
                },
              ]}
            />
          );
        })}

        <View style={styles.progressCenter}>
          <Text style={[styles.progressPercentage, { color: primaryText }]}>
            {activityProgress}%
          </Text>
          <Text style={[styles.progressCaption, { color: secondaryText }]}>
            {copy.progress}
          </Text>
        </View>
      </View>
    );
  };

  const renderEventCard = (event: TimelineEvent, index: number) => {
    const isLast = index === visibleEvents.length - 1;
    const isDone = event.completed;
    const eventColor = isDone ? accent : "#8FA255";

    return (
      <View key={event.id} style={styles.timelineRow}>
        <View style={styles.timelineRail}>
          <View
            style={[
              styles.timelineNode,
              {
                backgroundColor: isDone ? accent : cardBackground,
                borderColor: eventColor,
              },
            ]}
          >
            {isDone ? (
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            ) : (
              <View
                style={[
                  styles.timelineNodeInner,
                  { backgroundColor: eventColor },
                ]}
              />
            )}
          </View>

          {!isLast && (
            <View
              style={[
                styles.timelineConnector,
                { backgroundColor: borderColor },
              ]}
            />
          )}
        </View>

        <View
          style={[
            styles.eventCard,
            {
              backgroundColor: cardBackground,
              borderColor,
              opacity: isDone ? 0.78 : 1,
            },
          ]}
        >
          <View style={styles.eventTop}>
            <View
              style={[styles.eventIcon, { backgroundColor: mutedBackground }]}
            >
              <Ionicons
                name={getEventIcon(event.category)}
                size={19}
                color={accent}
              />
            </View>

            <View style={styles.eventMain}>
              <View style={styles.eventMeta}>
                <Text style={[styles.eventTime, { color: accent }]}>
                  {event.time ?? copy.noTime}
                </Text>

                {isDone && (
                  <View
                    style={[
                      styles.completedBadge,
                      { backgroundColor: mutedBackground },
                    ]}
                  >
                    <Text
                      style={[styles.completedBadgeText, { color: accent }]}
                    >
                      {copy.completedLabel}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.eventTitle,
                  {
                    color: primaryText,
                    textDecorationLine: isDone ? "line-through" : "none",
                  },
                ]}
              >
                {event.title}
              </Text>

              <Text style={[styles.eventSubtitle, { color: secondaryText }]}>
                {event.subtitle}
              </Text>
            </View>
          </View>

          {!!event.location.trim() && (
            <View style={styles.eventDetail}>
              <Ionicons
                name="location-outline"
                size={14}
                color={secondaryText}
              />
              <Text style={[styles.eventDetailText, { color: secondaryText }]}>
                {event.location}
              </Text>
            </View>
          )}

          {!!event.notes.trim() && (
            <View style={styles.eventNotes}>
              <Text style={[styles.eventNotesLabel, { color: secondaryText }]}>
                {copy.notes}
              </Text>
              <Text style={[styles.eventNotesText, { color: primaryText }]}>
                {event.notes}
              </Text>
            </View>
          )}

          {event.canComplete && (
            <Pressable
              style={({ pressed }) => [
                styles.completionButton,
                {
                  backgroundColor: isDone ? mutedBackground : accent,
                  opacity: pressed || savingCompletion ? 0.75 : 1,
                },
              ]}
              onPress={() => void toggleActivityCompletion(event)}
              disabled={savingCompletion}
              accessibilityRole="button"
              accessibilityLabel={
                isDone ? copy.markPending : copy.markCompleted
              }
            >
              <Ionicons
                name={isDone ? "refresh-outline" : "checkmark"}
                size={15}
                color={isDone ? accent : "#FFFFFF"}
              />
              <Text
                style={[
                  styles.completionButtonText,
                  { color: isDone ? accent : "#FFFFFF" },
                ]}
              >
                {isDone ? copy.markPending : copy.markCompleted}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const renderUndatedEvent = (event: UndatedEvent) => (
    <View
      key={event.id}
      style={[
        styles.undatedCard,
        { backgroundColor: cardBackground, borderColor },
      ]}
    >
      <View style={[styles.eventIcon, { backgroundColor: mutedBackground }]}>
        <Ionicons
          name={
            event.category === "sightseeing"
              ? "compass-outline"
              : event.category === "transport"
                ? "airplane-outline"
                : "bookmark-outline"
          }
          size={19}
          color={accent}
        />
      </View>

      <View style={styles.undatedInfo}>
        <Text style={[styles.undatedTitle, { color: primaryText }]}>
          {event.title}
        </Text>
        <Text style={[styles.undatedSubtitle, { color: secondaryText }]}>
          {event.subtitle}
        </Text>

        {!!event.location.trim() && (
          <View style={styles.eventDetail}>
            <Ionicons name="location-outline" size={13} color={secondaryText} />
            <Text style={[styles.eventDetailText, { color: secondaryText }]}>
              {event.location}
            </Text>
          </View>
        )}

        {!!event.notes.trim() && (
          <Text style={[styles.undatedNotes, { color: secondaryText }]}>
            {event.notes}
          </Text>
        )}
      </View>
    </View>
  );

  const filterOptions: { id: FilterType; label: string }[] = [
    { id: "all", label: copy.all },
    { id: "activities", label: copy.filterActivities },
    { id: "accommodation", label: copy.filterAccommodation },
    { id: "transport", label: copy.filterTransport },
    { id: "reservations", label: copy.filterReservations },
  ];

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: background }]}
        edges={["top"]}
      >
        <View style={[styles.topBar, { borderBottomColor: borderColor }]}>
          <View style={styles.topBarHeading}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: cardBackground,
                  borderColor,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={voltarParaSelecao}
              accessibilityRole="button"
              accessibilityLabel={copy.changeTrip}
            >
              <Ionicons name="chevron-back" size={21} color={primaryText} />
            </Pressable>

            <View>
              <Text style={[styles.topBarTitle, { color: primaryText }]}>
                Timeline
              </Text>
              <Text style={[styles.topBarSubtitle, { color: secondaryText }]}>
                {copy.headerSubtitle}
              </Text>
            </View>
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
        ) : loadFailed || !selectedTrip ? (
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
              onPress={() => void carregarDadosDaViagem()}
              accessibilityRole="button"
            >
              <Ionicons name="refresh-outline" size={19} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{copy.retry}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  borderColor,
                  backgroundColor: cardBackground,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={voltarParaSelecao}
              accessibilityRole="button"
            >
              <Text
                style={[styles.secondaryButtonText, { color: primaryText }]}
              >
                {copy.changeTrip}
              </Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionEyebrow, { color: secondaryText }]}>
              {copy.selectedTrip.toUpperCase()}
            </Text>

            <View style={styles.tripHeading}>
              <View style={styles.tripHeadingInfo}>
                <Text style={[styles.sectionTitle, { color: primaryText }]}>
                  {selectedTrip.nome}
                </Text>
                <View style={styles.destinationRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={secondaryText}
                  />
                  <Text
                    style={[styles.destinationText, { color: secondaryText }]}
                  >
                    {selectedTrip.destino}
                  </Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.changeTripSmall,
                  {
                    backgroundColor: cardBackground,
                    borderColor,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={voltarParaSelecao}
                accessibilityRole="button"
                accessibilityLabel={copy.changeTrip}
              >
                <Ionicons name="swap-horizontal" size={18} color={accent} />
              </Pressable>
            </View>

            <View
              style={[
                styles.dashboardCard,
                { backgroundColor: cardBackground, borderColor },
              ]}
            >
              <Text style={[styles.dashboardEyebrow, { color: secondaryText }]}>
                {copy.dashboard}
              </Text>

              <View style={styles.dashboardMain}>
                {renderProgressDots()}

                <View style={styles.dashboardInfo}>
                  <Text
                    style={[styles.dashboardLabel, { color: secondaryText }]}
                  >
                    {copy.elapsed}
                  </Text>

                  <Text style={[styles.dashboardValue, { color: primaryText }]}>
                    {elapsedDays} / {totalTripDays}
                  </Text>

                  <Text
                    style={[styles.dashboardCaption, { color: secondaryText }]}
                  >
                    {copy.days}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getStatusColor(selectedTrip)}20`,
                        alignSelf: "flex-start",
                        marginTop: 9,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(selectedTrip) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(selectedTrip) },
                      ]}
                    >
                      {getStatusLabel(selectedTrip)}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.dashboardDivider,
                  { backgroundColor: borderColor },
                ]}
              />

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: primaryText }]}>
                    {totalTripDays}
                  </Text>
                  <Text style={[styles.statLabel, { color: secondaryText }]}>
                    {copy.days}
                  </Text>
                </View>

                <View
                  style={[styles.statDivider, { backgroundColor: borderColor }]}
                />

                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: primaryText }]}>
                    {totalActivities}
                  </Text>
                  <Text style={[styles.statLabel, { color: secondaryText }]}>
                    {copy.activities}
                  </Text>
                </View>

                <View
                  style={[styles.statDivider, { backgroundColor: borderColor }]}
                />

                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: accent }]}>
                    {completedActivities}
                  </Text>
                  <Text style={[styles.statLabel, { color: secondaryText }]}>
                    {copy.completedActivities}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.mapCard,
                { backgroundColor: cardBackground, borderColor },
              ]}
            >
              <Pressable
                style={styles.mapHeader}
                onPress={() => setMapExpanded((current) => !current)}
                accessibilityRole="button"
                accessibilityState={{ expanded: mapExpanded }}
              >
                <View
                  style={[styles.mapIcon, { backgroundColor: mutedBackground }]}
                >
                  <Ionicons name="map-outline" size={21} color={accent} />
                </View>

                <View style={styles.mapInfo}>
                  <Text style={[styles.mapTitle, { color: primaryText }]}>
                    {copy.mapTitle}
                  </Text>
                  <Text style={[styles.mapSubtitle, { color: secondaryText }]}>
                    {copy.mapFuture}
                  </Text>
                </View>

                <Ionicons
                  name={mapExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={secondaryText}
                />
              </Pressable>

              {mapExpanded && (
                <View
                  style={[
                    styles.mapExpandedContent,
                    { borderTopColor: borderColor },
                  ]}
                >
                  <Ionicons name="location-outline" size={25} color={accent} />
                  <Text
                    style={[
                      styles.mapExpandedDescription,
                      { color: secondaryText },
                    ]}
                  >
                    {copy.mapDescription}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.timelineSectionHeader}>
              <View style={styles.timelineSectionTitleContainer}>
                <Text style={[styles.sectionTitle, { color: primaryText }]}>
                  {copy.tripOverview}
                </Text>
                {tripStartDate && (
                  <Text
                    style={[
                      styles.sectionDescription,
                      { color: secondaryText },
                    ]}
                  >
                    {formatFullDate(tripStartDate, locale)}
                    {tripEndDate
                      ? ` – ${formatFullDate(tripEndDate, locale)}`
                      : ""}
                  </Text>
                )}
              </View>
            </View>

            {tripDays.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.daySelector}
              >
                {tripDays.map((date, index) => {
                  const key = dateKey(date);
                  const isActive = key === effectiveSelectedDateKey;
                  const isToday = key === dateKey(today);

                  return (
                    <Pressable
                      key={key}
                      style={({ pressed }) => [
                        styles.dayButton,
                        {
                          backgroundColor: isActive ? accent : cardBackground,
                          borderColor: isActive ? accent : borderColor,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                      onPress={() => setSelectedDateKey(key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          { color: isActive ? "#FFFFFF" : primaryText },
                        ]}
                      >
                        {index + 1}
                      </Text>
                      <Text
                        style={[
                          styles.dayLabel,
                          {
                            color: isActive ? "#FFFFFF" : secondaryText,
                          },
                        ]}
                      >
                        {formatDay(date, locale)}
                      </Text>
                      {isToday && (
                        <View
                          style={[
                            styles.todayIndicator,
                            {
                              backgroundColor: isActive ? "#FFFFFF" : accent,
                            },
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            >
              {filterOptions.map((filter) => {
                const active = activeFilter === filter.id;

                return (
                  <Pressable
                    key={filter.id}
                    style={({ pressed }) => [
                      styles.filterButton,
                      {
                        backgroundColor: active ? accent : cardBackground,
                        borderColor: active ? accent : borderColor,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                    onPress={() => setActiveFilter(filter.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        { color: active ? "#FFFFFF" : secondaryText },
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedDate && (
              <View style={styles.selectedDayHeading}>
                <Text style={[styles.selectedDayTitle, { color: primaryText }]}>
                  {formatFullDate(selectedDate, locale)}
                </Text>
                <Text
                  style={[styles.selectedDayCount, { color: secondaryText }]}
                >
                  {visibleEvents.length}{" "}
                  {visibleEvents.length === 1
                    ? copy.activities.toLowerCase().slice(0, -1)
                    : copy.activities.toLowerCase()}
                </Text>
              </View>
            )}

            {visibleEvents.length > 0 ? (
              <View style={styles.eventsList}>
                {visibleEvents.map(renderEventCard)}
              </View>
            ) : (
              <View
                style={[
                  styles.noEventsCard,
                  { backgroundColor: cardBackground, borderColor },
                ]}
              >
                <View
                  style={[
                    styles.noEventsIcon,
                    { backgroundColor: mutedBackground },
                  ]}
                >
                  <Ionicons
                    name="calendar-clear-outline"
                    size={25}
                    color={accent}
                  />
                </View>
                <Text style={[styles.noEventsTitle, { color: primaryText }]}>
                  {copy.noEvents}
                </Text>
                <Text
                  style={[styles.noEventsDescription, { color: secondaryText }]}
                >
                  {copy.noEventsDescription}
                </Text>
              </View>
            )}

            {undatedEvents.length > 0 && (
              <View style={styles.undatedSection}>
                <View style={styles.undatedHeading}>
                  <Text
                    style={[styles.sectionEyebrow, { color: secondaryText }]}
                  >
                    {copy.unscheduled}
                  </Text>
                  <View
                    style={[
                      styles.undatedCount,
                      { backgroundColor: mutedBackground },
                    ]}
                  >
                    <Text style={[styles.undatedCountText, { color: accent }]}>
                      {undatedEvents.length}
                    </Text>
                  </View>
                </View>

                {undatedEvents.map(renderUndatedEvent)}
              </View>
            )}
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
  topBarHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    alignSelf: "stretch",
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
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
  tripHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 17,
  },
  tripHeadingInfo: {
    flex: 1,
  },
  changeTripSmall: {
    width: 43,
    height: 43,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
  dashboardCard: {
    borderRadius: 19,
    borderWidth: 1,
    padding: 18,
  },
  dashboardEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  dashboardMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 19,
    marginTop: 17,
  },
  progressCircle: {
    width: 100,
    height: 100,
    position: "relative",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
  },
  progressCenter: {
    position: "absolute",
    top: 22,
    left: 15,
    right: 15,
    bottom: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercentage: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  progressCaption: {
    fontSize: 9,
    marginTop: 1,
  },
  dashboardInfo: {
    flex: 1,
  },
  dashboardLabel: {
    fontSize: 11,
  },
  dashboardValue: {
    fontSize: 23,
    fontWeight: "800",
    marginTop: 4,
  },
  dashboardCaption: {
    fontSize: 11,
    marginTop: 1,
  },
  dashboardDivider: {
    height: 1,
    marginVertical: 17,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
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
  mapCard: {
    borderRadius: 17,
    borderWidth: 1,
    marginTop: 15,
    overflow: "hidden",
  },
  mapHeader: {
    minHeight: 76,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mapIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  mapInfo: {
    flex: 1,
  },
  mapTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  mapSubtitle: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  mapExpandedContent: {
    borderTopWidth: 1,
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  mapExpandedDescription: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
  },
  timelineSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 27,
    marginBottom: 15,
  },
  timelineSectionTitleContainer: {
    flex: 1,
  },
  daySelector: {
    gap: 9,
    paddingBottom: 5,
  },
  dayButton: {
    minWidth: 75,
    minHeight: 77,
    borderWidth: 1,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: "800",
  },
  dayLabel: {
    fontSize: 9,
    marginTop: 4,
    textTransform: "capitalize",
  },
  todayIndicator: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 5,
  },
  filterList: {
    gap: 8,
    paddingTop: 15,
    paddingBottom: 4,
  },
  filterButton: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    fontSize: 10,
    fontWeight: "700",
  },
  selectedDayHeading: {
    marginTop: 21,
    marginBottom: 16,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  selectedDayCount: {
    fontSize: 10,
    marginTop: 4,
  },
  eventsList: {
    paddingBottom: 5,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  timelineRail: {
    width: 26,
    alignItems: "center",
  },
  timelineNode: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 17,
    zIndex: 1,
  },
  timelineNodeInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 15,
  },
  eventCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  eventTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  eventIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  eventMain: {
    flex: 1,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 5,
  },
  eventTime: {
    fontSize: 10,
    fontWeight: "800",
  },
  completedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 8,
    fontWeight: "800",
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  eventSubtitle: {
    fontSize: 10,
    marginTop: 3,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 11,
  },
  eventDetailText: {
    fontSize: 10,
    flex: 1,
    lineHeight: 15,
  },
  eventNotes: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#8A8A8A35",
    marginTop: 11,
    paddingTop: 9,
  },
  eventNotesLabel: {
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 4,
  },
  eventNotesText: {
    fontSize: 10,
    lineHeight: 16,
  },
  completionButton: {
    minHeight: 35,
    borderRadius: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  completionButtonText: {
    fontSize: 10,
    fontWeight: "800",
  },
  noEventsCard: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    marginBottom: 15,
  },
  noEventsIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  noEventsTitle: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  noEventsDescription: {
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 6,
  },
  undatedSection: {
    marginTop: 22,
  },
  undatedHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  undatedCount: {
    minWidth: 27,
    height: 27,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  undatedCountText: {
    fontSize: 11,
    fontWeight: "800",
  },
  undatedCard: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 9,
  },
  undatedInfo: {
    flex: 1,
  },
  undatedTitle: {
    fontSize: 12,
    fontWeight: "800",
  },
  undatedSubtitle: {
    fontSize: 10,
    marginTop: 3,
  },
  undatedNotes: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
  },
});
