import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import { Spacing } from "@/constants/theme";
import { useLanguage } from "../contexts/LanguageContext";

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

const HINT_TRANSLATIONS = {
  "pt-BR": {
    title: "Experimente editar",
  },
  en: {
    title: "Try editing",
  },
  es: {
    title: "Prueba a editar",
  },
};

export function HintRow({ title, hint = "app/index.tsx" }: HintRowProps) {
  const { language } = useLanguage();
  const copy = HINT_TRANSLATIONS[language];

  return (
    <View style={styles.stepRow}>
      <ThemedText type="small">{title ?? copy.title}</ThemedText>

      <ThemedView type="backgroundSelected" style={styles.codeSnippet}>
        <ThemedText themeColor="textSecondary">{hint}</ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  codeSnippet: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});
