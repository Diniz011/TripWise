// @ts-nocheck
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const backgroundColor = isDark ? "#121212" : "#f0f2f5";
  const cardColor = isDark ? "#1e1e1e" : "#fff";
  const textColor = isDark ? "#fff" : "#1a1a1a";
  const subTextColor = isDark ? "#aaa" : "#666";
  const inputBg = isDark ? "#2c2c2c" : "#f8f9fa";
  const placeholderColor = isDark ? "#888" : "#aaa";

  const [nomeViagem, setNomeViagem] = useState("");
  const [destino, setDestino] = useState("");
  const [transporte, setTransporte] = useState("");
  const [data, setData] = useState("");
  const [viagens, setViagens] = useState([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      carregarViagens();
    }, []),
  );

  const carregarViagens = async () => {
    const dados = await AsyncStorage.getItem("@viagens");
    if (dados) setViagens(JSON.parse(dados));
  };

  const salvarViagem = async () => {
    if (!nomeViagem || !destino || !transporte || !data)
      return Alert.alert("Erro", "Preencha tudo!");
    const novaViagem = {
      id: Date.now().toString(),
      nome: nomeViagem,
      destino,
      transporte,
      data,
    };
    const lista = [...viagens, novaViagem];
    setViagens(lista);
    await AsyncStorage.setItem("@viagens", JSON.stringify(lista));
    setNomeViagem("");
    setDestino("");
    setTransporte("");
    setData("");
  };

  const deletarViagem = async (id) => {
    const lista = viagens.filter((item) => item.id !== id);
    setViagens(lista);
    await AsyncStorage.setItem("@viagens", JSON.stringify(lista));
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.titulo, { color: textColor }]}>
        ✈️ Minhas Viagens
      </Text>
      <View style={[styles.cardFormulario, { backgroundColor: cardColor }]}>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="Nome da Viagem"
          placeholderTextColor={placeholderColor}
          value={nomeViagem}
          onChangeText={setNomeViagem}
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="Destino"
          placeholderTextColor={placeholderColor}
          value={destino}
          onChangeText={setDestino}
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="Meio de Transporte"
          placeholderTextColor={placeholderColor}
          value={transporte}
          onChangeText={setTransporte}
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="Data"
          placeholderTextColor={placeholderColor}
          value={data}
          onChangeText={setData}
        />
        <TouchableOpacity style={styles.botao} onPress={salvarViagem}>
          <Text style={styles.textoBotao}>Adicionar Viagem</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={viagens}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.itemLista, { backgroundColor: cardColor }]}
            onPress={() =>
              router.push({ pathname: "/detalhes", params: { id: item.id } })
            }
          >
            <View>
              <Text style={[styles.textoItem, { color: textColor }]}>
                {item.nome}
              </Text>
              <Text style={[styles.subTextoItem, { color: subTextColor }]}>
                📍 {item.destino} 📅 {item.data}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deletarViagem(item.id)}>
              <Text style={styles.botaoExcluir}>🗑️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  cardFormulario: { padding: 20, borderRadius: 15, marginBottom: 20 },
  input: { padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1 },
  botao: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  textoBotao: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  itemLista: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textoItem: { fontSize: 18, fontWeight: "bold" },
  subTextoItem: { fontSize: 14 },
  botaoExcluir: { fontSize: 22 },
});
