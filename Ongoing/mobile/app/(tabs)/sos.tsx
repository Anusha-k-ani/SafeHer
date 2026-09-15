import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import { HELPLINES, openMapsAt } from "@/lib/helplines";
import {
  callAndShareLocation,
  callNumber,
  getEmergencyLocation,
  getTrustedContact,
  setTrustedContact,
  shareLocationToPoliceAndTrusted,
  shareLocationWithOthers,
  triggerFullSos,
} from "@/lib/emergency";

export default function SosScreen() {
  const [sharing, setSharing] = useState(false);
  const [locLabel, setLocLabel] = useState<string | null>(null);
  const [liveOn, setLiveOn] = useState(false);
  const [tick, setTick] = useState(0);
  const [trusted, setTrusted] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastCoords = useRef<{ lat: number; lon: number; area: string } | null>(
    null
  );

  const refreshLoc = useCallback(async () => {
    const loc = await getEmergencyLocation();
    if (!loc) return;
    lastCoords.current = loc;
    setLocLabel(`${loc.area} · ${loc.lat.toFixed(5)}, ${loc.lon.toFixed(5)}`);
  }, []);

  useEffect(() => {
    void refreshLoc();
    void getTrustedContact().then((n) => {
      if (n) setTrusted(n);
    });
    return () => {
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [refreshLoc]);

  async function onSharePolice() {
    setSharing(true);
    await shareLocationToPoliceAndTrusted();
    setSharing(false);
    await refreshLoc();
  }

  async function saveTrusted() {
    await setTrustedContact(trusted);
    setSavedMsg(
      trusted.trim()
        ? "Trusted contact saved on this phone."
        : "Trusted contact cleared."
    );
  }

  async function toggleLiveShare() {
    if (liveOn) {
      watchRef.current?.remove();
      watchRef.current = null;
      setLiveOn(false);
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    watchRef.current?.remove();
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 8000,
        distanceInterval: 15,
      },
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const area = lastCoords.current?.area ?? "Updating…";
        lastCoords.current = { lat, lon, area };
        setLocLabel(`${area} · ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        setTick((t) => t + 1);
      }
    );
    setLiveOn(true);
    await refreshLoc();
    await shareLocationToPoliceAndTrusted();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Emergency SOS</Text>
        <Text style={styles.bannerText}>
          Call helplines and share your live Google Maps location with police
          (SMS 100) or a trusted contact.
        </Text>
      </View>

      <Pressable style={styles.fullSos} onPress={() => void triggerFullSos()}>
        <Text style={styles.fullSosTitle}>CALL 112 + SHARE LOCATION</Text>
        <Text style={styles.fullSosSub}>
          National emergency dial · then SMS / WhatsApp your pin
        </Text>
      </Pressable>

      <Pressable
        style={[styles.sosBtn, sharing && { opacity: 0.7 }]}
        onPress={onSharePolice}
        disabled={sharing}
      >
        {sharing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.sosTitle}>Share live location with police</Text>
            <Text style={styles.sosSub}>
              SMS to 100 · trusted contact · or WhatsApp share menu
            </Text>
          </>
        )}
      </Pressable>

      <Pressable
        style={[styles.liveBtn, liveOn && styles.liveBtnOn]}
        onPress={toggleLiveShare}
      >
        <Text style={[styles.liveTitle, liveOn && styles.liveTitleOn]}>
          {liveOn ? "● Live tracking ON — tap to stop" : "Start live tracking"}
        </Text>
        <Text style={styles.liveSub}>
          {liveOn
            ? `GPS updating (#${tick}). Tap “Share live location” again to resend a fresh pin.`
            : "Keeps reading GPS so you can resend an updated location to police"}
        </Text>
      </Pressable>

      <View style={styles.locCard}>
        <Text style={styles.locLabel}>Your location</Text>
        <Text style={styles.locValue}>{locLabel ?? "Detecting…"}</Text>
        <Pressable onPress={refreshLoc}>
          <Text style={styles.refresh}>Refresh location</Text>
        </Pressable>
        {lastCoords.current && (
          <Pressable
            onPress={() => {
              const c = lastCoords.current;
              if (!c) return;
              void openMapsAt(c.lat, c.lon);
            }}
          >
            <Text style={styles.mapsLinkText}>Open in Maps</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.trustedCard}>
        <Text style={styles.section}>Trusted contact (optional)</Text>
        <Text style={styles.sectionHint}>
          Family / friend phone number for one-tap SMS with your live location.
        </Text>
        <TextInput
          style={styles.input}
          value={trusted}
          onChangeText={setTrusted}
          placeholder="e.g. +91 98XXXXXXXX"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />
        <Pressable style={styles.saveBtn} onPress={saveTrusted}>
          <Text style={styles.saveBtnText}>Save on this phone</Text>
        </Pressable>
        {savedMsg && <Text style={styles.savedMsg}>{savedMsg}</Text>}
      </View>

      <Text style={styles.section}>Helpline numbers</Text>
      <Text style={styles.sectionHint}>
        Tap Call to dial. Use “Call + share” to also send location.
      </Text>

      {HELPLINES.map((h) => (
        <View
          key={h.id}
          style={[
            styles.helpline,
            h.priority === "critical" && styles.helplineCritical,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.helpName}>{h.name}</Text>
            <Text style={styles.helpNumber}>{h.number}</Text>
            <Text style={styles.helpDesc}>{h.description}</Text>
          </View>
          <View style={styles.helpActions}>
            <Pressable
              style={styles.callBtn}
              onPress={() => void callNumber(h.number)}
            >
              <Text style={styles.callBtnText}>Call</Text>
            </Pressable>
            <Pressable
              style={styles.shareSmall}
              onPress={() => void callAndShareLocation(h.number)}
            >
              <Text style={styles.shareSmallText}>Call + share</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Pressable
        style={styles.secondaryShare}
        onPress={() => void shareLocationWithOthers()}
      >
        <Text style={styles.secondaryShareText}>Open general share menu</Text>
      </Pressable>

      <Text style={styles.disclaimer}>
        SafeHer dials official helplines and helps you SMS/share a Google Maps
        GPS pin. It does not connect into police dispatch computers. In danger,
        also move to a crowded, lit place if you can.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F5" },
  content: { padding: 16, paddingBottom: 40 },
  banner: {
    backgroundColor: "#7F1D1D",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  bannerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  bannerText: { marginTop: 6, color: "#FECACA", fontSize: 14, lineHeight: 20 },
  fullSos: {
    backgroundColor: "#991B1B",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#FECACA",
  },
  fullSosTitle: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 0.3 },
  fullSosSub: { marginTop: 4, color: "#FECACA", fontSize: 12, textAlign: "center" },
  sosBtn: {
    backgroundColor: "#E02424",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  sosTitle: { color: "#fff", fontSize: 17, fontWeight: "800", textAlign: "center" },
  sosSub: {
    marginTop: 4,
    color: "#FEE2E2",
    fontSize: 12,
    textAlign: "center",
  },
  liveBtn: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FECACA",
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 14,
  },
  liveBtnOn: { borderColor: "#E02424", backgroundColor: "#FEF2F2" },
  liveTitle: { fontWeight: "800", color: "#991B1B", fontSize: 15 },
  liveTitleOn: { color: "#E02424" },
  liveSub: { marginTop: 4, fontSize: 12, color: "#6B7280", lineHeight: 17 },
  locCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginBottom: 14,
  },
  trustedCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },
  locLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  locValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  refresh: { marginTop: 8, color: "#7C3AED", fontWeight: "700", fontSize: 13 },
  mapsLinkText: {
    marginTop: 6,
    color: "#1A56DB",
    fontWeight: "600",
    fontSize: 13,
  },
  section: { fontSize: 17, fontWeight: "800", color: "#111827" },
  sectionHint: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 13,
    color: "#6B7280",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: "#F5F3FF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  saveBtnText: { color: "#7C3AED", fontWeight: "800" },
  savedMsg: { marginTop: 8, fontSize: 12, color: "#0E9F6E", fontWeight: "600" },
  helpline: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  helplineCritical: { borderColor: "#FECACA", backgroundColor: "#FFF7F7" },
  helpName: { fontWeight: "800", fontSize: 15, color: "#111827" },
  helpNumber: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "800",
    color: "#E02424",
    letterSpacing: 0.5,
  },
  helpDesc: { marginTop: 4, fontSize: 12, color: "#6B7280", lineHeight: 16 },
  helpActions: { justifyContent: "center", gap: 6 },
  callBtn: {
    backgroundColor: "#E02424",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  callBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  shareSmall: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  shareSmallText: { color: "#991B1B", fontWeight: "700", fontSize: 11 },
  secondaryShare: {
    marginTop: 4,
    marginBottom: 8,
    alignItems: "center",
    padding: 12,
  },
  secondaryShareText: { color: "#7C3AED", fontWeight: "700", fontSize: 14 },
  disclaimer: {
    marginTop: 8,
    fontSize: 11,
    color: "#9CA3AF",
    lineHeight: 16,
    textAlign: "center",
  },
});
