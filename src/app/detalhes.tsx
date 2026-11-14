import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { Href } from "expo-router";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
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
import { useCurrency } from "../contexts/CurrencyContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  agendarLembreteViagem,
  getNotificationPreferences,
  NOTIFICATIONS_STORAGE_KEY,
} from "../services/notifications";

const NOTIFICATIONS_CHANGED_EVENT = "tripwise:notificationsChanged";
const TRIPS_STORAGE_KEY = "@viagens";

const DETAIL_TRANSLATIONS = {
  "pt-BR": {
    error: "Erro",
    loadError: "Não foi possível carregar os detalhes da viagem.",
    invalidDate: "Data inválida",
    checkoutBeforeCheckin:
      "O check-out não pode ser anterior à data de check-in.",
    endDateBeforeStart:
      "A data de término não pode ser anterior à data de início da viagem.",
    attention: "Atenção",
    expenseValidation: "Informe o nome e um valor válido para o gasto.",
    quoteUnavailable: "Cotação indisponível",
    quoteExpenseError:
      "Não foi possível obter a cotação da moeda selecionada. Atualize as cotações no Perfil e tente novamente.",
    fillTrip: "Preencha nome, destino, transporte e data da viagem.",
    budgetQuoteError:
      "Não foi possível converter o orçamento para reais. Atualize as cotações no Perfil e tente novamente.",
    budgetValidation: "Informe um orçamento válido.",
    tripsNotFound: "Não foi possível encontrar suas viagens.",
    tripNotFound: "Não foi possível encontrar essa viagem.",
    success: "Tudo certo!",
    successMessage: "Informações atualizadas com sucesso!",
    continue: "Continuar",
    saveError: "Não foi possível salvar as alterações.",
    tripNotFoundTitle: "Viagem não encontrada",
    backToTrips: "Voltar para minhas viagens",
    trips: "Viagens",
    editTrip: "Editar viagem",
    details: "Detalhes",
    checklist: "Checklist da viagem",
    checklistSubtitle: "Organize os itens essenciais para sua viagem.",
    smartItinerary: "Roteiro inteligente",
    smartItinerarySubtitle:
      "Organize cada dia da sua viagem com atividades e horários.",
    smartWeather: "Clima inteligente",
    smartWeatherSubtitle:
      "Consulte a previsão do tempo e prepare-se para cada dia da viagem.",
    travelWallet: "Carteira de viagem",
    travelWalletSubtitle:
      "Tenha documentos, passagens e reservas sempre organizados.",
    planned: "Planejada",
    experience: "SUA EXPERIÊNCIA",
    myTrip: "Minha viagem",
    destinationNotInformed: "Destino não informado",
    tripInfo: "Informações da viagem",
    tripInfoSubtitle: "Os dados principais do seu destino",
    tripName: "Nome da viagem",
    tripNamePlaceholder: "Ex: Férias",
    destination: "Destino",
    destinationPlaceholder: "Ex: Rio de Janeiro",
    transport: "Transporte",
    transportPlaceholder: "Ex: Avião",
    date: "Data de início",
    endDate: "Data de término",
    tripDatePlaceholder: "Selecione a data da viagem",
    name: "Nome",
    notInformed: "Não informado",
    accommodation: "Hospedagem",
    accommodationSubtitle: "Onde você vai ficar",
    hotelName: "Nome do hotel",
    accommodationPlaceholder: "Nome da hospedagem",
    address: "Endereço",
    fullAddress: "Endereço completo",
    accommodationDate: "Data da hospedagem",
    accommodationDatePlaceholder: "Selecione check-in e check-out",
    hotel: "Hotel",
    period: "Período",
    budget: "Orçamento financeiro",
    budgetSubtitle: "Controle seus gastos durante a viagem",
    remainingBalance: "SALDO RESTANTE",
    budgetUsed: "do orçamento utilizado",
    totalBudget: "Orçamento total",
    budgetPlaceholder: "Informe o orçamento",
    quoteWarning:
      "Cotação indisponível. Atualize as cotações no Perfil para editar valores nesta moeda.",
    totalExpenses: "Total de gastos",
    individualExpenses: "Gastos individuais",
    noExpenses: "Nenhum gasto registrado.",
    expenseName: "Nome do gasto",
    amount: "Valor",
    saveChanges: "Salvar alterações",
    editInfo: "Editar informações",
    cancelEditing: "Cancelar edição",
    tripDateTitle: "Data da viagem",
    selectCheckin: "Selecione o check-in",
    selectCheckout: "Selecione o check-out",
    chooseCheckin: "Escolha a data de entrada no hotel.",
    chooseTripStart: "Escolha quando sua viagem começa.",
    chooseTripEnd: "Escolha quando sua viagem termina.",
    checkin: "Check-in",
    notSelected: "Não selecionado",
    cancel: "Cancelar",
    nextCheckout: "Próximo: check-out",
    finish: "Concluir",
    tripUpdatedTitle: "Viagem atualizada!",
    tripUpdatedMessage: (destination: string) =>
      `As informações da sua viagem para ${destination} foram atualizadas.`,
    accommodationUpdated: "Hospedagem atualizada!",
    accommodationRemoved: "Hospedagem removida",
    accommodationUpdatedMessage: (destination: string) =>
      `As informações da hospedagem da viagem para ${destination} foram atualizadas.`,
    accommodationRemovedMessage: (destination: string) =>
      `A hospedagem da viagem para ${destination} foi removida.`,
    budgetWarning: "Atenção ao orçamento!",
    budgetWarningMessage: (percentage: string, destination: string) =>
      `Você já utilizou ${percentage}% do orçamento da viagem para ${destination}.`,
    budgetExceeded: "Orçamento ultrapassado!",
    budgetExceededMessage: (destination: string, amount: string) =>
      `Os gastos da viagem para ${destination} ultrapassaram o orçamento em ${amount}.`,
    now: "Agora",
    retry: "Tentar novamente",
    backAccessibility: "Voltar para minhas viagens",
    closeCalendarAccessibility: "Fechar calendário",
    removeExpenseAccessibility: "Remover gasto",
    addExpenseAccessibility: "Adicionar gasto",
  },
  en: {
    error: "Error",
    loadError: "Unable to load trip details.",
    invalidDate: "Invalid date",
    checkoutBeforeCheckin: "Check-out cannot be earlier than check-in.",
    endDateBeforeStart:
      "The end date cannot be earlier than the trip start date.",
    attention: "Attention",
    expenseValidation: "Enter an expense name and a valid amount.",
    quoteUnavailable: "Exchange rate unavailable",
    quoteExpenseError:
      "Unable to retrieve the selected currency exchange rate. Update the rates in Profile and try again.",
    fillTrip: "Enter the trip name, destination, transportation, and date.",
    budgetQuoteError:
      "Unable to convert the budget to reais. Update the rates in Profile and try again.",
    budgetValidation: "Enter a valid budget.",
    tripsNotFound: "Unable to find your trips.",
    tripNotFound: "Unable to find this trip.",
    success: "All done!",
    successMessage: "Information updated successfully!",
    continue: "Continue",
    saveError: "Unable to save your changes.",
    tripNotFoundTitle: "Trip not found",
    backToTrips: "Back to my trips",
    trips: "Trips",
    editTrip: "Edit trip",
    details: "Details",
    checklist: "Trip checklist",
    checklistSubtitle: "Organize the essentials for your trip.",
    smartItinerary: "Smart itinerary",
    smartItinerarySubtitle:
      "Organize each day of your trip with activities and schedules.",
    smartWeather: "Smart weather",
    smartWeatherSubtitle:
      "Check the weather forecast and get ready for each day of your trip.",
    travelWallet: "Travel wallet",
    travelWalletSubtitle:
      "Keep your documents, tickets, and reservations organized.",
    planned: "Planned",
    experience: "YOUR EXPERIENCE",
    myTrip: "My trip",
    destinationNotInformed: "Destination not provided",
    tripInfo: "Trip information",
    tripInfoSubtitle: "The main details of your destination",
    tripName: "Trip name",
    tripNamePlaceholder: "E.g. Vacation",
    destination: "Destination",
    destinationPlaceholder: "E.g. New York",
    transport: "Transportation",
    transportPlaceholder: "E.g. Airplane",
    date: "Start date",
    endDate: "End date",
    tripDatePlaceholder: "Select your trip date",
    name: "Name",
    notInformed: "Not provided",
    accommodation: "Accommodation",
    accommodationSubtitle: "Where you will be staying",
    hotelName: "Hotel name",
    accommodationPlaceholder: "Accommodation name",
    address: "Address",
    fullAddress: "Full address",
    accommodationDate: "Accommodation dates",
    accommodationDatePlaceholder: "Select check-in and check-out",
    hotel: "Hotel",
    period: "Period",
    budget: "Travel budget",
    budgetSubtitle: "Track your expenses during the trip",
    remainingBalance: "REMAINING BALANCE",
    budgetUsed: "of your budget used",
    totalBudget: "Total budget",
    budgetPlaceholder: "Enter your budget",
    quoteWarning:
      "Exchange rate unavailable. Update the rates in Profile to edit amounts in this currency.",
    totalExpenses: "Total expenses",
    individualExpenses: "Individual expenses",
    noExpenses: "No expenses recorded.",
    expenseName: "Expense name",
    amount: "Amount",
    saveChanges: "Save changes",
    editInfo: "Edit information",
    cancelEditing: "Cancel editing",
    tripDateTitle: "Trip date",
    selectCheckin: "Select check-in",
    selectCheckout: "Select check-out",
    chooseCheckin: "Choose your hotel check-in date.",
    chooseTripStart: "Choose when your trip starts.",
    chooseTripEnd: "Choose when your trip ends.",
    checkin: "Check-in",
    notSelected: "Not selected",
    cancel: "Cancel",
    nextCheckout: "Next: check-out",
    finish: "Done",
    tripUpdatedTitle: "Trip updated!",
    tripUpdatedMessage: (destination: string) =>
      `Your trip information for ${destination} has been updated.`,
    accommodationUpdated: "Accommodation updated!",
    accommodationRemoved: "Accommodation removed",
    accommodationUpdatedMessage: (destination: string) =>
      `The accommodation details for your trip to ${destination} have been updated.`,
    accommodationRemovedMessage: (destination: string) =>
      `The accommodation for your trip to ${destination} has been removed.`,
    budgetWarning: "Budget alert!",
    budgetWarningMessage: (percentage: string, destination: string) =>
      `You have used ${percentage}% of your budget for your trip to ${destination}.`,
    budgetExceeded: "Budget exceeded!",
    budgetExceededMessage: (destination: string, amount: string) =>
      `Expenses for your trip to ${destination} have exceeded the budget by ${amount}.`,
    now: "Now",
    retry: "Try again",
    backAccessibility: "Back to my trips",
    closeCalendarAccessibility: "Close calendar",
    removeExpenseAccessibility: "Remove expense",
    addExpenseAccessibility: "Add expense",
  },
  es: {
    error: "Error",
    loadError: "No fue posible cargar los detalles del viaje.",
    invalidDate: "Fecha no válida",
    checkoutBeforeCheckin:
      "La fecha de salida no puede ser anterior a la fecha de entrada.",
    endDateBeforeStart:
      "La fecha de finalización no puede ser anterior a la fecha de inicio del viaje.",
    attention: "Atención",
    expenseValidation: "Introduce el nombre y un importe válido para el gasto.",
    quoteUnavailable: "Tipo de cambio no disponible",
    quoteExpenseError:
      "No fue posible obtener el tipo de cambio seleccionado. Actualiza las cotizaciones en Perfil e inténtalo de nuevo.",
    fillTrip: "Completa el nombre, destino, transporte y fecha del viaje.",
    budgetQuoteError:
      "No fue posible convertir el presupuesto a reales. Actualiza las cotizaciones en Perfil e inténtalo de nuevo.",
    budgetValidation: "Introduce un presupuesto válido.",
    tripsNotFound: "No fue posible encontrar tus viajes.",
    tripNotFound: "No fue posible encontrar este viaje.",
    success: "¡Todo listo!",
    successMessage: "¡Información actualizada correctamente!",
    continue: "Continuar",
    saveError: "No fue posible guardar los cambios.",
    tripNotFoundTitle: "Viaje no encontrada",
    backToTrips: "Volver a mis viajes",
    trips: "Viajes",
    editTrip: "Editar viaje",
    details: "Detalles",
    checklist: "Lista del viaje",
    checklistSubtitle: "Organiza los elementos esenciales de tu viaje.",
    smartItinerary: "Itinerario inteligente",
    smartItinerarySubtitle:
      "Organiza cada día de tu viaje con actividades y horarios.",
    smartWeather: "Clima inteligente",
    smartWeatherSubtitle:
      "Consulta el pronóstico del tiempo y prepárate para cada día del viaje.",
    travelWallet: "Cartera de viaje",
    travelWalletSubtitle:
      "Mantén tus documentos, billetes y reservas organizados.",
    planned: "Planificado",
    experience: "TU EXPERIENCIA",
    myTrip: "Mi viaje",
    destinationNotInformed: "Destino no indicado",
    tripInfo: "Información del viaje",
    tripInfoSubtitle: "Los datos principales de tu destino",
    tripName: "Nombre del viaje",
    tripNamePlaceholder: "Ej.: Vacaciones",
    destination: "Destino",
    destinationPlaceholder: "Ej.: Madrid",
    transport: "Transporte",
    transportPlaceholder: "Ej.: Avión",
    date: "Fecha de inicio",
    endDate: "Fecha de finalización",
    tripDatePlaceholder: "Selecciona la fecha del viaje",
    name: "Nombre",
    notInformed: "No indicado",
    accommodation: "Alojamiento",
    accommodationSubtitle: "Dónde te alojarás",
    hotelName: "Nombre del hotel",
    accommodationPlaceholder: "Nombre del alojamiento",
    address: "Dirección",
    fullAddress: "Dirección completa",
    accommodationDate: "Fechas del alojamiento",
    accommodationDatePlaceholder: "Selecciona entrada y salida",
    hotel: "Hotel",
    period: "Período",
    budget: "Presupuesto del viaje",
    budgetSubtitle: "Controla tus gastos durante el viaje",
    remainingBalance: "SALDO RESTANTE",
    budgetUsed: "del presupuesto utilizado",
    totalBudget: "Presupuesto total",
    budgetPlaceholder: "Introduce el presupuesto",
    quoteWarning:
      "Tipo de cambio no disponible. Actualiza las cotizaciones en Perfil para editar importes en esta moneda.",
    totalExpenses: "Gastos totales",
    individualExpenses: "Gastos individuales",
    noExpenses: "No hay gastos registrados.",
    expenseName: "Nombre del gasto",
    amount: "Importe",
    saveChanges: "Guardar cambios",
    editInfo: "Editar información",
    cancelEditing: "Cancelar edición",
    tripDateTitle: "Fecha del viaje",
    selectCheckin: "Selecciona la entrada",
    selectCheckout: "Selecciona la salida",
    chooseCheckin: "Elige la fecha de entrada al hotel.",
    chooseTripStart: "Elige cuándo comienza tu viaje.",
    chooseTripEnd: "Elige cuándo termina tu viaje.",
    checkin: "Entrada",
    notSelected: "No seleccionado",
    cancel: "Cancelar",
    nextCheckout: "Siguiente: salida",
    finish: "Finalizar",
    tripUpdatedTitle: "¡Viaje actualizado!",
    tripUpdatedMessage: (destination: string) =>
      `La información de tu viaje a ${destination} ha sido actualizada.`,
    accommodationUpdated: "¡Alojamiento actualizado!",
    accommodationRemoved: "Alojamiento eliminado",
    accommodationUpdatedMessage: (destination: string) =>
      `La información del alojamiento de tu viaje a ${destination} ha sido actualizada.`,
    accommodationRemovedMessage: (destination: string) =>
      `El alojamiento de tu viaje a ${destination} ha sido eliminado.`,
    budgetWarning: "¡Atención al presupuesto!",
    budgetWarningMessage: (percentage: string, destination: string) =>
      `Ya has utilizado el ${percentage}% de tu presupuesto de viaje a ${destination}.`,
    budgetExceeded: "¡Presupuesto excedido!",
    budgetExceededMessage: (destination: string, amount: string) =>
      `Los gastos de tu viaje a ${destination} han superado el presupuesto en ${amount}.`,
    now: "Ahora",
    retry: "Intentar de nuevo",
    backAccessibility: "Volver a mis viajes",
    closeCalendarAccessibility: "Cerrar calendario",
    removeExpenseAccessibility: "Eliminar gasto",
    addExpenseAccessibility: "Añadir gasto",
  },
} as const;

type Gasto = {
  nome: string;
  valor: number;
};

type Viagem = {
  id: string;
  nome: string;
  destino: string;
  transporte: string;
  data: string;
  dataFim?: string;
  hotelNome?: string;
  hotelEndereco?: string;
  hotelData?: string;
  orcamentoTotal?: string;
  gastos?: string | Gasto[];
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  category: string;
  icon: string;
  color: string;
  background: string;
  read: boolean;
  section: string;
  viagemId?: string;
};

type DatePickerMode = "viagem" | "fimViagem" | "checkin" | "checkout" | null;
type IconeTransporte = keyof typeof MaterialCommunityIcons.glyphMap;

type SectionHeaderProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  isDark: boolean;
  primaryText: string;
  secondaryText: string;
  accent: string;
};

const obterIconeTransporte = (transporte: string): IconeTransporte => {
  const nomeNormalizado = transporte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (
    nomeNormalizado.includes("aviao") ||
    nomeNormalizado.includes("aereo") ||
    nomeNormalizado.includes("airplane")
  )
    return "airplane";
  if (
    nomeNormalizado.includes("moto") ||
    nomeNormalizado.includes("motorcycle") ||
    nomeNormalizado.includes("motorbike")
  )
    return "motorbike";
  if (nomeNormalizado.includes("onibus") || nomeNormalizado.includes("bus"))
    return "bus";
  if (nomeNormalizado.includes("trem") || nomeNormalizado.includes("train"))
    return "train";
  if (
    nomeNormalizado.includes("navio") ||
    nomeNormalizado.includes("barco") ||
    nomeNormalizado.includes("cruzeiro") ||
    nomeNormalizado.includes("ship") ||
    nomeNormalizado.includes("ferry")
  )
    return "ferry";
  if (
    nomeNormalizado.includes("carro") ||
    nomeNormalizado.includes("automovel") ||
    nomeNormalizado.includes("car")
  )
    return "car";

  return "car";
};

function SectionHeader({
  title,
  subtitle,
  icon,
  isDark,
  primaryText,
  secondaryText,
  accent,
}: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          { backgroundColor: isDark ? "#293021" : "#EDF2E5" },
        ]}
      >
        <Ionicons name={icon} size={21} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: primaryText }]}>
          {title}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: secondaryText }]}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validarViagem(value: unknown): value is Viagem {
  if (!isRecord(value)) return false;

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
    value.data.trim().length > 0
  );
}

function validarNotificacao(value: unknown): value is NotificationItem {
  if (!isRecord(value)) return false;

  const categoriasPermitidas = [
    "viagem",
    "hospedagem",
    "passeio",
    "passeios",
    "orcamento",
  ];

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.title === "string" &&
    typeof value.message === "string" &&
    typeof value.time === "string" &&
    categoriasPermitidas.includes(value.category as string) &&
    typeof value.icon === "string" &&
    value.icon in Ionicons.glyphMap &&
    typeof value.color === "string" &&
    typeof value.background === "string" &&
    typeof value.read === "boolean" &&
    (value.section === "Hoje" || value.section === "Anteriores") &&
    (value.viagemId === undefined ||
      (typeof value.viagemId === "string" && value.viagemId.trim().length > 0))
  );
}

function normalizarCategoriaNotificacao(
  notificacao: NotificationItem,
): NotificationItem {
  if (notificacao.category !== "passeios") return notificacao;

  return {
    ...notificacao,
    category: "passeio",
  };
}

function validarGasto(value: unknown): value is Gasto {
  return (
    isRecord(value) &&
    typeof value.nome === "string" &&
    value.nome.trim().length > 0 &&
    typeof value.valor === "number" &&
    Number.isFinite(value.valor)
  );
}

function lerGastos(valor: unknown): Gasto[] {
  if (!valor) return [];

  try {
    const resultado: unknown =
      typeof valor === "string" ? JSON.parse(valor) : valor;
    return Array.isArray(resultado) ? resultado.filter(validarGasto) : [];
  } catch {
    return [];
  }
}

function converterValor(valor: string) {
  const normalizado = valor.trim().replace(",", ".");
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

function formatarData(data: Date) {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function converterData(valor: string, anoReferencia?: number): Date | null {
  const valorNormalizado = valor.trim();

  const dataISO = valorNormalizado.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dataISO) {
    const ano = Number(dataISO[1]);
    const mes = Number(dataISO[2]);
    const dia = Number(dataISO[3]);
    const resultado = new Date(ano, mes - 1, dia, 12, 0, 0);

    if (
      resultado.getDate() !== dia ||
      resultado.getMonth() !== mes - 1 ||
      resultado.getFullYear() !== ano
    ) {
      return null;
    }

    return resultado;
  }

  const correspondencia = valorNormalizado.match(
    /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/,
  );
  if (!correspondencia) return null;

  const dia = Number(correspondencia[1]);
  const mes = Number(correspondencia[2]);
  const ano = Number(
    correspondencia[3] || anoReferencia || new Date().getFullYear(),
  );
  const resultado = new Date(ano, mes - 1, dia, 12, 0, 0);

  if (
    resultado.getDate() !== dia ||
    resultado.getMonth() !== mes - 1 ||
    resultado.getFullYear() !== ano
  )
    return null;

  return resultado;
}

function formatarDataExibicao(valor: string, locale: string) {
  if (!valor.trim()) return valor;
  const dataConvertida = converterData(valor);
  if (!dataConvertida) return valor;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dataConvertida);
}

function formatarPeriodoExibicao(
  valor: string,
  locale: string,
  language: "pt-BR" | "en" | "es",
  anoReferencia?: number,
) {
  if (!valor.trim()) return valor;

  const partes = valor.split(/\s+a\s+/i);
  if (partes.length !== 2) return formatarDataExibicao(valor, locale);

  const dataInicial = converterData(partes[0], anoReferencia);
  const dataFinal = converterData(partes[1], anoReferencia);
  if (!dataInicial || !dataFinal) return valor;

  const formatador = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const separador =
    language === "en" ? " to " : language === "es" ? " al " : " a ";
  return `${formatador.format(dataInicial)}${separador}${formatador.format(dataFinal)}`;
}

export default function Detalhes() {
  const params = useLocalSearchParams<{ id: string }>();
  const viagemId = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { language, locale } = useLanguage();
  const copy = DETAIL_TRANSLATIONS[language];
  const { currency, rates, convertFromBRL, formatAmount } = useCurrency();

  const background = isDark ? "#121212" : "#F4F6FA";
  const cardBackground = isDark ? "#1E1E1E" : "#FFFFFF";
  const primaryText = isDark ? "#FFFFFF" : "#172033";
  const secondaryText = isDark ? "#A0A0A0" : "#7B8495";
  const inputBackground = isDark ? "#292929" : "#F5F7FA";
  const borderColor = isDark ? "#333333" : "#E9ECF2";
  const accent = "#8FA255";

  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [editando, setEditando] = useState(false);

  const [nome, setNome] = useState("");
  const [destino, setDestino] = useState("");
  const [transporte, setTransporte] = useState("");
  const [data, setData] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [hotelNome, setHotelNome] = useState("");
  const [hotelEndereco, setHotelEndereco] = useState("");
  const [hotelData, setHotelData] = useState("");

  const [orcamentoTotal, setOrcamentoTotal] = useState("0");
  const [orcamentoEntrada, setOrcamentoEntrada] = useState("0");

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [novoGastoNome, setNovoGastoNome] = useState("");
  const [novoGastoValor, setNovoGastoValor] = useState("");

  const [viagemNaoEncontrada, setViagemNaoEncontrada] = useState(false);

  const [datePickerMode, setDatePickerMode] = useState<DatePickerMode>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hotelCheckin, setHotelCheckin] = useState<Date | null>(null);
  const [hotelCheckout, setHotelCheckout] = useState<Date | null>(null);

  const avancandoParaCheckout = useRef(false);
  const iconeTransporte = obterIconeTransporte(transporte);

  const dataViagemExibicao = formatarDataExibicao(data, locale);
  const dataFimViagemExibicao = formatarDataExibicao(dataFim, locale);
  const periodoHospedagemExibicao = formatarPeriodoExibicao(
    hotelData,
    locale,
    language,
    converterData(data)?.getFullYear(),
  );

  const converterParaBRL = (valor: number) => {
    const taxa = rates[currency];
    if (currency === "BRL") return valor;
    if (!taxa || taxa <= 0) return null;
    return valor / taxa;
  };

  const formatarValorEntrada = (valorBRL: number) =>
    convertFromBRL(valorBRL).toFixed(2);

  const preencherDetalhes = useCallback((viagemAtual: Viagem) => {
    setViagemNaoEncontrada(false);
    setErroCarregamento(false);
    setNome(viagemAtual.nome);
    setDestino(viagemAtual.destino);
    setTransporte(viagemAtual.transporte);
    setData(viagemAtual.data);
    setDataFim(
      typeof viagemAtual.dataFim === "string" ? viagemAtual.dataFim : "",
    );
    setHotelNome(
      typeof viagemAtual.hotelNome === "string" ? viagemAtual.hotelNome : "",
    );
    setHotelEndereco(
      typeof viagemAtual.hotelEndereco === "string"
        ? viagemAtual.hotelEndereco
        : "",
    );
    setHotelData(
      typeof viagemAtual.hotelData === "string" ? viagemAtual.hotelData : "",
    );
    setGastos(lerGastos(viagemAtual.gastos));
    setOrcamentoTotal(
      typeof viagemAtual.orcamentoTotal === "string"
        ? viagemAtual.orcamentoTotal
        : "0",
    );
  }, []);

  const buscarViagem = useCallback(async (): Promise<Viagem | null> => {
    const dados = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);
    if (!dados) return null;

    const resultado: unknown = JSON.parse(dados);
    if (!Array.isArray(resultado)) {
      throw new Error("O conteúdo salvo de viagens não é uma lista válida.");
    }

    const viagens = resultado.filter(validarViagem);
    return viagens.find((viagem) => viagem.id === viagemId) || null;
  }, [viagemId]);

  const carregarDetalhesViagem = useCallback(async () => {
    setLoading(true);
    setErroCarregamento(false);
    setViagemNaoEncontrada(false);

    try {
      const viagemAtual = await buscarViagem();

      if (!viagemAtual) {
        setViagemNaoEncontrada(true);
        return;
      }

      preencherDetalhes(viagemAtual);
    } catch (error) {
      console.error("Erro ao carregar viagem:", error);
      setErroCarregamento(true);
    } finally {
      setLoading(false);
    }
  }, [buscarViagem, preencherDetalhes]);

  useEffect(() => {
    let ativo = true;

    buscarViagem()
      .then((viagemAtual) => {
        if (!ativo) return;

        if (!viagemAtual) {
          setViagemNaoEncontrada(true);
          return;
        }

        preencherDetalhes(viagemAtual);
      })
      .catch((error) => {
        console.error("Erro ao carregar viagem:", error);
        if (ativo) setErroCarregamento(true);
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [buscarViagem, preencherDetalhes]);

  const iniciarEdicao = () => {
    setOrcamentoEntrada(formatarValorEntrada(converterValor(orcamentoTotal)));
    setEditando(true);
  };

  const abrirCalendarioViagem = () => {
    setSelectedDate(converterData(data) || new Date());
    setDatePickerMode("viagem");
    setShowDatePicker(true);
  };

  const abrirCalendarioFimViagem = () => {
    setSelectedDate(
      converterData(dataFim) || converterData(data) || new Date(),
    );
    setDatePickerMode("fimViagem");
    setShowDatePicker(true);
  };

  const abrirCalendarioHospedagem = () => {
    const anoViagem =
      converterData(data)?.getFullYear() || new Date().getFullYear();
    const periodo = hotelData.split(/\s+a\s+/i);
    const checkinAtual =
      converterData(periodo[0] || "", anoViagem) || new Date();
    const checkoutAtual =
      converterData(periodo[1] || "", anoViagem) || checkinAtual;

    setHotelCheckin(checkinAtual);
    setHotelCheckout(checkoutAtual);
    setSelectedDate(checkinAtual);
    setDatePickerMode("checkin");
    setShowDatePicker(true);
  };

  const fecharCalendario = () => {
    setShowDatePicker(false);
    setDatePickerMode(null);
  };

  const alterarDataCalendario = (novaData?: Date) => {
    if (!novaData || !datePickerMode) return;

    setSelectedDate(novaData);

    if (datePickerMode === "viagem") {
      if (Platform.OS === "android") {
        setData(formatarData(novaData));
        fecharCalendario();
      }
      return;
    }

    if (datePickerMode === "fimViagem") {
      const dataInicial = converterData(data);

      if (dataInicial && novaData < dataInicial) {
        Alert.alert(copy.invalidDate, copy.endDateBeforeStart);
        return;
      }

      if (Platform.OS === "android") {
        setDataFim(formatarData(novaData));
        fecharCalendario();
      }
      return;
    }

    if (datePickerMode === "checkin") {
      setHotelCheckin(novaData);

      if (Platform.OS === "android") {
        avancandoParaCheckout.current = true;
        setShowDatePicker(false);

        setTimeout(() => {
          setSelectedDate(novaData);
          setDatePickerMode("checkout");
          setShowDatePicker(true);
        }, 350);

        setTimeout(() => {
          avancandoParaCheckout.current = false;
        }, 800);
      }
      return;
    }

    if (datePickerMode === "checkout") {
      if (hotelCheckin && novaData < hotelCheckin) {
        Alert.alert(copy.invalidDate, copy.checkoutBeforeCheckin);
        return;
      }

      setHotelCheckout(novaData);

      if (Platform.OS === "android") {
        setHotelData(
          `${formatarData(hotelCheckin || novaData)} a ${formatarData(novaData)}`,
        );
        fecharCalendario();
      }
    }
  };

  const confirmarDataIOS = () => {
    if (datePickerMode === "viagem") {
      setData(formatarData(selectedDate));
      fecharCalendario();
      return;
    }

    if (datePickerMode === "fimViagem") {
      const dataInicial = converterData(data);

      if (dataInicial && selectedDate < dataInicial) {
        Alert.alert(copy.invalidDate, copy.endDateBeforeStart);
        return;
      }

      setDataFim(formatarData(selectedDate));
      fecharCalendario();
      return;
    }

    if (datePickerMode === "checkin") {
      setHotelCheckin(selectedDate);
      setDatePickerMode("checkout");
      setSelectedDate(hotelCheckout || selectedDate);
      return;
    }

    if (datePickerMode === "checkout") {
      if (hotelCheckin && selectedDate < hotelCheckin) {
        Alert.alert(copy.invalidDate, copy.checkoutBeforeCheckin);
        return;
      }

      setHotelCheckout(selectedDate);
      setHotelData(
        `${formatarData(hotelCheckin || selectedDate)} a ${formatarData(selectedDate)}`,
      );
      fecharCalendario();
    }
  };

  const formatarMoeda = (valor: number) => formatAmount(valor);

  const totalGastos = gastos.reduce(
    (acc, curr) => acc + (Number(curr.valor) || 0),
    0,
  );
  const saldoRestante = converterValor(orcamentoTotal) - totalGastos;

  const percentualGastoReal =
    converterValor(orcamentoTotal) > 0
      ? (totalGastos / converterValor(orcamentoTotal)) * 100
      : 0;

  const percentualGasto = Math.min(percentualGastoReal, 100);

  const adicionarGasto = () => {
    const valorInformado = converterValor(novoGastoValor);

    if (
      !novoGastoNome.trim() ||
      !novoGastoValor.trim() ||
      valorInformado <= 0
    ) {
      Alert.alert(copy.attention, copy.expenseValidation);
      return;
    }

    const valorEmBRL = converterParaBRL(valorInformado);

    if (valorEmBRL === null) {
      Alert.alert(copy.quoteUnavailable, copy.quoteExpenseError);
      return;
    }

    setGastos((atual) => [
      ...atual,
      { nome: novoGastoNome.trim(), valor: valorEmBRL },
    ]);

    setNovoGastoNome("");
    setNovoGastoValor("");
  };

  const removerGasto = (index: number) => {
    setGastos((atual) => atual.filter((_, i) => i !== index));
  };

  const registrarNotificacoes = async (
    notificacoes: {
      preferencia:
        | "viagemAtualizada"
        | "hospedagem"
        | "passeios"
        | "orcamento80"
        | "orcamentoExcedido";
      titulo: string;
      mensagem: string;
      categoria: string;
      icone: string;
      cor: string;
      fundo: string;
    }[],
  ) => {
    try {
      const preferencias = await getNotificationPreferences();

      const notificacoesPermitidas = notificacoes.filter(
        (item) => preferencias[item.preferencia],
      );

      const dadosExistentes = await AsyncStorage.getItem(
        NOTIFICATIONS_STORAGE_KEY,
      );

      let notificacoesSalvas: NotificationItem[] = [];
      let precisaMigrarCategoria = false;

      if (dadosExistentes !== null) {
        const parsed: unknown = JSON.parse(dadosExistentes);

        if (!Array.isArray(parsed)) {
          throw new Error(
            "Os dados salvos de notificações não possuem uma lista válida.",
          );
        }

        if (!parsed.every(validarNotificacao)) {
          throw new Error(
            "Existem notificações salvas com estrutura inválida. A gravação foi cancelada para preservar os dados.",
          );
        }

        const notificacoesOriginais = parsed as NotificationItem[];

        precisaMigrarCategoria = notificacoesOriginais.some(
          (item) => item.category === "passeios",
        );

        notificacoesSalvas = notificacoesOriginais.map(
          normalizarCategoriaNotificacao,
        );
      }

      if (notificacoesPermitidas.length === 0) {
        if (precisaMigrarCategoria) {
          await AsyncStorage.setItem(
            NOTIFICATIONS_STORAGE_KEY,
            JSON.stringify(notificacoesSalvas),
          );

          DeviceEventEmitter.emit(NOTIFICATIONS_CHANGED_EVENT);
        }

        return;
      }

      const novasNotificacoes: NotificationItem[] = notificacoesPermitidas.map(
        (item, index) => ({
          id: `${Date.now()}-${index}`,
          title: item.titulo,
          message: item.mensagem,
          time: copy.now,
          category: item.categoria,
          icon: item.icone,
          color: item.cor,
          background: item.fundo,
          read: false,
          section: "Hoje",
          viagemId,
        }),
      );

      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify([...novasNotificacoes, ...notificacoesSalvas]),
      );

      DeviceEventEmitter.emit(NOTIFICATIONS_CHANGED_EVENT);
    } catch (error) {
      console.error("Erro ao registrar notificações:", error);
    }
  };

  const salvarEdicao = async () => {
    if (!nome.trim() || !destino.trim() || !transporte.trim() || !data.trim()) {
      Alert.alert(copy.attention, copy.fillTrip);
      return;
    }

    const dataInicial = converterData(data);
    const dataFinal = dataFim.trim() ? converterData(dataFim) : null;

    if (dataFim.trim() && !dataFinal) {
      Alert.alert(copy.invalidDate, copy.endDateBeforeStart);
      return;
    }

    if (dataInicial && dataFinal && dataFinal < dataInicial) {
      Alert.alert(copy.invalidDate, copy.endDateBeforeStart);
      return;
    }

    const valorOrcamentoInformado = converterValor(orcamentoEntrada);
    const orcamentoEmBRL = converterParaBRL(valorOrcamentoInformado);

    if (orcamentoEmBRL === null) {
      Alert.alert(copy.quoteUnavailable, copy.budgetQuoteError);
      return;
    }

    if (valorOrcamentoInformado < 0) {
      Alert.alert(copy.attention, copy.budgetValidation);
      return;
    }

    try {
      const dados = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);

      if (!dados) {
        Alert.alert(copy.error, copy.tripsNotFound);
        return;
      }

      const resultado: unknown = JSON.parse(dados);

      if (!Array.isArray(resultado)) {
        Alert.alert(copy.error, copy.tripsNotFound);
        return;
      }

      const viagemAnterior = resultado.find(
        (item): item is Viagem => validarViagem(item) && item.id === viagemId,
      );

      if (!viagemAnterior) {
        Alert.alert(copy.error, copy.tripNotFound);
        return;
      }

      const novaViagem: Viagem = {
        ...viagemAnterior,
        nome: nome.trim(),
        destino: destino.trim(),
        transporte: transporte.trim(),
        data: data.trim(),
        dataFim: dataFim.trim(),
        hotelNome: hotelNome.trim(),
        hotelEndereco: hotelEndereco.trim(),
        hotelData: hotelData.trim(),
        orcamentoTotal: String(orcamentoEmBRL),
        gastos: JSON.stringify(gastos),
      };

      const listaAtualizada = resultado.map((item) =>
        validarViagem(item) && item.id === viagemId ? novaViagem : item,
      );

      await AsyncStorage.setItem(
        TRIPS_STORAGE_KEY,
        JSON.stringify(listaAtualizada),
      );
      setOrcamentoTotal(String(orcamentoEmBRL));

      try {
        await agendarLembreteViagem(novaViagem);
      } catch (error) {
        console.error("Erro ao atualizar lembrete da viagem:", error);
      }

      const mudouInformacaoPrincipal =
        viagemAnterior.nome !== novaViagem.nome ||
        viagemAnterior.destino !== novaViagem.destino ||
        viagemAnterior.transporte !== novaViagem.transporte ||
        viagemAnterior.data !== novaViagem.data ||
        (viagemAnterior.dataFim || "") !== (novaViagem.dataFim || "");

      const mudouHospedagem =
        (viagemAnterior.hotelNome || "") !== (novaViagem.hotelNome || "") ||
        (viagemAnterior.hotelEndereco || "") !==
          (novaViagem.hotelEndereco || "") ||
        (viagemAnterior.hotelData || "") !== (novaViagem.hotelData || "");

      const orcamentoAnterior = converterValor(
        viagemAnterior.orcamentoTotal || "0",
      );
      const orcamentoNovo = converterValor(novaViagem.orcamentoTotal || "0");
      const gastosAnteriores = lerGastos(viagemAnterior.gastos);

      const totalGastosAnterior = gastosAnteriores.reduce(
        (total, gasto) => total + (Number(gasto.valor) || 0),
        0,
      );

      const totalGastosNovo = gastos.reduce(
        (total, gasto) => total + (Number(gasto.valor) || 0),
        0,
      );

      const mudouListaGastos =
        JSON.stringify(gastosAnteriores) !== JSON.stringify(gastos);

      const mudouOrcamento =
        orcamentoAnterior !== orcamentoNovo ||
        totalGastosAnterior !== totalGastosNovo;

      const mudouAlgumaInformacao =
        mudouInformacaoPrincipal ||
        mudouHospedagem ||
        mudouOrcamento ||
        mudouListaGastos;

      const percentualAnterior =
        orcamentoAnterior > 0
          ? (totalGastosAnterior / orcamentoAnterior) * 100
          : 0;

      const percentualNovo =
        orcamentoNovo > 0 ? (totalGastosNovo / orcamentoNovo) * 100 : 0;

      const notificacoesParaRegistrar: Parameters<
        typeof registrarNotificacoes
      >[0] = [];

      if (mudouAlgumaInformacao) {
        notificacoesParaRegistrar.push({
          preferencia: "viagemAtualizada",
          titulo: copy.tripUpdatedTitle,
          mensagem: copy.tripUpdatedMessage(novaViagem.destino),
          categoria: "viagem",
          icone: "create-outline",
          cor: "#8FA255",
          fundo: "#8FA25518",
        });
      }

      if (mudouHospedagem) {
        const hospedagemCadastrada =
          novaViagem.hotelNome ||
          novaViagem.hotelEndereco ||
          novaViagem.hotelData;

        notificacoesParaRegistrar.push({
          preferencia: "hospedagem",
          titulo: hospedagemCadastrada
            ? copy.accommodationUpdated
            : copy.accommodationRemoved,
          mensagem: hospedagemCadastrada
            ? copy.accommodationUpdatedMessage(novaViagem.destino)
            : copy.accommodationRemovedMessage(novaViagem.destino),
          categoria: "hospedagem",
          icone: "bed-outline",
          cor: "#6D91C7",
          fundo: "#6D91C718",
        });
      }

      if (
        orcamentoNovo > 0 &&
        percentualAnterior < 80 &&
        percentualNovo >= 80
      ) {
        notificacoesParaRegistrar.push({
          preferencia: "orcamento80",
          titulo: copy.budgetWarning,
          mensagem: copy.budgetWarningMessage(
            percentualNovo.toFixed(0),
            novaViagem.destino,
          ),
          categoria: "orcamento",
          icone: "alert-circle-outline",
          cor: "#D99A42",
          fundo: "#D99A4218",
        });
      }

      if (
        orcamentoNovo > 0 &&
        percentualAnterior <= 100 &&
        percentualNovo > 100
      ) {
        notificacoesParaRegistrar.push({
          preferencia: "orcamentoExcedido",
          titulo: copy.budgetExceeded,
          mensagem: copy.budgetExceededMessage(
            novaViagem.destino,
            formatarMoeda(totalGastosNovo - orcamentoNovo),
          ),
          categoria: "orcamento",
          icone: "warning-outline",
          cor: "#D96B6B",
          fundo: "#D96B6B18",
        });
      }

      if (notificacoesParaRegistrar.length > 0) {
        await registrarNotificacoes(notificacoesParaRegistrar);
      }

      setEditando(false);

      Alert.alert(copy.success, copy.successMessage, [
        { text: copy.continue, onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      Alert.alert(copy.error, copy.saveError);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    icon: keyof typeof Ionicons.glyphMap,
    keyboardType: "default" | "numeric" = "default",
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: secondaryText }]}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: inputBackground, borderColor },
        ]}
      >
        <Ionicons name={icon} size={18} color={accent} />
        <TextInput
          style={[styles.input, { color: primaryText }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={secondaryText}
          keyboardType={keyboardType}
          accessibilityLabel={label}
        />
      </View>
    </View>
  );

  const renderDateInput = (
    label: string,
    value: string,
    displayValue: string,
    onPress: () => void,
    placeholder: string,
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: secondaryText }]}>{label}</Text>
      <Pressable
        style={[
          styles.inputContainer,
          { backgroundColor: inputBackground, borderColor },
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? displayValue : placeholder}`}
      >
        <Ionicons name="calendar-outline" size={18} color={accent} />
        <View style={styles.dateInputTextContainer}>
          <Text
            style={[
              styles.dateInputText,
              { color: value ? primaryText : secondaryText },
            ]}
            numberOfLines={1}
          >
            {value ? displayValue : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={17} color={secondaryText} />
      </Pressable>
    </View>
  );

  const renderInfo = (
    label: string,
    value: string,
    icon: keyof typeof Ionicons.glyphMap,
  ) => (
    <View style={styles.infoItem}>
      <View
        style={[
          styles.infoIcon,
          { backgroundColor: isDark ? "#293021" : "#EDF2E5" },
        ]}
      >
        <Ionicons name={icon} size={19} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: secondaryText }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: primaryText }]}>
          {value || copy.notInformed}
        </Text>
      </View>
    </View>
  );

  const renderInfoTransporte = () => (
    <View style={styles.infoItem}>
      <View
        style={[
          styles.infoIcon,
          { backgroundColor: isDark ? "#293021" : "#EDF2E5" },
        ]}
      >
        <MaterialCommunityIcons
          name={iconeTransporte}
          size={21}
          color={accent}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: secondaryText }]}>
          {copy.transport}
        </Text>
        <Text style={[styles.infoValue, { color: primaryText }]}>
          {transporte || copy.notInformed}
        </Text>
      </View>
    </View>
  );

  const sectionHeaderProps = { isDark, primaryText, secondaryText, accent };

  const tituloCalendario =
    datePickerMode === "viagem"
      ? copy.date
      : datePickerMode === "fimViagem"
        ? copy.endDate
        : datePickerMode === "checkin"
          ? copy.selectCheckin
          : copy.selectCheckout;

  const renderCalendarioIOS = () => {
    if (!showDatePicker || Platform.OS !== "ios") return null;

    return (
      <View
        style={[
          styles.card,
          styles.datePickerCard,
          { backgroundColor: cardBackground },
        ]}
      >
        <View style={styles.datePickerHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.datePickerTitle, { color: primaryText }]}>
              {tituloCalendario}
            </Text>
            <Text style={[styles.datePickerSubtitle, { color: secondaryText }]}>
              {datePickerMode === "checkin"
                ? copy.chooseCheckin
                : datePickerMode === "checkout"
                  ? `${copy.checkin}: ${hotelCheckin ? new Intl.DateTimeFormat(locale).format(hotelCheckin) : copy.notSelected}`
                  : datePickerMode === "fimViagem"
                    ? copy.chooseTripEnd
                    : copy.chooseTripStart}
            </Text>
          </View>
          <Pressable
            onPress={fecharCalendario}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={copy.closeCalendarAccessibility}
          >
            <Ionicons
              name="close-circle-outline"
              size={25}
              color={secondaryText}
            />
          </Pressable>
        </View>

        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner"
          locale={locale}
          onValueChange={(_event, novaData) => {
            if (novaData) setSelectedDate(novaData);
          }}
          textColor={primaryText}
          style={styles.iosDatePicker}
          minimumDate={
            datePickerMode === "checkout"
              ? hotelCheckin || undefined
              : datePickerMode === "fimViagem"
                ? converterData(data) || undefined
                : undefined
          }
        />

        <View style={styles.datePickerButtons}>
          <Pressable
            style={[styles.datePickerCancel, { borderColor }]}
            onPress={fecharCalendario}
            accessibilityRole="button"
          >
            <Text
              style={[styles.datePickerCancelText, { color: secondaryText }]}
            >
              {copy.cancel}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.datePickerConfirm, { backgroundColor: accent }]}
            onPress={confirmarDataIOS}
            accessibilityRole="button"
          >
            <Text style={styles.datePickerConfirmText}>
              {datePickerMode === "checkin" ? copy.nextCheckout : copy.finish}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: background }]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  if (erroCarregamento) {
    return (
      <SafeAreaView
        style={[styles.centered, { backgroundColor: background }]}
        edges={["top", "bottom"]}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#D96B6B" />
        <Text style={[styles.emptyTitle, { color: primaryText }]}>
          {copy.error}
        </Text>
        <Text style={[styles.errorMessage, { color: secondaryText }]}>
          {copy.loadError}
        </Text>
        <Pressable
          onPress={() => void carregarDetalhesViagem()}
          accessibilityRole="button"
          accessibilityLabel={copy.retry}
          style={[styles.retryButton, { backgroundColor: accent }]}
        >
          <Text style={styles.retryButtonText}>{copy.retry}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={copy.backAccessibility}
        >
          <Text style={{ color: accent, fontWeight: "700", marginTop: 16 }}>
            {copy.backToTrips}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (viagemNaoEncontrada) {
    return (
      <SafeAreaView
        style={[styles.centered, { backgroundColor: background }]}
        edges={["top", "bottom"]}
      >
        <Ionicons name="alert-circle-outline" size={48} color={accent} />
        <Text style={[styles.emptyTitle, { color: primaryText }]}>
          {copy.tripNotFoundTitle}
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={copy.backAccessibility}
        >
          <Text style={{ color: accent, fontWeight: "700", marginTop: 12 }}>
            {copy.backToTrips}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: background }}
        edges={["top"]}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={copy.backAccessibility}
          >
            <Ionicons name="arrow-back" size={22} color={primaryText} />
            <Text style={[styles.backButtonText, { color: primaryText }]}>
              {copy.trips}
            </Text>
          </Pressable>

          <Text style={[styles.topBarTitle, { color: primaryText }]}>
            {editando ? copy.editTrip : copy.details}
          </Text>
          <View style={{ width: 80 }} />
        </View>

        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            key={datePickerMode || "date"}
            value={selectedDate}
            mode="date"
            display="calendar"
            minimumDate={
              datePickerMode === "fimViagem"
                ? converterData(data) || undefined
                : datePickerMode === "checkout"
                  ? hotelCheckin || undefined
                  : undefined
            }
            onValueChange={(_event, novaData) =>
              alterarDataCalendario(novaData)
            }
            onDismiss={() => {
              if (!avancandoParaCheckout.current) {
                setShowDatePicker(false);
                setDatePickerMode(null);
              }
            }}
          />
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.heroCard, { backgroundColor: cardBackground }]}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons
                  name={iconeTransporte}
                  size={29}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.statusTag}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{copy.planned}</Text>
              </View>
            </View>

            <Text style={[styles.heroLabel, { color: secondaryText }]}>
              {copy.experience}
            </Text>
            <Text style={[styles.heroTitle, { color: primaryText }]}>
              {nome || copy.myTrip}
            </Text>
            <View style={styles.heroDestination}>
              <Ionicons name="location" size={17} color={accent} />
              <Text
                style={[styles.heroDestinationText, { color: secondaryText }]}
              >
                {destino || copy.destinationNotInformed}
              </Text>
            </View>
          </View>

          {!editando && (
            <Pressable
              style={({ pressed }) => [
                styles.smartItineraryButton,
                {
                  backgroundColor: isDark ? "#263322" : "#EAF0E2",
                  borderColor: isDark ? "#46583A" : "#D8E3CA",
                  opacity: pressed ? 0.86 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
              onPress={() =>
                router.push(
                  `/checklist?id=${encodeURIComponent(viagemId)}` as Href,
                )
              }
              accessibilityRole="button"
              accessibilityLabel={copy.checklist}
              accessibilityHint={copy.checklistSubtitle}
            >
              <View style={styles.smartItineraryIcon}>
                <Ionicons name="checkbox-outline" size={23} color="#FFFFFF" />
              </View>
              <View style={styles.smartItineraryContent}>
                <Text
                  style={[styles.smartItineraryTitle, { color: primaryText }]}
                >
                  {copy.checklist}
                </Text>
                <Text
                  style={[
                    styles.smartItinerarySubtitle,
                    { color: secondaryText },
                  ]}
                >
                  {copy.checklistSubtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={accent} />
            </Pressable>
          )}

          {!editando && (
            <Pressable
              style={({ pressed }) => [
                styles.smartItineraryButton,
                {
                  backgroundColor: isDark ? "#263322" : "#EAF0E2",
                  borderColor: isDark ? "#46583A" : "#D8E3CA",
                  opacity: pressed ? 0.86 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
              onPress={() =>
                router.push(
                  `/roteiro?id=${encodeURIComponent(viagemId)}` as Href,
                )
              }
              accessibilityRole="button"
              accessibilityLabel={copy.smartItinerary}
              accessibilityHint={copy.smartItinerarySubtitle}
            >
              <View style={styles.smartItineraryIcon}>
                <Ionicons name="calendar-outline" size={23} color="#FFFFFF" />
              </View>
              <View style={styles.smartItineraryContent}>
                <Text
                  style={[styles.smartItineraryTitle, { color: primaryText }]}
                >
                  {copy.smartItinerary}
                </Text>
                <Text
                  style={[
                    styles.smartItinerarySubtitle,
                    { color: secondaryText },
                  ]}
                >
                  {copy.smartItinerarySubtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={accent} />
            </Pressable>
          )}

          {!editando && (
            <Pressable
              style={({ pressed }) => [
                styles.smartItineraryButton,
                {
                  backgroundColor: isDark ? "#263322" : "#EAF0E2",
                  borderColor: isDark ? "#46583A" : "#D8E3CA",
                  opacity: pressed ? 0.86 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
              onPress={() =>
                router.push(`/clima?id=${encodeURIComponent(viagemId)}` as Href)
              }
              accessibilityRole="button"
              accessibilityLabel={copy.smartWeather}
              accessibilityHint={copy.smartWeatherSubtitle}
            >
              <View style={styles.smartItineraryIcon}>
                <Ionicons name="cloud-outline" size={23} color="#FFFFFF" />
              </View>
              <View style={styles.smartItineraryContent}>
                <Text
                  style={[styles.smartItineraryTitle, { color: primaryText }]}
                >
                  {copy.smartWeather}
                </Text>
                <Text
                  style={[
                    styles.smartItinerarySubtitle,
                    { color: secondaryText },
                  ]}
                >
                  {copy.smartWeatherSubtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={accent} />
            </Pressable>
          )}

          {!editando && (
            <Pressable
              style={({ pressed }) => [
                styles.smartItineraryButton,
                {
                  backgroundColor: isDark ? "#263322" : "#EAF0E2",
                  borderColor: isDark ? "#46583A" : "#D8E3CA",
                  opacity: pressed ? 0.86 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
              onPress={() =>
                router.push(
                  `/carteira?id=${encodeURIComponent(viagemId)}` as Href,
                )
              }
              accessibilityRole="button"
              accessibilityLabel={copy.travelWallet}
              accessibilityHint={copy.travelWalletSubtitle}
            >
              <View style={styles.smartItineraryIcon}>
                <Ionicons name="briefcase-outline" size={23} color="#FFFFFF" />
              </View>
              <View style={styles.smartItineraryContent}>
                <Text
                  style={[styles.smartItineraryTitle, { color: primaryText }]}
                >
                  {copy.travelWallet}
                </Text>
                <Text
                  style={[
                    styles.smartItinerarySubtitle,
                    { color: secondaryText },
                  ]}
                >
                  {copy.travelWalletSubtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={accent} />
            </Pressable>
          )}

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <SectionHeader
              {...sectionHeaderProps}
              title={copy.tripInfo}
              subtitle={copy.tripInfoSubtitle}
              icon="map-outline"
            />
            {editando ? (
              <>
                {renderInput(
                  copy.tripName,
                  nome,
                  setNome,
                  copy.tripNamePlaceholder,
                  "bookmark-outline",
                )}
                {renderInput(
                  copy.destination,
                  destino,
                  setDestino,
                  copy.destinationPlaceholder,
                  "location-outline",
                )}
                {renderInput(
                  copy.transport,
                  transporte,
                  setTransporte,
                  copy.transportPlaceholder,
                  "car-outline",
                )}
                {renderDateInput(
                  copy.date,
                  data,
                  dataViagemExibicao,
                  abrirCalendarioViagem,
                  copy.tripDatePlaceholder,
                )}
                {datePickerMode === "viagem" && renderCalendarioIOS()}

                {renderDateInput(
                  copy.endDate,
                  dataFim,
                  dataFimViagemExibicao,
                  abrirCalendarioFimViagem,
                  copy.tripDatePlaceholder,
                )}
                {datePickerMode === "fimViagem" && renderCalendarioIOS()}
              </>
            ) : (
              <View style={styles.infoGrid}>
                {renderInfo(copy.name, nome, "bookmark-outline")}
                {renderInfo(copy.destination, destino, "location-outline")}
                {renderInfoTransporte()}
                {renderInfo(copy.date, dataViagemExibicao, "calendar-outline")}
                {!!dataFim.trim() &&
                  renderInfo(
                    copy.endDate,
                    dataFimViagemExibicao,
                    "checkmark-circle-outline",
                  )}
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <SectionHeader
              {...sectionHeaderProps}
              title={copy.accommodation}
              subtitle={copy.accommodationSubtitle}
              icon="bed-outline"
            />
            {editando ? (
              <>
                {renderInput(
                  copy.hotelName,
                  hotelNome,
                  setHotelNome,
                  copy.accommodationPlaceholder,
                  "business-outline",
                )}
                {renderInput(
                  copy.address,
                  hotelEndereco,
                  setHotelEndereco,
                  copy.fullAddress,
                  "location-outline",
                )}
                {renderDateInput(
                  copy.accommodationDate,
                  hotelData,
                  periodoHospedagemExibicao,
                  abrirCalendarioHospedagem,
                  copy.accommodationDatePlaceholder,
                )}
                {(datePickerMode === "checkin" ||
                  datePickerMode === "checkout") &&
                  renderCalendarioIOS()}
              </>
            ) : (
              <View style={styles.infoGrid}>
                {renderInfo(copy.hotel, hotelNome, "business-outline")}
                {renderInfo(copy.address, hotelEndereco, "location-outline")}
                {renderInfo(
                  copy.period,
                  periodoHospedagemExibicao,
                  "calendar-outline",
                )}
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <SectionHeader
              {...sectionHeaderProps}
              title={copy.budget}
              subtitle={copy.budgetSubtitle}
              icon="wallet-outline"
            />

            <View
              style={[
                styles.budgetMain,
                { backgroundColor: isDark ? "#293021" : "#EDF2E5" },
              ]}
            >
              <Text style={[styles.budgetLabel, { color: secondaryText }]}>
                {copy.remainingBalance}
              </Text>
              <Text
                style={[
                  styles.budgetBalance,
                  { color: saldoRestante < 0 ? "#E36D6D" : accent },
                ]}
              >
                {formatarMoeda(saldoRestante)}
              </Text>
              <View
                style={[
                  styles.progressBackground,
                  { backgroundColor: isDark ? "#41483A" : "#DCE5CE" },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percentualGasto}%`,
                      backgroundColor:
                        totalGastos > converterValor(orcamentoTotal)
                          ? "#E36D6D"
                          : accent,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.budgetHint, { color: secondaryText }]}>
                {percentualGastoReal.toFixed(0)}% {copy.budgetUsed}
              </Text>
            </View>

            {editando ? (
              <>
                {renderInput(
                  `${copy.totalBudget} (${currency})`,
                  orcamentoEntrada,
                  setOrcamentoEntrada,
                  copy.budgetPlaceholder,
                  "wallet-outline",
                  "numeric",
                )}
                {currency !== "BRL" &&
                  (!rates[currency] || rates[currency] <= 0) && (
                    <Text
                      style={[styles.currencyWarning, { color: "#D99A42" }]}
                    >
                      {copy.quoteWarning}
                    </Text>
                  )}
              </>
            ) : (
              <View
                style={[styles.budgetRow, { borderBottomColor: borderColor }]}
              >
                <Text style={[styles.budgetRowLabel, { color: secondaryText }]}>
                  {copy.totalBudget}
                </Text>
                <Text style={[styles.budgetRowValue, { color: primaryText }]}>
                  {formatarMoeda(converterValor(orcamentoTotal))}
                </Text>
              </View>
            )}

            <View
              style={[styles.budgetRow, { borderBottomColor: borderColor }]}
            >
              <Text style={[styles.budgetRowLabel, { color: secondaryText }]}>
                {copy.totalExpenses}
              </Text>
              <Text style={[styles.budgetRowValue, { color: primaryText }]}>
                {formatarMoeda(totalGastos)}
              </Text>
            </View>

            <Text style={[styles.expensesTitle, { color: primaryText }]}>
              {copy.individualExpenses}
            </Text>

            {gastos.length === 0 ? (
              <Text style={[styles.emptyMessage, { color: secondaryText }]}>
                {copy.noExpenses}
              </Text>
            ) : (
              gastos.map((item, index) => (
                <View
                  key={`${index}-${item.nome}`}
                  style={[
                    styles.expenseItem,
                    { borderBottomColor: borderColor },
                  ]}
                >
                  <View style={styles.listItemLeft}>
                    <View style={styles.expenseIcon}>
                      <Ionicons
                        name="receipt-outline"
                        size={17}
                        color={accent}
                      />
                    </View>
                    <Text style={[styles.listItemText, { color: primaryText }]}>
                      {item.nome}
                    </Text>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={[styles.expenseValue, { color: primaryText }]}>
                      {formatarMoeda(item.valor)}
                    </Text>
                    {editando && (
                      <Pressable
                        onPress={() => removerGasto(index)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`${copy.removeExpenseAccessibility}: ${item.nome}`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#D96B6B"
                        />
                      </Pressable>
                    )}
                  </View>
                </View>
              ))
            )}

            {editando && (
              <View style={styles.expenseForm}>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: inputBackground, borderColor },
                  ]}
                >
                  <Ionicons name="create-outline" size={18} color={accent} />
                  <TextInput
                    style={[styles.input, { color: primaryText }]}
                    placeholder={copy.expenseName}
                    placeholderTextColor={secondaryText}
                    value={novoGastoNome}
                    onChangeText={setNovoGastoNome}
                    accessibilityLabel={copy.expenseName}
                  />
                </View>
                <View style={styles.addRow}>
                  <View
                    style={[
                      styles.inputContainer,
                      styles.flexInput,
                      { backgroundColor: inputBackground, borderColor },
                    ]}
                  >
                    <Ionicons name="cash-outline" size={18} color={accent} />
                    <TextInput
                      style={[styles.input, { color: primaryText }]}
                      placeholder={`${copy.amount} (${currency})`}
                      placeholderTextColor={secondaryText}
                      keyboardType="decimal-pad"
                      value={novoGastoValor}
                      onChangeText={setNovoGastoValor}
                      accessibilityLabel={`${copy.amount} (${currency})`}
                    />
                  </View>
                  <Pressable
                    style={styles.addButton}
                    onPress={adicionarGasto}
                    accessibilityRole="button"
                    accessibilityLabel={copy.addExpenseAccessibility}
                  >
                    <Ionicons name="add" size={23} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.mainButton,
              { backgroundColor: accent, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => (editando ? salvarEdicao() : iniciarEdicao())}
            accessibilityRole="button"
            accessibilityLabel={editando ? copy.saveChanges : copy.editInfo}
          >
            <Ionicons
              name={editando ? "save-outline" : "create-outline"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.mainButtonText}>
              {editando ? copy.saveChanges : copy.editInfo}
            </Text>
          </Pressable>

          {editando && (
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                fecharCalendario();
                setEditando(false);
                void carregarDetalhesViagem();
              }}
              accessibilityRole="button"
              accessibilityLabel={copy.cancelEditing}
            >
              <Text style={[styles.cancelText, { color: secondaryText }]}>
                {copy.cancelEditing}
              </Text>
            </Pressable>
          )}

          <View style={{ height: 35 }} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  topBar: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    width: 80,
  },
  backButtonText: { fontSize: 14, fontWeight: "700" },
  topBarTitle: { fontSize: 16, fontWeight: "800" },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 45,
  },
  heroCard: {
    padding: 21,
    borderRadius: 20,
    marginBottom: 18,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 23,
  },
  heroIcon: {
    width: 51,
    height: 51,
    borderRadius: 16,
    backgroundColor: "#8FA255",
    justifyContent: "center",
    alignItems: "center",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8FA25520",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#8FA255",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8FA255",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 7,
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  heroDestination: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 9,
  },
  heroDestinationText: { fontSize: 13 },
  card: {
    borderRadius: 19,
    padding: 17,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  sectionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  sectionSubtitle: { fontSize: 11 },
  infoGrid: { gap: 18 },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: { fontSize: 14, fontWeight: "600" },
  field: { marginBottom: 14 },
  inputContainer: {
    minHeight: 47,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, minHeight: 45, fontSize: 13 },
  dateInputTextContainer: {
    flex: 1,
    minHeight: 47,
    justifyContent: "center",
  },
  dateInputText: { fontSize: 13 },
  datePickerCard: { paddingTop: 19 },
  datePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  datePickerTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },
  datePickerSubtitle: { fontSize: 11 },
  iosDatePicker: {
    height: 165,
    alignSelf: "center",
    width: "100%",
  },
  datePickerButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  datePickerCancel: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerCancelText: {
    fontSize: 12,
    fontWeight: "700",
  },
  datePickerConfirm: {
    flex: 1.4,
    height: 45,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerConfirmText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  listItemText: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 13,
  },
  flexInput: { flex: 1 },
  addButton: {
    width: 47,
    height: 47,
    borderRadius: 13,
    backgroundColor: "#8FA255",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMessage: { fontSize: 12, paddingVertical: 10 },
  budgetMain: {
    borderRadius: 16,
    padding: 17,
    marginBottom: 17,
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  budgetBalance: {
    fontSize: 27,
    fontWeight: "800",
    marginTop: 7,
    marginBottom: 15,
  },
  progressBackground: {
    height: 7,
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: { height: 7, borderRadius: 10 },
  budgetHint: { fontSize: 10, marginTop: 9 },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  budgetRowLabel: { fontSize: 12 },
  budgetRowValue: { fontSize: 13, fontWeight: "800" },
  expensesTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 8,
  },
  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  expenseIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#8FA25518",
    justifyContent: "center",
    alignItems: "center",
  },
  expenseRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expenseValue: { fontSize: 12, fontWeight: "700" },
  expenseForm: { marginTop: 15, gap: 10 },
  currencyWarning: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: -5,
    marginBottom: 10,
  },
  mainButton: {
    height: 53,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 5,
  },
  smartItineraryButton: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 18,
    gap: 13,
  },
  smartItineraryIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#8FA255",
    alignItems: "center",
    justifyContent: "center",
  },
  smartItineraryContent: {
    flex: 1,
    gap: 5,
  },
  smartItineraryTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  smartItinerarySubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  mainButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 15,
  },
  cancelText: { fontSize: 12, fontWeight: "700" },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 280,
  },
  retryButton: {
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
