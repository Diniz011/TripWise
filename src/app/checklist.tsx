import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useLanguage } from "../contexts/LanguageContext";

const TRIPS_STORAGE_KEY = "@viagens";

type LanguageCode = "pt-BR" | "en" | "es";

type ChecklistCategory = "packing" | "documents" | "preparations";

type ChecklistItem = {
  id: string;
  title: string;
  category: ChecklistCategory;
  completed: boolean;
};

type Trip = {
  id: string;
  nome?: string;
  destino?: string;
  checklist?: ChecklistItem[];
  [key: string]: unknown;
};

type CategoryFilter = "all" | ChecklistCategory;

const TRANSLATIONS = {
  "pt-BR": {
    title: "Checklist da viagem",
    subtitle: "Organize tudo antes de partir",
    loading: "Carregando checklist...",
    tripNotFound: "Viagem não encontrada.",
    loadError: "Não foi possível carregar o checklist.",
    saveError: "Não foi possível salvar as alterações.",
    all: "Todos",
    packing: "O que levar",
    documents: "Documentos",
    preparations: "Preparativos",
    progress: "Seu progresso",
    completed: "concluídos",
    remaining: "pendentes",
    emptyTitle: "Tudo organizado por aqui!",
    emptyDescription: "Adicione um item para começar sua checklist.",
    addItem: "Adicionar item",
    editItem: "Editar item",
    newItem: "Novo item",
    itemName: "Nome do item",
    itemPlaceholder: "Ex.: Carregador do celular",
    category: "Categoria",
    cancel: "Cancelar",
    save: "Salvar",
    add: "Adicionar",
    delete: "Excluir",
    deleteTitle: "Excluir item?",
    deleteMessage: "Este item será removido da sua checklist.",
    deleteCancel: "Cancelar",
    deleteConfirm: "Excluir",
    untitled: "Minha viagem",
    suggested: [
      { title: "Roupas para a viagem", category: "packing" },
      { title: "Calçados", category: "packing" },
      { title: "Produtos de higiene pessoal", category: "packing" },
      { title: "Carregador do celular", category: "packing" },
      { title: "Fones de ouvido", category: "packing" },
      { title: "Documentos de identificação", category: "documents" },
      { title: "Passagens e reservas", category: "documents" },
      { title: "Cartões e dinheiro", category: "documents" },
      { title: "Seguro viagem", category: "documents" },
      { title: "Confirmar hospedagem", category: "preparations" },
      { title: "Verificar previsão do tempo", category: "preparations" },
      { title: "Organizar transporte", category: "preparations" },
      { title: "Verificar horários dos passeios", category: "preparations" },
      { title: "Preparar casa antes de sair", category: "preparations" },
    ] as { title: string; category: ChecklistCategory }[],
  },
  en: {
    title: "Trip checklist",
    subtitle: "Get everything ready before you go",
    loading: "Loading checklist...",
    tripNotFound: "Trip not found.",
    loadError: "Unable to load the checklist.",
    saveError: "Unable to save your changes.",
    all: "All",
    packing: "Packing",
    documents: "Documents",
    preparations: "Preparations",
    progress: "Your progress",
    completed: "completed",
    remaining: "remaining",
    emptyTitle: "All organized!",
    emptyDescription: "Add an item to start your checklist.",
    addItem: "Add item",
    editItem: "Edit item",
    newItem: "New item",
    itemName: "Item name",
    itemPlaceholder: "E.g. Phone charger",
    category: "Category",
    cancel: "Cancel",
    save: "Save",
    add: "Add",
    delete: "Delete",
    deleteTitle: "Delete item?",
    deleteMessage: "This item will be removed from your checklist.",
    deleteCancel: "Cancel",
    deleteConfirm: "Delete",
    untitled: "My trip",
    suggested: [
      { title: "Travel clothes", category: "packing" },
      { title: "Shoes", category: "packing" },
      { title: "Personal care products", category: "packing" },
      { title: "Phone charger", category: "packing" },
      { title: "Headphones", category: "packing" },
      { title: "Identification documents", category: "documents" },
      { title: "Tickets and reservations", category: "documents" },
      { title: "Cards and cash", category: "documents" },
      { title: "Travel insurance", category: "documents" },
      { title: "Confirm accommodation", category: "preparations" },
      { title: "Check the weather forecast", category: "preparations" },
      { title: "Arrange transportation", category: "preparations" },
      { title: "Check tour schedules", category: "preparations" },
      { title: "Prepare home before leaving", category: "preparations" },
    ] as { title: string; category: ChecklistCategory }[],
  },
  es: {
    title: "Lista de viaje",
    subtitle: "Organiza todo antes de partir",
    loading: "Cargando lista...",
    tripNotFound: "Viaje no encontrado.",
    loadError: "No fue posible cargar la lista.",
    saveError: "No fue posible guardar los cambios.",
    all: "Todos",
    packing: "Qué llevar",
    documents: "Documentos",
    preparations: "Preparativos",
    progress: "Tu progreso",
    completed: "completados",
    remaining: "pendientes",
    emptyTitle: "¡Todo organizado!",
    emptyDescription: "Añade un elemento para comenzar tu lista.",
    addItem: "Añadir elemento",
    editItem: "Editar elemento",
    newItem: "Nuevo elemento",
    itemName: "Nombre del elemento",
    itemPlaceholder: "Ej.: Cargador del móvil",
    category: "Categoría",
    cancel: "Cancelar",
    save: "Guardar",
    add: "Añadir",
    delete: "Eliminar",
    deleteTitle: "¿Eliminar elemento?",
    deleteMessage: "Este elemento será eliminado de tu lista.",
    deleteCancel: "Cancelar",
    deleteConfirm: "Eliminar",
    untitled: "Mi viaje",
    suggested: [
      { title: "Ropa para el viaje", category: "packing" },
      { title: "Calzado", category: "packing" },
      { title: "Productos de higiene personal", category: "packing" },
      { title: "Cargador del móvil", category: "packing" },
      { title: "Auriculares", category: "packing" },
      { title: "Documentos de identificación", category: "documents" },
      { title: "Billetes y reservas", category: "documents" },
      { title: "Tarjetas y dinero", category: "documents" },
      { title: "Seguro de viaje", category: "documents" },
      { title: "Confirmar alojamiento", category: "preparations" },
      { title: "Consultar el pronóstico del tiempo", category: "preparations" },
      { title: "Organizar el transporte", category: "preparations" },
      { title: "Consultar horarios de excursiones", category: "preparations" },
      { title: "Preparar la casa antes de salir", category: "preparations" },
    ] as { title: string; category: ChecklistCategory }[],
  },
} as const;

const CATEGORY_CONFIG = {
  packing: {
    icon: "briefcase-outline" as const,
    color: "#8FA255",
  },
  documents: {
    icon: "document-text-outline" as const,
    color: "#5C91C9",
  },
  preparations: {
    icon: "calendar-outline" as const,
    color: "#C18A52",
  },
};

function isValidChecklistItem(value: unknown): value is ChecklistItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    (item.category === "packing" ||
      item.category === "documents" ||
      item.category === "preparations") &&
    typeof item.completed === "boolean"
  );
}

export default function ChecklistScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { language } = useLanguage();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";
  const copy = TRANSLATIONS[language as LanguageCode] ?? TRANSLATIONS["pt-BR"];

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [tripName, setTripName] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [itemTitle, setItemTitle] = useState("");
  const [itemCategory, setItemCategory] =
    useState<ChecklistCategory>("packing");
  const [loadFailed, setLoadFailed] = useState(false);

  const colors = useMemo(
    () => ({
      background: isDark ? "#121212" : "#F4F6FA",
      card: isDark ? "#1E1E1E" : "#FFFFFF",
      text: isDark ? "#FFFFFF" : "#172033",
      secondary: isDark ? "#A0A0A0" : "#7B8495",
      border: isDark ? "#333333" : "#E9ECF2",
      input: isDark ? "#292929" : "#F5F7FA",
      accent: "#8FA255",
      mutedAccent: isDark ? "#303A22" : "#EEF2E5",
      danger: "#D85B5B",
    }),
    [isDark],
  );

  // Traduz os itens padrão sem modificar os dados persistidos.
  // Itens personalizados e itens padrão editados pelo usuário
  // continuam exibindo exatamente o texto definido pelo usuário.
  const getDisplayItemTitle = useCallback(
    (item: ChecklistItem) => {
      const match = /^suggested-(\d+)$/.exec(item.id);

      if (!match) {
        return item.title;
      }

      const suggestedIndex = Number(match[1]) - 1;

      if (
        !Number.isInteger(suggestedIndex) ||
        suggestedIndex < 0 ||
        suggestedIndex >= TRANSLATIONS["pt-BR"].suggested.length
      ) {
        return item.title;
      }

      const originalTitles = [
        TRANSLATIONS["pt-BR"].suggested[suggestedIndex]?.title,
        TRANSLATIONS.en.suggested[suggestedIndex]?.title,
        TRANSLATIONS.es.suggested[suggestedIndex]?.title,
      ];

      const isUnmodifiedSuggestedItem = originalTitles.some(
        (title) => title === item.title,
      );

      if (!isUnmodifiedSuggestedItem) {
        return item.title;
      }

      return copy.suggested[suggestedIndex]?.title ?? item.title;
    },
    [copy],
  );

  const loadChecklist = useCallback(async () => {
    if (!id) {
      setLoadFailed(true);
      setLoading(false);
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);

      if (!stored) {
        setLoadFailed(true);
        return;
      }

      const trips: unknown = JSON.parse(stored);

      if (!Array.isArray(trips)) {
        setLoadFailed(true);
        return;
      }

      const trip = trips.find(
        (entry): entry is Trip =>
          !!entry &&
          typeof entry === "object" &&
          (entry as Record<string, unknown>).id === id,
      );

      if (!trip) {
        setLoadFailed(true);
        return;
      }

      setTripName(
        typeof trip.nome === "string" && trip.nome.trim()
          ? trip.nome
          : typeof trip.destino === "string" && trip.destino.trim()
            ? trip.destino
            : copy.untitled,
      );

      if (Array.isArray(trip.checklist)) {
        setItems(trip.checklist.filter(isValidChecklistItem));
      } else {
        const initialItems: ChecklistItem[] = copy.suggested.map(
          (suggestion, index) => ({
            id: `suggested-${index + 1}`,
            title: suggestion.title,
            category: suggestion.category,
            completed: false,
          }),
        );

        const updatedTrips = trips.map((entry) => {
          if (
            !entry ||
            typeof entry !== "object" ||
            (entry as Record<string, unknown>).id !== id
          ) {
            return entry;
          }

          return {
            ...(entry as Record<string, unknown>),
            checklist: initialItems,
          };
        });

        await AsyncStorage.setItem(
          TRIPS_STORAGE_KEY,
          JSON.stringify(updatedTrips),
        );

        setItems(initialItems);
      }
    } catch {
      setLoadFailed(true);
      Alert.alert(copy.title, copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [id, copy]);

  useEffect(() => {
    // A chamada inicia o carregamento assíncrono do AsyncStorage.
    // A atualização dos estados ocorre após a leitura dos dados.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChecklist();
  }, [loadChecklist]);

  const persistItems = useCallback(
    async (nextItems: ChecklistItem[]) => {
      if (!id || saving) return false;

      setSaving(true);

      try {
        const stored = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);

        if (!stored) {
          throw new Error("Trip storage not found");
        }

        const trips: unknown = JSON.parse(stored);

        if (!Array.isArray(trips)) {
          throw new Error("Invalid trip storage");
        }

        let tripFound = false;

        const updatedTrips = trips.map((entry) => {
          if (
            !entry ||
            typeof entry !== "object" ||
            (entry as Record<string, unknown>).id !== id
          ) {
            return entry;
          }

          tripFound = true;

          return {
            ...(entry as Record<string, unknown>),
            checklist: nextItems,
          };
        });

        if (!tripFound) {
          throw new Error("Trip not found");
        }

        await AsyncStorage.setItem(
          TRIPS_STORAGE_KEY,
          JSON.stringify(updatedTrips),
        );

        setItems(nextItems);
        return true;
      } catch {
        Alert.alert(copy.title, copy.saveError);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [id, saving, copy],
  );

  const filteredItems = useMemo(
    () =>
      activeCategory === "all"
        ? items
        : items.filter((item) => item.category === activeCategory),
    [items, activeCategory],
  );

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const remainingCount = totalCount - completedCount;

  const openAddModal = () => {
    setEditingItem(null);
    setItemTitle("");
    setItemCategory(activeCategory === "all" ? "packing" : activeCategory);
    setModalVisible(true);
  };

  const openEditModal = (item: ChecklistItem) => {
    setEditingItem(item);
    setItemTitle(getDisplayItemTitle(item));
    setItemCategory(item.category);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    setItemTitle("");
  };

  const saveItem = async () => {
    const trimmedTitle = itemTitle.trim();

    if (!trimmedTitle || saving) return;

    let nextItems: ChecklistItem[];

    if (editingItem) {
      nextItems = items.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              title: trimmedTitle,
              category: itemCategory,
            }
          : item,
      );
    } else {
      const newItem: ChecklistItem = {
        id: `custom-${Date.now()}`,
        title: trimmedTitle,
        category: itemCategory,
        completed: false,
      };

      nextItems = [...items, newItem];
    }

    const success = await persistItems(nextItems);

    if (success) {
      closeModal();
    }
  };

  const toggleItem = async (item: ChecklistItem) => {
    if (saving) return;

    const nextItems = items.map((current) =>
      current.id === item.id
        ? { ...current, completed: !current.completed }
        : current,
    );

    await persistItems(nextItems);
  };

  const deleteItem = (item: ChecklistItem) => {
    Alert.alert(copy.deleteTitle, copy.deleteMessage, [
      {
        text: copy.deleteCancel,
        style: "cancel",
      },
      {
        text: copy.deleteConfirm,
        style: "destructive",
        onPress: async () => {
          const nextItems = items.filter((current) => current.id !== item.id);

          await persistItems(nextItems);
        },
      },
    ]);
  };

  const categoryLabel = (category: ChecklistCategory) => {
    return copy[category];
  };

  const categoryFilters: CategoryFilter[] = [
    "all",
    "packing",
    "documents",
    "preparations",
  ];

  const renderCategoryButton = (category: CategoryFilter) => {
    const selected = activeCategory === category;
    const label = category === "all" ? copy.all : copy[category];

    return (
      <Pressable
        key={category}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        onPress={() => setActiveCategory(category)}
        style={[
          styles.categoryButton,
          {
            backgroundColor: selected ? colors.accent : colors.card,
            borderColor: selected ? colors.accent : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.categoryButtonText,
            { color: selected ? "#FFFFFF" : colors.secondary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderChecklistItem = (item: ChecklistItem) => {
    const config = CATEGORY_CONFIG[item.category];

    return (
      <View
        key={item.id}
        style={[
          styles.itemCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.completed }}
          accessibilityLabel={getDisplayItemTitle(item)}
          disabled={saving}
          onPress={() => toggleItem(item)}
          style={styles.itemMain}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: item.completed ? colors.accent : "transparent",
                borderColor: item.completed ? colors.accent : colors.secondary,
              },
            ]}
          >
            {item.completed && (
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            )}
          </View>

          <View style={styles.itemTextContainer}>
            <Text
              style={[
                styles.itemTitle,
                {
                  color: item.completed ? colors.secondary : colors.text,
                  textDecorationLine: item.completed ? "line-through" : "none",
                },
              ]}
            >
              {getDisplayItemTitle(item)}
            </Text>

            <View style={styles.itemCategory}>
              <Ionicons name={config.icon} size={12} color={config.color} />
              <Text
                style={[styles.itemCategoryText, { color: colors.secondary }]}
              >
                {categoryLabel(item.category)}
              </Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.itemActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.editItem}
            hitSlop={8}
            disabled={saving}
            onPress={() => openEditModal(item)}
            style={styles.actionButton}
          >
            <Ionicons
              name="create-outline"
              size={19}
              color={colors.secondary}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.delete}
            hitSlop={8}
            disabled={saving}
            onPress={() => deleteItem(item)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={19} color={colors.danger} />
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.centered, { backgroundColor: colors.background }]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.secondary }]}>
          {copy.loading}
        </Text>
      </SafeAreaView>
    );
  }

  if (loadFailed) {
    return (
      <SafeAreaView
        style={[styles.centered, { backgroundColor: colors.background }]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {copy.tripNotFound}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.accent }]}
        >
          <Text style={styles.backButtonText}>{copy.cancel}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.cancel}
          onPress={() => router.back()}
          style={[
            styles.headerBackButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="chevron-back" size={23} color={colors.text} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {copy.title}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.secondary }]}
            numberOfLines={1}
          >
            {tripName}
          </Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleContainer}>
              <View
                style={[
                  styles.progressIcon,
                  { backgroundColor: colors.mutedAccent },
                ]}
              >
                <Ionicons
                  name="airplane-outline"
                  size={21}
                  color={colors.accent}
                />
              </View>

              <View>
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  {copy.progress}
                </Text>
                <Text
                  style={[styles.progressSubtitle, { color: colors.secondary }]}
                >
                  {completedCount} {copy.completed}
                </Text>
              </View>
            </View>

            <Text style={[styles.progressPercentage, { color: colors.accent }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>

          <View
            style={[styles.progressTrack, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>

          <View style={styles.progressFooter}>
            <Text
              style={[styles.progressFooterText, { color: colors.secondary }]}
            >
              {totalCount} {copy.completed}
            </Text>
            <Text
              style={[styles.progressFooterText, { color: colors.secondary }]}
            >
              {remainingCount} {copy.remaining}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          {copy.subtitle}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categoryFilters.map(renderCategoryButton)}
        </ScrollView>

        <View style={styles.itemsHeader}>
          <Text style={[styles.itemsHeading, { color: colors.text }]}>
            {activeCategory === "all" ? copy.all : copy[activeCategory]}
          </Text>

          <Text style={[styles.itemsCount, { color: colors.secondary }]}>
            {filteredItems.length}
          </Text>
        </View>

        {filteredItems.length > 0 ? (
          <View style={styles.itemsList}>
            {filteredItems.map(renderChecklistItem)}
          </View>
        ) : (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.mutedAccent },
              ]}
            >
              <Ionicons
                name="clipboard-outline"
                size={32}
                color={colors.accent}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {copy.emptyTitle}
            </Text>
            <Text
              style={[styles.emptyDescription, { color: colors.secondary }]}
            >
              {copy.emptyDescription}
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.addItem}
          disabled={saving}
          onPress={openAddModal}
          style={[
            styles.addButton,
            { backgroundColor: colors.accent },
            saving && styles.disabledButton,
          ]}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{copy.addItem}</Text>
        </Pressable>

        <View style={{ height: 30 }} />
      </ScrollView>

      {saving && (
        <View
          style={[
            styles.savingIndicator,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />

          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingItem ? copy.editItem : copy.newItem}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.cancel}
                onPress={closeModal}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color={colors.secondary} />
              </Pressable>
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {copy.itemName}
            </Text>

            <TextInput
              value={itemTitle}
              onChangeText={setItemTitle}
              placeholder={copy.itemPlaceholder}
              placeholderTextColor={colors.secondary}
              maxLength={100}
              returnKeyType="done"
              onSubmitEditing={saveItem}
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                },
              ]}
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {copy.category}
            </Text>

            <View style={styles.modalCategories}>
              {(
                ["packing", "documents", "preparations"] as ChecklistCategory[]
              ).map((category) => {
                const selected = itemCategory === category;
                const config = CATEGORY_CONFIG[category];

                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setItemCategory(category)}
                    style={[
                      styles.modalCategoryButton,
                      {
                        backgroundColor: selected
                          ? colors.mutedAccent
                          : colors.input,
                        borderColor: selected ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={config.icon}
                      size={17}
                      color={config.color}
                    />
                    <Text
                      style={[styles.modalCategoryText, { color: colors.text }]}
                    >
                      {categoryLabel(category)}
                    </Text>
                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={17}
                        color={colors.accent}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={closeModal}
                style={[
                  styles.modalCancelButton,
                  { borderColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.modalCancelText, { color: colors.secondary }]}
                >
                  {copy.cancel}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={!itemTitle.trim() || saving}
                onPress={saveItem}
                style={[
                  styles.modalSaveButton,
                  { backgroundColor: colors.accent },
                  (!itemTitle.trim() || saving) && styles.disabledButton,
                ]}
              >
                <Text style={styles.modalSaveText}>
                  {editingItem ? copy.save : copy.add}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
  },
  errorText: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 14,
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
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
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  progressCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 25,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  progressTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  progressSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  progressPercentage: {
    fontSize: 25,
    fontWeight: "800",
  },
  progressTrack: {
    height: 9,
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 11,
  },
  progressFooterText: {
    fontSize: 11,
    fontWeight: "500",
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  categoryList: {
    gap: 9,
    paddingBottom: 22,
  },
  categoryButton: {
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 17,
    paddingVertical: 10,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  itemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 13,
  },
  itemsHeading: {
    fontSize: 16,
    fontWeight: "800",
  },
  itemsCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemsList: {
    gap: 10,
  },
  itemCard: {
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  itemMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
    paddingRight: 5,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  itemCategory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  itemCategoryText: {
    fontSize: 10,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  actionButton: {
    width: 32,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 26,
    alignItems: "center",
  },
  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 7,
    lineHeight: 19,
  },
  addButton: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 20,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.5,
  },
  savingIndicator: {
    position: "absolute",
    right: 20,
    bottom: 25,
    borderWidth: 1,
    borderRadius: 30,
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 22,
    padding: 21,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 23,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 9,
  },
  textInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 20,
  },
  modalCategories: {
    gap: 9,
  },
  modalCategoryButton: {
    minHeight: 45,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  modalCategoryText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 25,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalSaveButton: {
    flex: 1,
    height: 48,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
