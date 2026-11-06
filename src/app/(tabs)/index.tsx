// @ts-nocheck
// 1. IMPORTAÇÕES
import AsyncStorage from "@react-native-async-storage/async-storage"; // Banco de dados local simples
import { useRouter } from "expo-router"; // Ferramenta para navegar entre telas
import { useEffect, useState } from "react"; // Hooks do React para gerenciar estado e ciclo de vida
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"; // Componentes visuais básicos

export default function Index() {
  // 2. GERENCIAMENTO DE TEMA (Modo Escuro)
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Cores que mudam automaticamente se o celular estiver no modo escuro
  const backgroundColor = isDark ? "#121212" : "#f0f2f5";
  const cardColor = isDark ? "#1e1e1e" : "#fff";
  const textColor = isDark ? "#fff" : "#1a1a1a";
  const subTextColor = isDark ? "#aaa" : "#666";
  const inputBg = isDark ? "#2c2c2c" : "#f8f9fa";
  const placeholderColor = isDark ? "#888" : "#aaa";

  // 3. ESTADOS (Variáveis que guardam informações na tela)
  const [nomeViagem, setNomeViagem] = useState("");
  const [destino, setDestino] = useState("");
  const [transporte, setTransporte] = useState("");
  const [data, setData] = useState("");
  const [viagens, setViagens] = useState([]); // Lista de todas as viagens
  const router = useRouter(); // Inicializa o roteador

  // 4. CICLO DE VIDA: Executa uma vez quando a tela abre
  useEffect(() => {
    carregarViagens();
  }, []);

  // 5. FUNÇÕES DO BANCO DE DADOS (AsyncStorage)

  // Carrega as viagens salvas no celular
  const carregarViagens = async () => {
    const dados = await AsyncStorage.getItem("@viagens");
    if (dados) setViagens(JSON.parse(dados)); // Transforma texto em lista
  };

  // Salva uma nova viagem
  const salvarViagem = async () => {
    // Validação: Impede salvar se faltar algum campo
    if (!nomeViagem || !destino || !transporte || !data) {
      Alert.alert("Erro", "Preencha tudo!");
      return;
    }
    // Cria o objeto da nova viagem
    const novaViagem = {
      id: Date.now().toString(), // Gera um ID único baseado na hora
      nome: nomeViagem,
      destino,
      transporte,
      data,
    };
    const lista = [...viagens, novaViagem]; // Adiciona à lista existente
    setViagens(lista);
    await AsyncStorage.setItem("@viagens", JSON.stringify(lista)); // Salva no celular

    // Limpa os campos de texto
    setNomeViagem("");
    setDestino("");
    setTransporte("");
    setData("");
  };

  // Deleta uma viagem pelo ID
  const deletarViagem = async (id) => {
    const lista = viagens.filter(
      (item) => <unsafe_url>item.id</unsafe_url> !== id,
    ); // Filtra a lista removendo o item
    setViagens(lista);
    await AsyncStorage.setItem("@viagens", JSON.stringify(lista)); // Atualiza o banco
  };

  // 6. INTERFACE VISUAL (O que aparece na tela)
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.titulo, { color: textColor }]}>
        ✈️ Minhas Viagens
      </Text>

      {/* Formulário de Cadastro */}
      <View style={[styles.cardFormulario, { backgroundColor: cardColor }]}>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="Nome da Viagem"
          placeholderTextColor={placeholderColor}
          value={nomeViagem}
          onChangeText={setNomeViagem}
        />
        {/* ... outros inputs seguem a mesma lógica ... */}
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
          placeholder="Data (ex: 10/12/2026)"
          placeholderTextColor={placeholderColor}
          value={data}
          onChangeText={setData}
        />

        <TouchableOpacity style={styles.botao} onPress={salvarViagem}>
          <Text style={styles.textoBotao}>Adicionar Viagem</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Viagens */}
      <FlatList
        data={viagens}
        keyExtractor={(item) => <unsafe_url>item.id</unsafe_url>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.itemLista, { backgroundColor: cardColor }]}
            // Ao clicar, navega para a tela de detalhes passando os dados da viagem
            onPress={() => router.push({ pathname: "/detalhes", params: item })}
          >
            <View>
              <Text style={[styles.textoItem, { color: textColor }]}>
                {item.nome}
              </Text>
              <Text style={[styles.subTextoItem, { color: subTextColor }]}>
                📍 {item.destino} 📅 {item.data}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => deletarViagem(<unsafe_url>item.id</unsafe_url>)}
            >
              <Text style={styles.botaoExcluir}>🗑️</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// 7. ESTILOS (Aparência dos elementos)
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  cardFormulario: { padding: 20, borderRadius: 15, marginBottom: 20 },
  input: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  botao: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
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
  subTextoItem: { fontSize: 14, marginTop: 2 },
  botaoExcluir: { fontSize: 22, padding: 5 },
});
