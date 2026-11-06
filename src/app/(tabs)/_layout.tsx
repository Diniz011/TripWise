// @ts-nocheck
// 1. IMPORTAÇÕES: Ferramentas necessárias para construir a tela
import { Ionicons } from "@expo/vector-icons"; // Biblioteca de ícones
import { Tabs } from "expo-router"; // Componente de navegação em abas do Expo Router
import { StyleSheet, useColorScheme } from "react-native"; // Ferramentas de estilo e detecção de tema

// 2. COMPONENTE PRINCIPAL: Define a estrutura da Tab Bar
export default function TabLayout() {
  // Detecta se o celular está no modo claro ou escuro
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Define as cores dinamicamente com base no tema
  const backgroundColor = isDark ? "#1e1e1e" : "#ffffff"; // Fundo da barra
  const textColor = isDark ? "#ffffff" : "#000000"; // Cor do texto do cabeçalho
  const activeColor = "#8FA255"; // Cor verde para a aba selecionada

  return (
    // 3. CONFIGURAÇÃO GLOBAL DAS ABAS
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor, // Cor do ícone/texto quando selecionado
        tabBarInactiveTintColor: isDark ? "#888888" : "#666666", // Cor quando não selecionado
        tabBarStyle: [styles.tabBar, { backgroundColor: backgroundColor }], // Aplica o estilo flutuante
        headerStyle: { backgroundColor: isDark ? "#121212" : "#f0f2f5" }, // Cor do topo do app
        headerTitleStyle: { color: textColor }, // Cor do título no topo
      }}
    >
      {/* 4. DEFINIÇÃO DAS TELAS (ABAS) */}

      {/* Aba 1: Viagens (Tela Inicial) */}
      <Tabs.Screen
        name="index" // Nome do arquivo (index.tsx)
        options={{
          title: "Viagens", // Texto que aparece na aba
          // Ícone que muda de cor dinamicamente
          tabBarIcon: ({ color }) => (
            <Ionicons name="airplane" size={24} color={color} />
          ),
        }}
      />

      {/* Aba 2: Notificações */}
      <Tabs.Screen
        name="notificacoes"
        options={{
          title: "Notificações",
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications" size={24} color={color} />
          ),
          tabBarBadge: 21, // Bolinha vermelha com número
        }}
      />

      {/* Aba 3: Perfil */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// 5. ESTILOS: Responsável pelo design flutuante
const styles = StyleSheet.create({
  tabBar: {
    position: "absolute", // Faz a barra flutuar sobre a tela
    bottom: 40, // Distância do fundo da tela
    left: 40, // Distância da lateral esquerda
    right: 40, // Distância da lateral direita
    elevation: 5, // Sombra para Android
    borderRadius: 35, // Bordas arredondadas (Formato de cápsula)
    height: 65, // Altura da barra
    paddingBottom: 8, // Espaçamento interno inferior
    paddingTop: 8, // Espaçamento interno superior
    shadowColor: "#000", // Cor da sombra (iOS)
    shadowOffset: { width: 0, height: 10 }, // Direção da sombra (iOS)
    shadowOpacity: 0.3, // Transparência da sombra (iOS)
    shadowRadius: 15, // Desfoque da sombra (iOS)
    borderTopWidth: 0, // Remove a linha padrão que fica em cima da barra
  },
});
