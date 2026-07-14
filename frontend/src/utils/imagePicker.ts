import * as ImagePicker from "expo-image-picker";

/**
 * Returns a data URI (data:image/jpeg;base64,...) or null.
 */
export async function pickImageBase64(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.6,
    base64: true,
    allowsEditing: true,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  if (!asset.base64) return null;
  return `data:image/jpeg;base64,${asset.base64}`;
}
