import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking, Platform, Share } from "react-native";
import * as Location from "expo-location";
import { resolveArea } from "./areas";
import { emergencyShareMessage, mapsLink } from "./helplines";

const TRUSTED_KEY = "safeher_trusted_contact";

export async function getTrustedContact(): Promise<string | null> {
  return AsyncStorage.getItem(TRUSTED_KEY);
}

export async function setTrustedContact(number: string): Promise<void> {
  const cleaned = number.replace(/[^\d+]/g, "").trim();
  if (!cleaned) {
    await AsyncStorage.removeItem(TRUSTED_KEY);
    return;
  }
  await AsyncStorage.setItem(TRUSTED_KEY, cleaned);
}

export async function callNumber(number: string): Promise<void> {
  const url = `tel:${number}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Cannot place call", `Dial ${number} manually on your phone.`);
  }
}

export async function getEmergencyLocation(): Promise<{
  lat: number;
  lon: number;
  area: string;
} | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Location needed",
      "Allow location access so we can share your position with help."
    );
    return null;
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  const area = await resolveArea(lat, lon);
  return { lat, lon, area };
}

/** SMS with live Maps pin (works best on a real phone). */
export async function smsLocation(
  toNumber: string,
  lat: number,
  lon: number,
  area?: string | null
): Promise<void> {
  const message = emergencyShareMessage(lat, lon, area);
  const body = encodeURIComponent(message);
  const digits = toNumber.replace(/[^\d+]/g, "");
  // Try several schemes — do NOT gate on canOpenURL (Android 11+ often lies).
  const urls =
    Platform.OS === "ios"
      ? [`sms:${digits}&body=${body}`, `sms:${digits}`]
      : [
          `sms:${digits}?body=${body}`,
          `smsto:${digits}?body=${body}`,
          `sms:${digits}`,
        ];

  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // try next
    }
  }

  try {
    await Share.share({ message, title: "SafeHer — live location" });
  } catch {
    Alert.alert(
      "Could not open Messages",
      "Copy your location from Share, or open Messages and send it manually."
    );
  }
}

/** Open the system share sheet with a Google Maps live-location link. */
export async function shareLocationWithOthers(): Promise<boolean> {
  const loc = await getEmergencyLocation();
  if (!loc) return false;
  const message = emergencyShareMessage(loc.lat, loc.lon, loc.area);
  try {
    await Share.share(
      Platform.OS === "ios"
        ? { message, url: mapsLink(loc.lat, loc.lon) }
        : { message, title: "SafeHer — live location" }
    );
    return true;
  } catch {
    Alert.alert("Share failed", "Copy your location and send it manually.");
    return false;
  }
}

/** Share to police SMS (100) and optional trusted contact. */
export async function shareLocationToPoliceAndTrusted(): Promise<void> {
  const loc = await getEmergencyLocation();
  if (!loc) return;

  const trusted = await getTrustedContact();

  Alert.alert(
    "Share live location",
    trusted
      ? `Send your Google Maps pin by SMS to Police (100) and your trusted contact (${trusted}), or use the share menu.`
      : "Send your Google Maps pin by SMS to Police (100), or use the share menu (WhatsApp etc.).",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "SMS Police (100)",
        onPress: () => void smsLocation("100", loc.lat, loc.lon, loc.area),
      },
      ...(trusted
        ? [
            {
              text: "SMS trusted contact",
              onPress: () =>
                void smsLocation(trusted, loc.lat, loc.lon, loc.area),
            },
          ]
        : []),
      {
        text: "WhatsApp / Share menu",
        onPress: () => {
          void Share.share(
            Platform.OS === "ios"
              ? {
                  message: emergencyShareMessage(loc.lat, loc.lon, loc.area),
                  url: mapsLink(loc.lat, loc.lon),
                }
              : {
                  message: emergencyShareMessage(loc.lat, loc.lon, loc.area),
                  title: "SafeHer — live location",
                }
          );
        },
      },
    ]
  );
}

/** Call emergency number, then share location with police/trusted. */
export async function callAndShareLocation(number: string): Promise<void> {
  const trusted = await getTrustedContact();
  Alert.alert(
    "Call & share location",
    `1) Call ${number}\n2) SMS / share your live Maps pin with police${
      trusted ? ` and ${trusted}` : " or a trusted contact"
    }.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call + share",
        style: "destructive",
        onPress: async () => {
          await callNumber(number);
          setTimeout(() => {
            void shareLocationToPoliceAndTrusted();
          }, 1200);
        },
      },
      {
        text: "Share only",
        onPress: () => {
          void shareLocationToPoliceAndTrusted();
        },
      },
    ]
  );
}

/** One-tap SOS: call 112, then offer police SMS + trusted share. */
export async function triggerFullSos(): Promise<void> {
  Alert.alert(
    "Emergency SOS",
    "This will dial 112 (national emergency), then help you SMS your live location to police.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call 112 & share",
        style: "destructive",
        onPress: async () => {
          await callNumber("112");
          setTimeout(() => {
            void shareLocationToPoliceAndTrusted();
          }, 1200);
        },
      },
    ]
  );
}
