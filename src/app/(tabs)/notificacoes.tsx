import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  DeviceEventEmitter,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

type NotificationCardProps = {
  item: NotificationItem;
  isDark: boolean;
  cardBackground: string;
  primaryText: string;
  secondaryText: string;
  borderColor: string;
  accent: string;
  onPress: () => void;
  onDelete: () => void;
};

const STORAGE_KEY = "@tripwise_notificacoes";
const NOTIFICATIONS_CHANGED_EVENT = "tripwise:notificationsChanged";
const SWIPE_DELETE_WIDTH = 92;

const SAMPLE_NOTIFICATIONS = [
  { id: "1", title: "Sua viagem está chegando!" },
  { id: "2", title: "Confira sua hospedagem" },
  { id: "3", title: "Atenção ao orçamento" },
  { id: "4", title: "Passeio adicionado" },
  { id: "5", title: "Viagem criada com sucesso" },
];

function isSampleNotification(item: NotificationItem) {
  return SAMPLE_NOTIFICATIONS.some(
    (sample) => sample.id === item.id && sample.title === item.title,
  );
}

// Card com gesto de deslizar para a esquerda.
function NotificationCard({
  item,
  isDark,
  cardBackground,
  primaryText,
  secondaryText,
  borderColor,
  accent,
  onPress,
  onDelete,
}: NotificationCardProps) {
  const [translateX] = useState(() => new Animated.Value(0));
  const [isOpen, setIsOpen] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const currentDx = useRef(0);
  const horizontalGesture = useRef(false);
  const lastSwipeAt = useRef(0);

  const animarPara = (destino: number) => {
    Animated.spring(translateX, {
      toValue: destino,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start(() => {
      setIsOpen(destino !== 0);
    });
  };

  const fecharAcao = () => {
    currentDx.current = 0;
    horizontalGesture.current = false;
    animarPara(0);
  };

  // Registra a posição inicial do toque.
  const handleTouchStart = (event: any) => {
    startX.current = event.nativeEvent.pageX;
    startY.current = event.nativeEvent.pageY;
    startOffset.current = isOpen ? -SWIPE_DELETE_WIDTH : 0;
    currentDx.current = startOffset.current;
    horizontalGesture.current = false;
  };

  // Só assume o gesto quando identifica um movimento horizontal.
  // Assim, a rolagem vertical continua funcionando normalmente.
  const handleMoveShouldSetResponder = (event: any) => {
    const deslocamentoX = event.nativeEvent.pageX - startX.current;
    const deslocamentoY = event.nativeEvent.pageY - startY.current;

    const movimentoHorizontal =
      Math.abs(deslocamentoX) > 10 &&
      Math.abs(deslocamentoX) > Math.abs(deslocamentoY);

    if (movimentoHorizontal) {
      horizontalGesture.current = true;
    }

    return movimentoHorizontal;
  };

  // Atualiza a posição do card enquanto o dedo se movimenta.
  const handleResponderMove = (event: any) => {
    if (!horizontalGesture.current) return;

    const deslocamentoX = event.nativeEvent.pageX - startX.current;

    const deslocamento = Math.max(
      -SWIPE_DELETE_WIDTH,
      Math.min(0, startOffset.current + deslocamentoX),
    );

    currentDx.current = deslocamento;
    translateX.setValue(deslocamento);
  };

  // Ao soltar, decide se o botão de exclusão deve permanecer aberto.
  const handleResponderRelease = () => {
    if (!horizontalGesture.current) return;

    const deveAbrir = currentDx.current < -SWIPE_DELETE_WIDTH / 2;

    horizontalGesture.current = false;
    lastSwipeAt.current = Date.now();

    animarPara(deveAbrir ? -SWIPE_DELETE_WIDTH : 0);
  };

  // Se o sistema interromper o gesto, restaura a posição do card.
  const handleResponderTerminate = () => {
    if (!horizontalGesture.current) return;

    horizontalGesture.current = false;
    lastSwipeAt.current = Date.now();

    animarPara(0);
  };

  // O botão só ganha opacidade conforme o card é arrastado.
  const deleteOpacity = translateX.interpolate({
    inputRange: [-SWIPE_DELETE_WIDTH, -10, 0],
    outputRange: [1, 0, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.deleteActionContainer}>
        <Animated.View
          style={[styles.deleteActionWrapper, { opacity: deleteOpacity }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Excluir notificação: ${item.title}`}
            disabled={!isOpen}
            onPress={() => {
              fecharAcao();
              onDelete();
            }}
            style={styles.deleteAction}
          >
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
            <Text style={styles.deleteActionText}>Excluir</Text>
          </Pressable>
        </Animated.View>
      </View>

      <Animated.View
        onTouchStart={handleTouchStart}
        onMoveShouldSetResponder={handleMoveShouldSetResponder}
        onMoveShouldSetResponderCapture={handleMoveShouldSetResponder}
        onResponderMove={handleResponderMove}
        onResponderRelease={handleResponderRelease}
        onResponderTerminate={handleResponderTerminate}
        onResponderTerminationRequest={() => false}
        style={[
          styles.notificationCardAnimated,
          { transform: [{ translateX }] },
        ]}
      >
        <Pressable
          onPress={() => {
            // Impede que o término de um arraste seja interpretado
            // como um toque para abrir os detalhes da viagem.
            if (Date.now() - lastSwipeAt.current < 400) {
              return;
            }

            if (isOpen) {
              fecharAcao();
              return;
            }

            onPress();
          }}
          style={[
            styles.notificationCard,
            {
              backgroundColor: cardBackground,
              borderColor,
              opacity: item.read ? 0.82 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDark ? `${item.color}25` : item.background,
              },
            ]}
          >
            <Ionicons name={item.icon} size={23} color={item.color} />
          </View>

          <View style={styles.notificationContent}>
            <View style={styles.notificationTop}>
              <Text style={[styles.notificationTitle, { color: primaryText }]}>
                {item.title}
              </Text>

              {!item.read && (
                <View style={[styles.unreadDot, { backgroundColor: accent }]} />
              )}
            </View>

            <Text
              style={[styles.notificationMessage, { color: secondaryText }]}
            >
              {item.message}
            </Text>

            <Text style={[styles.notificationTime, { color: secondaryText }]}>
              {item.time}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function Notificacoes() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"Todas" | "Não lidas">("Todas");
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((item) => !item.read).length;

  // Recarrega as notificações sempre que a aba recebe foco.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadNotifications() {
        try {
          setLoading(true);

          const saved = await AsyncStorage.getItem(STORAGE_KEY);

          if (saved) {
            const parsed: unknown = JSON.parse(saved);

            if (Array.isArray(parsed)) {
              const validNotifications = parsed.filter(
                (item): item is NotificationItem =>
                  item !== null &&
                  typeof item === "object" &&
                  typeof item.id === "string" &&
                  typeof item.title === "string" &&
                  typeof item.read === "boolean",
              );

              const cleanedNotifications = validNotifications.filter(
                (item) => !isSampleNotification(item),
              );

              if (isActive) {
                setNotifications(cleanedNotifications);
              }

              if (cleanedNotifications.length !== validNotifications.length) {
                await AsyncStorage.setItem(
                  STORAGE_KEY,
                  JSON.stringify(cleanedNotifications),
                );

                DeviceEventEmitter.emit(NOTIFICATIONS_CHANGED_EVENT);
              }
            } else {
              if (isActive) {
                setNotifications([]);
              }

              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
              DeviceEventEmitter.emit(NOTIFICATIONS_CHANGED_EVENT);
            }
          } else {
            if (isActive) {
              setNotifications([]);
            }

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
            DeviceEventEmitter.emit(NOTIFICATIONS_CHANGED_EVENT);
          }
        } catch (error) {
          console.error("Erro ao carregar notificações:", error);

          if (isActive) {
            setNotifications([]);
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadNotifications();

      return () => {
        isActive = false;
      };
    }, []),
  );

  // Atualiza o estado, salva a lista e avisa a Tab Bar.
  async function salvarNotificacoes(lista: NotificationItem[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista));

      setNotifications(lista);
      DeviceEventEmitter.emit(NOTIFICATIONS_CHANGED_EVENT);
    } catch (error) {
      console.error("Erro ao salvar notificações:", error);

      Alert.alert(
        "Erro",
        "Não foi possível atualizar suas notificações. Tente novamente.",
      );
    }
  }

  async function markAsRead(id: string) {
    const updated = notifications.map((item) =>
      item.id === id ? { ...item, read: true } : item,
    );

    await salvarNotificacoes(updated);
  }

  async function markAllAsRead() {
    const updated = notifications.map((item) => ({
      ...item,
      read: true,
    }));

    await salvarNotificacoes(updated);
  }

  // Exclui uma notificação individual.
  function confirmarExclusao(item: NotificationItem) {
    Alert.alert(
      "Excluir notificação",
      "Deseja realmente excluir esta notificação?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            const updated = notifications.filter(
              (notification) => notification.id !== item.id,
            );

            void salvarNotificacoes(updated);
          },
        },
      ],
    );
  }

  // Exclui todas as notificações armazenadas.
  function confirmarExclusaoTodas() {
    if (notifications.length === 0) return;

    Alert.alert(
      "Excluir todas as notificações",
      "Tem certeza de que deseja excluir todas as notificações? Essa ação não poderá ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir todas",
          style: "destructive",
          onPress: () => {
            void salvarNotificacoes([]);
          },
        },
      ],
    );
  }

  // Marca a notificação como lida e abre a viagem relacionada.
  async function handleNotificationPress(item: NotificationItem) {
    await markAsRead(item.id);

    if (!item.viagemId) return;

    try {
      const dados = await AsyncStorage.getItem("@viagens");

      if (!dados) {
        Alert.alert(
          "Viagem não encontrada",
          "Essa viagem não está mais disponível.",
        );
        return;
      }

      const viagens: unknown = JSON.parse(dados);

      if (!Array.isArray(viagens)) {
        Alert.alert(
          "Viagem não encontrada",
          "Não foi possível localizar essa viagem.",
        );
        return;
      }

      const viagemExiste = viagens.some(
        (viagem: { id?: string }) => viagem?.id === item.viagemId,
      );

      if (!viagemExiste) {
        Alert.alert(
          "Viagem não disponível",
          "Essa viagem foi excluída ou não está mais cadastrada.",
        );
        return;
      }

      router.push({
        pathname: "/detalhes",
        params: { id: item.viagemId },
      });
    } catch (error) {
      console.error("Erro ao abrir viagem pela notificação:", error);

      Alert.alert("Erro", "Não foi possível abrir os detalhes dessa viagem.");
    }
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) =>
      filter === "Não lidas" ? !item.read : true,
    );
  }, [notifications, filter]);

  const background = isDark ? "#121212" : "#F4F6FA";
  const cardBackground = isDark ? "#1E1E1E" : "#FFFFFF";
  const primaryText = isDark ? "#FFFFFF" : "#172033";
  const secondaryText = isDark ? "#A0A0A0" : "#7B8495";
  const borderColor = isDark ? "#303030" : "#E9ECF2";
  const accent = "#8FA255";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.intro}>
          <View>
            <Text style={[styles.subtitle, { color: secondaryText }]}>
              Fique por dentro
            </Text>
            <Text style={[styles.heading, { color: primaryText }]}>
              Suas notificações
            </Text>
          </View>

          {unreadCount > 0 && (
            <View style={[styles.countCircle, { backgroundColor: accent }]}>
              <Text style={styles.countText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons name="notifications" size={21} color={accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.summaryTitle, { color: primaryText }]}>
              Tudo em um só lugar
            </Text>

            <Text style={[styles.summaryDescription, { color: secondaryText }]}>
              Acompanhe atualizações importantes das suas viagens.
            </Text>
          </View>
        </View>

        <View style={styles.filterHeader}>
          <View style={styles.filters}>
            {(["Todas", "Não lidas"] as const).map((item) => {
              const selected = filter === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: selected ? accent : cardBackground,
                      borderColor: selected ? accent : borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: selected ? "#FFFFFF" : secondaryText },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Ações em uma linha separada para evitar toques acidentais. */}
          <View style={styles.actions}>
            {unreadCount > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Marcar todas as notificações como lidas"
                onPress={markAllAsRead}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.markAllButton,
                  pressed && styles.actionPressed,
                ]}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={18}
                  color={accent}
                />
                <Text style={[styles.markAll, { color: accent }]}>
                  Ler todas
                </Text>
              </Pressable>
            )}

            {notifications.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Excluir todas as notificações"
                onPress={confirmarExclusaoTodas}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.deleteAllButton,
                  pressed && styles.actionPressed,
                ]}
              >
                <Ionicons name="trash-outline" size={17} color="#E45B5B" />
                <Text style={styles.deleteAllText}>Excluir todas</Text>
              </Pressable>
            )}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={accent}
            style={{ marginTop: 50 }}
          />
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: isDark ? "#252B20" : "#EDF2E5" },
              ]}
            >
              <Ionicons
                name="checkmark-done-circle-outline"
                size={42}
                color={accent}
              />
            </View>

            <Text style={[styles.emptyTitle, { color: primaryText }]}>
              Tudo em dia!
            </Text>

            <Text style={[styles.emptyDescription, { color: secondaryText }]}>
              Você não tem notificações pendentes por aqui.
            </Text>
          </View>
        ) : (
          (["Hoje", "Anteriores"] as const).map((section) => {
            const items = filteredNotifications.filter(
              (item) => item.section === section,
            );

            if (items.length === 0) return null;

            return (
              <View key={section} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: primaryText }]}>
                  {section}
                </Text>

                {items.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    isDark={isDark}
                    cardBackground={cardBackground}
                    primaryText={primaryText}
                    secondaryText={secondaryText}
                    borderColor={borderColor}
                    accent={accent}
                    onPress={() => handleNotificationPress(item)}
                    onDelete={() => confirmarExclusao(item)}
                  />
                ))}
              </View>
            );
          })
        )}

        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={15}
            color={secondaryText}
          />

          <Text style={[styles.footerText, { color: secondaryText }]}>
            Sua experiência de viagem, sempre organizada.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 140,
  },
  intro: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  heading: {
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  countCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    padding: 17,
    borderRadius: 18,
    backgroundColor: "#8FA25515",
    marginBottom: 26,
    gap: 13,
  },
  summaryIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#8FA25520",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  filterHeader: {
    flexDirection: "column",
    alignItems: "stretch",
    marginBottom: 24,
  },
  filters: {
    flexDirection: "row",
    gap: 9,
  },
  filterButton: {
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingHorizontal: 4,
    gap: 16,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#8FA25518",
  },
  markAll: {
    fontSize: 13,
    fontWeight: "700",
  },
  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
  },
  deleteAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E45B5B",
  },
  actionPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 13,
  },
  swipeContainer: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    borderRadius: 17,
    marginBottom: 11,
  },
  deleteActionContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  deleteActionWrapper: {
    width: SWIPE_DELETE_WIDTH,
    height: "100%",
  },
  deleteAction: {
    flex: 1,
    backgroundColor: "#E34F4F",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 14,
  },
  deleteActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  notificationCardAnimated: {
    width: "100%",
    zIndex: 1,
  },
  notificationCard: {
    width: "100%",
    flexDirection: "row",
    padding: 15,
    borderRadius: 17,
    borderWidth: 1,
    gap: 13,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  notificationMessage: {
    fontSize: 12,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 10,
    marginTop: 10,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 55,
  },
  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 7,
  },
  emptyDescription: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 8,
  },
  footerText: {
    fontSize: 10,
  },
});
