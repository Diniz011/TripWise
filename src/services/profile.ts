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
      return DEFAULT_PROFILE;
    }

    const parsedProfile = JSON.parse(storedProfile) as Partial<UserProfile>;

    return {
      name:
        typeof parsedProfile.name === "string" && parsedProfile.name.trim()
          ? parsedProfile.name.trim()
          : DEFAULT_PROFILE.name,
      photoUri:
        typeof parsedProfile.photoUri === "string"
          ? parsedProfile.photoUri
          : null,
    };
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    return DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export async function saveProfilePhoto(
  sourceUri: string,
  previousPhotoUri?: string | null,
): Promise<string> {
  const sourceFile = new File(sourceUri);

  if (!sourceFile.exists) {
    throw new Error("A imagem selecionada não foi encontrada.");
  }

  const extension = sourceFile.extension || ".jpg";
  const fileName = `tripwise-profile-${Date.now()}${extension}`;
  const destinationFile = new File(Paths.document, fileName);

  await sourceFile.copy(destinationFile);

  if (previousPhotoUri && previousPhotoUri !== destinationFile.uri) {
    try {
      const previousFile = new File(previousPhotoUri);

      if (previousFile.exists) {
        previousFile.delete();
      }
    } catch (error) {
      console.warn("Não foi possível remover a foto anterior:", error);
    }
  }

  return destinationFile.uri;
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
