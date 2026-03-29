import * as ImagePicker from "expo-image-picker";
import { SaveFormat, manipulateAsync } from "expo-image-manipulator";
import { Platform } from "react-native";

const AVATAR_SIZE = 320;
const AVATAR_QUALITY = 0.72;

async function resizeWebAvatar(file: File) {
  return new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("KatChef couldn't prepare that avatar image."));
        return;
      }

      const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - sourceSize) / 2;
      const sourceY = (image.naturalHeight - sourceSize) / 2;

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        AVATAR_SIZE,
        AVATAR_SIZE,
      );

      const dataUrl = canvas.toDataURL("image/jpeg", AVATAR_QUALITY);
      URL.revokeObjectURL(objectUrl);
      resolve(dataUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("KatChef couldn't read that avatar image."));
    };

    image.src = objectUrl;
  });
}

export async function pickAvatarDataUrl() {
  if (Platform.OS !== "web") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Photo access is needed to choose an avatar.");
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"] as ImagePicker.MediaType[],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: Platform.OS === "web",
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];

  if (Platform.OS === "web") {
    if (asset.file) {
      return resizeWebAvatar(asset.file);
    }

    if (asset.base64) {
      return `data:image/jpeg;base64,${asset.base64}`;
    }

    throw new Error("KatChef couldn't read that avatar image.");
  }

  const processed = await manipulateAsync(
    asset.uri,
    [{ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } }],
    {
      compress: AVATAR_QUALITY,
      format: SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!processed.base64) {
    throw new Error("KatChef couldn't prepare that avatar image.");
  }

  return `data:image/jpeg;base64,${processed.base64}`;
}
