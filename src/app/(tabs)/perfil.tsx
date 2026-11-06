// 1. IMPORTAÇÕES
// Componentes visuais básicos do React Native
import { Text, View } from "react-native";

// 2. COMPONENTE PRINCIPAL
// A função tem o mesmo nome do arquivo, facilitando a organização
export default function Perfil() {
  return (
    // 3. CONTAINER PRINCIPAL
    // Usamos estilos inline (direto na tag) para centralizar o conteúdo
    // "flex: 1" garante que a tela inteira seja preenchida
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* 4. CONTEÚDO */}
      {/* Texto simples que indica em qual tela o usuário está */}
      <Text>Perfil</Text>
    </View>
  );
}
