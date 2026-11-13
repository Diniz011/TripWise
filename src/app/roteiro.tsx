import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../contexts/LanguageContext";

const TRIPS_STORAGE_KEY = "@viagens";

type Activity = {
  id: string;
  time: string;
  title: string;
  place: string;
  notes: string;
};

type ItineraryDay = {
  date: string;
  activities: Activity[];
};

type Trip = {
  id: string;
  nome: string;
  destino: string;
  data: string;
  hotelData?: string;
  roteiroDataFinal?: string;
  roteiro?: ItineraryDay[];
  [key: string]: unknown;
};

type Language = "pt-BR" | "en" | "es";

const TRANSLATIONS = {
  "pt-BR": {
    title: "Roteiro inteligente",
    subtitle: "Organize cada momento da sua viagem",
    loading: "Preparando seu roteiro...",
    error: "Erro",
    loadError: "Não foi possível carregar o roteiro.",
    saveError: "Não foi possível salvar suas alterações.",
    tripNotFound: "Não foi possível encontrar esta viagem.",
    back: "Voltar",
    destination: "Destino",
    days: "dias de viagem",
    day: "Dia",
    today: "Hoje",
    noActivities: "Nenhuma atividade neste dia",
    noActivitiesDescription:
      "Adicione lugares e experiências para organizar seu dia.",
    addActivity: "Adicionar atividade",
    editActivity: "Editar atividade",
    activityName: "Nome da atividade",
    activityPlaceholder: "Ex.: Visitar o Cristo Redentor",
    time: "Horário",
    place: "Local",
    placePlaceholder: "Endereço ou nome do local",
    notes: "Observações",
    notesPlaceholder: "Detalhes, reservas ou informações importantes",
    save: "Salvar atividade",
    saveEndDate: "Salvar data final",
    cancel: "Cancelar",
    done: "Concluir",
    delete: "Excluir",
    deleteTitle: "Excluir atividade?",
    deleteMessage: "Esta atividade será removida do roteiro.",
    deleteCancel: "Manter",
    confirmDelete: "Excluir",
    required: "Informe o nome da atividade.",
    invalidTime: "Informe um horário válido no formato HH:MM.",
    endDate: "Data final do roteiro",
    selectEndDate: "Definir data final",
    changeEndDate: "Alterar data final",
    endDateInfo:
      "Defina até quando você ficará no destino para gerar os dias do roteiro automaticamente.",
    automaticPeriod: "Período da hospedagem",
    tripPeriod: "Período da viagem",
    activities: "atividades",
    activity: "atividade",
    saved: "Salvo automaticamente",
    previous: "Anterior",
    next: "Próximo",
    dateError: "A data final não pode ser anterior à data inicial.",
    maxDays: "O roteiro pode ter no máximo 60 dias.",
    moveUp: "Mover atividade para cima",
    moveDown: "Mover atividade para baixo",
    emptyTitle: "Vamos planejar sua viagem?",
    emptyDescription:
      "Adicione atividades, horários e lugares para montar seu roteiro.",
  },
  en: {
    title: "Smart itinerary",
    subtitle: "Organize every moment of your trip",
    loading: "Preparing your itinerary...",
    error: "Error",
    loadError: "Unable to load the itinerary.",
    saveError: "Unable to save your changes.",
    tripNotFound: "Unable to find this trip.",
    back: "Back",
    destination: "Destination",
    days: "travel days",
    day: "Day",
    today: "Today",
    noActivities: "No activities for this day",
    noActivitiesDescription: "Add places and experiences to organize your day.",
    addActivity: "Add activity",
    editActivity: "Edit activity",
    activityName: "Activity name",
    activityPlaceholder: "E.g. Visit the Eiffel Tower",
    time: "Time",
    place: "Location",
    placePlaceholder: "Address or place name",
    notes: "Notes",
    notesPlaceholder: "Details, bookings or important information",
    save: "Save activity",
    saveEndDate: "Save end date",
    cancel: "Cancel",
    done: "Done",
    delete: "Delete",
    deleteTitle: "Delete activity?",
    deleteMessage: "This activity will be removed from your itinerary.",
    deleteCancel: "Keep",
    confirmDelete: "Delete",
    required: "Enter an activity name.",
    invalidTime: "Enter a valid time in HH:MM format.",
    endDate: "Itinerary end date",
    selectEndDate: "Set end date",
    changeEndDate: "Change end date",
    endDateInfo:
      "Choose how long you will stay at your destination to automatically generate your itinerary days.",
    automaticPeriod: "Accommodation period",
    tripPeriod: "Trip period",
    activities: "activities",
    activity: "activity",
    saved: "Automatically saved",
    previous: "Previous",
    next: "Next",
    dateError: "The end date cannot be earlier than the start date.",
    maxDays: "The itinerary can have a maximum of 60 days.",
    moveUp: "Move activity up",
    moveDown: "Move activity down",
    emptyTitle: "Let's plan your trip?",
    emptyDescription:
      "Add activities, times and places to build your itinerary.",
  },
  es: {
    title: "Itinerario inteligente",
    subtitle: "Organiza cada momento de tu viaje",
    loading: "Preparando tu itinerario...",
    error: "Error",
    loadError: "No fue posible cargar el itinerario.",
    saveError: "No fue posible guardar los cambios.",
    tripNotFound: "No fue posible encontrar este viaje.",
    back: "Volver",
    destination: "Destino",
    days: "días de viaje",
    day: "Día",
    today: "Hoy",
    noActivities: "No hay actividades para este día",
    noActivitiesDescription:
      "Añade lugares y experiencias para organizar tu día.",
    addActivity: "Añadir actividad",
    editActivity: "Editar actividad",
    activityName: "Nombre de la actividad",
    activityPlaceholder: "Ej.: Visitar la Sagrada Familia",
    time: "Hora",
    place: "Lugar",
    placePlaceholder: "Dirección o nombre del lugar",
    notes: "Observaciones",
    notesPlaceholder: "Detalles, reservas o información importante",
    save: "Guardar actividad",
    saveEndDate: "Guardar fecha final",
    cancel: "Cancelar",
    done: "Listo",
    delete: "Eliminar",
    deleteTitle: "¿Eliminar actividad?",
    deleteMessage: "Esta actividad se eliminará del itinerario.",
    deleteCancel: "Mantener",
    confirmDelete: "Eliminar",
    required: "Introduce el nombre de la actividad.",
    invalidTime: "Introduce una hora válida en formato HH:MM.",
    endDate: "Fecha final del itinerario",
    selectEndDate: "Definir fecha final",
    changeEndDate: "Cambiar fecha final",
    endDateInfo:
      "Elige hasta cuándo estarás en el destino para generar automáticamente los días del itinerario.",
    automaticPeriod: "Período del alojamiento",
    tripPeriod: "Período del viaje",
    activities: "actividades",
    activity: "actividad",
    saved: "Guardado automáticamente",
    previous: "Anterior",
    next: "Próximo",
    dateError: "La fecha final no puede ser anterior a la fecha inicial.",
    maxDays: "El itinerario puede tener un máximo de 60 días.",
    moveUp: "Mover actividad hacia arriba",
    moveDown: "Mover actividad hacia abajo",
    emptyTitle: "¿Vamos a planificar tu viaje?",
    emptyDescription:
      "Añade actividades, horarios y lugares para crear tu itinerario.",
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDate(value: string, referenceYear?: number): Date | null {
  const match = value.match(/^\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\s*$/);

  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3] || referenceYear || new Date().getFullYear());

  const result = new Date(year, month - 1, day, 12, 0, 0);

  if (
    result.getDate() !== day ||
    result.getMonth() !== month - 1 ||
    result.getFullYear() !== year
  ) {
    return null;
  }

  return result;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function normalizeTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidTime(value: string): boolean {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return Boolean(match);
}

function getTimeAsDate(value: string): Date {
  const match = value.match(/^(\d{2}):(\d{2})$/);

  const hours = match ? Number(match[1]) : 9;
  const minutes = match ? Number(match[2]) : 0;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date;
}

function formatTimeFromDate(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getDateRange(trip: Trip): {
  start: Date;
  end: Date;
  fromAccommodation: boolean;
} | null {
  const tripStart = parseDate(trip.data);

  if (!tripStart) return null;

  const accommodationParts =
    typeof trip.hotelData === "string" ? trip.hotelData.split(/\s+a\s+/i) : [];

  if (accommodationParts.length === 2) {
    const checkin = parseDate(accommodationParts[0], tripStart.getFullYear());
    const checkout = parseDate(accommodationParts[1], tripStart.getFullYear());

    if (checkin && checkout && checkout >= checkin) {
      return {
        start: checkin,
        end: checkout,
        fromAccommodation: true,
      };
    }
  }

  const customEnd =
    typeof trip.roteiroDataFinal === "string"
      ? parseDate(trip.roteiroDataFinal, tripStart.getFullYear())
      : null;

  return {
    start: tripStart,
    end: customEnd && customEnd >= tripStart ? customEnd : tripStart,
    fromAccommodation: false,
  };
}

function createDays(
  start: Date,
  end: Date,
  previousDays: ItineraryDay[] = [],
): ItineraryDay[] {
  const previousMap = new Map(
    previousDays.map((day) => [day.date, day.activities]),
  );

  const result: ItineraryDay[] = [];
  const current = new Date(start);

  while (current <= end && result.length < 60) {
    const date = formatDate(current);

    result.push({
      date,
      activities: previousMap.get(date) || [],
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}

function validateActivity(value: unknown): value is Activity {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.time === "string" &&
    typeof value.title === "string" &&
    typeof value.place === "string" &&
    typeof value.notes === "string"
  );
}

function validateDays(value: unknown): ItineraryDay[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is ItineraryDay => {
    return (
      isRecord(item) &&
      typeof item.date === "string" &&
      Array.isArray(item.activities) &&
      item.activities.every(validateActivity)
    );
  });
}

function formatDisplayDate(value: string, locale: string): string {
  const date = parseDate(value);

  if (!date) return value;

  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export default function Roteiro() {
  const params = useLocalSearchParams<{ id: string }>();
  const tripId = typeof params.id === "string" ? params.id : "";
  const router = useRouter();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { language, locale } = useLanguage();
  const copy = TRANSLATIONS[language as Language] || TRANSLATIONS["pt-BR"];

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingEndDate, setPendingEndDate] = useState<Date>(new Date());
  const [dateSelectionPending, setDateSelectionPending] = useState(false);
  const [endDate, setEndDate] = useState<Date>(new Date());

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityTime, setActivityTime] = useState("09:00");
  const [activityPlace, setActivityPlace] = useState("");
  const [activityNotes, setActivityNotes] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [saving, setSaving] = useState(false);

  const background = isDark ? "#121212" : "#F4F6FA";
  const card = isDark ? "#1E1E1E" : "#FFFFFF";
  const primaryText = isDark ? "#FFFFFF" : "#172033";
  const secondaryText = isDark ? "#A0A0A0" : "#7B8495";
  const border = isDark ? "#333333" : "#E9ECF2";
  const inputBackground = isDark ? "#292929" : "#F5F7FA";
  const accent = "#8FA255";

  const styles = useMemo(
    () =>
      createStyles({
        background,
        card,
        primaryText,
        secondaryText,
        border,
        inputBackground,
        accent,
      }),
    [background, card, primaryText, secondaryText, border, inputBackground],
  );

  const dateRange = useMemo(() => (trip ? getDateRange(trip) : null), [trip]);

  const selectedDayData = days[selectedDay];

  const loadTrip = useCallback(async () => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);

      if (!stored) {
        throw new Error("Lista de viagens não encontrada.");
      }

      const parsed: unknown = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        throw new Error("Formato de viagens inválido.");
      }

      const found = parsed.find(
        (item): item is Trip =>
          isRecord(item) &&
          typeof item.id === "string" &&
          item.id === tripId &&
          typeof item.data === "string",
      );

      if (!found) {
        setTrip(null);
        return;
      }

      const range = getDateRange(found);

      if (!range) {
        throw new Error("Data inicial da viagem inválida.");
      }

      const savedDays = validateDays(found.roteiro);
      const generatedDays = createDays(range.start, range.end, savedDays);

      setTrip(found);
      setDays(generatedDays);
      setEndDate(range.end);
      setPendingEndDate(range.end);

      const selectedIndex = generatedDays.findIndex(
        (day) => day.date === formatDate(new Date()),
      );

      setSelectedDay(selectedIndex >= 0 ? selectedIndex : 0);
    } catch (error) {
      console.error("Erro ao carregar roteiro:", error);
      Alert.alert(copy.error, copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [tripId, copy.error, copy.loadError]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadTrip();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadTrip]);

  const persistChanges = async (
    updatedDays: ItineraryDay[],
    updatedEndDate: Date,
  ) => {
    if (!tripId) return;

    setSaving(true);

    try {
      const stored = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);

      if (!stored) {
        throw new Error("Viagens não encontradas.");
      }

      const parsed: unknown = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        throw new Error("Formato de viagens inválido.");
      }

      let found = false;

      const updatedTrips = parsed.map((item) => {
        if (!isRecord(item) || item.id !== tripId) {
          return item;
        }

        found = true;

        const updatedTrip = {
          ...item,
          roteiro: updatedDays,
        } as Record<string, unknown>;

        const accommodationPeriod =
          typeof item.hotelData === "string"
            ? item.hotelData.split(/\s+a\s+/i)
            : [];

        if (accommodationPeriod.length !== 2) {
          updatedTrip.roteiroDataFinal = formatDate(updatedEndDate);
        }

        return updatedTrip;
      });

      if (!found) {
        throw new Error("Viagem não encontrada.");
      }

      await AsyncStorage.setItem(
        TRIPS_STORAGE_KEY,
        JSON.stringify(updatedTrips),
      );

      setDays(updatedDays);
    } catch (error) {
      console.error("Erro ao salvar roteiro:", error);
      Alert.alert(copy.error, copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  const openNewActivity = () => {
    setEditingActivity(null);
    setActivityTitle("");
    setActivityTime("09:00");
    setActivityPlace("");
    setActivityNotes("");
    setShowTimePicker(false);
    setIsEditorVisible(true);
  };

  const openEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setActivityTitle(activity.title);
    setActivityTime(activity.time);
    setActivityPlace(activity.place);
    setActivityNotes(activity.notes);
    setShowTimePicker(false);
    setIsEditorVisible(true);
  };

  const closeEditor = () => {
    setIsEditorVisible(false);
    setEditingActivity(null);
    setActivityTitle("");
    setActivityTime("09:00");
    setActivityPlace("");
    setActivityNotes("");
    setShowTimePicker(false);
  };

  const saveActivity = async () => {
    if (!activityTitle.trim() || !selectedDayData) {
      Alert.alert(copy.error, copy.required);
      return;
    }

    if (!isValidTime(activityTime)) {
      Alert.alert(copy.error, copy.invalidTime);
      return;
    }

    const activity: Activity = {
      id: editingActivity?.id || `${Date.now()}-${Math.random()}`,
      time: activityTime,
      title: activityTitle.trim(),
      place: activityPlace.trim(),
      notes: activityNotes.trim(),
    };

    const updatedActivities = editingActivity
      ? selectedDayData.activities.map((item) =>
          item.id === editingActivity.id ? activity : item,
        )
      : [...selectedDayData.activities, activity];

    updatedActivities.sort((a, b) => a.time.localeCompare(b.time));

    const updatedDays = days.map((day, index) =>
      index === selectedDay ? { ...day, activities: updatedActivities } : day,
    );

    setDays(updatedDays);
    closeEditor();

    await persistChanges(updatedDays, endDate);
  };

  const deleteActivity = (activityId: string) => {
    Alert.alert(copy.deleteTitle, copy.deleteMessage, [
      {
        text: copy.deleteCancel,
        style: "cancel",
      },
      {
        text: copy.confirmDelete,
        style: "destructive",
        onPress: () => {
          const updatedDays = days.map((day, index) =>
            index === selectedDay
              ? {
                  ...day,
                  activities: day.activities.filter(
                    (item) => item.id !== activityId,
                  ),
                }
              : day,
          );

          setDays(updatedDays);
          void persistChanges(updatedDays, endDate);
        },
      },
    ]);
  };

  const moveActivity = (activityIndex: number, direction: -1 | 1) => {
    if (!selectedDayData) return;

    const activities = [...selectedDayData.activities];
    const targetIndex = activityIndex + direction;

    if (targetIndex < 0 || targetIndex >= activities.length) {
      return;
    }

    [activities[activityIndex], activities[targetIndex]] = [
      activities[targetIndex],
      activities[activityIndex],
    ];

    const updatedDays = days.map((day, index) =>
      index === selectedDay ? { ...day, activities } : day,
    );

    setDays(updatedDays);
    void persistChanges(updatedDays, endDate);
  };

  const openEndDatePicker = () => {
    setPendingEndDate(endDate);
    setDateSelectionPending(false);
    setShowDatePicker(true);
  };

  const handleEndDateChange = async (newDate?: Date) => {
    if (!newDate || !dateRange) return;

    const start = dateRange.start;
    const selected = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      12,
    );

    if (selected < start) {
      Alert.alert(copy.error, copy.dateError);
      return;
    }

    const difference =
      Math.floor(
        (selected.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    if (difference > 60) {
      Alert.alert(copy.error, copy.maxDays);
      return;
    }

    const updatedDays = createDays(start, selected, days);

    setEndDate(selected);
    setPendingEndDate(selected);
    setDays(updatedDays);
    setSelectedDay((current) => Math.min(current, updatedDays.length - 1));
    setShowDatePicker(false);
    setDateSelectionPending(false);

    await persistChanges(updatedDays, selected);
  };

  const cancelEndDateSelection = () => {
    setPendingEndDate(endDate);
    setShowDatePicker(false);
    setDateSelectionPending(false);
  };

  const formatDayNumber = (index: number) => `${copy.day} ${index + 1}`;

  const totalActivities = days.reduce(
    (total, day) => total + day.activities.length,
    0,
  );

  const accommodationPeriod =
    typeof trip?.hotelData === "string" ? trip.hotelData.split(/\s+a\s+/i) : [];

  const usesAccommodationPeriod =
    accommodationPeriod.length === 2 &&
    Boolean(parseDate(accommodationPeriod[0])) &&
    Boolean(parseDate(accommodationPeriod[1]));

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { justifyContent: "center" }]}
        edges={["top"]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={accent} />
        <Text style={styles.loadingText}>{copy.loading}</Text>
      </SafeAreaView>
    );
  }

  if (!trip || !dateRange) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Ionicons name="map-outline" size={46} color={accent} />
          <Text style={styles.emptyTitle}>{copy.tripNotFound}</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>{copy.back}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={copy.back}
            >
              <Ionicons name="chevron-back" size={23} color={primaryText} />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{copy.title}</Text>
              <Text style={styles.headerSubtitle}>{copy.subtitle}</Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons name="map-outline" size={23} color={accent} />
            </View>
          </View>

          <View style={styles.tripCard}>
            <View style={styles.tripCardIcon}>
              <Ionicons name="airplane" size={23} color="#FFFFFF" />
            </View>

            <View style={styles.tripInfo}>
              <Text style={styles.tripName}>{trip.nome}</Text>
              <Text style={styles.tripDestination}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={secondaryText}
                />{" "}
                {trip.destino}
              </Text>
            </View>

            <View style={styles.tripDaysBadge}>
              <Text style={styles.tripDaysNumber}>{days.length}</Text>
              <Text style={styles.tripDaysLabel}>{copy.days}</Text>
            </View>
          </View>

          {!usesAccommodationPeriod && (
            <View style={styles.periodCard}>
              <View style={styles.periodIcon}>
                <Ionicons name="calendar-outline" size={21} color={accent} />
              </View>

              <View style={styles.periodInfo}>
                <Text style={styles.periodTitle}>{copy.endDate}</Text>
                <Text style={styles.periodDescription}>{copy.endDateInfo}</Text>
                <Text style={styles.periodDate}>
                  {formatDisplayDate(formatDate(endDate), locale)}
                </Text>
              </View>

              <Pressable
                style={styles.periodButton}
                onPress={openEndDatePicker}
                accessibilityRole="button"
                accessibilityLabel={copy.changeEndDate}
              >
                <Ionicons name="create-outline" size={19} color={accent} />
              </Pressable>
            </View>
          )}

          {usesAccommodationPeriod && (
            <View style={styles.automaticPeriod}>
              <Ionicons name="checkmark-circle" size={18} color={accent} />
              <Text style={styles.automaticPeriodText}>
                {copy.automaticPeriod}
              </Text>
            </View>
          )}

          {(showDatePicker || dateSelectionPending) && (
            <View style={styles.datePickerCard}>
              <Text style={styles.datePickerTitle}>{copy.endDate}</Text>

              {showDatePicker && (
                <DateTimePicker
                  value={pendingEndDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={dateRange.start}
                  onChange={(event, selectedDateValue) => {
                    if (Platform.OS === "android") {
                      if (event.type === "set" && selectedDateValue) {
                        setPendingEndDate(selectedDateValue);
                        setDateSelectionPending(true);
                      }

                      setShowDatePicker(false);
                      return;
                    }

                    if (selectedDateValue) {
                      setPendingEndDate(selectedDateValue);
                      setDateSelectionPending(true);
                    }
                  }}
                  locale={locale}
                />
              )}

              <Text style={styles.datePickerPreview}>
                {formatDisplayDate(formatDate(pendingEndDate), locale)}
              </Text>

              <View style={styles.datePickerActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={cancelEndDateSelection}
                >
                  <Text style={styles.cancelButtonText}>{copy.cancel}</Text>
                </Pressable>

                <Pressable
                  style={styles.primaryButton}
                  onPress={() => void handleEndDateChange(pendingEndDate)}
                  disabled={saving}
                >
                  <Text style={styles.primaryButtonText}>
                    {copy.saveEndDate}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>{copy.title}</Text>
              <Text style={styles.sectionSubtitle}>
                {totalActivities}{" "}
                {totalActivities === 1 ? copy.activity : copy.activities}
              </Text>
            </View>

            {saving && <ActivityIndicator size="small" color={accent} />}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysList}
          >
            {days.map((day, index) => {
              const selected = selectedDay === index;

              return (
                <Pressable
                  key={day.date}
                  style={[styles.dayTab, selected && styles.dayTabSelected]}
                  onPress={() => {
                    setSelectedDay(index);
                    closeEditor();
                  }}
                >
                  <Text
                    style={[
                      styles.dayTabNumber,
                      selected && styles.dayTabNumberSelected,
                    ]}
                  >
                    {formatDayNumber(index)}
                  </Text>

                  <Text
                    style={[
                      styles.dayTabDate,
                      selected && styles.dayTabDateSelected,
                    ]}
                  >
                    {formatDisplayDate(day.date, locale)}
                  </Text>

                  {day.activities.length > 0 && (
                    <View
                      style={[
                        styles.dayIndicator,
                        selected && styles.dayIndicatorSelected,
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedDayData && (
            <View style={styles.selectedDayHeader}>
              <View>
                <Text style={styles.selectedDayTitle}>
                  {formatDayNumber(selectedDay)}
                </Text>
                <Text style={styles.selectedDayDate}>
                  {formatDisplayDate(selectedDayData.date, locale)}
                </Text>
              </View>

              <View style={styles.dayActivityCount}>
                <Ionicons name="time-outline" size={16} color={accent} />
                <Text style={styles.dayActivityCountText}>
                  {selectedDayData.activities.length}
                </Text>
              </View>
            </View>
          )}

          {selectedDayData?.activities.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={32}
                  color={accent}
                />
              </View>
              <Text style={styles.emptyTitle}>{copy.noActivities}</Text>
              <Text style={styles.emptyDescription}>
                {copy.noActivitiesDescription}
              </Text>
            </View>
          )}

          {selectedDayData?.activities.map((activity, index) => (
            <View key={activity.id} style={styles.activityRow}>
              <View style={styles.timeline}>
                <View style={styles.timelineDot} />
                {index < selectedDayData.activities.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>

              <View style={styles.activityCard}>
                <View style={styles.activityTop}>
                  <View style={styles.activityTime}>
                    <Ionicons name="time-outline" size={15} color={accent} />
                    <Text style={styles.activityTimeText}>{activity.time}</Text>
                  </View>

                  <View style={styles.activityActions}>
                    <Pressable
                      onPress={() => moveActivity(index, -1)}
                      disabled={index === 0}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={copy.moveUp}
                    >
                      <Ionicons
                        name="arrow-up"
                        size={18}
                        color={index === 0 ? border : secondaryText}
                      />
                    </Pressable>

                    <Pressable
                      onPress={() => moveActivity(index, 1)}
                      disabled={index === selectedDayData.activities.length - 1}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={copy.moveDown}
                    >
                      <Ionicons
                        name="arrow-down"
                        size={18}
                        color={
                          index === selectedDayData.activities.length - 1
                            ? border
                            : secondaryText
                        }
                      />
                    </Pressable>

                    <Pressable
                      onPress={() => openEditActivity(activity)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={copy.editActivity}
                    >
                      <Ionicons
                        name="create-outline"
                        size={19}
                        color={secondaryText}
                      />
                    </Pressable>

                    <Pressable
                      onPress={() => deleteActivity(activity.id)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={copy.delete}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#D96B6B"
                      />
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.activityTitle}>{activity.title}</Text>

                {activity.place.length > 0 && (
                  <View style={styles.activityDetail}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={secondaryText}
                    />
                    <Text style={styles.activityDetailText}>
                      {activity.place}
                    </Text>
                  </View>
                )}

                {activity.notes.length > 0 && (
                  <View style={styles.activityNotes}>
                    <Text style={styles.activityNotesText}>
                      {activity.notes}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {isEditorVisible ? (
            <View style={styles.editorCard}>
              <Text style={styles.editorTitle}>
                {editingActivity ? copy.editActivity : copy.addActivity}
              </Text>

              <Text style={styles.inputLabel}>{copy.activityName}</Text>
              <TextInput
                style={styles.input}
                value={activityTitle}
                onChangeText={setActivityTitle}
                placeholder={copy.activityPlaceholder}
                placeholderTextColor={secondaryText}
                maxLength={100}
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>{copy.time}</Text>

              <View style={styles.timeInputRow}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={activityTime}
                  onChangeText={(value) =>
                    setActivityTime(normalizeTimeInput(value))
                  }
                  placeholder="09:00"
                  placeholderTextColor={secondaryText}
                  keyboardType="number-pad"
                  maxLength={5}
                  returnKeyType="done"
                />

                <Pressable
                  style={styles.timePickerButton}
                  onPress={() => setShowTimePicker((current) => !current)}
                  accessibilityRole="button"
                  accessibilityLabel={copy.time}
                >
                  <Ionicons name="time-outline" size={22} color={accent} />
                </Pressable>
              </View>

              {showTimePicker && (
                <View style={styles.timePickerCard}>
                  <DateTimePicker
                    value={getTimeAsDate(activityTime)}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    is24Hour
                    onChange={(event, selectedTime) => {
                      if (Platform.OS === "android") {
                        setShowTimePicker(false);
                      }

                      if (
                        (Platform.OS === "ios" || event.type === "set") &&
                        selectedTime
                      ) {
                        setActivityTime(formatTimeFromDate(selectedTime));
                      }
                    }}
                  />

                  {Platform.OS === "ios" && (
                    <Pressable
                      style={styles.timePickerDoneButton}
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={styles.primaryButtonText}>{copy.done}</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <Text style={styles.inputLabel}>{copy.place}</Text>
              <TextInput
                style={styles.input}
                value={activityPlace}
                onChangeText={setActivityPlace}
                placeholder={copy.placePlaceholder}
                placeholderTextColor={secondaryText}
                maxLength={150}
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>{copy.notes}</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={activityNotes}
                onChangeText={setActivityNotes}
                placeholder={copy.notesPlaceholder}
                placeholderTextColor={secondaryText}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />

              <View style={styles.editorActions}>
                <Pressable style={styles.cancelButton} onPress={closeEditor}>
                  <Text style={styles.cancelButtonText}>{copy.cancel}</Text>
                </Pressable>

                <Pressable
                  style={styles.primaryButton}
                  onPress={() => void saveActivity()}
                  disabled={saving}
                >
                  <Text style={styles.primaryButtonText}>{copy.save}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.addButton}
              onPress={openNewActivity}
              accessibilityRole="button"
              accessibilityLabel={copy.addActivity}
            >
              <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" />
              <Text style={styles.addButtonText}>{copy.addActivity}</Text>
            </Pressable>
          )}

          <View style={styles.footer}>
            <Ionicons name="cloud-done-outline" size={16} color={accent} />
            <Text style={styles.footerText}>{copy.saved}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: {
  background: string;
  card: string;
  primaryText: string;
  secondaryText: string;
  border: string;
  inputBackground: string;
  accent: string;
}) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardContainer: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 22,
      paddingTop: 16,
      paddingBottom: 60,
    },
    loadingText: {
      color: colors.secondaryText,
      fontSize: 14,
      textAlign: "center",
      marginTop: 14,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 28,
      gap: 18,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
      gap: 12,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      color: colors.primaryText,
      fontSize: 23,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      color: colors.secondaryText,
      fontSize: 12,
      marginTop: 4,
    },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: 15,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    tripCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      gap: 12,
    },
    tripCardIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    tripInfo: {
      flex: 1,
    },
    tripName: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "800",
    },
    tripDestination: {
      color: colors.secondaryText,
      fontSize: 12,
      marginTop: 5,
    },
    tripDaysBadge: {
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },
    tripDaysNumber: {
      color: colors.accent,
      fontSize: 19,
      fontWeight: "800",
    },
    tripDaysLabel: {
      color: colors.secondaryText,
      fontSize: 9,
      marginTop: 2,
    },
    periodCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 17,
      padding: 15,
      marginBottom: 20,
      gap: 12,
    },
    periodIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    periodInfo: {
      flex: 1,
    },
    periodTitle: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "700",
    },
    periodDescription: {
      color: colors.secondaryText,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 4,
    },
    periodDate: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 6,
    },
    periodButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    automaticPeriod: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    automaticPeriodText: {
      color: colors.secondaryText,
      fontSize: 12,
    },
    datePickerCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 20,
    },
    datePickerTitle: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 8,
    },
    datePickerPreview: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 8,
      marginBottom: 12,
      textTransform: "capitalize",
    },
    datePickerActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 12,
    },
    sectionHeading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 15,
      marginTop: 8,
    },
    sectionTitle: {
      color: colors.primaryText,
      fontSize: 19,
      fontWeight: "800",
    },
    sectionSubtitle: {
      color: colors.secondaryText,
      fontSize: 12,
      marginTop: 4,
    },
    daysList: {
      gap: 10,
      paddingBottom: 18,
    },
    dayTab: {
      minWidth: 104,
      backgroundColor: colors.card,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 13,
      paddingVertical: 12,
      alignItems: "center",
    },
    dayTabSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    dayTabNumber: {
      color: colors.primaryText,
      fontSize: 12,
      fontWeight: "800",
    },
    dayTabNumberSelected: {
      color: "#FFFFFF",
    },
    dayTabDate: {
      color: colors.secondaryText,
      fontSize: 11,
      marginTop: 5,
    },
    dayTabDateSelected: {
      color: "#FFFFFF",
    },
    dayIndicator: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.accent,
      marginTop: 7,
    },
    dayIndicatorSelected: {
      backgroundColor: "#FFFFFF",
    },
    selectedDayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 17,
    },
    selectedDayTitle: {
      color: colors.primaryText,
      fontSize: 18,
      fontWeight: "800",
    },
    selectedDayDate: {
      color: colors.secondaryText,
      fontSize: 12,
      marginTop: 4,
      textTransform: "capitalize",
    },
    dayActivityCount: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    dayActivityCountText: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "700",
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 28,
      alignItems: "center",
      marginBottom: 18,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 21,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
    },
    emptyTitle: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "800",
      textAlign: "center",
    },
    emptyDescription: {
      color: colors.secondaryText,
      fontSize: 12,
      lineHeight: 19,
      textAlign: "center",
      marginTop: 8,
    },
    activityRow: {
      flexDirection: "row",
      minHeight: 100,
      gap: 12,
    },
    timeline: {
      width: 14,
      alignItems: "center",
    },
    timelineDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: colors.accent,
      marginTop: 19,
    },
    timelineLine: {
      width: 2,
      flex: 1,
      backgroundColor: colors.border,
      marginTop: 4,
    },
    activityCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 17,
      padding: 15,
      marginBottom: 13,
    },
    activityTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    activityTime: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    activityTimeText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "800",
    },
    activityActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
    },
    activityTitle: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: "800",
      lineHeight: 21,
    },
    activityDetail: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 9,
    },
    activityDetailText: {
      color: colors.secondaryText,
      fontSize: 12,
      flex: 1,
    },
    activityNotes: {
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 10,
      marginTop: 10,
    },
    activityNotesText: {
      color: colors.secondaryText,
      fontSize: 12,
      lineHeight: 18,
    },
    editorCard: {
      backgroundColor: colors.card,
      borderRadius: 19,
      padding: 17,
      marginTop: 8,
    },
    editorTitle: {
      color: colors.primaryText,
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 17,
    },
    inputLabel: {
      color: colors.primaryText,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 7,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 12,
      color: colors.primaryText,
      fontSize: 13,
    },
    timeInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    timeInput: {
      flex: 1,
    },
    timePickerButton: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    timePickerCard: {
      backgroundColor: colors.inputBackground,
      borderRadius: 13,
      padding: 10,
      marginTop: 10,
    },
    timePickerDoneButton: {
      alignSelf: "flex-end",
      backgroundColor: colors.accent,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 8,
    },
    notesInput: {
      minHeight: 90,
      textAlignVertical: "top",
    },
    editorActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 20,
    },
    cancelButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButtonText: {
      color: colors.secondaryText,
      fontSize: 13,
      fontWeight: "700",
    },
    primaryButton: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 15,
      marginTop: 8,
    },
    addButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 7,
      marginTop: 25,
    },
    footerText: {
      color: colors.secondaryText,
      fontSize: 11,
    },
  });
}
