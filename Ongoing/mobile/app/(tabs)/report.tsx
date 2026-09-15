import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import { getTimeOfDay, resolveArea } from "@/lib/areas";
import {
  INCIDENT_OPTIONS,
  type FeelingChoice,
  type IncidentType,
} from "@/lib/incidents";
import { submitReport } from "@/lib/reports";

type Loc =
  | { status: "loading" }
  | { status: "ready"; lat: number; lon: number; area: string }
  | { status: "error"; message: string };

type Step = 1 | 2 | 3 | 4;

const STEPS = ["Location", "What happened", "Details", "Done"];

export default function ReportScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loc, setLoc] = useState<Loc>({ status: "loading" });
  const [choice, setChoice] = useState<FeelingChoice | null>(null);
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [rating, setRating] = useState(3);
  const [crowdLevel, setCrowdLevel] = useState(3);
  const [lightingOk, setLightingOk] = useState(false);
  const [policeNearby, setPoliceNearby] = useState(false);
  const [cctvSeen, setCctvSeen] = useState(false);
  const [transportNearby, setTransportNearby] = useState(false);
  const [harassmentReported, setHarassmentReported] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIncident = choice === "incident";

  const fetchLoc = useCallback(async () => {
    setLoc({ status: "loading" });
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoc({
          status: "error",
          message: "Please allow location access so we can find your area.",
        });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const area = await resolveArea(
        pos.coords.latitude,
        pos.coords.longitude
      );
      setLoc({
        status: "ready",
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        area,
      });
    } catch {
      setLoc({
        status: "error",
        message: "Couldn't get your location. Check GPS and try again.",
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setStep(1);
      setChoice(null);
      setIncidentType(null);
      setError(null);
      fetchLoc();
    }, [fetchLoc])
  );

  const progress = useMemo(() => ((step - 1) / 3) * 100, [step]);

  function resetForm() {
    setChoice(null);
    setIncidentType(null);
    setComment("");
    setLightingOk(false);
    setPoliceNearby(false);
    setCctvSeen(false);
    setTransportNearby(false);
    setHarassmentReported(false);
    setRating(3);
    setCrowdLevel(3);
    setError(null);
    setStep(1);
    fetchLoc();
  }

  function canContinueFromStep2() {
    if (!choice) return false;
    if (choice === "incident" && !incidentType) return false;
    return true;
  }

  async function onSubmit() {
    setError(null);
    if (loc.status !== "ready" || !choice) {
      setError("Something went wrong. Please start again.");
      return;
    }
    if (choice === "incident" && !incidentType) {
      setError("Please choose what kind of incident happened.");
      return;
    }
    setSubmitting(true);
    const res = await submitReport({
      lat: loc.lat,
      lon: loc.lon,
      area: loc.area,
      is_safe: choice === "safe",
      report_kind: choice === "incident" ? "incident" : "feeling",
      incident_type: choice === "incident" ? incidentType : null,
      safety_rating: choice === "incident" ? Math.min(rating, 2) : rating,
      crowd_level: crowdLevel,
      lighting_ok: lightingOk,
      police_nearby: policeNearby,
      cctv_seen: cctvSeen,
      transport_nearby: transportNearby,
      harassment_reported: harassmentReported,
      comment,
      time_of_day: getTimeOfDay(),
    });
    setSubmitting(false);
    if (res.ok) {
      setStep(4);
    } else {
      setError(res.error);
    }
  }

  const chips: { label: string; value: boolean; set: (v: boolean) => void }[] =
    [
      { label: "Good lighting", value: lightingOk, set: setLightingOk },
      { label: "Police nearby", value: policeNearby, set: setPoliceNearby },
      { label: "CCTV visible", value: cctvSeen, set: setCctvSeen },
      { label: "Transport nearby", value: transportNearby, set: setTransportNearby },
      {
        label: "Harassment concern",
        value: harassmentReported,
        set: setHarassmentReported,
      },
    ];

  return (
    <View style={styles.screen}>
      {step < 4 && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.stepRow}>
            {STEPS.slice(0, 3).map((label, i) => {
              const n = (i + 1) as Step;
              const active = step >= n;
              return (
                <Text
                  key={label}
                  style={[styles.stepLabel, active && styles.stepLabelOn]}
                >
                  {n}. {label}
                </Text>
              );
            })}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <View>
            <Text style={styles.hello}>Step 1 of 3</Text>
            <Text style={styles.title}>Where are you?</Text>
            <Text style={styles.subtitle}>
              We use your phone GPS only to name the area — never shared as a
              tracking profile.
            </Text>

            <View style={styles.locCard}>
              {loc.status === "loading" ? (
                <View style={styles.centerBlock}>
                  <ActivityIndicator size="large" color="#7C3AED" />
                  <Text style={styles.locHint}>Finding your area…</Text>
                </View>
              ) : loc.status === "error" ? (
                <View style={styles.centerBlock}>
                  <Text style={styles.errorBig}>{loc.message}</Text>
                  <Pressable onPress={fetchLoc} style={styles.secondaryBtn}>
                    <Text style={styles.secondaryBtnText}>Try again</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Text style={styles.youAreIn}>You are in</Text>
                  <Text style={styles.areaHero}>{loc.area}</Text>
                  <Text style={styles.coords}>
                    {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
                  </Text>
                  <Pressable onPress={fetchLoc} style={styles.linkBtn}>
                    <Text style={styles.linkBtnText}>Refresh location</Text>
                  </Pressable>
                </>
              )}
            </View>

            <Pressable
              style={[
                styles.primaryBtn,
                loc.status !== "ready" && styles.btnDisabled,
              ]}
              disabled={loc.status !== "ready"}
              onPress={() => setStep(2)}
            >
              <Text style={styles.primaryBtnText}>Looks right — continue</Text>
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.hello}>Step 2 of 3</Text>
            <Text style={styles.title}>What do you want to report?</Text>
            <Text style={styles.subtitle}>
              {loc.status === "ready" ? `In ${loc.area} right now` : "Your area"}
              — share how it feels, or report an incident that happened.
            </Text>

            <Pressable
              onPress={() => {
                setChoice("safe");
                setIncidentType(null);
              }}
              style={[
                styles.bigChoice,
                styles.bigSafe,
                choice === "safe" && styles.bigSafeOn,
              ]}
            >
              <Text style={styles.bigChoiceIcon}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bigChoiceTitle}>I feel safe</Text>
                <Text style={styles.bigChoiceHint}>
                  Lit, busy, or comfortable walking here
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setChoice("unsafe");
                setIncidentType(null);
              }}
              style={[
                styles.bigChoice,
                styles.bigUnsafe,
                choice === "unsafe" && styles.bigUnsafeOn,
              ]}
            >
              <Text style={[styles.bigChoiceIcon, { color: "#E02424" }]}>!</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bigChoiceTitle}>I feel unsafe</Text>
                <Text style={styles.bigChoiceHint}>
                  Dark, isolated, or something felt wrong
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setChoice("incident")}
              style={[
                styles.bigChoice,
                styles.bigIncident,
                choice === "incident" && styles.bigIncidentOn,
              ]}
            >
              <Text style={[styles.bigChoiceIcon, { color: "#C2410C" }]}>⚠</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bigChoiceTitle}>Something happened</Text>
                <Text style={styles.bigChoiceHint}>
                  Report an incident — harassment, theft, or other
                </Text>
              </View>
            </Pressable>

            {choice === "incident" && (
              <View style={styles.incidentBox}>
                <Text style={styles.section}>What kind of incident?</Text>
                {INCIDENT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setIncidentType(opt.value)}
                    style={[
                      styles.incidentOption,
                      incidentType === opt.value && styles.incidentOptionOn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.incidentOptionTitle,
                        incidentType === opt.value && styles.incidentOptionTitleOn,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.incidentOptionHint}>{opt.hint}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.navRow}>
              <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryBtn,
                  styles.flexBtn,
                  !canContinueFromStep2() && styles.btnDisabled,
                ]}
                disabled={!canContinueFromStep2()}
                onPress={() => setStep(3)}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>
            </View>

            <Pressable
              disabled={!canContinueFromStep2() || submitting}
              onPress={onSubmit}
              style={styles.skipLink}
            >
              <Text style={styles.skipLinkText}>
                {submitting ? "Submitting…" : "Skip details & submit now"}
              </Text>
            </Pressable>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.hello}>Step 3 of 3 · optional</Text>
            <Text style={styles.title}>
              {isIncident ? "Add incident details" : "Any extra details?"}
            </Text>
            <Text style={styles.subtitle}>
              {isIncident
                ? "A short note helps others stay alert. Skip anything you don’t want to share."
                : "Helps others understand why. You can skip anything below."}
            </Text>

            {!isIncident && (
              <>
                <Text style={styles.section}>Safety rating · {rating}/5</Text>
                <View style={styles.row}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setRating(n)}
                      style={[styles.ratingBtn, rating === n && styles.ratingActive]}
                    >
                      <Text
                        style={[
                          styles.ratingText,
                          rating === n && styles.ratingTextActive,
                        ]}
                      >
                        {n}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.scaleHints}>
                  <Text style={styles.scaleHint}>Unsafe</Text>
                  <Text style={styles.scaleHint}>Safe</Text>
                </View>
              </>
            )}

            <Text style={styles.section}>How crowded? · {crowdLevel}/5</Text>
            <View style={styles.row}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setCrowdLevel(n)}
                  style={[
                    styles.ratingBtn,
                    crowdLevel === n && styles.ratingActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.ratingText,
                      crowdLevel === n && styles.ratingTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>

            {!isIncident && (
              <>
                <Text style={styles.section}>What did you notice?</Text>
                <View style={styles.chips}>
                  {chips.map((c) => (
                    <Pressable
                      key={c.label}
                      onPress={() => c.set(!c.value)}
                      style={[styles.chip, c.value && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, c.value && styles.chipTextOn]}>
                        {c.value ? "✓ " : ""}
                        {c.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.section}>
              {isIncident ? "What happened? (optional)" : "Note (optional)"}
            </Text>
            <TextInput
              style={styles.input}
              value={comment}
              onChangeText={(t) => setComment(t.slice(0, 500))}
              placeholder={
                isIncident
                  ? "Briefly describe what happened — no personal details"
                  : "Short tip for others — no personal details"
              }
              placeholderTextColor="#9CA3AF"
              multiline
            />

            {isIncident && (
              <Pressable
                style={styles.sosHint}
                onPress={() => router.push("/sos")}
              >
                <Text style={styles.sosHintText}>
                  In danger now? Open Emergency SOS →
                </Text>
              </Pressable>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.navRow}>
              <Pressable onPress={() => setStep(2)} style={styles.backBtn}>
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryBtn,
                  styles.flexBtn,
                  submitting && styles.btnDisabled,
                ]}
                disabled={submitting}
                onPress={onSubmit}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {isIncident ? "Submit incident" : "Submit report"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.successBlock}>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>✓</Text>
            </View>
            <Text style={styles.title}>Thank you</Text>
            <Text style={styles.subtitle}>
              Your {isIncident ? "incident report" : "report"}
              {loc.status === "ready" ? ` for ${loc.area}` : ""} was shared
              anonymously. It helps other women plan safer routes.
            </Text>

            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                resetForm();
              }}
            >
              <Text style={styles.primaryBtnText}>Report again</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.push("/map")}
            >
              <Text style={styles.secondaryBtnText}>See community map</Text>
            </Pressable>

            <Link href="/" asChild>
              <Pressable style={styles.linkBtn}>
                <Text style={styles.linkBtnText}>Back to home</Text>
              </Pressable>
            </Link>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAF8FF" },
  progressWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EDE9FE",
  },
  progressTrack: {
    height: 6,
    borderRadius: 99,
    backgroundColor: "#EDE9FE",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 99,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 8,
  },
  stepLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  stepLabelOn: { color: "#7C3AED" },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  hello: {
    color: "#7C3AED",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 34,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    marginBottom: 20,
  },
  locCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 160,
    marginBottom: 20,
  },
  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
  },
  locHint: { color: "#6B7280", fontSize: 14 },
  youAreIn: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  areaHero: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  coords: { marginTop: 4, color: "#9CA3AF", fontSize: 13 },
  bigChoice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  bigSafe: { borderColor: "#A7F3D0" },
  bigSafeOn: { borderColor: "#0E9F6E", backgroundColor: "#ECFDF5" },
  bigUnsafe: { borderColor: "#FECACA" },
  bigUnsafeOn: { borderColor: "#E02424", backgroundColor: "#FEF2F2" },
  bigIncident: { borderColor: "#FDBA74" },
  bigIncidentOn: { borderColor: "#C2410C", backgroundColor: "#FFF7ED" },
  bigChoiceIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
    textAlign: "center",
    lineHeight: 42,
    fontSize: 22,
    fontWeight: "800",
    color: "#0E9F6E",
    overflow: "hidden",
  },
  bigChoiceTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  bigChoiceHint: { marginTop: 2, fontSize: 13, color: "#6B7280" },
  incidentBox: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  incidentOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  incidentOptionOn: {
    borderColor: "#C2410C",
    backgroundColor: "#FFEDD5",
  },
  incidentOptionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  incidentOptionTitleOn: { color: "#9A3412" },
  incidentOptionHint: { marginTop: 2, fontSize: 12, color: "#6B7280" },
  sosHint: {
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
  },
  sosHintText: { color: "#E02424", fontWeight: "700", fontSize: 14 },
  section: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  row: { flexDirection: "row", gap: 8 },
  ratingBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ratingActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  ratingText: { fontWeight: "700", color: "#374151", fontSize: 16 },
  ratingTextActive: { color: "#fff" },
  scaleHints: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 8,
  },
  scaleHint: { fontSize: 11, color: "#9CA3AF" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipOn: { borderColor: "#7C3AED", backgroundColor: "#F5F3FF" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  chipTextOn: { color: "#7C3AED" },
  input: {
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    padding: 14,
    textAlignVertical: "top",
    color: "#111827",
    fontSize: 15,
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  secondaryBtnText: { color: "#7C3AED", fontWeight: "700", fontSize: 15 },
  backBtn: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backBtnText: { color: "#374151", fontWeight: "700" },
  navRow: { flexDirection: "row", gap: 10, marginTop: 16, alignItems: "center" },
  flexBtn: { flex: 1 },
  btnDisabled: { opacity: 0.45 },
  skipLink: { marginTop: 16, alignItems: "center", padding: 8 },
  skipLinkText: { color: "#7C3AED", fontWeight: "600", fontSize: 14 },
  linkBtn: { marginTop: 14, alignItems: "center", padding: 6 },
  linkBtnText: { color: "#7C3AED", fontWeight: "600", fontSize: 14 },
  error: { marginTop: 10, color: "#E02424", fontSize: 14 },
  errorBig: {
    color: "#E02424",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  successBlock: { paddingTop: 24, alignItems: "stretch" },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  successBadgeText: { fontSize: 32, color: "#0E9F6E", fontWeight: "800" },
});
