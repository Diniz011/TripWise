import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Perfil() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    background: isDark ? "#121212" : "#F4F6FA",
    card: isDark ? "#1E1E1E" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#202124",
    secondary: isDark ? "#A7A7A7" : "#777D87",
    border: isDark ? "#333333" : "#ECEEF2",
    green: "#8FA255",
    iconBackground: isDark ? "#292D22" : "#F0F3E8",
  };

  const styles = createStyles(colors);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* CABEÇALHO */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Perfil</Text>
              <Text style={styles.subtitle}>Seu espaço no TripWise</Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons name="person-outline" size={23} color={colors.green} />
            </View>
          </View>

          {/* CARTÃO DO PERFIL */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={38} color="#FFFFFF" />
            </View>

            <Text style={styles.profileName}>Viajante</Text>
            <Text style={styles.profileDescription}>
              Sua próxima aventura começa aqui.
            </Text>

            <View style={styles.profileDivider} />

            <View style={styles.profileFooter}>
              <Ionicons
                name="airplane-outline"
                size={18}
                color={colors.green}
              />
              <Text style={styles.profileFooterText}>
                Explore o mundo com TripWise
              </Text>
            </View>
          </View>

          {/* PREFERÊNCIAS */}
          <Text style={styles.sectionTitle}>Preferências</Text>

          <View style={styles.sectionCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="cash-outline" size={21} color={colors.green} />
              </View>

              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Moeda</Text>
                <Text style={styles.preferenceDescription}>
                  Real brasileiro (R$)
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIcon}>
                <Ionicons
                  name="language-outline"
                  size={21}
                  color={colors.green}
                />
              </View>

              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Idioma</Text>
                <Text style={styles.preferenceDescription}>
                  Português (Brasil)
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="moon-outline" size={21} color={colors.green} />
              </View>

              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Aparência</Text>
                <Text style={styles.preferenceDescription}>
                  {isDark ? "Tema escuro" : "Tema claro"}
                </Text>
              </View>
            </View>
          </View>

          {/* SOBRE O APLICATIVO */}
          <Text style={styles.sectionTitle}>Sobre o aplicativo</Text>

          <View style={styles.sectionCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={21}
                  color={colors.green}
                />
              </View>

              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Sobre o TripWise</Text>
                <Text style={styles.preferenceDescription}>
                  Seu companheiro de viagens.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIcon}>
                <Ionicons
                  name="code-slash-outline"
                  size={21}
                  color={colors.green}
                />
              </View>

              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Versão do aplicativo</Text>
                <Text style={styles.preferenceDescription}>
                  TripWise · Versão 1.0.0
                </Text>
              </View>
            </View>
          </View>

          {/* RODAPÉ */}
          <View style={styles.footer}>
            <Ionicons name="airplane" size={17} color={colors.green} />
            <Text style={styles.footerText}>TripWise</Text>
            <Text style={styles.footerSubtitle}>Planeje. Explore. Viva.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function createStyles(colors: {
  background: string;
  card: string;
  text: string;
  secondary: string;
  border: string;
  green: string;
  iconBackground: string;
}) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 22,
      paddingTop: 16,
      paddingBottom: 35,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 25,
    },
    title: {
      fontSize: 29,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.7,
    },
    subtitle: {
      fontSize: 14,
      color: colors.secondary,
      marginTop: 5,
    },
    headerIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: colors.iconBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 23,
      padding: 25,
      alignItems: "center",
      marginBottom: 29,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: colors.green,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
    },
    profileName: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
    },
    profileDescription: {
      fontSize: 13,
      color: colors.secondary,
      marginTop: 6,
    },
    profileDivider: {
      height: 1,
      backgroundColor: colors.border,
      width: "100%",
      marginVertical: 20,
    },
    profileFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    profileFooterText: {
      fontSize: 13,
      color: colors.secondary,
      fontWeight: "500",
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 13,
      marginLeft: 2,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 19,
      paddingHorizontal: 16,
      marginBottom: 27,
      borderWidth: 1,
      borderColor: colors.border,
    },
    preferenceRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      gap: 13,
    },
    preferenceIcon: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor: colors.iconBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    preferenceInfo: {
      flex: 1,
    },
    preferenceTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    preferenceDescription: {
      fontSize: 12,
      color: colors.secondary,
      marginTop: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    footer: {
      alignItems: "center",
      marginTop: 5,
      gap: 7,
    },
    footerText: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
    },
    footerSubtitle: {
      fontSize: 12,
      color: colors.secondary,
    },
  });
}
