import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import {
  getUserProfile,
  removeProfilePhoto,
  saveProfilePhoto,
  saveUserProfile,
  UserProfile,
} from "../services/profile";

type ProfileColors = {
  card: string;
  text: string;
  secondary: string;
  border: string;
  green: string;
  iconBackground: string;
  selectedBackground: string;
};

type Props = {
  colors: ProfileColors;
};

type IdentityTranslations = {
  invalidName: string;
  enterName: string;
  longName: string;
  maxNameLength: string;
  error: string;
  saveNameError: string;
  permissionNeeded: string;
  galleryPermission: string;
  photoError: string;
  removePhoto: string;
  removePhotoConfirm: string;
  cancel: string;
  remove: string;
  changePhoto: string;
  choosePhoto: string;
  profilePhoto: string;
  photoOptions: string;
  editProfile: string;
  adventureStarts: string;
  savingChanges: string;
  exploreWorld: string;
  editProfileDescription: string;
  travelerName: string;
  enterYourName: string;
  characters: string;
  saveChanges: string;
  defaultName: string;
};

const IDENTITY_TRANSLATIONS: Record<
  "pt-BR" | "en" | "es",
  IdentityTranslations
> = {
  "pt-BR": {
    invalidName: "Nome inválido",
    enterName: "Informe seu nome para continuar.",
    longName: "Nome muito longo",
    maxNameLength: "O nome deve ter no máximo 40 caracteres.",
    error: "Erro",
    saveNameError: "Não foi possível salvar seu nome.",
    permissionNeeded: "Permissão necessária",
    galleryPermission:
      "Permita o acesso à galeria nas configurações do iPhone para escolher uma foto.",
    photoError:
      "Não foi possível selecionar ou salvar a foto. Tente novamente.",
    removePhoto: "Remover foto",
    removePhotoConfirm: "Deseja realmente remover sua foto de perfil?",
    cancel: "Cancelar",
    remove: "Remover",
    changePhoto: "Trocar foto",
    choosePhoto: "Escolher foto",
    profilePhoto: "Foto de perfil",
    photoOptions: "O que deseja fazer?",
    editProfile: "Editar perfil",
    adventureStarts: "Sua próxima aventura começa aqui.",
    savingChanges: "Salvando alterações...",
    exploreWorld: "Explore o mundo com TripWise",
    editProfileDescription: "Como gostaria de ser chamado no TripWise?",
    travelerName: "Nome do viajante",
    enterYourName: "Digite seu nome",
    characters: "caracteres",
    saveChanges: "Salvar alterações",
    defaultName: "Viajante",
  },

  en: {
    invalidName: "Invalid name",
    enterName: "Enter your name to continue.",
    longName: "Name is too long",
    maxNameLength: "Your name must be no longer than 40 characters.",
    error: "Error",
    saveNameError: "Could not save your name.",
    permissionNeeded: "Permission required",
    galleryPermission:
      "Allow access to your photo library in iPhone Settings to choose a photo.",
    photoError: "Could not select or save the photo. Please try again.",
    removePhoto: "Remove photo",
    removePhotoConfirm: "Are you sure you want to remove your profile photo?",
    cancel: "Cancel",
    remove: "Remove",
    changePhoto: "Change photo",
    choosePhoto: "Choose photo",
    profilePhoto: "Profile photo",
    photoOptions: "What would you like to do?",
    editProfile: "Edit profile",
    adventureStarts: "Your next adventure starts here.",
    savingChanges: "Saving changes...",
    exploreWorld: "Explore the world with TripWise",
    editProfileDescription: "What would you like us to call you on TripWise?",
    travelerName: "Traveler name",
    enterYourName: "Enter your name",
    characters: "characters",
    saveChanges: "Save changes",
    defaultName: "Traveler",
  },

  es: {
    invalidName: "Nombre no válido",
    enterName: "Introduce tu nombre para continuar.",
    longName: "El nombre es demasiado largo",
    maxNameLength: "El nombre debe tener un máximo de 40 caracteres.",
    error: "Error",
    saveNameError: "No se pudo guardar tu nombre.",
    permissionNeeded: "Permiso necesario",
    galleryPermission:
      "Permite el acceso a la galería en los ajustes del iPhone para elegir una foto.",
    photoError: "No se pudo seleccionar o guardar la foto. Inténtalo de nuevo.",
    removePhoto: "Eliminar foto",
    removePhotoConfirm: "¿Realmente deseas eliminar tu foto de perfil?",
    cancel: "Cancelar",
    remove: "Eliminar",
    changePhoto: "Cambiar foto",
    choosePhoto: "Elegir foto",
    profilePhoto: "Foto de perfil",
    photoOptions: "¿Qué deseas hacer?",
    editProfile: "Editar perfil",
    adventureStarts: "Tu próxima aventura comienza aquí.",
    savingChanges: "Guardando cambios...",
    exploreWorld: "Explora el mundo con TripWise",
    editProfileDescription: "¿Cómo te gustaría que te llamáramos en TripWise?",
    travelerName: "Nombre del viajero",
    enterYourName: "Escribe tu nombre",
    characters: "caracteres",
    saveChanges: "Guardar cambios",
    defaultName: "Viajero",
  },
};

export default function ProfileIdentityCard({ colors }: Props) {
  const { language } = useLanguage();
  const copy = IDENTITY_TRANSLATIONS[language];

  const [profile, setProfile] = useState<UserProfile>({
    name: copy.defaultName,
    photoUri: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const styles = createStyles(colors);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const savedProfile = await getUserProfile();

        if (active) {
          setProfile(savedProfile);
          setNameInput(savedProfile.name);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSaveName() {
    const normalizedName = nameInput.trim();

    if (!normalizedName) {
      Alert.alert(copy.invalidName, copy.enterName);
      return;
    }

    if (normalizedName.length > 40) {
      Alert.alert(copy.longName, copy.maxNameLength);
      return;
    }

    setSaving(true);

    try {
      const updatedProfile = {
        ...profile,
        name: normalizedName,
      };

      await saveUserProfile(updatedProfile);

      setProfile(updatedProfile);
      setEditModalVisible(false);
    } catch (error) {
      console.error("Erro ao salvar nome:", error);
      Alert.alert(copy.error, copy.saveNameError);
    } finally {
      setSaving(false);
    }
  }

  async function handleChoosePhoto() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(copy.permissionNeeded, copy.galleryPermission);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      setSaving(true);

      const newPhotoUri = await saveProfilePhoto(
        result.assets[0].uri,
        profile.photoUri,
      );

      const updatedProfile = {
        ...profile,
        photoUri: newPhotoUri,
      };

      await saveUserProfile(updatedProfile);

      setProfile(updatedProfile);
    } catch (error) {
      console.error("Erro ao selecionar foto:", error);
      Alert.alert(copy.error, copy.photoError);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemovePhoto() {
    if (!profile.photoUri) {
      return;
    }

    Alert.alert(copy.removePhoto, copy.removePhotoConfirm, [
      {
        text: copy.cancel,
        style: "cancel",
      },
      {
        text: copy.remove,
        style: "destructive",
        onPress: async () => {
          setSaving(true);

          try {
            const previousPhoto = profile.photoUri;

            const updatedProfile = {
              ...profile,
              photoUri: null,
            };

            await saveUserProfile(updatedProfile);
            setProfile(updatedProfile);

            await removeProfilePhoto(previousPhoto);
          } catch (error) {
            console.error("Erro ao remover foto:", error);
            Alert.alert(copy.error, copy.photoError);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  function handlePhotoOptions() {
    if (saving || loading) {
      return;
    }

    const options = [
      {
        text: profile.photoUri ? copy.changePhoto : copy.choosePhoto,
        onPress: () => {
          void handleChoosePhoto();
        },
      },
    ];

    if (profile.photoUri) {
      options.push({
        text: copy.removePhoto,
        onPress: () => {
          void handleRemovePhoto();
        },
      });
    }

    Alert.alert(copy.profilePhoto, copy.photoOptions, [
      ...options,
      {
        text: copy.cancel,
        style: "cancel",
      },
    ]);
  }

  return (
    <>
      <View style={styles.profileCard}>
        <Pressable
          style={styles.avatarContainer}
          onPress={handlePhotoOptions}
          disabled={loading || saving}
        >
          {profile.photoUri ? (
            <Image
              source={{ uri: profile.photoUri }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={38} color="#FFFFFF" />
            </View>
          )}

          <View style={styles.cameraButton}>
            <Ionicons name="camera" size={15} color="#FFFFFF" />
          </View>
        </Pressable>

        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.green}
            style={styles.profileLoading}
          />
        ) : (
          <>
            <Text style={styles.profileName}>{profile.name}</Text>

            <Pressable
              style={styles.editProfileButton}
              onPress={() => {
                setNameInput(profile.name);
                setEditModalVisible(true);
              }}
              disabled={saving}
            >
              <Ionicons name="create-outline" size={15} color={colors.green} />

              <Text style={styles.editProfileButtonText}>
                {copy.editProfile}
              </Text>
            </Pressable>

            <Text style={styles.profileDescription}>
              {copy.adventureStarts}
            </Text>
          </>
        )}

        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={colors.green} />

            <Text style={styles.savingText}>{copy.savingChanges}</Text>
          </View>
        )}

        <View style={styles.profileDivider} />

        <View style={styles.profileFooter}>
          <Ionicons name="airplane-outline" size={18} color={colors.green} />

          <Text style={styles.profileFooterText}>{copy.exploreWorld}</Text>
        </View>
      </View>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons
                  name="person-outline"
                  size={23}
                  color={colors.green}
                />
              </View>

              <Pressable
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={23} color={colors.secondary} />
              </Pressable>
            </View>

            <Text style={styles.modalTitle}>{copy.editProfile}</Text>

            <Text style={styles.modalDescription}>
              {copy.editProfileDescription}
            </Text>

            <Text style={styles.inputLabel}>{copy.travelerName}</Text>

            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder={copy.enterYourName}
              placeholderTextColor={colors.secondary}
              maxLength={40}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => {
                void handleSaveName();
              }}
              editable={!saving}
              selectionColor={colors.green}
            />

            <Text style={styles.characterCount}>
              {nameInput.length}/40 {copy.characters}
            </Text>

            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={() => {
                void handleSaveName();
              }}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>{copy.saveChanges}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function createStyles(colors: ProfileColors) {
  return StyleSheet.create({
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 23,
      padding: 25,
      alignItems: "center",
      marginBottom: 29,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarContainer: {
      position: "relative",
      marginBottom: 15,
    },
    avatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: colors.green,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarImage: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: colors.iconBackground,
    },
    cameraButton: {
      position: "absolute",
      right: -2,
      bottom: 0,
      width: 29,
      height: 29,
      borderRadius: 15,
      backgroundColor: colors.green,
      borderWidth: 2,
      borderColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
    },
    profileName: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
    },
    editProfileButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 9,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: colors.iconBackground,
    },
    editProfileButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.green,
    },
    profileDescription: {
      fontSize: 13,
      color: colors.secondary,
      marginTop: 9,
      textAlign: "center",
    },
    profileLoading: {
      marginVertical: 12,
    },
    savingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
    },
    savingText: {
      fontSize: 11,
      color: colors.secondary,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.card,
      borderRadius: 23,
      padding: 23,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    modalIcon: {
      width: 45,
      height: 45,
      borderRadius: 14,
      backgroundColor: colors.iconBackground,
      justifyContent: "center",
      alignItems: "center",
    },
    closeButton: {
      padding: 5,
    },
    modalTitle: {
      fontSize: 21,
      fontWeight: "800",
      color: colors.text,
    },
    modalDescription: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.secondary,
      marginTop: 7,
      marginBottom: 23,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 9,
    },
    nameInput: {
      height: 50,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.iconBackground,
      paddingHorizontal: 14,
      fontSize: 15,
      color: colors.text,
    },
    characterCount: {
      fontSize: 11,
      color: colors.secondary,
      textAlign: "right",
      marginTop: 7,
    },
    saveButton: {
      height: 50,
      borderRadius: 14,
      backgroundColor: colors.green,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 23,
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
}
