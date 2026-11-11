import { Stack } from "expo-router";
import { CurrencyProvider } from "../contexts/CurrencyContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ThemeProvider } from "../contexts/ThemeContext";

export default function Layout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <Stack>
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="detalhes"
              options={{
                headerShown: false,
                animation: "slide_from_right",
                gestureEnabled: true,
              }}
            />
          </Stack>
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
