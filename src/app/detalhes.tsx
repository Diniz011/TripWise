import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import {
  agendarLembreteViagem,
  getNotificationPreferences,
  NOTIFICATIONS_STORAGE_KEY,
} from "../services/notifications";

const NOTIFICATIONS_CHANGED_EVENT = "tripwise:notificationsChanged";

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
  hotelNome?: string;
  hotelEndereco?: string;
  hotelData?: string;
  passeios?: string | string[];
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

type SectionHeaderProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  isDark: boolean;
  primaryText: string;
  secondaryText: string;
  accent: string;
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

function lerLista<T>(valor?: string | T[]): T[] {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor;

  try {
    const resultado = JSON.parse(valor);
    return Array.isArray(resultado) ? resultado : [];
  } catch {
    return [];
  }
}

function converterValor(valor: string) {
  const normalizado = valor.trim().replace(",", ".");
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

export default function Detalhes() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const background = isDark ? "#121212" : "#F4F6FA";
  const cardBackground = isDark ? "#1E1E1E" : "#FFFFFF";
  const primaryText = isDark ? "#FFFFFF" : "#172033";
  const secondaryText = isDark ? "#A0A0A0" : "#7B8495";
  const inputBackground = isDark ? "#292929" : "#F5F7FA";
  const borderColor = isDark ? "#333333" : "#E9ECF2";
  const accent = "#8FA255";

  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);

  const [nome, setNome] = useState("");
  const [destino, setDestino] = useState("");
  const [transporte, setTransporte] = useState("");
  const [data, setData] = useState("");

  const [hotelNome, setHotelNome] = useState("");
  const [hotelEndereco, setHotelEndereco] = useState("");
  const [hotelData, setHotelData] = useState("");

  const [passeios, setPasseios] = useState<string[]>([]);
  const [novoPasseio, setNovoPasseio] = useState("");

  const [orcamentoTotal, setOrcamentoTotal] = useState("0");
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [novoGastoNome, setNovoGastoNome] = useState("");
  const [novoGastoValor, setNovoGastoValor] = useState("");

  const [viagemNaoEncontrada, setViagemNaoEncontrada] = useState(false);

  const preencherDetalhes = useCallback((viagemAtual: Viagem) => {
    setViagemNaoEncontrada(false);
    setNome(viagemAtual.nome || "");
    setDestino(viagemAtual.destino || "");
    setTransporte(viagemAtual.transporte || "");
    setData(viagemAtual.data || "");

    setHotelNome(viagemAtual.hotelNome || "");
    setHotelEndereco(viagemAtual.hotelEndereco || "");
    setHotelData(viagemAtual.hotelData || "");

    setPasseios(lerLista<string>(viagemAtual.passeios));
    setGastos(lerLista<Gasto>(viagemAtual.gastos));
    setOrcamentoTotal(viagemAtual.orcamentoTotal || "0");
  }, []);

  const carregarDetalhesViagem = useCallback(async () => {
    try {
      const dados = await AsyncStorage.getItem("@viagens");

      if (!dados) {
        setViagemNaoEncontrada(true);
        return;
      }

      const viagens: Viagem[] = JSON.parse(dados);
      const viagemAtual = viagens.find((v) => v.id === params.id);

      if (!viagemAtual) {
        setViagemNaoEncontrada(true);
        return;
      }

      preencherDetalhes(viagemAtual);
    } catch (error) {
      console.error("Erro ao carregar viagem:", error);
      Alert.alert("Erro", "Não foi possível carregar os detalhes da viagem.");
    } finally {
      setLoading(false);
    }
  }, [params.id, preencherDetalhes]);

  // Carregamento inicial assíncrono para evitar atualizações
  // de estado diretamente durante a execução do efeito.
  useEffect(() => {
    let ativo = true;

    AsyncStorage.getItem("@viagens")
      .then((dados) => {
        if (!ativo) return;

        if (!dados) {
          setViagemNaoEncontrada(true);
          return;
        }

        const viagens: Viagem[] = JSON.parse(dados);
        const viagemAtual = viagens.find((v) => v.id === params.id);

        if (!viagemAtual) {
          setViagemNaoEncontrada(true);
          return;
        }

        preencherDetalhes(viagemAtual);
      })
      .catch((error) => {
        console.error("Erro ao carregar viagem:", error);

        if (ativo) {
          Alert.alert(
            "Erro",
            "Não foi possível carregar os detalhes da viagem.",
          );
        }
      })
      .finally(() => {
        if (ativo) {
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [params.id, preencherDetalhes]);

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const totalGastos = gastos.reduce(
    (acc, curr) => acc + (Number(curr.valor) || 0),
    0,
  );

  const saldoRestante = converterValor(orcamentoTotal) - totalGastos;

  const percentualGasto =
    converterValor(orcamentoTotal) > 0
      ? Math.min((totalGastos / converterValor(orcamentoTotal)) * 100, 100)
      : 0;

  const adicionarPasseio = () => {
    if (!novoPasseio.trim()) return;

    setPasseios((atual) => [...atual, novoPasseio.trim()]);
    setNovoPasseio("");
  };

  const removerPasseio = (index: number) => {
    setPasseios((atual) => atual.filter((_, i) => i !== index));
  };

  const adicionarGasto = () => {
    const valor = converterValor(novoGastoValor);

    if (!novoGastoNome.trim() || !novoGastoValor.trim() || valor <= 0) {
      Alert.alert("Atenção", "Informe o nome e um valor válido para o gasto.");
      return;
    }

    setGastos((atual) => [...atual, { nome: novoGastoNome.trim(), valor }]);

    setNovoGastoNome("");
    setNovoGastoValor("");
  };

  const removerGasto = (index: number) => {
    setGastos((atual) => atual.filter((_, i) => i !== index));
  };

  // Salva as notificações respeitando as preferências configuradas no Perfil.
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

      if (notificacoesPermitidas.length === 0) return;

      const dadosExistentes = await AsyncStorage.getItem(
        NOTIFICATIONS_STORAGE_KEY,
      );

      let notificacoesSalvas: NotificationItem[] = [];

      if (dadosExistentes) {
        try {
          const parsed = JSON.parse(dadosExistentes);
          if (Array.isArray(parsed)) {
            notificacoesSalvas = parsed;
          }
        } catch {
          notificacoesSalvas = [];
        }
      }

      const novasNotificacoes: NotificationItem[] = notificacoesPermitidas.map(
        (item, index) => ({
          id: `${Date.now()}-${index}`,
          title: item.titulo,
          message: item.mensagem,
          time: "Agora",
          category: item.categoria,
          icon: item.icone,
          color: item.cor,
          background: item.fundo,
          read: false,
          section: "Hoje",
          viagemId: params.id,
        }),
      );

      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify([...novasNotificacoes, ...notificacoesSalvas]),
      );

      // Atualiza o contador de notificações não lidas na barra de navegação.
      DeviceEventEmitter.emit(NOTIFICATIONS_CHANGED_EVENT);
    } catch (error) {
      // Uma falha nas notificações não deve impedir o salvamento da viagem.
      console.error("Erro ao registrar notificações:", error);
    }
  };

  const salvarEdicao = async () => {
    if (!nome.trim() || !destino.trim() || !transporte.trim() || !data.trim()) {
      Alert.alert(
        "Atenção",
        "Preencha nome, destino, transporte e data da viagem.",
      );
      return;
    }

    try {
      const dados = await AsyncStorage.getItem("@viagens");

      if (!dados) {
        Alert.alert("Erro", "Não foi possível encontrar suas viagens.");
        return;
      }

      const viagens: Viagem[] = JSON.parse(dados);
      const viagemAnterior = viagens.find((v) => v.id === params.id);

      if (!viagemAnterior) {
        Alert.alert("Erro", "Não foi possível encontrar essa viagem.");
        return;
      }

      const novaViagem: Viagem = {
        ...viagemAnterior,
        nome: nome.trim(),
        destino: destino.trim(),
        transporte: transporte.trim(),
        data: data.trim(),
        hotelNome: hotelNome.trim(),
        hotelEndereco: hotelEndereco.trim(),
        hotelData: hotelData.trim(),
        passeios: JSON.stringify(passeios),
        orcamentoTotal,
        gastos: JSON.stringify(gastos),
      };

      const listaAtualizada = viagens.map((v) =>
        v.id === params.id ? novaViagem : v,
      );

      // Primeiro salvamos os dados da viagem.
      await AsyncStorage.setItem("@viagens", JSON.stringify(listaAtualizada));

      // Atualiza o lembrete local conforme a nova data e o destino.
      // Uma falha no agendamento não impede o salvamento da viagem.
      try {
        await agendarLembreteViagem(novaViagem);
      } catch (error) {
        console.error("Erro ao atualizar lembrete da viagem:", error);
      }

      // Comparamos os dados anteriores com os novos.
      const mudouInformacaoPrincipal =
        (viagemAnterior.nome || "") !== novaViagem.nome ||
        (viagemAnterior.destino || "") !== novaViagem.destino ||
        (viagemAnterior.transporte || "") !== novaViagem.transporte ||
        (viagemAnterior.data || "") !== novaViagem.data;

      const mudouHospedagem =
        (viagemAnterior.hotelNome || "") !== (novaViagem.hotelNome || "") ||
        (viagemAnterior.hotelEndereco || "") !==
          (novaViagem.hotelEndereco || "") ||
        (viagemAnterior.hotelData || "") !== (novaViagem.hotelData || "");

      const passeiosAnteriores = lerLista<string>(viagemAnterior.passeios);
      const passeiosNovos = passeios;

      const mudouPasseios =
        JSON.stringify(passeiosAnteriores) !== JSON.stringify(passeiosNovos);

      const orcamentoAnterior = converterValor(
        viagemAnterior.orcamentoTotal || "0",
      );

      const orcamentoNovo = converterValor(novaViagem.orcamentoTotal || "0");

      const gastosAnteriores = lerLista<Gasto>(viagemAnterior.gastos);

      const totalGastosAnterior = gastosAnteriores.reduce(
        (total, gasto) => total + (Number(gasto.valor) || 0),
        0,
      );

      const totalGastosNovo = gastos.reduce(
        (total, gasto) => total + (Number(gasto.valor) || 0),
        0,
      );

      const mudouOrcamento =
        orcamentoAnterior !== orcamentoNovo ||
        totalGastosAnterior !== totalGastosNovo;

      const mudouAlgumaInformacao =
        mudouInformacaoPrincipal ||
        mudouHospedagem ||
        mudouPasseios ||
        mudouOrcamento;

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
          titulo: "Viagem atualizada!",
          mensagem: `As informações da sua viagem para ${novaViagem.destino} foram atualizadas.`,
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
            ? "Hospedagem atualizada!"
            : "Hospedagem removida",
          mensagem: hospedagemCadastrada
            ? `As informações da hospedagem da viagem para ${novaViagem.destino} foram atualizadas.`
            : `A hospedagem da viagem para ${novaViagem.destino} foi removida.`,
          categoria: "hospedagem",
          icone: "bed-outline",
          cor: "#6D91C7",
          fundo: "#6D91C718",
        });
      }

      if (mudouPasseios) {
        notificacoesParaRegistrar.push({
          preferencia: "passeios",
          titulo: "Passeios atualizados!",
          mensagem: `A lista de passeios da viagem para ${novaViagem.destino} foi modificada.`,
          categoria: "passeios",
          icone: "ticket-outline",
          cor: "#A17BC2",
          fundo: "#A17BC218",
        });
      }

      // Alerta de 80%: dispara apenas quando o percentual cruza esse limite.
      if (
        orcamentoNovo > 0 &&
        percentualAnterior < 80 &&
        percentualNovo >= 80
      ) {
        notificacoesParaRegistrar.push({
          preferencia: "orcamento80",
          titulo: "Atenção ao orçamento!",
          mensagem: `Você já utilizou ${percentualNovo.toFixed(0)}% do orçamento da viagem para ${novaViagem.destino}.`,
          categoria: "orcamento",
          icone: "alert-circle-outline",
          cor: "#D99A42",
          fundo: "#D99A4218",
        });
      }

      // Alerta de 100%: dispara quando os gastos ultrapassam o orçamento.
      if (
        orcamentoNovo > 0 &&
        percentualAnterior <= 100 &&
        percentualNovo > 100
      ) {
        notificacoesParaRegistrar.push({
          preferencia: "orcamentoExcedido",
          titulo: "Orçamento ultrapassado!",
          mensagem: `Os gastos da viagem para ${novaViagem.destino} ultrapassaram o orçamento em ${formatarMoeda(totalGastosNovo - orcamentoNovo)}.`,
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

      Alert.alert("Tudo certo!", "Informações atualizadas com sucesso!", [
        {
          text: "Continuar",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
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
          {
            backgroundColor: inputBackground,
            borderColor,
          },
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
        />
      </View>
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
          {value || "Não informado"}
        </Text>
      </View>
    </View>
  );

  const sectionHeaderProps = {
    isDark,
    primaryText,
    secondaryText,
    accent,
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: background }]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
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
          Viagem não encontrada
        </Text>

        <Pressable onPress={() => router.back()}>
          <Text style={{ color: accent, fontWeight: "700", marginTop: 12 }}>
            Voltar para minhas viagens
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
          >
            <Ionicons name="arrow-back" size={22} color={primaryText} />
            <Text style={[styles.backButtonText, { color: primaryText }]}>
              Viagens
            </Text>
          </Pressable>

          <Text style={[styles.topBarTitle, { color: primaryText }]}>
            {editando ? "Editar viagem" : "Detalhes"}
          </Text>

          <View style={{ width: 80 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.heroCard, { backgroundColor: cardBackground }]}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Ionicons name="airplane" size={28} color="#FFFFFF" />
              </View>

              <View style={styles.statusTag}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Planejada</Text>
              </View>
            </View>

            <Text style={[styles.heroLabel, { color: secondaryText }]}>
              SUA EXPERIÊNCIA
            </Text>

            <Text style={[styles.heroTitle, { color: primaryText }]}>
              {nome || "Minha viagem"}
            </Text>

            <View style={styles.heroDestination}>
              <Ionicons name="location" size={17} color={accent} />
              <Text
                style={[styles.heroDestinationText, { color: secondaryText }]}
              >
                {destino || "Destino não informado"}
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <SectionHeader
              {...sectionHeaderProps}
              title="Informações da viagem"
              subtitle="Os dados principais do seu destino"
              icon="map-outline"
            />

            {editando ? (
              <>
                {renderInput(
                  "Nome da viagem",
                  nome,
                  setNome,
                  "Ex: Férias",
                  "bookmark-outline",
                )}
                {renderInput(
                  "Destino",
                  destino,
                  setDestino,
                  "Ex: Rio de Janeiro",
                  "location-outline",
                )}
                {renderInput(
                  "Transporte",
                  transporte,
                  setTransporte,
                  "Ex: Avião",
                  "car-outline",
                )}
                {renderInput(
                  "Data",
                  data,
                  setData,
                  "Ex: 20/12/2026",
                  "calendar-outline",
                )}
              </>
            ) : (
              <View style={styles.infoGrid}>
                {renderInfo("Nome", nome, "bookmark-outline")}
                {renderInfo("Destino", destino, "location-outline")}
                {renderInfo("Transporte", transporte, "car-outline")}
                {renderInfo("Data", data, "calendar-outline")}
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <SectionHeader
              {...sectionHeaderProps}
              title="Hospedagem"
              subtitle="Onde você vai ficar"
              icon="bed-outline"
            />

            {editando ? (
              <>
                {renderInput(
                  "Nome do hotel",
                  hotelNome,
                  setHotelNome,
                  "Nome da hospedagem",
                  "business-outline",
                )}
                {renderInput(
                  "Endereço",
                  hotelEndereco,
                  setHotelEndereco,
                  "Endereço completo",
                  "location-outline",
                )}
                {renderInput(
                  "Data da hospedagem",
                  hotelData,
                  setHotelData,
                  "Ex: 20/12 a 25/12",
                  "calendar-outline",
                )}
              </>
            ) : (
              <View style={styles.infoGrid}>
                {renderInfo("Hotel", hotelNome, "business-outline")}
                {renderInfo("Endereço", hotelEndereco, "location-outline")}
                {renderInfo("Período", hotelData, "calendar-outline")}
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <SectionHeader
              {...sectionHeaderProps}
              title="Passeios e experiências"
              subtitle="Lugares que você deseja conhecer"
              icon="ticket-outline"
            />

            {passeios.length === 0 && !editando ? (
              <Text style={[styles.emptyMessage, { color: secondaryText }]}>
                Nenhum passeio cadastrado ainda.
              </Text>
            ) : (
              passeios.map((item, index) => (
                <View
                  key={`${index}-${item}`}
                  style={[styles.listItem, { borderBottomColor: borderColor }]}
                >
                  <View style={styles.listItemLeft}>
                    <Ionicons
                      name="navigate-circle-outline"
                      size={21}
                      color={accent}
                    />
                    <Text style={[styles.listItemText, { color: primaryText }]}>
                      {item}
                    </Text>
                  </View>

                  {editando && (
                    <Pressable
                      onPress={() => removerPasseio(index)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={19}
                        color="#D96B6B"
                      />
                    </Pressable>
                  )}
                </View>
              ))
            )}

            {editando && (
              <View style={styles.addRow}>
                <View
                  style={[
                    styles.inputContainer,
                    styles.flexInput,
                    { backgroundColor: inputBackground, borderColor },
                  ]}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color={accent}
                  />
                  <TextInput
                    style={[styles.input, { color: primaryText }]}
                    placeholder="Adicionar passeio"
                    placeholderTextColor={secondaryText}
                    value={novoPasseio}
                    onChangeText={setNovoPasseio}
                    onSubmitEditing={adicionarPasseio}
                  />
                </View>

                <Pressable style={styles.addButton} onPress={adicionarPasseio}>
                  <Ionicons name="add" size={23} color="#FFFFFF" />
                </Pressable>
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <SectionHeader
              {...sectionHeaderProps}
              title="Orçamento financeiro"
              subtitle="Controle seus gastos durante a viagem"
              icon="wallet-outline"
            />

            <View
              style={[
                styles.budgetMain,
                { backgroundColor: isDark ? "#293021" : "#EDF2E5" },
              ]}
            >
              <Text style={[styles.budgetLabel, { color: secondaryText }]}>
                SALDO RESTANTE
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
                {percentualGasto.toFixed(0)}% do orçamento utilizado
              </Text>
            </View>

            {editando ? (
              renderInput(
                "Orçamento total (R$)",
                orcamentoTotal,
                setOrcamentoTotal,
                "Ex: 5000",
                "wallet-outline",
                "numeric",
              )
            ) : (
              <View
                style={[styles.budgetRow, { borderBottomColor: borderColor }]}
              >
                <Text style={[styles.budgetRowLabel, { color: secondaryText }]}>
                  Orçamento total
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
                Total de gastos
              </Text>
              <Text style={[styles.budgetRowValue, { color: primaryText }]}>
                {formatarMoeda(totalGastos)}
              </Text>
            </View>

            <Text style={[styles.expensesTitle, { color: primaryText }]}>
              Gastos individuais
            </Text>

            {gastos.length === 0 ? (
              <Text style={[styles.emptyMessage, { color: secondaryText }]}>
                Nenhum gasto registrado.
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
                    placeholder="Nome do gasto"
                    placeholderTextColor={secondaryText}
                    value={novoGastoNome}
                    onChangeText={setNovoGastoNome}
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
                      placeholder="Valor em R$"
                      placeholderTextColor={secondaryText}
                      keyboardType="decimal-pad"
                      value={novoGastoValor}
                      onChangeText={setNovoGastoValor}
                    />
                  </View>

                  <Pressable style={styles.addButton} onPress={adicionarGasto}>
                    <Ionicons name="add" size={23} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.mainButton,
              {
                backgroundColor: accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => (editando ? salvarEdicao() : setEditando(true))}
          >
            <Ionicons
              name={editando ? "save-outline" : "create-outline"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.mainButtonText}>
              {editando ? "Salvar alterações" : "Editar informações"}
            </Text>
          </Pressable>

          {editando && (
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setEditando(false);
                carregarDetalhesViagem();
              }}
            >
              <Text style={[styles.cancelText, { color: secondaryText }]}>
                Cancelar edição
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
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  mainButton: {
    height: 53,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 5,
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
});
