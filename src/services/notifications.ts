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

type LembreteAgendado = {
  identificador: string;
  dataAgendada: number;
};

type LembretesAgendados = Record<string, LembreteAgendado>;

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

const TRIPS_STORAGE_KEY = "@viagens";

// Carrega as preferências salvas.
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const storedPreferences = await AsyncStorage.getItem(
      NOTIFICATION_PREFERENCES_KEY,
    );

    if (!storedPreferences) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }

    const parsed: unknown = JSON.parse(storedPreferences);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
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

    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
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

// Valida os dados básicos de uma viagem.
function isViagemLembrete(valor: unknown): valor is ViagemLembrete {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
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
    typeof viagem.data === "string" &&
    viagem.data.trim().length > 0
  );
}

// Carrega os identificadores dos lembretes agendados.
// Também mantém compatibilidade com o formato antigo, que armazenava apenas strings.
async function carregarLembretesAgendados(): Promise<LembretesAgendados> {
  const dados = await AsyncStorage.getItem(LEMBRETES_AGENDADOS_KEY);

  if (!dados) {
    return {};
  }

  const parsed: unknown = JSON.parse(dados);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Os dados dos lembretes agendados são inválidos.");
  }

  const resultado: LembretesAgendados = {};

  for (const [id, valor] of Object.entries(parsed)) {
    // Compatibilidade com identificadores da versão anterior.
    if (typeof valor === "string" && valor.trim().length > 0) {
      resultado[id] = {
        identificador: valor,
        dataAgendada: 0,
      };

      continue;
    }

    if (
      valor &&
      typeof valor === "object" &&
      "identificador" in valor &&
      "dataAgendada" in valor &&
      typeof valor.identificador === "string" &&
      valor.identificador.trim().length > 0 &&
      typeof valor.dataAgendada === "number" &&
      Number.isFinite(valor.dataAgendada)
    ) {
      resultado[id] = {
        identificador: valor.identificador,
        dataAgendada: valor.dataAgendada,
      };

      continue;
    }

    throw new Error(`Registro de lembrete inválido para a viagem ${id}.`);
  }

  return resultado;
}

// Salva os identificadores e as datas dos lembretes.
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

// Cancela o lembrete de uma viagem e atualiza o armazenamento.
async function removerLembreteRegistrado(
  viagemId: string,
  lembretes: LembretesAgendados,
): Promise<boolean> {
  const lembreteAnterior = lembretes[viagemId];

  if (!lembreteAnterior) {
    return true;
  }

  const cancelado = await cancelarNotificacaoAgendada(
    lembreteAnterior.identificador,
  );

  if (!cancelado) {
    return false;
  }

  delete lembretes[viagemId];

  await salvarLembretesAgendados(lembretes);

  return true;
}

// Agenda um lembrete para as 9h do dia anterior à viagem.
export async function agendarLembreteViagem(
  viagem: ViagemLembrete,
): Promise<void> {
  if (!isViagemLembrete(viagem)) {
    console.warn("Dados inválidos para agendar lembrete:", viagem);

    return;
  }

  const lembretes = await carregarLembretesAgendados();
  const lembreteAnterior = lembretes[viagem.id];

  const preferencias = await getNotificationPreferences();

  // Se os lembretes estiverem desativados, remove o agendamento anterior.
  if (!preferencias.lembretesViagem) {
    await removerLembreteRegistrado(viagem.id, lembretes);

    return;
  }

  const dataViagem = interpretarData(viagem.data);

  if (!dataViagem) {
    console.warn(
      `Data inválida para agendar lembrete da viagem ${viagem.id}:`,
      viagem.data,
    );

    await removerLembreteRegistrado(viagem.id, lembretes);

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

  const timestampLembrete = dataLembrete.getTime();

  // Não agenda notificações cuja data já passou.
  if (timestampLembrete <= Date.now()) {
    console.log(
      "Lembrete não agendado porque o horário já passou:",
      viagem.nome,
    );

    await removerLembreteRegistrado(viagem.id, lembretes);

    return;
  }

  // Evita recriar um lembrete quando a data não foi alterada.
  if (lembreteAnterior && lembreteAnterior.dataAgendada === timestampLembrete) {
    const agendamentos =
      await Notifications.getAllScheduledNotificationsAsync();

    const lembreteExiste = agendamentos.some(
      (item) => item.identifier === lembreteAnterior.identificador,
    );

    if (lembreteExiste) {
      return;
    }

    // O registro existe, mas o agendamento não está mais no sistema.
    delete lembretes[viagem.id];

    await salvarLembretesAgendados(lembretes);
  }

  // Verifica a permissão antes de remover um lembrete antigo.
  const permissaoConcedida = await obterPermissaoNotificacoes();

  if (!permissaoConcedida) {
    console.warn("Permissão para notificações não concedida.");

    return;
  }

  await configurarCanalNotificacoes();

  // Se a data mudou, cancela o agendamento anterior antes de criar outro.
  if (lembreteAnterior && lembretes[viagem.id]) {
    const cancelado = await removerLembreteRegistrado(viagem.id, lembretes);

    if (!cancelado) {
      console.warn(
        "Novo lembrete não foi criado porque o anterior não pôde ser cancelado.",
        viagem.id,
      );

      return;
    }
  }

  let identificador: string | null = null;

  try {
    identificador = await Notifications.scheduleNotificationAsync({
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

    // Persiste o identificador somente após o agendamento ser criado.
    lembretes[viagem.id] = {
      identificador,
      dataAgendada: timestampLembrete,
    };

    await salvarLembretesAgendados(lembretes);

    console.log(
      `Lembrete agendado para ${viagem.nome}:`,
      dataLembrete.toLocaleString("pt-BR"),
    );
  } catch (error) {
    console.error(
      `Erro ao criar ou salvar lembrete da viagem ${viagem.id}:`,
      error,
    );

    // Se o agendamento foi criado, tenta cancelá-lo caso não consiga persistir.
    if (identificador) {
      const cancelado = await cancelarNotificacaoAgendada(identificador);

      if (!cancelado) {
        console.error(
          "O novo lembrete foi criado, mas não pôde ser cancelado após a falha de armazenamento:",
          identificador,
        );
      }
    }

    throw error;
  }
}

// Cancela o lembrete de uma viagem específica.
export async function cancelarLembreteViagem(viagemId: string): Promise<void> {
  const lembretes = await carregarLembretesAgendados();

  const identificador = lembretes[viagemId];

  if (!identificador) {
    console.warn("Nenhum lembrete encontrado para a viagem:", viagemId);

    return;
  }

  const cancelado = await cancelarNotificacaoAgendada(
    identificador.identificador,
  );

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

  const lembretes = await carregarLembretesAgendados();

  // Se os lembretes estiverem desativados, cancela todos os agendamentos.
  if (!preferencias.lembretesViagem) {
    const lembretesRestantes: LembretesAgendados = {};

    for (const [viagemId, lembrete] of Object.entries(lembretes)) {
      const cancelado = await cancelarNotificacaoAgendada(
        lembrete.identificador,
      );

      if (!cancelado) {
        lembretesRestantes[viagemId] = lembrete;
      }
    }

    await salvarLembretesAgendados(lembretesRestantes);

    console.log(
      "Sincronização de lembretes finalizada. Preferência desativada.",
    );

    return;
  }

  // Lê os dados sem interpretar falhas como uma lista vazia.
  const dados = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);

  const parsed: unknown = dados ? JSON.parse(dados) : [];

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Os dados de viagens salvos não são uma lista válida. Sincronização interrompida.",
    );
  }

  // Se houver registros inválidos, interrompe a sincronização.
  // Isso evita cancelar lembretes de viagens que não puderam ser identificadas.
  if (!parsed.every(isViagemLembrete)) {
    throw new Error(
      "Foram encontrados dados de viagens inválidos. Sincronização interrompida para preservar os lembretes existentes.",
    );
  }

  const viagens = parsed;

  const idsAtuais = new Set<string>();

  for (const viagem of viagens) {
    if (idsAtuais.has(viagem.id)) {
      throw new Error(
        `Identificador duplicado encontrado na viagem: ${viagem.id}`,
      );
    }

    idsAtuais.add(viagem.id);
  }

  // Agenda ou atualiza apenas os lembretes necessários.
  for (const viagem of viagens) {
    try {
      await agendarLembreteViagem(viagem);
    } catch (error) {
      console.error(
        `Erro ao sincronizar lembrete da viagem ${viagem.id}:`,
        error,
      );
    }
  }

  // Remove lembretes de viagens que não existem mais.
  const lembretesAtualizados = await carregarLembretesAgendados();

  for (const viagemId of Object.keys(lembretesAtualizados)) {
    if (!idsAtuais.has(viagemId)) {
      try {
        await cancelarLembreteViagem(viagemId);
      } catch (error) {
        console.error(`Erro ao remover lembrete da viagem ${viagemId}:`, error);
      }
    }
  }

  console.log("Sincronização de lembretes finalizada.");
}
