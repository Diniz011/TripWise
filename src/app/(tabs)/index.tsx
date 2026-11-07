import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Viagem = {
  id: string;
  nome: string;
  destino: string;
  transporte: string;
  data: string;
};

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [nomeViagem, setNomeViagem] = useState("");
  const [destino, setDestino] = useState("");
  const [transporte, setTransporte] = useState("");
  const [data, setData] = useState("");
  const [viagens, setViagens] = useState<Viagem[]>([]);

  const background = isDark ? "#121212" : "#F4F6FA";
  const cardBackground = isDark ? "#1E1E1E" : "#FFFFFF";
  const primaryText = isDark ? "#FFFFFF" : "#172033";
  const secondaryText = isDark ? "#A0A0A0" : "#7B8495";
  const inputBackground = isDark ? "#292929" : "#F5F7FA";
  const borderColor = isDark ? "#333333" : "#E9ECF2";
  const accent = "#8FA255";

  const carregarViagens = useCallback(async () => {
    try {
      const dados = await AsyncStorage.getItem("@viagens");
      if (dados) {
        setViagens(JSON.parse(dados));
      } else {
        setViagens([]);
      }
    } catch (error) {
      console.error("Erro ao carregar viagens:", error);
      Alert.alert("Erro", "Não foi possível carregar suas viagens.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarViagens();
    }, [carregarViagens]),
  );

  const salvarViagem = async () => {
    if (
      !nomeViagem.trim() ||
      !destino.trim() ||
      !transporte.trim() ||
      !data.trim()
    ) {
      Alert.alert("Atenção", "Preencha todos os campos para continuar.");
      return;
    }

    const novaViagem: Viagem = {
      id: Date.now().toString(),
      nome: nomeViagem.trim(),
      destino: destino.trim(),
      transporte: transporte.trim(),
      data: data.trim(),
    };

    const lista = [...viagens, novaViagem];

    try {
      await AsyncStorage.setItem("@viagens", JSON.stringify(lista));
      setViagens(lista);
      setNomeViagem("");
      setDestino("");
      setTransporte("");
      setData("");
      Alert.alert("Tudo certo!", "Sua viagem foi adicionada.");
    } catch (error) {
      console.error("Erro ao salvar viagem:", error);
      Alert.alert("Erro", "Não foi possível salvar sua viagem.");
    }
  };

  const deletarViagem = (id: string) => {
    Alert.alert(
      "Excluir viagem",
      "Tem certeza de que deseja excluir esta viagem?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const lista = viagens.filter((item) => item.id !== id);

            try {
              await AsyncStorage.setItem("@viagens", JSON.stringify(lista));
              setViagens(lista);
            } catch (error) {
              console.error("Erro ao excluir viagem:", error);
              Alert.alert("Erro", "Não foi possível excluir a viagem.");
            }
          },
        },
      ],
    );
  };

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
  ) => (
    <View
      style={[
        styles.inputContainer,
        { backgroundColor: inputBackground, borderColor },
      ]}
    >
      <Ionicons name={icon} size={19} color={accent} />
      <TextInput
        style={[styles.input, { color: primaryText }]}
        placeholder={placeholder}
        placeholderTextColor={secondaryText}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );

  const Header = (
    <View>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subtitle, { color: secondaryText }]}>
            SUA PRÓXIMA AVENTURA COMEÇA AQUI
          </Text>
          <Text style={[styles.heading, { color: primaryText }]}>
            Explore o mundo.
          </Text>
          <Text style={[styles.headingAccent, { color: accent }]}>
            Viva cada destino.
          </Text>
        </View>

        <View style={[styles.headerIcon, { backgroundColor: cardBackground }]}>
          <Ionicons name="compass-outline" size={29} color={accent} />
        </View>
      </View>

      <View style={[styles.banner, { backgroundColor: cardBackground }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerTitle, { color: primaryText }]}>
            Planeje sem limites
          </Text>
          <Text style={[styles.bannerDescription, { color: secondaryText }]}>
            Organize seus destinos e tenha cada detalhe da viagem em um só
            lugar.
          </Text>
        </View>

        <View style={styles.bannerIcon}>
          <Ionicons name="airplane" size={28} color={accent} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: primaryText }]}>
            Nova viagem
          </Text>
          <Text style={[styles.sectionSubtitle, { color: secondaryText }]}>
            Comece a planejar sua próxima experiência
          </Text>
        </View>
        <Ionicons name="add-circle-outline" size={24} color={accent} />
      </View>

      <View style={[styles.formCard, { backgroundColor: cardBackground }]}>
        {renderInput(
          "Nome da viagem",
          nomeViagem,
          setNomeViagem,
          "bookmark-outline",
        )}
        {renderInput("Destino", destino, setDestino, "location-outline")}
        {renderInput(
          "Meio de transporte",
          transporte,
          setTransporte,
          "car-outline",
        )}
        {renderInput("Data da viagem", data, setData, "calendar-outline")}

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: accent, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={salvarViagem}
        >
          <Ionicons name="add" size={21} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Adicionar viagem</Text>
        </Pressable>
      </View>

      <View style={styles.listHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: primaryText }]}>
            Minhas viagens
          </Text>
          <Text style={[styles.sectionSubtitle, { color: secondaryText }]}>
            Seus destinos planejados
          </Text>
        </View>

        <View
          style={[
            styles.tripCount,
            { backgroundColor: isDark ? "#293021" : "#EDF2E5" },
          ]}
        >
          <Text style={[styles.tripCountText, { color: accent }]}>
            {viagens.length} {viagens.length === 1 ? "viagem" : "viagens"}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: background }]}
        edges={["top"]}
      >
        {/* Cabeçalho personalizado */}
        <View style={[styles.topBar, { borderBottomColor: borderColor }]}>
          <View>
            <Text style={[styles.topBarTitle, { color: primaryText }]}>
              Viagens
            </Text>
            <Text style={[styles.topBarSubtitle, { color: secondaryText }]}>
              Organize suas próximas aventuras
            </Text>
          </View>

          <View
            style={[
              styles.topBarIcon,
              { backgroundColor: isDark ? "#293021" : "#EDF2E5" },
            ]}
          >
            <Ionicons name="airplane" size={21} color={accent} />
          </View>
        </View>

        <FlatList
          data={viagens}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={Header}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View
              style={[
                styles.tripCard,
                { backgroundColor: cardBackground, borderColor },
              ]}
            >
              <Pressable
                style={styles.tripMain}
                onPress={() =>
                  router.push({
                    pathname: "/detalhes",
                    params: { id: item.id },
                  })
                }
              >
                <View style={styles.tripIcon}>
                  <Ionicons name="airplane-outline" size={23} color={accent} />
                </View>

                <View style={styles.tripInfo}>
                  <Text
                    style={[styles.tripName, { color: primaryText }]}
                    numberOfLines={1}
                  >
                    {item.nome}
                  </Text>

                  <View style={styles.tripDetail}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={secondaryText}
                    />
                    <Text
                      style={[styles.tripDetailText, { color: secondaryText }]}
                      numberOfLines={1}
                    >
                      {item.destino}
                    </Text>
                  </View>

                  <View style={styles.tripDetail}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={secondaryText}
                    />
                    <Text
                      style={[styles.tripDetailText, { color: secondaryText }]}
                    >
                      {item.data}
                    </Text>
                  </View>

                  <View style={styles.tripDetail}>
                    <Ionicons
                      name="car-outline"
                      size={14}
                      color={secondaryText}
                    />
                    <Text
                      style={[styles.tripDetailText, { color: secondaryText }]}
                      numberOfLines={1}
                    >
                      {item.transporte}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={secondaryText}
                />
              </Pressable>

              <View
                style={[styles.cardDivider, { backgroundColor: borderColor }]}
              />

              <View style={styles.tripActions}>
                <Text style={[styles.tripActionHint, { color: secondaryText }]}>
                  Ver detalhes da viagem
                </Text>

                <Pressable
                  onPress={() => deletarViagem(item.id)}
                  hitSlop={10}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={19} color="#D96B6B" />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View
              style={[styles.emptyCard, { backgroundColor: cardBackground }]}
            >
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: isDark ? "#293021" : "#EDF2E5" },
                ]}
              >
                <Ionicons name="map-outline" size={35} color={accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: primaryText }]}>
                Sua jornada começa aqui
              </Text>
              <Text style={[styles.emptyDescription, { color: secondaryText }]}>
                Você ainda não possui viagens cadastradas. Adicione seu primeiro
                destino e comece a planejar!
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    minHeight: 68,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarTitle: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  topBarSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
  topBarIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 140,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 9,
  },
  heading: {
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  headingAccent: {
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  headerIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  banner: {
    borderRadius: 19,
    padding: 19,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 27,
    gap: 12,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  bannerDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#8FA25518",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  formCard: {
    padding: 16,
    borderRadius: 19,
    marginBottom: 28,
    gap: 11,
  },
  inputContainer: {
    height: 49,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 11,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 13,
  },
  addButton: {
    height: 49,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  tripCount: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tripCountText: {
    fontSize: 11,
    fontWeight: "800",
  },
  tripCard: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },
  tripMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tripIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: "#8FA25518",
    alignItems: "center",
    justifyContent: "center",
  },
  tripInfo: {
    flex: 1,
    gap: 5,
  },
  tripName: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  tripDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tripDetailText: {
    fontSize: 11,
    flexShrink: 1,
  },
  cardDivider: {
    height: 1,
    marginTop: 13,
    marginBottom: 9,
  },
  tripActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tripActionHint: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 5,
  },
  emptyCard: {
    borderRadius: 19,
    padding: 25,
    alignItems: "center",
    marginTop: 2,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 7,
  },
  emptyDescription: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
  },
});
