// @ts-nocheck
// 1. IMPORTAÇÕES
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios"; // Usado para buscar dados na internet (Clima)
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
  // 2. GERENCIAMENTO DE TEMA (Modo Escuro)
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const backgroundColor = isDark ? "#121212" : "#f0f2f5";
  const cardColor = isDark ? "#1e1e1e" : "#fff";
  const textColor = isDark ? "#fff" : "#333";

  // 3. RECEBIMENTO DE PARÂMETROS
  // Captura os dados da viagem que foram passados pela tela inicial
  const params = useLocalSearchParams();
  const router = useRouter();

  // 4. ESTADOS (Dados que podem ser editados)
  const [editando, setEditando] = useState(false); // Controla se a tela está em modo de edição
  const [nome, setNome] = useState(params.nome || "");
  const [destino, setDestino] = useState(params.destino || "");
  // ... outros estados de texto ...

  // Estados para listas (Passeios e Gastos)
  const [passeios, setPasseios] = useState(
    params.passeios ? JSON.parse(params.passeios) : [],
  );
  const [gastos, setGastos] = useState(
    params.gastos ? JSON.parse(params.gastos) : [],
  );

  // 5. INTEGRAÇÃO COM API (Clima)
  const [clima, setClima] = useState(null);

  const buscarClima = async (cidade) => {
    if (!cidade) return;
    try {
      // Passo 1: Busca as coordenadas da cidade
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1`;
      const geoResponse = await axios.get(geoUrl);

      if (geoResponse.data.results) {
        const { latitude, longitude } = geoResponse.data.results[0];
        // Passo 2: Busca o clima usando as coordenadas
        const climaUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const climaResponse = await axios.get(climaUrl);
        setClima(`${climaResponse.data.current_weather.temperature}°C`);
      }
    } catch (error) {
      setClima("Erro");
    }
  };

  // Executa a busca do clima quando a tela abre
  useEffect(() => {
    if (destino) buscarClima(destino);
  }, [destino]);

  // 6. FUNÇÕES FINANCEIRAS
  // Formata números para o padrão Real (R$ 0,00)
  const formatarMoeda = (valor) => {
    if (isNaN(valor)) return "R$ 0,00";
    return "R$ " + valor.toFixed(2).replace(".", ",");
  };

  // Calcula o saldo restante
  const totalGastos = gastos.reduce((acc, curr) => acc + curr.valor, 0);
  const saldoRestante = parseFloat(params.orcamentoTotal || 0) - totalGastos;

  // 7. SALVAR ALTERAÇÕES
  const salvarEdicao = async () => {
    try {
      const dados = await AsyncStorage.getItem("@viagens");
      let viagens = JSON.parse(dados);
      // Atualiza apenas a viagem atual na lista
      viagens = viagens.map((v) =>
        <unsafe_url>v.id</unsafe_url> === <unsafe_url>params.id</unsafe_url>
          ? { ...v, nome, destino }
          : v,
      );
      await AsyncStorage.setItem("@viagens", JSON.stringify(viagens));
      Alert.alert("Sucesso", "Informações atualizadas!");
      setEditando(false);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar.");
    }
  };

  // 8. INTERFACE VISUAL
  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      {/* Atualiza o título do cabeçalho dinamicamente */}
      <Stack.Screen options={{ title: editando ? "Editando..." : nome }} />

      {/* Exemplo de bloco condicional (Visualização vs Edição) */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={styles.sessaoTitulo}>Informações da Viagem</Text>
        {editando ? (
          <TextInput style={styles.input} value={nome} onChangeText={setNome} />
        ) : (
          <Text style={styles.valor}>{nome}</Text>
        )}
      </View>

      {/* Botão de Ação Principal */}
      <TouchableOpacity
        style={[styles.botao, editando && { backgroundColor: "#2ecc71" }]}
        onPress={() => (editando ? salvarEdicao() : setEditando(true))}
      >
        <Text style={styles.textoBotao}>
          {editando ? "💾 Salvar Tudo" : "✏️ Editar Informações"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// 9. ESTILOS (Omitidos para brevidade, mas controlam o visual dos cards e botões)
const styles = StyleSheet.create({
  /* ... */
});
