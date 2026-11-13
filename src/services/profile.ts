import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";

const PROFILE_STORAGE_KEY = "@tripwise_perfil";

export type UserProfile = {
  name: string;
  photoUri: string | null;
};

const DEFAULT_PROFILE: UserProfile = {
  name: "Viajante",
  photoUri: null,
};

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

    if (!storedProfile) {
      return { ...DEFAULT_PROFILE };
    }

    const parsedProfile: unknown = JSON.parse(storedProfile);

    if (
      !parsedProfile ||
      typeof parsedProfile !== "object" ||
      Array.isArray(parsedProfile)
    ) {
      return { ...DEFAULT_PROFILE };
    }

    const profile = parsedProfile as Partial<UserProfile>;

    const name = typeof profile.name === "string" ? profile.name.trim() : "";

    const photoUri =
      typeof profile.photoUri === "string" && profile.photoUri.trim().length > 0
        ? profile.photoUri
        : null;

    return {
      name: name.length > 0 && name.length <= 40 ? name : DEFAULT_PROFILE.name,
      photoUri,
    };
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const normalizedName =
    typeof profile.name === "string" ? profile.name.trim() : "";

  if (!normalizedName || normalizedName.length > 40) {
    throw new Error("O nome do perfil é inválido.");
  }

  if (
    profile.photoUri !== null &&
    (typeof profile.photoUri !== "string" ||
      profile.photoUri.trim().length === 0)
  ) {
    throw new Error("O endereço da foto de perfil é inválido.");
  }

  const normalizedProfile: UserProfile = {
    name: normalizedName,
    photoUri: profile.photoUri,
  };

  await AsyncStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify(normalizedProfile),
  );
}

export async function saveProfilePhoto(
  sourceUri: string,
  _previousPhotoUri?: string | null,
): Promise<string> {
  if (!sourceUri || typeof sourceUri !== "string") {
    throw new Error("O endereço da imagem selecionada é inválido.");
  }

  const sourceFile = new File(sourceUri);

  if (!sourceFile.exists) {
    throw new Error("A imagem selecionada não foi encontrada.");
  }

  const originalExtension = sourceFile.extension;
  const extension = /^\.[a-zA-Z0-9]+$/.test(originalExtension)
    ? originalExtension
    : ".jpg";

  const fileName = `tripwise-profile-${Date.now()}${extension}`;
  const destinationFile = new File(Paths.document, fileName);

  try {
    await sourceFile.copy(destinationFile);

    if (!destinationFile.exists) {
      throw new Error("Não foi possível salvar a nova foto de perfil.");
    }

    return destinationFile.uri;
  } catch (error) {
    try {
      if (destinationFile.exists) {
        destinationFile.delete();
      }
    } catch (cleanupError) {
      console.warn(
        "Não foi possível limpar o arquivo temporário da foto:",
        cleanupError,
      );
    }

    throw error;
  }
}

export async function removeProfilePhoto(
  photoUri: string | null,
): Promise<void> {
  if (!photoUri) {
    return;
  }

  try {
    const photoFile = new File(photoUri);

    if (photoFile.exists) {
      photoFile.delete();
    }
  } catch (error) {
    console.warn("Não foi possível remover o arquivo da foto:", error);
  }
}
