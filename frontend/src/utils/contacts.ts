import * as Contacts from "expo-contacts";
import { Linking, Platform } from "react-native";

export interface PickedContact {
  name: string;
  phone: string;
}

/**
 * Opens the native contact picker (iOS) or a lightweight picker fallback (Android).
 * Returns { name, phone } or null if cancelled/denied.
 */
export async function pickContact(): Promise<PickedContact | null> {
  const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
  if (status !== "granted") {
    if (!canAskAgain) {
      // user permanently denied — hint them to open settings
      Linking.openSettings().catch(() => {});
    }
    return null;
  }

  // Native contact picker sheet on iOS (returns a single contact directly)
  if (Platform.OS === "ios" && (Contacts as any).presentContactPickerAsync) {
    const contact = await (Contacts as any).presentContactPickerAsync();
    if (!contact) return null;
    const phone = contact.phoneNumbers?.[0]?.number || "";
    const name = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ");
    if (!phone) return null;
    return { name: name || "", phone };
  }

  // Fallback: return the first phone contact — not ideal on Android but works headlessly.
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
  });
  if (!data.length) return null;
  const first = data.find((c) => (c.phoneNumbers || []).length > 0);
  if (!first) return null;
  return {
    name: first.name || "",
    phone: first.phoneNumbers?.[0]?.number || "",
  };
}

/**
 * On Android we need a proper visual picker, so provide a listing function.
 */
export async function listContacts(): Promise<PickedContact[]> {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== "granted") return [];
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
    sort: Contacts.SortTypes.FirstName,
  });
  const out: PickedContact[] = [];
  data.forEach((c) => {
    (c.phoneNumbers || []).forEach((p) => {
      if (p.number) {
        out.push({ name: c.name || "", phone: p.number });
      }
    });
  });
  return out;
}

/**
 * Dial a phone number using the platform dialer.
 */
export async function callNumber(phone: string) {
  if (!phone) return;
  const cleaned = phone.replace(/\s+/g, "");
  const url = `tel:${cleaned}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  } catch {
    // no-op
  }
}

/**
 * Open Google Maps (on Android) or default maps app with directions
 * between `from` and `to` textual locations.
 */
export async function openMapDirections(from: string, to: string) {
  const origin = encodeURIComponent((from || "").trim());
  const destination = encodeURIComponent((to || "").trim());
  if (!destination) return;

  // Universal Google Maps URL – opens the Google Maps app when installed on
  // Android, or google.com/maps in the browser as fallback.
  const url = `https://www.google.com/maps/dir/?api=1${
    origin ? `&origin=${origin}` : ""
  }&destination=${destination}&travelmode=driving`;

  try {
    // Prefer the Android-only google.navigation intent so it always launches
    // the native Google Maps app.
    if (Platform.OS === "android") {
      const nav = `google.navigation:q=${destination}`;
      const canNav = await Linking.canOpenURL(nav);
      if (canNav) {
        await Linking.openURL(nav);
        return;
      }
    }
    await Linking.openURL(url);
  } catch {
    // no-op
  }
}
