import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Exibe notificações também quando o aplicativo está aberto.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotificationPreferences = {
  viagemCriada: boolean;
  viagemExcluida: boolean;
  viagemAtualizada: boolean;
  hospedagem: boolean;
  passeios: boolean;
  orcamento80: boolean;
  orcamentoExcedido: boolean;
  lembretesViagem: boolean;
};

type ViagemLembrete = {
  id: string;
  nome: string;
  destino: string;
  data: string;
};

type LembretesAgendados = Record<string, string>;

export const NOTIFICATION_PREFERENCES_KEY =
  "@tripwise_notification_preferences";

export const NOTIFICATIONS_STORAGE_KEY = "@tripwise_notificacoes";

export const LEMBRETES_AGENDADOS_KEY = "@tripwise_lembretes_agendados";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  viagemCriada: true,
  viagemExcluida: true,
  viagemAtualizada: true,
  hospedagem: true,
  passeios: true,
  orcamento80: true,
  orcamentoExcedido: true,
  lembretesViagem: true,
};

// Carrega as preferências salvas.
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const storedPreferences = await AsyncStorage.getItem(
      NOTIFICATION_PREFERENCES_KEY,
    );

    if (!storedPreferences) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    const parsed: unknown = JSON.parse(storedPreferences);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    const preferences = parsed as Partial<NotificationPreferences>;

    return {
      viagemCriada:
        typeof preferences.viagemCriada === "boolean"
          ? preferences.viagemCriada
          : true,
      viagemExcluida:
        typeof preferences.viagemExcluida === "boolean"
          ? preferences.viagemExcluida
          : true,
      viagemAtualizada:
        typeof preferences.viagemAtualizada === "boolean"
          ? preferences.viagemAtualizada
          : true,
      hospedagem:
        typeof preferences.hospedagem === "boolean"
          ? preferences.hospedagem
          : true,
      passeios:
        typeof preferences.passeios === "boolean" ? preferences.passeios : true,
      orcamento80:
        typeof preferences.orcamento80 === "boolean"
          ? preferences.orcamento80
          : true,
      orcamentoExcedido:
        typeof preferences.orcamentoExcedido === "boolean"
          ? preferences.orcamentoExcedido
          : true,
      lembretesViagem:
        typeof preferences.lembretesViagem === "boolean"
          ? preferences.lembretesViagem
          : true,
    };
  } catch (error) {
    console.error("Erro ao carregar preferências de notificações:", error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

// Salva as preferências e sincroniza os lembretes existentes.
export async function saveNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      NOTIFICATION_PREFERENCES_KEY,
      JSON.stringify(preferences),
    );
  } catch (error) {
    console.error("Erro ao salvar preferências de notificações:", error);
    throw error;
  }

  try {
    await sincronizarLembretesViagem();
  } catch (error) {
    console.error("Erro ao sincronizar lembretes:", error);
  }
}

// Verifica se determinada categoria de notificação está habilitada.
export async function isNotificationEnabled(
  preference: keyof NotificationPreferences,
): Promise<boolean> {
  const preferences = await getNotificationPreferences();
  return preferences[preference];
}

// Interpreta datas brasileiras e datas ISO.
function interpretarData(data: string): Date | null {
  const valor = data.trim();

  let ano: number;
  let mes: number;
  let dia: number;

  const formatoBrasileiro = valor.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  const formatoISO = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (formatoBrasileiro) {
    dia = Number(formatoBrasileiro[1]);
    mes = Number(formatoBrasileiro[2]);
    ano = Number(formatoBrasileiro[3]);
  } else if (formatoISO) {
    ano = Number(formatoISO[1]);
    mes = Number(formatoISO[2]);
    dia = Number(formatoISO[3]);
  } else {
    return null;
  }

  const resultado = new Date(ano, mes - 1, dia);

  // Impede datas inexistentes, como 31/02/2027.
  if (
    resultado.getFullYear() !== ano ||
    resultado.getMonth() !== mes - 1 ||
    resultado.getDate() !== dia
  ) {
    return null;
  }

  return resultado;
}

// Carrega os identificadores dos lembretes agendados.
async function carregarLembretesAgendados(): Promise<LembretesAgendados> {
  try {
    const dados = await AsyncStorage.getItem(LEMBRETES_AGENDADOS_KEY);

    if (!dados) {
      return {};
    }

    const parsed: unknown = JSON.parse(dados);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const resultado: LembretesAgendados = {};

    for (const [id, identificador] of Object.entries(parsed)) {
      if (typeof identificador === "string") {
        resultado[id] = identificador;
      }
    }

    return resultado;
  } catch (error) {
    console.error("Erro ao carregar lembretes agendados:", error);
    return {};
  }
}

// Salva os identificadores dos lembretes.
async function salvarLembretesAgendados(
  lembretes: LembretesAgendados,
): Promise<void> {
  await AsyncStorage.setItem(
    LEMBRETES_AGENDADOS_KEY,
    JSON.stringify(lembretes),
  );
}

// Configura o canal de notificações do Android.
async function configurarCanalNotificacoes(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "Notificações do TripWise",
    description: "Lembretes e atualizações das suas viagens.",
    importance: 4,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2563EB",
    sound: "default",
  });
}

// Verifica e solicita permissões de notificações.
async function obterPermissaoNotificacoes(): Promise<boolean> {
  const permissoesAtuais = await Notifications.getPermissionsAsync();

  if (permissoesAtuais.granted) {
    return true;
  }

  if (!permissoesAtuais.canAskAgain) {
    return false;
  }

  const novasPermissoes = await Notifications.requestPermissionsAsync();

  return novasPermissoes.granted;
}

// Cancela uma notificação agendada e informa o resultado.
async function cancelarNotificacaoAgendada(
  identificador: string,
): Promise<boolean> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identificador);

    console.log("Lembrete cancelado com sucesso:", identificador);

    return true;
  } catch (error) {
    console.error(
      "Não foi possível cancelar o lembrete:",
      identificador,
      error,
    );

    return false;
  }
}

// Agenda um lembrete para as 9h do dia anterior à viagem.
export async function agendarLembreteViagem(
  viagem: ViagemLembrete,
): Promise<void> {
  const lembretes = await carregarLembretesAgendados();

  // Remove um lembrete anterior da mesma viagem.
  const lembreteAnterior = lembretes[viagem.id];

  if (lembreteAnterior) {
    const cancelado = await cancelarNotificacaoAgendada(lembreteAnterior);

    if (!cancelado) {
      console.warn(
        "Novo lembrete não foi criado porque o anterior não pôde ser cancelado.",
        viagem.id,
      );

      return;
    }

    delete lembretes[viagem.id];
    await salvarLembretesAgendados(lembretes);
  }

  const preferencias = await getNotificationPreferences();

  if (!preferencias.lembretesViagem) {
    return;
  }

  const dataViagem = interpretarData(viagem.data);

  if (!dataViagem) {
    console.warn(
      `Data inválida para agendar lembrete da viagem ${viagem.id}:`,
      viagem.data,
    );

    return;
  }

  const dataLembrete = new Date(
    dataViagem.getFullYear(),
    dataViagem.getMonth(),
    dataViagem.getDate() - 1,
    9,
    0,
    0,
    0,
  );

  // Não agenda notificações cuja data já passou.
  if (dataLembrete.getTime() <= Date.now()) {
    console.log(
      "Lembrete não agendado porque o horário já passou:",
      viagem.nome,
    );

    return;
  }

  const permissaoConcedida = await obterPermissaoNotificacoes();

  if (!permissaoConcedida) {
    console.warn("Permissão para notificações não concedida.");
    return;
  }

  await configurarCanalNotificacoes();

  const identificador = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Sua viagem está chegando! ✈️",
      body: `Amanhã é o dia da sua viagem para ${viagem.destino}. Prepare tudo para essa experiência!`,
      sound: true,
      ...(Platform.OS === "android" ? { channelId: "default" } : {}),
      data: {
        viagemId: viagem.id,
        tipo: "lembreteViagem",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dataLembrete,
    },
  });

  lembretes[viagem.id] = identificador;

  await salvarLembretesAgendados(lembretes);

  console.log(
    `Lembrete agendado para ${viagem.nome}:`,
    dataLembrete.toLocaleString("pt-BR"),
  );
}

// Cancela o lembrete de uma viagem específica.
export async function cancelarLembreteViagem(viagemId: string): Promise<void> {
  const lembretes = await carregarLembretesAgendados();
  const identificador = lembretes[viagemId];

  if (!identificador) {
    console.warn("Nenhum lembrete encontrado para a viagem:", viagemId);

    return;
  }

  const cancelado = await cancelarNotificacaoAgendada(identificador);

  if (!cancelado) {
    console.warn(
      "O identificador do lembrete foi preservado para uma nova tentativa:",
      viagemId,
    );

    return;
  }

  delete lembretes[viagemId];

  await salvarLembretesAgendados(lembretes);

  console.log("Cancelamento concluído para a viagem:", viagemId);
}

// Sincroniza os lembretes de todas as viagens salvas.
export async function sincronizarLembretesViagem(): Promise<void> {
  const preferencias = await getNotificationPreferences();
  const dados = await AsyncStorage.getItem("@viagens");

  let viagens: ViagemLembrete[] = [];

  try {
    const parsed: unknown = dados ? JSON.parse(dados) : [];

    if (!Array.isArray(parsed)) {
      console.warn("Os dados de viagens salvos não são uma lista válida.");
      return;
    }

    viagens = parsed.filter(
      (item): item is ViagemLembrete =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.nome === "string" &&
        typeof item.destino === "string" &&
        typeof item.data === "string",
    );
  } catch (error) {
    console.error("Erro ao interpretar viagens salvas:", error);
    return;
  }

  // Se os lembretes estiverem desativados, cancela todos.
  if (!preferencias.lembretesViagem) {
    const lembretes = await carregarLembretesAgendados();

    const lembretesRestantes: LembretesAgendados = {};

    for (const [viagemId, identificador] of Object.entries(lembretes)) {
      const cancelado = await cancelarNotificacaoAgendada(identificador);

      if (!cancelado) {
        lembretesRestantes[viagemId] = identificador;
      }
    }

    await salvarLembretesAgendados(lembretesRestantes);

    console.log(
      "Sincronização de lembretes finalizada. Preferência desativada.",
    );

    return;
  }

  // Agenda os lembretes das viagens existentes.
  for (const viagem of viagens) {
    try {
      await agendarLembreteViagem(viagem);
    } catch (error) {
      console.error(`Erro ao agendar lembrete da viagem ${viagem.id}:`, error);
    }
  }

  // Remove lembretes de viagens que não existem mais.
  const idsAtuais = new Set(viagens.map((viagem) => viagem.id));
  const lembretes = await carregarLembretesAgendados();

  for (const viagemId of Object.keys(lembretes)) {
    if (!idsAtuais.has(viagemId)) {
      await cancelarLembreteViagem(viagemId);
    }
  }

  console.log("Sincronização de lembretes finalizada.");
}
