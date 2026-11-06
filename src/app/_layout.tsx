// 1. IMPORTAÇÃO
// Stack é o componente que cria a navegação em pilha (uma tela em cima da outra)
import { Stack } from "expo-router";

// 2. COMPONENTE PRINCIPAL
export default function Layout() {
  return (
    // 3. NAVEGADOR EM PILHA
    <Stack>
      {/* TELA INICIAL: O grupo de abas */}
      {/* "headerShown: false" esconde o cabeçalho superior, pois as abas já têm o próprio cabeçalho */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* TELA SECUNDÁRIA: Detalhes da Viagem */}
      {/* Esta tela fica fora das abas. Quando o usuário entra nela, a Tab Bar some, */}
      {/* permitindo focar totalmente nos detalhes. O título aparece no topo. */}
      <Stack.Screen name="detalhes" options={{ title: "Detalhes da Viagem" }} />
    </Stack>
  );
}
