import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  agendarLembreteViagem,
  cancelarLembreteViagem,
  getNotificationPreferences,
  NOTIFICATIONS_STORAGE_KEY,
} from "../../services/notifications";

const TRIPS_STORAGE_KEY = "@viagens";
const NOTIFICATIONS_CHANGED_EVENT = "tripwise:notificationsChanged";

type Viagem = {
  id: string;
  nome: string;
  destino: string;
  transporte: string;
  data: string;
  dataFim?: string;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  category: "viagem" | "hospedagem" | "passeio" | "orcamento";
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
  read: boolean;
  section: "Hoje" | "Anteriores";
  viagemId?: string;
};

type IconeTransporte = keyof typeof MaterialCommunityIcons.glyphMap;

type HomeTranslations = {
  subtitle: string;
  heading: string;
  headingAccent: string;
  bannerTitle: string;
  bannerDescription: string;
  newTrip: string;
  newTripDescription: string;
  tripName: string;
  destination: string;
  transport: string;
  tripDate: string;
  tripEndDate: string;
  selectTripDate: string;
  selectTripEndDate: string;
  selectTripEndDateAccessibility: string;
  invalidTripPeriod: string;
  finish: string;
  addTrip: string;
  myTrips: string;
  plannedDestinations: string;
  tripSingular: string;
  tripPlural: string;
  tripCreatedTitle: string;
  tripCreatedMessage: string;
  now: string;
  attention: string;
  fillFields: string;
  success: string;
  tripAdded: string;
  error: string;
  loadTripsError: string;
  saveTripError: string;
  deleteTrip: string;
  deleteTripAccessibility: string;
  deleteTripConfirm: string;
  cancel: string;
  delete: string;
  tripDeleted: string;
  tripDeletedMessage: string;
  deleteTripError: string;
  tripDetails: string;
  journeyStarts: string;
  emptyDescription: string;
  selectDateAccessibility: string;
};

const HOME_TRANSLATIONS: Record<"pt-BR" | "en" | "es", HomeTranslations> = {
  "pt-BR": {
    subtitle: "SUA PRÓXIMA AVENTURA COMEÇA AQUI",
    heading: "Explore o mundo.",
    headingAccent: "Viva cada destino.",
    bannerTitle: "Planeje sem limites",
    bannerDescription:
      "Organize seus destinos e tenha cada detalhe da viagem em um só lugar.",
    newTrip: "Nova viagem",
    newTripDescription: "Comece a planejar sua próxima experiência",
    tripName: "Nome da viagem",
    destination: "Destino",
    transport: "Meio de transporte",
    tripDate: "Data de início da viagem",
    tripEndDate: "Data final da viagem",
    selectTripDate: "Selecione a data de início",
    selectTripEndDate: "Selecione a data final da viagem",
    selectTripEndDateAccessibility: "Selecionar data final da viagem",
    invalidTripPeriod:
      "A data final precisa ser igual ou posterior à data de início.",
    finish: "Concluir",
    addTrip: "Adicionar viagem",
    myTrips: "Minhas viagens",
    plannedDestinations: "Seus destinos planejados",
    tripSingular: "viagem",
    tripPlural: "viagens",
    tripCreatedTitle: "Nova viagem adicionada!",
    tripCreatedMessage:
      "Sua viagem para {destination} foi cadastrada com sucesso.",
    now: "Agora",
    attention: "Atenção",
    fillFields: "Preencha todos os campos para continuar.",
    success: "Tudo certo!",
    tripAdded: "Sua viagem foi adicionada.",
    error: "Erro",
    loadTripsError: "Não foi possível carregar suas viagens.",
    saveTripError: "Não foi possível salvar sua viagem.",
    deleteTrip: "Excluir viagem",
    deleteTripAccessibility: "Excluir viagem {name}",
    deleteTripConfirm: "Tem certeza de que deseja excluir esta viagem?",
    cancel: "Cancelar",
    delete: "Excluir",
    tripDeleted: "Viagem excluída",
    tripDeletedMessage: "A viagem para {destination} foi removida.",
    deleteTripError: "Não foi possível excluir a viagem.",
    tripDetails: "Ver detalhes da viagem",
    journeyStarts: "Sua jornada começa aqui",
    emptyDescription:
      "Você ainda não possui viagens cadastradas. Adicione seu primeiro destino e comece a planejar!",
    selectDateAccessibility: "Selecionar data de início da viagem",
  },

  en: {
    subtitle: "YOUR NEXT ADVENTURE STARTS HERE",
    heading: "Explore the world.",
    headingAccent: "Experience every destination.",
    bannerTitle: "Plan without limits",
    bannerDescription:
      "Organize your destinations and keep every travel detail in one place.",
    newTrip: "New trip",
    newTripDescription: "Start planning your next experience",
    tripName: "Trip name",
    destination: "Destination",
    transport: "Means of transport",
    tripDate: "Trip start date",
    tripEndDate: "Trip end date",
    selectTripDate: "Select the start date",
    selectTripEndDate: "Select the trip end date",
    selectTripEndDateAccessibility: "Select trip end date",
    invalidTripPeriod:
      "The end date must be the same as or later than the start date.",
    finish: "Done",
    addTrip: "Add trip",
    myTrips: "My trips",
    plannedDestinations: "Your planned destinations",
    tripSingular: "trip",
    tripPlural: "trips",
    tripCreatedTitle: "New trip added!",
    tripCreatedMessage:
      "Your trip to {destination} has been successfully registered.",
    now: "Now",
    attention: "Attention",
    fillFields: "Fill in all fields to continue.",
    success: "All set!",
    tripAdded: "Your trip has been added.",
    error: "Error",
    loadTripsError: "Could not load your trips.",
    saveTripError: "Could not save your trip.",
    deleteTrip: "Delete trip",
    deleteTripAccessibility: "Delete trip {name}",
    deleteTripConfirm: "Are you sure you want to delete this trip?",
    cancel: "Cancel",
    delete: "Delete",
    tripDeleted: "Trip deleted",
    tripDeletedMessage: "The trip to {destination} has been removed.",
    deleteTripError: "Could not delete the trip.",
    tripDetails: "View trip details",
    journeyStarts: "Your journey starts here",
    emptyDescription:
      "You don't have any trips yet. Add your first destination and start planning!",
    selectDateAccessibility: "Select trip start date",
  },

  es: {
    subtitle: "TU PRÓXIMA AVENTURA COMIENZA AQUÍ",
    heading: "Explora el mundo.",
    headingAccent: "Vive cada destino.",
    bannerTitle: "Planifica sin límites",
    bannerDescription:
      "Organiza tus destinos y reúne todos los detalles del viaje en un solo lugar.",
    newTrip: "Nuevo viaje",
    newTripDescription: "Empieza a planificar tu próxima experiencia",
    tripName: "Nombre del viaje",
    destination: "Destino",
    transport: "Medio de transporte",
    tripDate: "Fecha de inicio del viaje",
    tripEndDate: "Fecha de finalización del viaje",
    selectTripDate: "Selecciona la fecha de inicio",
    selectTripEndDate: "Selecciona la fecha de finalización",
    selectTripEndDateAccessibility:
      "Seleccionar fecha de finalización del viaje",
    invalidTripPeriod:
      "La fecha de finalización debe ser igual o posterior a la fecha de inicio.",
    finish: "Finalizar",
    addTrip: "Añadir viaje",
    myTrips: "Mis viajes",
    plannedDestinations: "Tus destinos planificados",
    tripSingular: "viaje",
    tripPlural: "viajes",
    tripCreatedTitle: "¡Nuevo viaje añadido!",
    tripCreatedMessage:
      "Tu viaje a {destination} se ha registrado correctamente.",
    now: "Ahora",
    attention: "Atención",
    fillFields: "Completa todos los campos para continuar.",
    success: "¡Todo listo!",
    tripAdded: "Tu viaje ha sido añadido.",
    error: "Error",
    loadTripsError: "No se pudieron cargar tus viajes.",
    saveTripError: "No se pudo guardar tu viaje.",
    deleteTrip: "Eliminar viaje",
    deleteTripAccessibility: "Eliminar viaje {name}",
    deleteTripConfirm: "¿Estás seguro de que deseas eliminar este viaje?",
    cancel: "Cancelar",
    delete: "Eliminar",
    tripDeleted: "Viaje eliminado",
    tripDeletedMessage: "El viaje a {destination} ha sido eliminado.",
    deleteTripError: "No se pudo eliminar el viaje.",
    tripDetails: "Ver detalles del viaje",
    journeyStarts: "Tu aventura comienza aquí",
    emptyDescription:
      "Todavía no tienes viajes registrados. ¡Añade tu primer destino y empieza a planificar!",
    selectDateAccessibility: "Seleccionar fecha de inicio del viaje",
  },
};

// Valida os dados de cada viagem antes de utilizá-los na interface.
// dataFim permanece opcional para manter a compatibilidade com viagens antigas.
const isViagem = (valor: unknown): valor is Viagem => {
  if (typeof valor !== "object" || valor === null) {
    return false;
  }

  const viagem = valor as Record<string, unknown>;

  return (
    typeof viagem.id === "string" &&
    viagem.id.trim().length > 0 &&
    typeof viagem.nome === "string" &&
    viagem.nome.trim().length > 0 &&
    typeof viagem.destino === "string" &&
    viagem.destino.trim().length > 0 &&
    typeof viagem.transporte === "string" &&
    viagem.transporte.trim().length > 0 &&
    typeof viagem.data === "string" &&
    viagem.data.trim().length > 0 &&
    (viagem.dataFim === undefined || typeof viagem.dataFim === "string")
  );
};

// Valida a lista inteira e impede IDs duplicados.
const isListaViagens = (valor: unknown): valor is Viagem[] => {
  if (!Array.isArray(valor) || !valor.every(isViagem)) {
    return false;
  }

  const ids = new Set(valor.map((viagem) => viagem.id));

  return ids.size === valor.length;
};

// Identifica o meio de transporte e retorna seu ícone correspondente.
const obterIconeTransporte = (transporte: string): IconeTransporte => {
  const nomeNormalizado = transporte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (
    nomeNormalizado.includes("aviao") ||
    nomeNormalizado.includes("aereo") ||
    nomeNormalizado.includes("airplane") ||
    nomeNormalizado.includes("plane") ||
    nomeNormalizado.includes("avion") ||
    nomeNormalizado.includes("aeroplano")
  ) {
    return "airplane";
  }

  if (
    nomeNormalizado.includes("moto") ||
    nomeNormalizado.includes("motorcycle") ||
    nomeNormalizado.includes("motorbike")
  ) {
    return "motorbike";
  }

  if (
    nomeNormalizado.includes("onibus") ||
    nomeNormalizado.includes("bus") ||
    nomeNormalizado.includes("autobus")
  ) {
    return "bus";
  }

  if (
    nomeNormalizado.includes("trem") ||
    nomeNormalizado.includes("train") ||
    nomeNormalizado.includes("tren")
  ) {
    return "train";
  }

  if (
    nomeNormalizado.includes("navio") ||
    nomeNormalizado.includes("barco") ||
    nomeNormalizado.includes("cruzeiro") ||
    nomeNormalizado.includes("ship") ||
    nomeNormalizado.includes("ferry")
  ) {
    return "ferry";
  }

  if (
    nomeNormalizado.includes("carro") ||
    nomeNormalizado.includes("automovel") ||
    nomeNormalizado.includes("car") ||
    nomeNormalizado.includes("coche")
  ) {
    return "car";
  }

  return "car";
};

// Mantém o formato DD/MM/AAAA para armazenamento.
const formatarData = (date: Date) => {
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const ano = date.getFullYear();

  return `${dia}/${mes}/${ano}`;
};

// Recupera uma data já cadastrada no formato DD/MM/AAAA.
const converterData = (valor: string): Date | null => {
  const partes = valor.split("/");

  if (partes.length !== 3) {
    return null;
  }

  const dia = Number(partes[0]);
  const mes = Number(partes[1]);
  const ano = Number(partes[2]);

  const date = new Date(ano, mes - 1, dia);

  if (
    date.getDate() !== dia ||
    date.getMonth() !== mes - 1 ||
    date.getFullYear() !== ano
  ) {
    return null;
  }

  return date;
};

// Formata a data visualmente conforme o idioma selecionado.
const formatarDataExibicao = (valor: string, locale: string) => {
  const date = converterData(valor);

  if (!date) {
    return valor;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { language, locale } = useLanguage();
  const copy = HOME_TRANSLATIONS[language];

  const [nomeViagem, setNomeViagem] = useState("");
  const [destino, setDestino] = useState("");
  const [transporte, setTransporte] = useState("");
  const [data, setData] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [viagens, setViagens] = useState<Viagem[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());

  const background = isDark ? "#121212" : "#F4F6FA";
  const cardBackground = isDark ? "#1E1E1E" : "#FFFFFF";
  const primaryText = isDark ? "#FFFFFF" : "#172033";
  const secondaryText = isDark ? "#A0A0A0" : "#7B8495";
  const inputBackground = isDark ? "#292929" : "#F5F7FA";
  const borderColor = isDark ? "#333333" : "#E9ECF2";
  const accent = "#8FA255";

  const carregarViagens = useCallback(async () => {
    try {
      const dados = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);

      if (dados === null) {
        setViagens([]);
        return;
      }

      const parsedData: unknown = JSON.parse(dados);

      if (!isListaViagens(parsedData)) {
        throw new Error("Os dados armazenados das viagens são inválidos.");
      }

      setViagens(parsedData);
    } catch (error) {
      console.error("Erro ao carregar viagens:", error);
      Alert.alert(copy.error, copy.loadTripsError);
    }
  }, [copy.error, copy.loadTripsError]);

  useFocusEffect(
    useCallback(() => {
      carregarViagens();
    }, [carregarViagens]),
  );

  const abrirCalendario = () => {
    const dataAtual = converterData(data);

    setSelectedDate(dataAtual || new Date());
    setShowDatePicker(true);
  };

  const abrirCalendarioFinal = () => {
    const dataAtual = converterData(dataFim);
    const dataInicial = converterData(data);

    setSelectedEndDate(dataAtual || dataInicial || new Date());
    setShowEndDatePicker(true);
  };

  const alterarData = (novaData?: Date) => {
    if (novaData) {
      setSelectedDate(novaData);
      setData(formatarData(novaData));
    }
  };

  const alterarDataFinal = (novaData?: Date) => {
    if (novaData) {
      setSelectedEndDate(novaData);
      setDataFim(formatarData(novaData));
    }
  };

  const registrarNotificacao = async (
    tipo: "viagemCriada" | "viagemExcluida",
    titulo: string,
    mensagem: string,
    viagemId?: string,
  ) => {
    try {
      const preferences = await getNotificationPreferences();

      if (!preferences[tipo]) {
        return;
      }

      const dados = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);

      let notificacoes: NotificationItem[] = [];

      if (dados) {
        const parsedData: unknown = JSON.parse(dados);

        if (Array.isArray(parsedData)) {
          notificacoes = parsedData;
        }
      }

      const novaNotificacao: NotificationItem = {
        id: Date.now().toString(),
        title: titulo,
        message: mensagem,
        time: copy.now,
        category: "viagem",
        icon: "airplane-outline",
        color: accent,
        background: "#8FA25518",
        read: false,
        section: "Hoje",
        viagemId,
      };

      const listaAtualizada = [novaNotificacao, ...notificacoes];

      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(listaAtualizada),
      );

      DeviceEventEmitter.emit(NOTIFICATIONS_CHANGED_EVENT);
    } catch (error) {
      console.error("Erro ao registrar notificação:", error);
    }
  };

  const salvarViagem = async () => {
    if (
      !nomeViagem.trim() ||
      !destino.trim() ||
      !transporte.trim() ||
      !data.trim() ||
      !dataFim.trim()
    ) {
      Alert.alert(copy.attention, copy.fillFields);
      return;
    }

    const dataInicial = converterData(data);
    const dataFinal = converterData(dataFim);

    if (
      !dataInicial ||
      !dataFinal ||
      dataFinal.getTime() < dataInicial.getTime()
    ) {
      Alert.alert(copy.attention, copy.invalidTripPeriod);
      return;
    }

    try {
      // Recupera os dados mais recentes antes de salvar.
      const dados = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);

      let listaAtual: Viagem[] = [];

      if (dados !== null) {
        const parsedData: unknown = JSON.parse(dados);

        if (!isListaViagens(parsedData)) {
          throw new Error("Os dados armazenados das viagens são inválidos.");
        }

        listaAtual = parsedData;
      }

      // Garante que o novo ID não seja igual ao de outra viagem.
      let novoId = Date.now();

      while (listaAtual.some((viagem) => viagem.id === String(novoId))) {
        novoId += 1;
      }

      const novaViagem: Viagem = {
        id: String(novoId),
        nome: nomeViagem.trim(),
        destino: destino.trim(),
        transporte: transporte.trim(),
        data: data.trim(),
        dataFim: dataFim.trim(),
      };

      const lista = [...listaAtual, novaViagem];

      await AsyncStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(lista));

      setViagens(lista);
      setNomeViagem("");
      setDestino("");
      setTransporte("");
      setData("");
      setDataFim("");

      try {
        await agendarLembreteViagem(novaViagem);
      } catch (error) {
        console.error("Erro ao agendar lembrete da viagem:", error);
      }

      await registrarNotificacao(
        "viagemCriada",
        copy.tripCreatedTitle,
        copy.tripCreatedMessage.replace("{destination}", novaViagem.destino),
        novaViagem.id,
      );

      Alert.alert(copy.success, copy.tripAdded);
    } catch (error) {
      console.error("Erro ao salvar viagem:", error);
      Alert.alert(copy.error, copy.saveTripError);
    }
  };

  const deletarViagem = (id: string) => {
    Alert.alert(copy.deleteTrip, copy.deleteTripConfirm, [
      { text: copy.cancel, style: "cancel" },
      {
        text: copy.delete,
        style: "destructive",
        onPress: async () => {
          try {
            // Lê novamente os dados para evitar excluir com uma lista desatualizada.
            const dados = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);

            let listaAtual: Viagem[] = [];

            if (dados !== null) {
              const parsedData: unknown = JSON.parse(dados);

              if (!isListaViagens(parsedData)) {
                throw new Error(
                  "Os dados armazenados das viagens são inválidos.",
                );
              }

              listaAtual = parsedData;
            }

            const viagemExcluida = listaAtual.find((item) => item.id === id);

            const lista = listaAtual.filter((item) => item.id !== id);

            await AsyncStorage.setItem(
              TRIPS_STORAGE_KEY,
              JSON.stringify(lista),
            );

            setViagens(lista);

            try {
              await cancelarLembreteViagem(id);
            } catch (error) {
              console.error("Erro ao cancelar lembrete da viagem:", error);
            }

            if (viagemExcluida) {
              await registrarNotificacao(
                "viagemExcluida",
                copy.tripDeleted,
                copy.tripDeletedMessage.replace(
                  "{destination}",
                  viagemExcluida.destino,
                ),
                viagemExcluida.id,
              );
            }
          } catch (error) {
            console.error("Erro ao excluir viagem:", error);
            Alert.alert(copy.error, copy.deleteTripError);
          }
        },
      },
    ]);
  };

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
  ) => (
    <View
      style={[
        styles.inputContainer,
        { backgroundColor: inputBackground, borderColor },
      ]}
    >
      <Ionicons name={icon} size={19} color={accent} />
      <TextInput
        style={[styles.input, { color: primaryText }]}
        placeholder={placeholder}
        placeholderTextColor={secondaryText}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );

  const Header = (
    <View>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subtitle, { color: secondaryText }]}>
            {copy.subtitle}
          </Text>
          <Text style={[styles.heading, { color: primaryText }]}>
            {copy.heading}
          </Text>
          <Text style={[styles.headingAccent, { color: accent }]}>
            {copy.headingAccent}
          </Text>
        </View>

        <View style={[styles.headerIcon, { backgroundColor: cardBackground }]}>
          <Ionicons name="compass-outline" size={29} color={accent} />
        </View>
      </View>

      <View style={[styles.banner, { backgroundColor: cardBackground }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerTitle, { color: primaryText }]}>
            {copy.bannerTitle}
          </Text>
          <Text style={[styles.bannerDescription, { color: secondaryText }]}>
            {copy.bannerDescription}
          </Text>
        </View>

        <View style={styles.bannerIcon}>
          <Ionicons name="airplane" size={28} color={accent} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: primaryText }]}>
            {copy.newTrip}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: secondaryText }]}>
            {copy.newTripDescription}
          </Text>
        </View>
        <Ionicons name="add-circle-outline" size={24} color={accent} />
      </View>

      <View style={[styles.formCard, { backgroundColor: cardBackground }]}>
        {renderInput(
          copy.tripName,
          nomeViagem,
          setNomeViagem,
          "bookmark-outline",
        )}

        {renderInput(copy.destination, destino, setDestino, "location-outline")}

        {renderInput(copy.transport, transporte, setTransporte, "car-outline")}

        <Pressable
          style={[
            styles.inputContainer,
            { backgroundColor: inputBackground, borderColor },
          ]}
          onPress={abrirCalendario}
          accessibilityRole="button"
          accessibilityLabel={copy.selectDateAccessibility}
        >
          <Ionicons name="calendar-outline" size={19} color={accent} />

          <Text
            style={[
              styles.dateInputText,
              { color: data ? primaryText : secondaryText },
            ]}
          >
            {data ? formatarDataExibicao(data, locale) : copy.tripDate}
          </Text>

          <Ionicons
            name="chevron-down-outline"
            size={17}
            color={secondaryText}
          />
        </Pressable>

        {showDatePicker && Platform.OS === "ios" && (
          <View
            style={[
              styles.datePickerContainer,
              {
                backgroundColor: inputBackground,
                borderColor,
              },
            ]}
          >
            <Text style={[styles.datePickerTitle, { color: primaryText }]}>
              {copy.selectTripDate}
            </Text>

            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              locale={locale}
              onValueChange={(_event, novaData) => alterarData(novaData)}
              textColor={primaryText}
              style={styles.iosDatePicker}
            />

            <Pressable
              style={({ pressed }) => [
                styles.datePickerButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              onPress={() => setShowDatePicker(false)}
              accessibilityRole="button"
            >
              <Ionicons name="checkmark" size={19} color={accent} />
              <Text style={[styles.datePickerButtonText, { color: accent }]}>
                {copy.finish}
              </Text>
            </Pressable>
          </View>
        )}

        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="calendar"
            onValueChange={(_event, novaData) => alterarData(novaData)}
            onDismiss={() => setShowDatePicker(false)}
          />
        )}

        <Pressable
          style={[
            styles.inputContainer,
            { backgroundColor: inputBackground, borderColor },
          ]}
          onPress={abrirCalendarioFinal}
          accessibilityRole="button"
          accessibilityLabel={copy.selectTripEndDateAccessibility}
        >
          <Ionicons name="calendar-outline" size={19} color={accent} />

          <Text
            style={[
              styles.dateInputText,
              { color: dataFim ? primaryText : secondaryText },
            ]}
          >
            {dataFim ? formatarDataExibicao(dataFim, locale) : copy.tripEndDate}
          </Text>

          <Ionicons
            name="chevron-down-outline"
            size={17}
            color={secondaryText}
          />
        </Pressable>

        {showEndDatePicker && Platform.OS === "ios" && (
          <View
            style={[
              styles.datePickerContainer,
              {
                backgroundColor: inputBackground,
                borderColor,
              },
            ]}
          >
            <Text style={[styles.datePickerTitle, { color: primaryText }]}>
              {copy.selectTripEndDate}
            </Text>

            <DateTimePicker
              value={selectedEndDate}
              mode="date"
              display="spinner"
              locale={locale}
              minimumDate={converterData(data) || undefined}
              onValueChange={(_event, novaData) => alterarDataFinal(novaData)}
              textColor={primaryText}
              style={styles.iosDatePicker}
            />

            <Pressable
              style={({ pressed }) => [
                styles.datePickerButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              onPress={() => setShowEndDatePicker(false)}
              accessibilityRole="button"
            >
              <Ionicons name="checkmark" size={19} color={accent} />
              <Text style={[styles.datePickerButtonText, { color: accent }]}>
                {copy.finish}
              </Text>
            </Pressable>
          </View>
        )}

        {showEndDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={selectedEndDate}
            mode="date"
            display="calendar"
            minimumDate={converterData(data) || undefined}
            onValueChange={(_event, novaData) => alterarDataFinal(novaData)}
            onDismiss={() => setShowEndDatePicker(false)}
          />
        )}

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: accent, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={salvarViagem}
        >
          <Ionicons name="add" size={21} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{copy.addTrip}</Text>
        </Pressable>
      </View>

      <View style={styles.listHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: primaryText }]}>
            {copy.myTrips}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: secondaryText }]}>
            {copy.plannedDestinations}
          </Text>
        </View>

        <View
          style={[
            styles.tripCount,
            { backgroundColor: isDark ? "#293021" : "#EDF2E5" },
          ]}
        >
          <Text style={[styles.tripCountText, { color: accent }]}>
            {viagens.length}{" "}
            {viagens.length === 1 ? copy.tripSingular : copy.tripPlural}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: background }]}
        edges={["top"]}
      >
        <View style={[styles.topBar, { borderBottomColor: borderColor }]}>
          <View>
            <Text style={[styles.topBarTitle, { color: primaryText }]}>
              {copy.myTrips}
            </Text>
            <Text style={[styles.topBarSubtitle, { color: secondaryText }]}>
              {copy.newTripDescription}
            </Text>
          </View>

          <View
            style={[
              styles.topBarIcon,
              { backgroundColor: isDark ? "#293021" : "#EDF2E5" },
            ]}
          >
            <Ionicons name="airplane" size={21} color={accent} />
          </View>
        </View>

        <FlatList
          data={viagens}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={Header}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const iconeTransporte = obterIconeTransporte(item.transporte);

            return (
              <View
                style={[
                  styles.tripCard,
                  { backgroundColor: cardBackground, borderColor },
                ]}
              >
                <Pressable
                  style={styles.tripMain}
                  onPress={() =>
                    router.push({
                      pathname: "/detalhes",
                      params: { id: item.id },
                    })
                  }
                >
                  <View style={styles.tripIcon}>
                    <MaterialCommunityIcons
                      name={iconeTransporte}
                      size={25}
                      color={accent}
                    />
                  </View>

                  <View style={styles.tripInfo}>
                    <Text
                      style={[styles.tripName, { color: primaryText }]}
                      numberOfLines={1}
                    >
                      {item.nome}
                    </Text>

                    <View style={styles.tripDetail}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={secondaryText}
                      />
                      <Text
                        style={[
                          styles.tripDetailText,
                          { color: secondaryText },
                        ]}
                        numberOfLines={1}
                      >
                        {item.destino}
                      </Text>
                    </View>

                    <View style={styles.tripDetail}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={secondaryText}
                      />
                      <Text
                        style={[
                          styles.tripDetailText,
                          { color: secondaryText },
                        ]}
                      >
                        {formatarDataExibicao(item.data, locale)}
                      </Text>
                    </View>

                    <View style={styles.tripDetail}>
                      <MaterialCommunityIcons
                        name={iconeTransporte}
                        size={14}
                        color={secondaryText}
                      />
                      <Text
                        style={[
                          styles.tripDetailText,
                          { color: secondaryText },
                        ]}
                        numberOfLines={1}
                      >
                        {item.transporte}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={secondaryText}
                  />
                </Pressable>

                <View
                  style={[styles.cardDivider, { backgroundColor: borderColor }]}
                />

                <View style={styles.tripActions}>
                  <Text
                    style={[styles.tripActionHint, { color: secondaryText }]}
                  >
                    {copy.tripDetails}
                  </Text>

                  <Pressable
                    onPress={() => deletarViagem(item.id)}
                    hitSlop={10}
                    style={styles.deleteButton}
                    accessibilityRole="button"
                    accessibilityLabel={copy.deleteTripAccessibility.replace(
                      "{name}",
                      item.nome,
                    )}
                  >
                    <Ionicons name="trash-outline" size={19} color="#D96B6B" />
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View
              style={[styles.emptyCard, { backgroundColor: cardBackground }]}
            >
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: isDark ? "#293021" : "#EDF2E5" },
                ]}
              >
                <Ionicons name="map-outline" size={35} color={accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: primaryText }]}>
                {copy.journeyStarts}
              </Text>
              <Text style={[styles.emptyDescription, { color: secondaryText }]}>
                {copy.emptyDescription}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
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
    fontSize: 11,
    marginTop: 3,
  },
  topBarIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 140,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 9,
  },
  heading: {
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  headingAccent: {
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  banner: {
    borderRadius: 19,
    padding: 19,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 27,
    gap: 12,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  bannerDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#8FA25518",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  formCard: {
    padding: 16,
    borderRadius: 19,
    marginBottom: 28,
    gap: 11,
  },
  inputContainer: {
    height: 49,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 11,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 13,
  },
  dateInputText: {
    flex: 1,
    fontSize: 13,
  },
  datePickerContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  datePickerTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 5,
  },
  iosDatePicker: {
    width: "100%",
    height: 150,
  },
  datePickerButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 7,
    marginTop: 5,
  },
  datePickerButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  addButton: {
    height: 49,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  tripCount: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tripCountText: {
    fontSize: 11,
    fontWeight: "800",
  },
  tripCard: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },
  tripMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tripIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: "#8FA25518",
    alignItems: "center",
    justifyContent: "center",
  },
  tripInfo: {
    flex: 1,
    gap: 5,
  },
  tripName: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  tripDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tripDetailText: {
    fontSize: 11,
    flexShrink: 1,
  },
  cardDivider: {
    height: 1,
    marginTop: 13,
    marginBottom: 9,
  },
  tripActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tripActionHint: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 5,
  },
  emptyCard: {
    borderRadius: 19,
    padding: 25,
    alignItems: "center",
    marginTop: 2,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 7,
  },
  emptyDescription: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
  },
});
