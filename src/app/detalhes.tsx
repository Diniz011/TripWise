import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

export default function Detalhes() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";
  const backgroundColor = isDark ? "#121212" : "#f0f2f5";
  const cardColor = isDark ? "#1e1e1e" : "#fff";
  const textColor = isDark ? "#fff" : "#1a1a1a";
  const subTextColor = isDark ? "#aaa" : "#868e96";
  const inputBg = isDark ? "#2c2c2c" : "#f8f9fa";
  const placeholderColor = isDark ? "#888" : "#aaa";

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState("");
  const [destino, setDestino] = useState("");
  const [transporte, setTransporte] = useState("");
  const [data, setData] = useState("");

  const [hotelNome, setHotelNome] = useState("");
  const [hotelEndereco, setHotelEndereco] = useState("");
  const [hotelData, setHotelData] = useState("");

  const [passeios, setPasseios] = useState([]);
  const [novoPasseio, setNovoPasseio] = useState("");

  const [orcamentoTotal, setOrcamentoTotal] = useState("0");
  const [gastos, setGastos] = useState([]);
  const [novoGastoNome, setNovoGastoNome] = useState("");
  const [novoGastoValor, setNovoGastoValor] = useState("");

  useEffect(() => {
    carregarDetalhesViagem();
  }, []);

  const carregarDetalhesViagem = async () => {
    try {
      const dados = await AsyncStorage.getItem("@viagens");
      if (dados) {
        const viagens = JSON.parse(dados);
        const viagemAtual = viagens.find((v) => v.id === params.id);

        if (viagemAtual) {
          setNome(viagemAtual.nome || "");
          setDestino(viagemAtual.destino || "");
          setTransporte(viagemAtual.transporte || "");
          setData(viagemAtual.data || "");

          setHotelNome(viagemAtual.hotelNome || "");
          setHotelEndereco(viagemAtual.hotelEndereco || "");
          setHotelData(viagemAtual.hotelData || "");

          setPasseios(
            viagemAtual.passeios ? JSON.parse(viagemAtual.passeios) : [],
          );
          setOrcamentoTotal(viagemAtual.orcamentoTotal || "0");
          setGastos(viagemAtual.gastos ? JSON.parse(viagemAtual.gastos) : []);
        }
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os detalhes da viagem.");
    }
  };

  const formatarMoeda = (valor) => {
    if (isNaN(valor)) return "R$ 0,00";
    return (
      "R$ " +
      valor
        .toFixed(2)
        .replace(".", ",")
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")
    );
  };

  const adicionarPasseio = () => {
    if (!novoPasseio) return;
    setPasseios([...passeios, novoPasseio]);
    setNovoPasseio("");
  };

  const removerPasseio = (index) => {
    setPasseios(passeios.filter((_, i) => i !== index));
  };

  const adicionarGasto = () => {
    if (!novoGastoNome || !novoGastoValor) return;
    setGastos([
      ...gastos,
      { nome: novoGastoNome, valor: parseFloat(novoGastoValor) },
    ]);
    setNovoGastoNome("");
    setNovoGastoValor("");
  };

  const removerGasto = (index) => {
    setGastos(gastos.filter((_, i) => i !== index));
  };

  const totalGastos = gastos.reduce((acc, curr) => acc + curr.valor, 0);
  const saldoRestante = parseFloat(orcamentoTotal) - totalGastos;

  const salvarEdicao = async () => {
    try {
      const dados = await AsyncStorage.getItem("@viagens");
      if (dados) {
        let viagens = JSON.parse(dados);
        viagens = viagens.map((v) =>
          v.id === params.id
            ? {
                ...v,
                nome,
                destino,
                transporte,
                data,
                hotelNome,
                hotelEndereco,
                hotelData,
                passeios: JSON.stringify(passeios),
                orcamentoTotal,
                gastos: JSON.stringify(gastos),
              }
            : v,
        );

        await AsyncStorage.setItem("@viagens", JSON.stringify(viagens));
        Alert.alert("Sucesso", "Informações atualizadas!");
        setEditando(false);
        router.replace("/");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar.");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: editando ? "Editando..." : nome,
          headerTitleStyle: {
            color: "#FFFFFF",
          },
        }}
      />

      {/* Card da Viagem */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.sessaoTitulo, { color: textColor }]}>
          Informações da Viagem
        </Text>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: subTextColor }]}>Nome</Text>
          {editando ? (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              value={nome}
              onChangeText={setNome}
            />
          ) : (
            <Text style={[styles.valor, { color: textColor }]}>{nome}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: subTextColor }]}>Destino</Text>
          {editando ? (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              value={destino}
              onChangeText={setDestino}
            />
          ) : (
            <Text style={[styles.valor, { color: textColor }]}>
              📍 {destino}
            </Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: subTextColor }]}>
            Transporte
          </Text>
          {editando ? (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              value={transporte}
              onChangeText={setTransporte}
            />
          ) : (
            <Text style={[styles.valor, { color: textColor }]}>
              🚀 {transporte}
            </Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: subTextColor }]}>Data</Text>
          {editando ? (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              value={data}
              onChangeText={setData}
            />
          ) : (
            <Text style={[styles.valor, { color: textColor }]}>📅 {data}</Text>
          )}
        </View>
      </View>

      {/* Card do Hotel */}
      <View
        style={[styles.card, { backgroundColor: cardColor, marginTop: 20 }]}
      >
        <Text style={[styles.sessaoTitulo, { color: textColor }]}>
          Hospedagem 🏨
        </Text>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: subTextColor }]}>
            Nome do Hotel
          </Text>
          {editando ? (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              value={hotelNome}
              onChangeText={setHotelNome}
            />
          ) : (
            <Text style={[styles.valor, { color: textColor }]}>
              {hotelNome || "Não informado"}
            </Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: subTextColor }]}>Endereço</Text>
          {editando ? (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              value={hotelEndereco}
              onChangeText={setHotelEndereco}
            />
          ) : (
            <Text style={[styles.valor, { color: textColor }]}>
              {hotelEndereco || "Não informado"}
            </Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: subTextColor }]}>
            Data da Hospedagem
          </Text>
          {editando ? (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              value={hotelData}
              onChangeText={setHotelData}
            />
          ) : (
            <Text style={[styles.valor, { color: textColor }]}>
              {hotelData || "Não informado"}
            </Text>
          )}
        </View>
      </View>

      {/* Card de Passeios */}
      <View
        style={[styles.card, { backgroundColor: cardColor, marginTop: 20 }]}
      >
        <Text style={[styles.sessaoTitulo, { color: textColor }]}>
          Passeios & Pontos Turísticos 🎟️
        </Text>

        {passeios.map((item, index) => (
          <View key={index} style={styles.linhaItem}>
            <Text style={[styles.textoItem, { color: textColor }]}>
              • {item}
            </Text>
            {editando && (
              <TouchableOpacity onPress={() => removerPasseio(index)}>
                <Text>❌</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {editando && (
          <View style={styles.linhaAdd}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 1,
                  marginBottom: 0,
                  backgroundColor: inputBg,
                  color: textColor,
                },
              ]}
              placeholder="Ex: Museu"
              placeholderTextColor={placeholderColor}
              value={novoPasseio}
              onChangeText={setNovoPasseio}
            />

            <TouchableOpacity
              style={styles.botaoAdd}
              onPress={adicionarPasseio}
            >
              <Text style={styles.textoBotaoAdd}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Card de Orçamento */}
      <View
        style={[styles.card, { backgroundColor: cardColor, marginTop: 20 }]}
      >
        <Text style={[styles.sessaoTitulo, { color: textColor }]}>
          Orçamento Financeiro 💰
        </Text>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: subTextColor }]}>
            Orçamento Total
          </Text>
          {editando ? (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: inputBg, color: textColor },
              ]}
              keyboardType="numeric"
              value={orcamentoTotal}
              onChangeText={setOrcamentoTotal}
            />
          ) : (
            <Text style={[styles.valor, { color: textColor }]}>
              {formatarMoeda(parseFloat(orcamentoTotal))}
            </Text>
          )}
        </View>

        {gastos.map((item, index) => (
          <View key={index} style={styles.linhaItem}>
            <Text style={[styles.textoItem, { color: textColor }]}>
              {item.nome}
            </Text>

            <View style={{ flexDirection: "row" }}>
              <Text style={[styles.textoItem, { color: textColor }]}>
                {formatarMoeda(item.valor)}
              </Text>

              {editando && (
                <TouchableOpacity
                  onPress={() => removerGasto(index)}
                  style={{ marginLeft: 10 }}
                >
                  <Text>❌</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {editando && (
          <View style={styles.linhaAdd}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 2,
                  marginBottom: 0,
                  backgroundColor: inputBg,
                  color: textColor,
                },
              ]}
              placeholder="Gasto"
              placeholderTextColor={placeholderColor}
              value={novoGastoNome}
              onChangeText={setNovoGastoNome}
            />

            <TextInput
              style={[
                styles.input,
                {
                  flex: 1,
                  marginBottom: 0,
                  marginLeft: 10,
                  backgroundColor: inputBg,
                  color: textColor,
                },
              ]}
              placeholder="R$"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={novoGastoValor}
              onChangeText={setNovoGastoValor}
            />

            <TouchableOpacity style={styles.botaoAdd} onPress={adicionarGasto}>
              <Text style={styles.textoBotaoAdd}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text
          style={[
            styles.valor,
            { marginTop: 15, color: saldoRestante < 0 ? "#e74c3c" : "#2ecc71" },
          ]}
        >
          Saldo: {formatarMoeda(saldoRestante)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.botao, editando && styles.botaoSalvar]}
        onPress={() => (editando ? salvarEdicao() : setEditando(true))}
      >
        <Text style={styles.textoBotao}>
          {editando ? "💾 Salvar Tudo" : "✏️ Editar Informações"}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },

  card: {
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    marginTop: 20,
  },

  sessaoTitulo: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },

  infoRow: { marginBottom: 15 },

  label: {
    fontSize: 14,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 5,
  },

  valor: { fontSize: 20, fontWeight: "500" },

  input: { padding: 10, borderRadius: 8, borderWidth: 1, fontSize: 18 },

  botao: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  botaoSalvar: { backgroundColor: "#2ecc71" },

  textoBotao: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  linhaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  textoItem: { fontSize: 18 },

  linhaAdd: { flexDirection: "row", alignItems: "center", marginTop: 10 },

  botaoAdd: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
  },

  textoBotaoAdd: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
