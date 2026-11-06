// 1. IMPORTAÇÕES
// Trazemos os componentes básicos de interface do React Native
import { Text, View } from "react-native";

// 2. COMPONENTE PRINCIPAL
// "export default" permite que o Expo Router encontre e exiba esta tela
export default function Notificacoes() {
  return (
    // 3. CONTAINER PRINCIPAL (View)
    // flex: 1 -> Faz a tela ocupar todo o espaço disponível
    // justifyContent e alignItems: "center" -> Centraliza tudo bem no meio da tela
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* 4. TEXTO */}
      {/* Exibe a palavra "Notificações" na tela */}
      <Text>Notificações</Text>
    </View>
  );
}
