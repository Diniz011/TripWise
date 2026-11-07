import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
};

const STORAGE_KEY = "@tripwise_notificacoes";

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Sua viagem está chegando!",
    message:
      "Está quase na hora de fazer as malas. Confira os detalhes da sua viagem.",
    time: "Há 2 horas",
    category: "viagem",
    icon: "airplane",
    color: "#6685D9",
    background: "#EAF0FF",
    read: false,
    section: "Hoje",
  },
  {
    id: "2",
    title: "Confira sua hospedagem",
    message:
      "Não se esqueça de verificar o endereço e os horários de check-in.",
    time: "Há 5 horas",
    category: "hospedagem",
    icon: "bed",
    color: "#A078D1",
    background: "#F2EAFE",
    read: false,
    section: "Hoje",
  },
  {
    id: "3",
    title: "Atenção ao orçamento",
    message: "Seus gastos estão se aproximando do limite planejado.",
    time: "Hoje, 09:30",
    category: "orcamento",
    icon: "wallet",
    color: "#D69A43",
    background: "#FFF3E1",
    read: true,
    section: "Hoje",
  },
  {
    id: "4",
    title: "Passeio adicionado",
    message: "Um novo passeio foi incluído no seu planejamento.",
    time: "Ontem",
    category: "passeio",
    icon: "ticket",
    color: "#43A68B",
    background: "#E3F6EF",
    read: true,
    section: "Anteriores",
  },
  {
    id: "5",
    title: "Viagem criada com sucesso",
    message: "Seu próximo destino já está organizado no TripWise.",
    time: "Há 3 dias",
    category: "viagem",
    icon: "checkmark-circle",
    color: "#6685D9",
    background: "#EAF0FF",
    read: true,
    section: "Anteriores",
  },
];

export default function Notificacoes() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"Todas" | "Não lidas">("Todas");
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    async function loadNotifications() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved) {
          setNotifications(JSON.parse(saved));
        } else {
          setNotifications(initialNotifications);
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(initialNotifications),
          );
        }
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
        setNotifications(initialNotifications);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications)).catch(
        (error) => console.error("Erro ao salvar notificações:", error),
      );
    }
  }, [notifications, loading]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) =>
      filter === "Não lidas" ? !item.read : true,
    );
  }, [notifications, filter]);

  function markAsRead(id: string) {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
  }

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

          <View style={[styles.countCircle, { backgroundColor: accent }]}>
            <Text style={styles.countText}>{unreadCount}</Text>
          </View>
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

          {unreadCount > 0 && (
            <Pressable onPress={markAllAsRead}>
              <Text style={[styles.markAll, { color: accent }]}>Ler todas</Text>
            </Pressable>
          )}
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
          ["Hoje", "Anteriores"].map((section) => {
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
                  <Pressable
                    key={item.id}
                    onPress={() => markAsRead(item.id)}
                    style={[
                      styles.notificationCard,
                      {
                        backgroundColor: cardBackground,
                        borderColor: borderColor,
                        opacity: item.read ? 0.82 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: isDark
                            ? `${item.color}25`
                            : item.background,
                        },
                      ]}
                    >
                      <Ionicons name={item.icon} size={23} color={item.color} />
                    </View>

                    <View style={styles.notificationContent}>
                      <View style={styles.notificationTop}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            { color: primaryText },
                          ]}
                        >
                          {item.title}
                        </Text>

                        {!item.read && (
                          <View
                            style={[
                              styles.unreadDot,
                              { backgroundColor: accent },
                            ]}
                          />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.notificationMessage,
                          { color: secondaryText },
                        ]}
                      >
                        {item.message}
                      </Text>

                      <Text
                        style={[
                          styles.notificationTime,
                          { color: secondaryText },
                        ]}
                      >
                        {item.time}
                      </Text>
                    </View>
                  </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  markAll: {
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 13,
  },
  notificationCard: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 17,
    borderWidth: 1,
    marginBottom: 11,
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
