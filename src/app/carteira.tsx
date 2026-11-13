import { useLanguage } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Categoria = "documentos" | "passagens" | "reservas";

type Registro = {
  id: string;
  categoria: Categoria;
  titulo: string;
  detalhe: string;
  data: string;
  local: string;
  observacoes: string;
};

type Formulario = {
  titulo: string;
  detalhe: string;
  data: string;
  local: string;
  observacoes: string;
};

const STORAGE_KEY_PREFIX = "@tripwise_carteira_";

const FORMULARIO_VAZIO: Formulario = {
  titulo: "",
  detalhe: "",
  data: "",
  local: "",
  observacoes: "",
};

const translations = {
  "pt-BR": {
    title: "Carteira de Viagem",
    subtitle: "Tudo o que você precisa, em um só lugar",
    loading: "Carregando carteira...",
    tripNotFound: "Não foi possível identificar esta viagem.",
    documents: "Documentos",
    tickets: "Passagens",
    reservations: "Reservas",
    documentsDescription: "Organize seus documentos importantes",
    ticketsDescription: "Tenha seus dados de transporte à mão",
    reservationsDescription: "Centralize suas reservas e confirmações",
    add: "Adicionar",
    addDocument: "Adicionar documento",
    addTicket: "Adicionar passagem",
    addReservation: "Adicionar reserva",
    editItem: "Editar registro",
    titleField: "Nome ou título",
    titlePlaceholder: "Ex.: Passaporte, voo para Lisboa...",
    detailField: "Número ou referência",
    detailPlaceholder: "Ex.: Número do documento ou localizador",
    dateField: "Data",
    datePlaceholder: "Ex.: 20/12/2026",
    locationField: "Local ou instituição",
    locationPlaceholder: "Ex.: Aeroporto, hotel ou órgão emissor",
    notesField: "Observações",
    notesPlaceholder: "Informações adicionais importantes...",
    save: "Salvar registro",
    cancel: "Cancelar",
    delete: "Excluir",
    edit: "Editar",
    emptyDocuments: "Nenhum documento cadastrado",
    emptyTickets: "Nenhuma passagem cadastrada",
    emptyReservations: "Nenhuma reserva cadastrada",
    emptyDescription:
      "Adicione suas informações para manter tudo organizado durante a viagem.",
    requiredTitle: "Informe um título para continuar.",
    deleteTitle: "Excluir registro?",
    deleteMessage: "Esta informação será removida da carteira desta viagem.",
    deleteCancel: "Manter",
    deleteConfirm: "Excluir",
    saved: "Registro salvo com sucesso!",
    updated: "Registro atualizado com sucesso!",
    disclaimer:
      "A carteira organiza informações e referências. Evite inserir senhas, códigos de acesso ou dados sensíveis completos de documentos.",
    itemCount: "registros",
    documentTypes: [
      "Passaporte",
      "RG / Identidade",
      "CNH",
      "Visto",
      "Seguro-viagem",
      "Certificado de vacinação",
      "Outro documento",
    ],
    ticketTypes: [
      "Passagem aérea",
      "Passagem de ônibus",
      "Passagem de trem",
      "Aluguel de carro",
      "Outro transporte",
    ],
    reservationTypes: [
      "Hospedagem",
      "Passeio",
      "Restaurante",
      "Evento",
      "Outra reserva",
    ],
    chooseType: "Tipo de registro",
    selectType: "Selecione uma opção",
    noDate: "Data não informada",
    noLocation: "Local não informado",
    noDetail: "Sem referência",
    back: "Voltar",
  },
  en: {
    title: "Travel Wallet",
    subtitle: "Everything you need, all in one place",
    loading: "Loading wallet...",
    tripNotFound: "Unable to identify this trip.",
    documents: "Documents",
    tickets: "Tickets",
    reservations: "Reservations",
    documentsDescription: "Organize your important documents",
    ticketsDescription: "Keep your transportation details handy",
    reservationsDescription: "Centralize your bookings and confirmations",
    add: "Add",
    addDocument: "Add document",
    addTicket: "Add ticket",
    addReservation: "Add reservation",
    editItem: "Edit record",
    titleField: "Name or title",
    titlePlaceholder: "E.g. Passport, flight to Lisbon...",
    detailField: "Number or reference",
    detailPlaceholder: "E.g. Document number or booking reference",
    dateField: "Date",
    datePlaceholder: "E.g. 12/20/2026",
    locationField: "Location or institution",
    locationPlaceholder: "E.g. Airport, hotel or issuing authority",
    notesField: "Notes",
    notesPlaceholder: "Additional important information...",
    save: "Save record",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    emptyDocuments: "No documents added",
    emptyTickets: "No tickets added",
    emptyReservations: "No reservations added",
    emptyDescription:
      "Add your information to keep everything organized during your trip.",
    requiredTitle: "Enter a title to continue.",
    deleteTitle: "Delete record?",
    deleteMessage: "This information will be removed from this trip's wallet.",
    deleteCancel: "Keep",
    deleteConfirm: "Delete",
    saved: "Record saved successfully!",
    updated: "Record updated successfully!",
    disclaimer:
      "The wallet organizes information and references. Avoid entering passwords, access codes or complete sensitive document details.",
    itemCount: "records",
    documentTypes: [
      "Passport",
      "ID card",
      "Driver's license",
      "Visa",
      "Travel insurance",
      "Vaccination certificate",
      "Other document",
    ],
    ticketTypes: [
      "Flight ticket",
      "Bus ticket",
      "Train ticket",
      "Car rental",
      "Other transportation",
    ],
    reservationTypes: [
      "Accommodation",
      "Tour",
      "Restaurant",
      "Event",
      "Other reservation",
    ],
    chooseType: "Record type",
    selectType: "Select an option",
    noDate: "Date not provided",
    noLocation: "Location not provided",
    noDetail: "No reference",
    back: "Go back",
  },
  es: {
    title: "Cartera de viaje",
    subtitle: "Todo lo que necesitas, en un solo lugar",
    loading: "Cargando cartera...",
    tripNotFound: "No fue posible identificar este viaje.",
    documents: "Documentos",
    tickets: "Billetes",
    reservations: "Reservas",
    documentsDescription: "Organiza tus documentos importantes",
    ticketsDescription: "Ten a mano los datos de tu transporte",
    reservationsDescription: "Centraliza tus reservas y confirmaciones",
    add: "Añadir",
    addDocument: "Añadir documento",
    addTicket: "Añadir billete",
    addReservation: "Añadir reserva",
    editItem: "Editar registro",
    titleField: "Nombre o título",
    titlePlaceholder: "Ej.: Pasaporte, vuelo a Lisboa...",
    detailField: "Número o referencia",
    detailPlaceholder: "Ej.: Número del documento o localizador",
    dateField: "Fecha",
    datePlaceholder: "Ej.: 20/12/2026",
    locationField: "Lugar o institución",
    locationPlaceholder: "Ej.: Aeropuerto, hotel o entidad emisora",
    notesField: "Observaciones",
    notesPlaceholder: "Información adicional importante...",
    save: "Guardar registro",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    emptyDocuments: "No hay documentos registrados",
    emptyTickets: "No hay billetes registrados",
    emptyReservations: "No hay reservas registradas",
    emptyDescription:
      "Añade tu información para mantener todo organizado durante el viaje.",
    requiredTitle: "Introduce un título para continuar.",
    deleteTitle: "¿Eliminar registro?",
    deleteMessage: "Esta información se eliminará de la cartera de este viaje.",
    deleteCancel: "Conservar",
    deleteConfirm: "Eliminar",
    saved: "¡Registro guardado correctamente!",
    updated: "¡Registro actualizado correctamente!",
    disclaimer:
      "La cartera organiza información y referencias. Evita introducir contraseñas, códigos de acceso o datos sensibles completos de documentos.",
    itemCount: "registros",
    documentTypes: [
      "Pasaporte",
      "Documento de identidad",
      "Permiso de conducir",
      "Visado",
      "Seguro de viaje",
      "Certificado de vacunación",
      "Otro documento",
    ],
    ticketTypes: [
      "Billete de avión",
      "Billete de autobús",
      "Billete de tren",
      "Alquiler de coche",
      "Otro transporte",
    ],
    reservationTypes: [
      "Alojamiento",
      "Excursión",
      "Restaurante",
      "Evento",
      "Otra reserva",
    ],
    chooseType: "Tipo de registro",
    selectType: "Selecciona una opción",
    noDate: "Fecha no indicada",
    noLocation: "Lugar no indicado",
    noDetail: "Sin referencia",
    back: "Volver",
  },
};

function normalizeLanguage(language: string) {
  if (language === "en" || language === "es") return language;
  return "pt-BR";
}

function isRegistro(value: unknown): value is Registro {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    (item.categoria === "documentos" ||
      item.categoria === "passagens" ||
      item.categoria === "reservas") &&
    typeof item.titulo === "string" &&
    typeof item.detalhe === "string" &&
    typeof item.data === "string" &&
    typeof item.local === "string" &&
    typeof item.observacoes === "string"
  );
}

export default function CarteiraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { language } = useLanguage();
  const currentLanguage = normalizeLanguage(language);
  const t = translations[currentLanguage];

  const viagemId = Array.isArray(params.id) ? params.id[0] : params.id;
  const storageKey = viagemId ? `${STORAGE_KEY_PREFIX}${viagemId}` : null;

  const [registros, setRegistros] = useState<Registro[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<Categoria>("documentos");
  const [carregando, setCarregando] = useState(true);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [categoriaFormulario, setCategoriaFormulario] =
    useState<Categoria>("documentos");
  const [registroEditando, setRegistroEditando] = useState<Registro | null>(
    null,
  );
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VAZIO);

  const [erro, setErro] = useState(false);

  const colors = useMemo(
    () => ({
      background: isDark ? "#121212" : "#F4F6FA",
      card: isDark ? "#1E1E1E" : "#FFFFFF",
      text: isDark ? "#FFFFFF" : "#172033",
      secondary: isDark ? "#A0A0A0" : "#7B8495",
      border: isDark ? "#333333" : "#E8EBF1",
      accent: "#8FA255",
      accentSoft: isDark ? "#29321E" : "#EEF2E5",
      blue: "#5D9CEC",
      blueSoft: isDark ? "#1D2B3A" : "#EAF3FF",
      orange: "#E5A33D",
      orangeSoft: isDark ? "#3A2F1D" : "#FFF4DF",
      danger: "#E35D5D",
      input: isDark ? "#292929" : "#F7F8FA",
      overlay: "rgba(0,0,0,0.55)",
    }),
    [isDark],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 18,
        },
        headerBackButton: {
          width: 42,
          height: 42,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          alignItems: "center",
          justifyContent: "center",
        },
        headerTitleContainer: {
          flex: 1,
          alignItems: "center",
          paddingHorizontal: 8,
        },
        headerTitle: {
          fontSize: 19,
          fontWeight: "800",
          color: colors.text,
        },
        headerSubtitle: {
          fontSize: 12,
          color: colors.secondary,
          marginTop: 3,
        },
        headerSpacer: {
          width: 42,
        },
        content: {
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 40,
        },
        introCard: {
          backgroundColor: colors.card,
          borderRadius: 22,
          padding: 19,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.border,
        },
        introTop: {
          flexDirection: "row",
          alignItems: "center",
        },
        introIcon: {
          width: 48,
          height: 48,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
          marginRight: 13,
        },
        introTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: "800",
        },
        introSubtitle: {
          color: colors.secondary,
          fontSize: 12,
          marginTop: 4,
          lineHeight: 18,
        },
        summaryRow: {
          flexDirection: "row",
          marginTop: 18,
          paddingTop: 15,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          justifyContent: "space-between",
        },
        summaryItem: {
          flex: 1,
          alignItems: "center",
        },
        summaryNumber: {
          color: colors.text,
          fontSize: 20,
          fontWeight: "800",
        },
        summaryLabel: {
          color: colors.secondary,
          fontSize: 11,
          marginTop: 4,
        },
        sectionTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: "800",
          marginBottom: 13,
          letterSpacing: -0.3,
        },
        tabsContainer: {
          flexDirection: "row",
          marginBottom: 17,
          gap: 8,
        },
        tab: {
          flex: 1,
          minHeight: 88,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 5,
          paddingVertical: 10,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        activeTab: {
          backgroundColor: colors.accentSoft,
          borderColor: colors.accent,
        },
        tabIcon: {
          marginBottom: 6,
        },
        tabText: {
          color: colors.secondary,
          fontSize: 10,
          fontWeight: "700",
          textAlign: "center",
        },
        activeTabText: {
          color: colors.accent,
        },
        tabCount: {
          color: colors.secondary,
          fontSize: 10,
          marginTop: 3,
        },
        categoryHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 13,
        },
        categoryTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: "800",
        },
        categorySubtitle: {
          color: colors.secondary,
          fontSize: 11,
          marginTop: 4,
        },
        addButton: {
          minHeight: 39,
          paddingHorizontal: 13,
          borderRadius: 12,
          backgroundColor: colors.accent,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        },
        addButtonText: {
          color: "#FFFFFF",
          fontSize: 12,
          fontWeight: "800",
          marginLeft: 6,
        },
        itemCard: {
          backgroundColor: colors.card,
          borderRadius: 18,
          padding: 16,
          marginBottom: 11,
          borderWidth: 1,
          borderColor: colors.border,
        },
        itemTop: {
          flexDirection: "row",
          alignItems: "flex-start",
        },
        itemIcon: {
          width: 42,
          height: 42,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
          marginRight: 11,
        },
        itemMain: {
          flex: 1,
          paddingTop: 2,
        },
        itemTitle: {
          color: colors.text,
          fontSize: 14,
          fontWeight: "800",
        },
        itemDetail: {
          color: colors.secondary,
          fontSize: 11,
          marginTop: 4,
        },
        itemMeta: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: 15,
        },
        metaItem: {
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
        },
        metaText: {
          color: colors.secondary,
          fontSize: 11,
          marginLeft: 6,
          flex: 1,
        },
        itemNotes: {
          color: colors.secondary,
          fontSize: 12,
          lineHeight: 18,
          marginTop: 12,
        },
        itemActions: {
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: 13,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: 18,
        },
        actionButton: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 4,
        },
        actionText: {
          fontSize: 11,
          fontWeight: "700",
          marginLeft: 5,
        },
        emptyCard: {
          backgroundColor: colors.card,
          borderRadius: 20,
          paddingHorizontal: 25,
          paddingVertical: 35,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
          borderStyle: "dashed",
        },
        emptyIcon: {
          width: 62,
          height: 62,
          borderRadius: 21,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
        },
        emptyTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: "800",
          marginTop: 16,
          textAlign: "center",
        },
        emptyDescription: {
          color: colors.secondary,
          fontSize: 12,
          lineHeight: 19,
          textAlign: "center",
          marginTop: 8,
        },
        emptyAddButton: {
          marginTop: 19,
          backgroundColor: colors.accent,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 13,
          flexDirection: "row",
          alignItems: "center",
        },
        disclaimer: {
          flexDirection: "row",
          alignItems: "flex-start",
          backgroundColor: colors.blueSoft,
          padding: 14,
          borderRadius: 15,
          marginTop: 20,
        },
        disclaimerText: {
          color: colors.secondary,
          fontSize: 11,
          lineHeight: 17,
          marginLeft: 9,
          flex: 1,
        },
        centerState: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          backgroundColor: colors.background,
        },
        stateTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: "800",
          textAlign: "center",
          marginTop: 16,
        },
        stateText: {
          color: colors.secondary,
          fontSize: 14,
          lineHeight: 21,
          textAlign: "center",
          marginTop: 8,
        },
        retryButton: {
          marginTop: 20,
          backgroundColor: colors.accent,
          paddingHorizontal: 25,
          paddingVertical: 13,
          borderRadius: 13,
        },
        retryText: {
          color: "#FFFFFF",
          fontWeight: "800",
          fontSize: 14,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: "flex-end",
        },
        modalContent: {
          backgroundColor: colors.background,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          maxHeight: "92%",
          paddingBottom: Platform.OS === "ios" ? 30 : 18,
        },
        modalHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 21,
          paddingTop: 22,
          paddingBottom: 17,
        },
        modalTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: "800",
        },
        closeButton: {
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        modalScroll: {
          paddingHorizontal: 21,
          paddingBottom: 15,
        },
        fieldLabel: {
          color: colors.text,
          fontSize: 12,
          fontWeight: "800",
          marginBottom: 8,
          marginTop: 15,
        },
        textInput: {
          minHeight: 47,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.input,
          paddingHorizontal: 13,
          color: colors.text,
          fontSize: 13,
        },
        textArea: {
          minHeight: 90,
          paddingTop: 13,
          textAlignVertical: "top",
        },
        typeOptions: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        },
        typeOption: {
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        activeTypeOption: {
          borderColor: colors.accent,
          backgroundColor: colors.accentSoft,
        },
        typeOptionText: {
          color: colors.secondary,
          fontSize: 11,
          fontWeight: "700",
        },
        activeTypeOptionText: {
          color: colors.accent,
        },
        saveButton: {
          minHeight: 51,
          borderRadius: 15,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
          marginHorizontal: 21,
          marginTop: 18,
          flexDirection: "row",
        },
        saveButtonText: {
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: "800",
          marginLeft: 8,
        },
        cancelButton: {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 13,
          marginHorizontal: 21,
          marginTop: 5,
        },
        cancelText: {
          color: colors.secondary,
          fontSize: 13,
          fontWeight: "700",
        },
      }),
    [colors],
  );

  useEffect(() => {
    let active = true;

    async function carregarRegistros() {
      setCarregando(true);
      setErro(false);
      setLoadedKey(null);
      setRegistros([]);

      if (!storageKey) {
        setErro(true);
        setCarregando(false);
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(storageKey);

        if (!active) return;

        if (stored) {
          const parsed: unknown = JSON.parse(stored);

          if (Array.isArray(parsed)) {
            setRegistros(parsed.filter(isRegistro));
          }
        }

        setLoadedKey(storageKey);
      } catch {
        if (active) {
          setErro(true);
        }
      } finally {
        if (active) {
          setCarregando(false);
        }
      }
    }

    void carregarRegistros();

    return () => {
      active = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || loadedKey !== storageKey) return;

    const salvarRegistros = async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(registros));
      } catch {
        Alert.alert(
          t.title,
          currentLanguage === "en"
            ? "Unable to save the wallet information."
            : currentLanguage === "es"
              ? "No fue posible guardar la información de la cartera."
              : "Não foi possível salvar as informações da carteira.",
        );
      }
    };

    void salvarRegistros();
  }, [registros, storageKey, loadedKey, t.title, currentLanguage]);

  const contagem = useMemo(
    () => ({
      documentos: registros.filter((item) => item.categoria === "documentos")
        .length,
      passagens: registros.filter((item) => item.categoria === "passagens")
        .length,
      reservas: registros.filter((item) => item.categoria === "reservas")
        .length,
    }),
    [registros],
  );

  const registrosFiltrados = useMemo(
    () => registros.filter((item) => item.categoria === categoriaAtiva),
    [registros, categoriaAtiva],
  );

  const categorias = [
    {
      id: "documentos" as const,
      label: t.documents,
      icon: "document-text-outline" as const,
      count: contagem.documentos,
    },
    {
      id: "passagens" as const,
      label: t.tickets,
      icon: "airplane-outline" as const,
      count: contagem.passagens,
    },
    {
      id: "reservas" as const,
      label: t.reservations,
      icon: "calendar-outline" as const,
      count: contagem.reservas,
    },
  ];

  const tiposDisponiveis =
    categoriaFormulario === "documentos"
      ? t.documentTypes
      : categoriaFormulario === "passagens"
        ? t.ticketTypes
        : t.reservationTypes;

  const categoriaTitulo =
    categoriaAtiva === "documentos"
      ? t.documents
      : categoriaAtiva === "passagens"
        ? t.tickets
        : t.reservations;

  const categoriaDescricao =
    categoriaAtiva === "documentos"
      ? t.documentsDescription
      : categoriaAtiva === "passagens"
        ? t.ticketsDescription
        : t.reservationsDescription;

  const tituloVazio =
    categoriaAtiva === "documentos"
      ? t.emptyDocuments
      : categoriaAtiva === "passagens"
        ? t.emptyTickets
        : t.emptyReservations;

  const tituloFormulario = registroEditando
    ? t.editItem
    : categoriaFormulario === "documentos"
      ? t.addDocument
      : categoriaFormulario === "passagens"
        ? t.addTicket
        : t.addReservation;

  function abrirNovoRegistro(categoria: Categoria) {
    setCategoriaFormulario(categoria);
    setRegistroEditando(null);
    setFormulario(FORMULARIO_VAZIO);
    setModalVisible(true);
  }

  function abrirEdicao(registro: Registro) {
    setCategoriaFormulario(registro.categoria);
    setRegistroEditando(registro);
    setFormulario({
      titulo: registro.titulo,
      detalhe: registro.detalhe,
      data: registro.data,
      local: registro.local,
      observacoes: registro.observacoes,
    });
    setModalVisible(true);
  }

  function fecharModal() {
    setModalVisible(false);
    setRegistroEditando(null);
    setFormulario(FORMULARIO_VAZIO);
  }

  function atualizarCampo(campo: keyof Formulario, valor: string) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function salvarRegistro() {
    const titulo = formulario.titulo.trim();

    if (!titulo) {
      Alert.alert(t.title, t.requiredTitle);
      return;
    }

    const novoRegistro: Registro = {
      id: registroEditando?.id ?? `${Date.now()}-${Math.random()}`,
      categoria: categoriaFormulario,
      titulo,
      detalhe: formulario.detalhe.trim(),
      data: formulario.data.trim(),
      local: formulario.local.trim(),
      observacoes: formulario.observacoes.trim(),
    };

    setRegistros((atuais) => {
      if (registroEditando) {
        return atuais.map((item) =>
          item.id === registroEditando.id ? novoRegistro : item,
        );
      }

      return [novoRegistro, ...atuais];
    });

    setCategoriaAtiva(categoriaFormulario);
    fecharModal();

    Alert.alert(t.title, registroEditando ? t.updated : t.saved);
  }

  function confirmarExclusao(registro: Registro) {
    Alert.alert(t.deleteTitle, t.deleteMessage, [
      {
        text: t.deleteCancel,
        style: "cancel",
      },
      {
        text: t.deleteConfirm,
        style: "destructive",
        onPress: () => {
          setRegistros((atuais) =>
            atuais.filter((item) => item.id !== registro.id),
          );
        },
      },
    ]);
  }

  function voltar() {
    router.back();
  }

  function renderHeader() {
    return (
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.back}
          onPress={voltar}
          style={styles.headerBackButton}
          hitSlop={6}
        >
          <Ionicons name="chevron-back" size={23} color={colors.text} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t.title}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {t.subtitle}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>
    );
  }

  function renderRegistro(registro: Registro) {
    const icon =
      registro.categoria === "documentos"
        ? "document-text-outline"
        : registro.categoria === "passagens"
          ? "airplane-outline"
          : "calendar-outline";

    return (
      <View key={registro.id} style={styles.itemCard}>
        <View style={styles.itemTop}>
          <View style={styles.itemIcon}>
            <Ionicons name={icon} size={22} color={colors.accent} />
          </View>

          <View style={styles.itemMain}>
            <Text style={styles.itemTitle}>{registro.titulo}</Text>
            <Text style={styles.itemDetail}>
              {registro.detalhe || t.noDetail}
            </Text>
          </View>
        </View>

        <View style={styles.itemMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={15} color={colors.accent} />
            <Text style={styles.metaText} numberOfLines={1}>
              {registro.data || t.noDate}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={15} color={colors.accent} />
            <Text style={styles.metaText} numberOfLines={1}>
              {registro.local || t.noLocation}
            </Text>
          </View>
        </View>

        {!!registro.observacoes && (
          <Text style={styles.itemNotes}>{registro.observacoes}</Text>
        )}

        <View style={styles.itemActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t.edit}: ${registro.titulo}`}
            onPress={() => abrirEdicao(registro)}
            style={styles.actionButton}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={16} color={colors.accent} />
            <Text style={[styles.actionText, { color: colors.accent }]}>
              {t.edit}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t.delete}: ${registro.titulo}`}
            onPress={() => confirmarExclusao(registro)}
            style={styles.actionButton}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>
              {t.delete}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        {renderHeader()}

        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.stateText}>{t.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (erro) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        {renderHeader()}

        <View style={styles.centerState}>
          <Ionicons
            name="alert-circle-outline"
            size={52}
            color={colors.secondary}
          />
          <Text style={styles.stateTitle}>{t.tripNotFound}</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={voltar}
          >
            <Text style={styles.retryText}>{t.back}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {renderHeader()}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introCard}>
          <View style={styles.introTop}>
            <View style={styles.introIcon}>
              <Ionicons
                name="briefcase-outline"
                size={25}
                color={colors.accent}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>{t.title}</Text>
              <Text style={styles.introSubtitle}>{t.subtitle}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            {categorias.map((categoria) => (
              <View key={categoria.id} style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{categoria.count}</Text>
                <Text style={styles.summaryLabel}>{categoria.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t.chooseType}</Text>

        <View style={styles.tabsContainer}>
          {categorias.map((categoria) => {
            const ativa = categoriaAtiva === categoria.id;

            return (
              <Pressable
                key={categoria.id}
                accessibilityRole="button"
                accessibilityLabel={`${categoria.label}: ${categoria.count} ${t.itemCount}`}
                accessibilityState={{ selected: ativa }}
                onPress={() => setCategoriaAtiva(categoria.id)}
                style={[styles.tab, ativa && styles.activeTab]}
              >
                <Ionicons
                  name={categoria.icon}
                  size={21}
                  color={ativa ? colors.accent : colors.secondary}
                  style={styles.tabIcon}
                />
                <Text
                  style={[styles.tabText, ativa && styles.activeTabText]}
                  numberOfLines={1}
                >
                  {categoria.label}
                </Text>
                <Text style={styles.tabCount}>{categoria.count}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.categoryHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.categoryTitle}>{categoriaTitulo}</Text>
            <Text style={styles.categorySubtitle}>{categoriaDescricao}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t.add} ${categoriaTitulo}`}
            onPress={() => abrirNovoRegistro(categoriaAtiva)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>{t.add}</Text>
          </Pressable>
        </View>

        {registrosFiltrados.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  categoriaAtiva === "documentos"
                    ? "document-text-outline"
                    : categoriaAtiva === "passagens"
                      ? "airplane-outline"
                      : "calendar-outline"
                }
                size={29}
                color={colors.accent}
              />
            </View>

            <Text style={styles.emptyTitle}>{tituloVazio}</Text>

            <Text style={styles.emptyDescription}>{t.emptyDescription}</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => abrirNovoRegistro(categoriaAtiva)}
              style={styles.emptyAddButton}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>{t.add}</Text>
            </Pressable>
          </View>
        ) : (
          registrosFiltrados.map(renderRegistro)
        )}

        <View style={styles.disclaimer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={colors.blue}
          />
          <Text style={styles.disclaimerText}>{t.disclaimer}</Text>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={fecharModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tituloFormulario}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.cancel}
                onPress={fecharModal}
                style={styles.closeButton}
                hitSlop={6}
              >
                <Ionicons name="close" size={21} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.fieldLabel}>{t.chooseType}</Text>

              <View style={styles.typeOptions}>
                {tiposDisponiveis.map((tipo) => {
                  const selecionado = formulario.detalhe === tipo;

                  return (
                    <Pressable
                      key={tipo}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selecionado }}
                      onPress={() => atualizarCampo("detalhe", tipo)}
                      style={[
                        styles.typeOption,
                        selecionado && styles.activeTypeOption,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          selecionado && styles.activeTypeOptionText,
                        ]}
                      >
                        {tipo}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>{t.titleField} *</Text>
              <TextInput
                accessibilityLabel={t.titleField}
                value={formulario.titulo}
                onChangeText={(value) => atualizarCampo("titulo", value)}
                placeholder={t.titlePlaceholder}
                placeholderTextColor={colors.secondary}
                style={styles.textInput}
                maxLength={100}
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>{t.detailField}</Text>
              <TextInput
                accessibilityLabel={t.detailField}
                value={
                  formulario.detalhe &&
                  !tiposDisponiveis.includes(formulario.detalhe)
                    ? formulario.detalhe
                    : ""
                }
                onChangeText={(value) => atualizarCampo("detalhe", value)}
                placeholder={t.detailPlaceholder}
                placeholderTextColor={colors.secondary}
                style={styles.textInput}
                maxLength={100}
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>{t.dateField}</Text>
              <TextInput
                accessibilityLabel={t.dateField}
                value={formulario.data}
                onChangeText={(value) => atualizarCampo("data", value)}
                placeholder={t.datePlaceholder}
                placeholderTextColor={colors.secondary}
                style={styles.textInput}
                maxLength={30}
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>{t.locationField}</Text>
              <TextInput
                accessibilityLabel={t.locationField}
                value={formulario.local}
                onChangeText={(value) => atualizarCampo("local", value)}
                placeholder={t.locationPlaceholder}
                placeholderTextColor={colors.secondary}
                style={styles.textInput}
                maxLength={100}
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>{t.notesField}</Text>
              <TextInput
                accessibilityLabel={t.notesField}
                value={formulario.observacoes}
                onChangeText={(value) => atualizarCampo("observacoes", value)}
                placeholder={t.notesPlaceholder}
                placeholderTextColor={colors.secondary}
                style={[styles.textInput, styles.textArea]}
                multiline
                maxLength={500}
              />
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              onPress={salvarRegistro}
              style={styles.saveButton}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.saveButtonText}>{t.save}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={fecharModal}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
