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
import { LanguageCode, useLanguage } from "../../contexts/LanguageContext";

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
  copy: (typeof NOTIFICATION_TRANSLATIONS)["pt-BR"];
  onPress: () => void;
  onDelete: () => void;
};

const STORAGE_KEY = "@tripwise_notificacoes";
const NOTIFICATIONS_CHANGED_EVENT = "tripwise:notificationsChanged";
const SWIPE_DELETE_WIDTH = 92;

const NOTIFICATION_TRANSLATIONS = {
  "pt-BR": {
    subtitle: "Fique por dentro",
    heading: "Suas notificações",
    summaryTitle: "Tudo em um só lugar",
    summaryDescription: "Acompanhe atualizações importantes das suas viagens.",
    all: "Todas",
    unread: "Não lidas",
    markAllAccessibility: "Marcar todas as notificações como lidas",
    deleteAllAccessibility: "Excluir todas as notificações",
    markAll: "Ler todas",
    deleteAll: "Excluir todas",
    delete: "Excluir",
    deleteNotificationAccessibility: (title: string) =>
      `Excluir notificação: ${title}`,
    error: "Erro",
    saveError: "Não foi possível atualizar suas notificações. Tente novamente.",
    deleteConfirmationTitle: "Excluir notificação",
    deleteConfirmationMessage: "Deseja realmente excluir esta notificação?",
    cancel: "Cancelar",
    deleteAllTitle: "Excluir todas as notificações",
    deleteAllMessage:
      "Tem certeza de que deseja excluir todas as notificações? Essa ação não poderá ser desfeita.",
    deleteAllConfirm: "Excluir todas",
    tripNotFound: "Viagem não encontrada",
    tripNotAvailable: "Viagem não disponível",
    tripNoLongerAvailable: "Essa viagem não está mais disponível.",
    tripCouldNotFind: "Não foi possível localizar essa viagem.",
    tripDeleted: "Essa viagem foi excluída ou não está mais cadastrada.",
    openTripError: "Não foi possível abrir os detalhes dessa viagem.",
    today: "Hoje",
    previous: "Anteriores",
    emptyTitle: "Tudo em dia!",
    emptyDescription: "Você não tem notificações pendentes por aqui.",
    footer: "Sua experiência de viagem, sempre organizada.",
  },
  en: {
    subtitle: "Stay up to date",
    heading: "Your notifications",
    summaryTitle: "Everything in one place",
    summaryDescription: "Keep track of important updates about your trips.",
    all: "All",
    unread: "Unread",
    markAllAccessibility: "Mark all notifications as read",
    deleteAllAccessibility: "Delete all notifications",
    markAll: "Mark all as read",
    deleteAll: "Delete all",
    delete: "Delete",
    deleteNotificationAccessibility: (title: string) =>
      `Delete notification: ${title}`,
    error: "Error",
    saveError: "Unable to update your notifications. Please try again.",
    deleteConfirmationTitle: "Delete notification",
    deleteConfirmationMessage:
      "Are you sure you want to delete this notification?",
    cancel: "Cancel",
    deleteAllTitle: "Delete all notifications",
    deleteAllMessage:
      "Are you sure you want to delete all notifications? This action cannot be undone.",
    deleteAllConfirm: "Delete all",
    tripNotFound: "Trip not found",
    tripNotAvailable: "Trip unavailable",
    tripNoLongerAvailable: "This trip is no longer available.",
    tripCouldNotFind: "Unable to find this trip.",
    tripDeleted: "This trip has been deleted or is no longer registered.",
    openTripError: "Unable to open this trip's details.",
    today: "Today",
    previous: "Earlier",
    emptyTitle: "You're all caught up!",
    emptyDescription: "You don't have any pending notifications.",
    footer: "Your travel experience, always organized.",
  },
  es: {
    subtitle: "Mantente al día",
    heading: "Tus notificaciones",
    summaryTitle: "Todo en un solo lugar",
    summaryDescription: "Sigue las actualizaciones importantes de tus viajes.",
    all: "Todas",
    unread: "No leídas",
    markAllAccessibility: "Marcar todas las notificaciones como leídas",
    deleteAllAccessibility: "Eliminar todas las notificaciones",
    markAll: "Marcar todas como leídas",
    deleteAll: "Eliminar todas",
    delete: "Eliminar",
    deleteNotificationAccessibility: (title: string) =>
      `Eliminar notificación: ${title}`,
    error: "Error",
    saveError:
      "No se pudieron actualizar tus notificaciones. Inténtalo de nuevo.",
    deleteConfirmationTitle: "Eliminar notificación",
    deleteConfirmationMessage: "¿Realmente deseas eliminar esta notificación?",
    cancel: "Cancelar",
    deleteAllTitle: "Eliminar todas las notificaciones",
    deleteAllMessage:
      "¿Estás seguro de que deseas eliminar todas las notificaciones? Esta acción no se puede deshacer.",
    deleteAllConfirm: "Eliminar todas",
    tripNotFound: "Viaje no encontrado",
    tripNotAvailable: "Viaje no disponible",
    tripNoLongerAvailable: "Este viaje ya no está disponible.",
    tripCouldNotFind: "No se pudo encontrar este viaje.",
    tripDeleted: "Este viaje ha sido eliminado o ya no está registrado.",
    openTripError: "No se pudieron abrir los detalles de este viaje.",
    today: "Hoy",
    previous: "Anteriores",
    emptyTitle: "¡Todo al día!",
    emptyDescription: "No tienes notificaciones pendientes.",
    footer: "Tu experiencia de viaje, siempre organizada.",
  },
};

const NOTIFICATION_CONTENT_TRANSLATIONS = {
  "pt-BR": {
    tripCreatedTitle: "Nova viagem adicionada!",
    tripCreatedMessage: (destination: string) =>
      `Sua viagem para ${destination} foi cadastrada com sucesso.`,
    tripDeletedTitle: "Viagem excluída",
    tripDeletedMessage: (destination: string) =>
      `A viagem para ${destination} foi removida.`,
    tripUpdatedTitle: "Viagem atualizada!",
    tripUpdatedMessage: (destination: string) =>
      `As informações da sua viagem para ${destination} foram atualizadas.`,
    lodgingUpdatedTitle: "Hospedagem atualizada!",
    lodgingUpdatedMessage: (destination: string) =>
      `As informações da hospedagem da viagem para ${destination} foram atualizadas.`,
    lodgingRemovedTitle: "Hospedagem removida",
    lodgingRemovedMessage: (destination: string) =>
      `A hospedagem da viagem para ${destination} foi removida.`,
    toursUpdatedTitle: "Passeios atualizados!",
    toursUpdatedMessage: (destination: string) =>
      `A lista de passeios da viagem para ${destination} foi modificada.`,
    budgetWarningTitle: "Atenção ao orçamento!",
    budgetExceededTitle: "Orçamento excedido!",
    budgetWarningMessage: (percentage: string) =>
      `Você já utilizou ${percentage}% do seu orçamento. Fique de olho nos seus gastos!`,
    budgetExceededMessage: (percentage: string) =>
      `Você ultrapassou seu orçamento em ${percentage}%. Revise seus gastos.`,
    budgetWarningGeneric:
      "Fique de olho nos seus gastos e no orçamento da viagem.",
    budgetExceededGeneric:
      "Você ultrapassou seu orçamento. Revise seus gastos.",
    tripReminderTitle: "Sua viagem está chegando!",
    tripReminderMessage:
      "Sua viagem está próxima. Confira os detalhes e prepare-se!",
    now: "Agora",
  },
  en: {
    tripCreatedTitle: "New trip added!",
    tripCreatedMessage: (destination: string) =>
      `Your trip to ${destination} has been successfully created.`,
    tripDeletedTitle: "Trip deleted",
    tripDeletedMessage: (destination: string) =>
      `The trip to ${destination} has been removed.`,
    tripUpdatedTitle: "Trip updated!",
    tripUpdatedMessage: (destination: string) =>
      `The information about your trip to ${destination} has been updated.`,
    lodgingUpdatedTitle: "Accommodation updated!",
    lodgingUpdatedMessage: (destination: string) =>
      `The accommodation information for your trip to ${destination} has been updated.`,
    lodgingRemovedTitle: "Accommodation removed",
    lodgingRemovedMessage: (destination: string) =>
      `The accommodation for your trip to ${destination} has been removed.`,
    toursUpdatedTitle: "Activities updated!",
    toursUpdatedMessage: (destination: string) =>
      `The list of activities for your trip to ${destination} has been updated.`,
    budgetWarningTitle: "Budget alert!",
    budgetExceededTitle: "Budget exceeded!",
    budgetWarningMessage: (percentage: string) =>
      `You have already used ${percentage}% of your budget. Keep an eye on your expenses!`,
    budgetExceededMessage: (percentage: string) =>
      `You have exceeded your budget by ${percentage}%. Review your expenses.`,
    budgetWarningGeneric: "Keep an eye on your expenses and your trip budget.",
    budgetExceededGeneric:
      "You have exceeded your budget. Review your expenses.",
    tripReminderTitle: "Your trip is coming up!",
    tripReminderMessage:
      "Your trip is approaching. Check the details and get ready!",
    now: "Now",
  },
  es: {
    tripCreatedTitle: "¡Nuevo viaje añadido!",
    tripCreatedMessage: (destination: string) =>
      `Tu viaje a ${destination} se ha registrado correctamente.`,
    tripDeletedTitle: "Viaje eliminado",
    tripDeletedMessage: (destination: string) =>
      `El viaje a ${destination} ha sido eliminado.`,
    tripUpdatedTitle: "¡Viaje actualizado!",
    tripUpdatedMessage: (destination: string) =>
      `La información de tu viaje a ${destination} ha sido actualizada.`,
    lodgingUpdatedTitle: "¡Alojamiento actualizado!",
    lodgingUpdatedMessage: (destination: string) =>
      `La información del alojamiento de tu viaje a ${destination} ha sido actualizada.`,
    lodgingRemovedTitle: "Alojamiento eliminado",
    lodgingRemovedMessage: (destination: string) =>
      `El alojamiento de tu viaje a ${destination} ha sido eliminado.`,
    toursUpdatedTitle: "¡Actividades actualizadas!",
    toursUpdatedMessage: (destination: string) =>
      `La lista de actividades de tu viaje a ${destination} ha sido modificada.`,
    budgetWarningTitle: "¡Atención al presupuesto!",
    budgetExceededTitle: "¡Presupuesto excedido!",
    budgetWarningMessage: (percentage: string) =>
      `Ya has utilizado el ${percentage}% de tu presupuesto. ¡Controla tus gastos!`,
    budgetExceededMessage: (percentage: string) =>
      `Has superado tu presupuesto en un ${percentage}%. Revisa tus gastos.`,
    budgetWarningGeneric: "Controla tus gastos y el presupuesto de tu viaje.",
    budgetExceededGeneric: "Has superado tu presupuesto. Revisa tus gastos.",
    tripReminderTitle: "¡Tu viaje se acerca!",
    tripReminderMessage:
      "Tu viaje está próximo. ¡Consulta los detalles y prepárate!",
    now: "Ahora",
  },
};

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

// Identifica o conteúdo original em qualquer um dos três idiomas.
function traduzirNotificacao(
  item: NotificationItem,
  language: LanguageCode,
): NotificationItem {
  const content = NOTIFICATION_CONTENT_TRANSLATIONS[language];

  const titulo = item.title.trim();
  const mensagem = item.message.trim();

  const normalizar = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();

  const tituloNormalizado = normalizar(titulo);
  const horarioNormalizado = normalizar(item.time);

  // Traduz o horário independentemente do tipo de notificação.
  const itemLocalizado: NotificationItem = {
    ...item,
    time:
      horarioNormalizado === "agora" ||
      horarioNormalizado === "now" ||
      horarioNormalizado === "ahora"
        ? content.now
        : item.time,
  };

  const extrairDestino = (texto: string, expressoes: RegExp[]) => {
    for (const expressao of expressoes) {
      const resultado = texto.match(expressao);

      if (resultado?.[1]) {
        return resultado[1].trim().replace(/[.!?]+$/, "");
      }
    }

    return null;
  };

  const expressoesDestino = {
    criacao: [
      /^Sua viagem para (.+) foi cadastrada com sucesso\.?$/i,
      /^Your trip to (.+) has been successfully created\.?$/i,
      /^Tu viaje a (.+) se ha registrado correctamente\.?$/i,
    ],
    exclusao: [
      /^A viagem para (.+) foi removida\.?$/i,
      /^The trip to (.+) has been removed\.?$/i,
      /^El viaje a (.+) ha sido eliminado\.?$/i,
    ],
    atualizacao: [
      /^As informações da sua viagem para (.+) foram atualizadas\.?$/i,
      /^The information about your trip to (.+) has been updated\.?$/i,
      /^La información de tu viaje a (.+) ha sido actualizada\.?$/i,
    ],
    hospedagemAtualizada: [
      /^As informações da hospedagem da viagem para (.+) foram atualizadas\.?$/i,
      /^The accommodation information for your trip to (.+) has been updated\.?$/i,
      /^La información del alojamiento de tu viaje a (.+) ha sido actualizada\.?$/i,
    ],
    hospedagemRemovida: [
      /^A hospedagem da viagem para (.+) foi removida\.?$/i,
      /^The accommodation for your trip to (.+) has been removed\.?$/i,
      /^El alojamiento de tu viaje a (.+) ha sido eliminado\.?$/i,
    ],
    passeios: [
      /^A lista de passeios da viagem para (.+) foi modificada\.?$/i,
      /^The list of activities for your trip to (.+) has been updated\.?$/i,
      /^La lista de actividades de tu viaje a (.+) ha sido modificada\.?$/i,
    ],
  };

  const destinoCriacao = extrairDestino(mensagem, expressoesDestino.criacao);

  const destinoExclusao = extrairDestino(mensagem, expressoesDestino.exclusao);

  const destinoAtualizacao = extrairDestino(
    mensagem,
    expressoesDestino.atualizacao,
  );

  const destinoHospedagemAtualizada = extrairDestino(
    mensagem,
    expressoesDestino.hospedagemAtualizada,
  );

  const destinoHospedagemRemovida = extrairDestino(
    mensagem,
    expressoesDestino.hospedagemRemovida,
  );

  const destinoPasseios = extrairDestino(mensagem, expressoesDestino.passeios);

  const tituloCriacao =
    tituloNormalizado.includes("nova viagem adicionada") ||
    tituloNormalizado.includes("new trip added") ||
    tituloNormalizado.includes("nuevo viaje anadido");

  const tituloExclusao =
    tituloNormalizado === "viagem excluida" ||
    tituloNormalizado === "trip deleted" ||
    tituloNormalizado === "viaje eliminado";

  const tituloAtualizacao =
    tituloNormalizado.includes("viagem atualizada") ||
    tituloNormalizado.includes("trip updated") ||
    tituloNormalizado.includes("viaje actualizado");

  const tituloHospedagemAtualizada =
    tituloNormalizado.includes("hospedagem atualizada") ||
    tituloNormalizado.includes("accommodation updated") ||
    tituloNormalizado.includes("alojamiento actualizado");

  const tituloHospedagemRemovida =
    tituloNormalizado.includes("hospedagem removida") ||
    tituloNormalizado.includes("accommodation removed") ||
    tituloNormalizado.includes("alojamiento eliminado");

  const tituloPasseios =
    tituloNormalizado.includes("passeios atualizados") ||
    tituloNormalizado.includes("activities updated") ||
    tituloNormalizado.includes("actividades actualizadas");

  if (tituloCriacao || destinoCriacao) {
    if (destinoCriacao) {
      return {
        ...itemLocalizado,
        title: content.tripCreatedTitle,
        message: content.tripCreatedMessage(destinoCriacao),
      };
    }
  }

  if (tituloExclusao || destinoExclusao) {
    if (destinoExclusao) {
      return {
        ...itemLocalizado,
        title: content.tripDeletedTitle,
        message: content.tripDeletedMessage(destinoExclusao),
      };
    }
  }

  if (tituloAtualizacao || destinoAtualizacao) {
    if (destinoAtualizacao) {
      return {
        ...itemLocalizado,
        title: content.tripUpdatedTitle,
        message: content.tripUpdatedMessage(destinoAtualizacao),
      };
    }
  }

  if (tituloHospedagemAtualizada || destinoHospedagemAtualizada) {
    if (destinoHospedagemAtualizada) {
      return {
        ...itemLocalizado,
        title: content.lodgingUpdatedTitle,
        message: content.lodgingUpdatedMessage(destinoHospedagemAtualizada),
      };
    }
  }

  if (tituloHospedagemRemovida || destinoHospedagemRemovida) {
    if (destinoHospedagemRemovida) {
      return {
        ...itemLocalizado,
        title: content.lodgingRemovedTitle,
        message: content.lodgingRemovedMessage(destinoHospedagemRemovida),
      };
    }
  }

  if (tituloPasseios || destinoPasseios) {
    if (destinoPasseios) {
      return {
        ...itemLocalizado,
        title: content.toursUpdatedTitle,
        message: content.toursUpdatedMessage(destinoPasseios),
      };
    }
  }

  const percentualDaMensagem = mensagem.match(/(\d+(?:[.,]\d+)?)\s*%/);

  const percentual = percentualDaMensagem?.[1];

  const notificacaoOrcamento =
    item.category === "orcamento" ||
    tituloNormalizado.includes("orcamento") ||
    tituloNormalizado.includes("budget") ||
    tituloNormalizado.includes("presupuesto");

  if (notificacaoOrcamento) {
    const excedido =
      tituloNormalizado.includes("excedido") ||
      tituloNormalizado.includes("ultrapassado") ||
      tituloNormalizado.includes("exceeded") ||
      tituloNormalizado.includes("superado");

    return {
      ...itemLocalizado,
      title: excedido
        ? content.budgetExceededTitle
        : content.budgetWarningTitle,
      message: percentual
        ? excedido
          ? content.budgetExceededMessage(percentual)
          : content.budgetWarningMessage(percentual)
        : excedido
          ? content.budgetExceededGeneric
          : content.budgetWarningGeneric,
    };
  }

  const notificacaoLembrete =
    tituloNormalizado.includes("sua viagem esta chegando") ||
    tituloNormalizado.includes("lembrete de viagem") ||
    tituloNormalizado.includes("your trip is coming up") ||
    tituloNormalizado.includes("viaje se acerca");

  if (notificacaoLembrete) {
    return {
      ...itemLocalizado,
      title: content.tripReminderTitle,
      message: content.tripReminderMessage,
    };
  }

  return itemLocalizado;
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
  copy,
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

  const handleTouchStart = (event: any) => {
    startX.current = event.nativeEvent.pageX;
    startY.current = event.nativeEvent.pageY;
    startOffset.current = isOpen ? -SWIPE_DELETE_WIDTH : 0;
    currentDx.current = startOffset.current;
    horizontalGesture.current = false;
  };

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

  const handleResponderRelease = () => {
    if (!horizontalGesture.current) return;

    const deveAbrir = currentDx.current < -SWIPE_DELETE_WIDTH / 2;

    horizontalGesture.current = false;
    lastSwipeAt.current = Date.now();

    animarPara(deveAbrir ? -SWIPE_DELETE_WIDTH : 0);
  };

  const handleResponderTerminate = () => {
    if (!horizontalGesture.current) return;

    horizontalGesture.current = false;
    lastSwipeAt.current = Date.now();

    animarPara(0);
  };

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
            accessibilityLabel={copy.deleteNotificationAccessibility(
              item.title,
            )}
            disabled={!isOpen}
            onPress={() => {
              fecharAcao();
              onDelete();
            }}
            style={styles.deleteAction}
          >
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
            <Text style={styles.deleteActionText}>{copy.delete}</Text>
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

  const { language } = useLanguage();
  const copy = NOTIFICATION_TRANSLATIONS[language];

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

      Alert.alert(copy.error, copy.saveError);
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

  function confirmarExclusao(item: NotificationItem) {
    Alert.alert(copy.deleteConfirmationTitle, copy.deleteConfirmationMessage, [
      {
        text: copy.cancel,
        style: "cancel",
      },
      {
        text: copy.delete,
        style: "destructive",
        onPress: () => {
          const updated = notifications.filter(
            (notification) => notification.id !== item.id,
          );

          void salvarNotificacoes(updated);
        },
      },
    ]);
  }

  function confirmarExclusaoTodas() {
    if (notifications.length === 0) return;

    Alert.alert(copy.deleteAllTitle, copy.deleteAllMessage, [
      {
        text: copy.cancel,
        style: "cancel",
      },
      {
        text: copy.deleteAllConfirm,
        style: "destructive",
        onPress: () => {
          void salvarNotificacoes([]);
        },
      },
    ]);
  }

  async function handleNotificationPress(item: NotificationItem) {
    await markAsRead(item.id);

    if (!item.viagemId) return;

    try {
      const dados = await AsyncStorage.getItem("@viagens");

      if (!dados) {
        Alert.alert(copy.tripNotFound, copy.tripNoLongerAvailable);
        return;
      }

      const viagens: unknown = JSON.parse(dados);

      if (!Array.isArray(viagens)) {
        Alert.alert(copy.tripNotFound, copy.tripCouldNotFind);
        return;
      }

      const viagemExiste = viagens.some(
        (viagem: { id?: string }) => viagem?.id === item.viagemId,
      );

      if (!viagemExiste) {
        Alert.alert(copy.tripNotAvailable, copy.tripDeleted);
        return;
      }

      router.push({
        pathname: "/detalhes",
        params: { id: item.viagemId },
      });
    } catch (error) {
      console.error("Erro ao abrir viagem pela notificação:", error);

      Alert.alert(copy.error, copy.openTripError);
    }
  }

  const localizedNotifications = useMemo(
    () => notifications.map((item) => traduzirNotificacao(item, language)),
    [notifications, language],
  );

  const filteredNotifications = useMemo(() => {
    return localizedNotifications.filter((item) =>
      filter === "Não lidas" ? !item.read : true,
    );
  }, [localizedNotifications, filter]);

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
              {copy.subtitle}
            </Text>
            <Text style={[styles.heading, { color: primaryText }]}>
              {copy.heading}
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
              {copy.summaryTitle}
            </Text>

            <Text style={[styles.summaryDescription, { color: secondaryText }]}>
              {copy.summaryDescription}
            </Text>
          </View>
        </View>

        <View style={styles.filterHeader}>
          <View style={styles.filters}>
            {(["Todas", "Não lidas"] as const).map((item) => {
              const selected = filter === item;
              const label = item === "Todas" ? copy.all : copy.unread;

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
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            {unreadCount > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.markAllAccessibility}
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
                  {copy.markAll}
                </Text>
              </Pressable>
            )}

            {notifications.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.deleteAllAccessibility}
                onPress={confirmarExclusaoTodas}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.deleteAllButton,
                  pressed && styles.actionPressed,
                ]}
              >
                <Ionicons name="trash-outline" size={17} color="#E45B5B" />
                <Text style={styles.deleteAllText}>{copy.deleteAll}</Text>
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
              {copy.emptyTitle}
            </Text>

            <Text style={[styles.emptyDescription, { color: secondaryText }]}>
              {copy.emptyDescription}
            </Text>
          </View>
        ) : (
          (["Hoje", "Anteriores"] as const).map((section) => {
            const items = filteredNotifications.filter(
              (item) => item.section === section,
            );

            if (items.length === 0) return null;

            const sectionLabel =
              section === "Hoje" ? copy.today : copy.previous;

            return (
              <View key={section} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: primaryText }]}>
                  {sectionLabel}
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
                    copy={copy}
                    onPress={() => {
                      const originalItem = notifications.find(
                        (notification) => notification.id === item.id,
                      );

                      if (originalItem) {
                        void handleNotificationPress(originalItem);
                      }
                    }}
                    onDelete={() => {
                      const originalItem = notifications.find(
                        (notification) => notification.id === item.id,
                      );

                      if (originalItem) {
                        confirmarExclusao(originalItem);
                      }
                    }}
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
            {copy.footer}
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
