import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { resolveArea } from "@/lib/areas";
import {
  communityLevel,
  communityScore,
  loadAreaVerdict,
  loadCommunitySummary,
  type AreaSafety,
  type CommunitySummary,
} from "@/lib/reports";

const LEVEL_COLOR = {
  Safe: "#0E9F6E",
  Moderate: "#D97706",
  Unsafe: "#E02424",
};

export default function HomeScreen() {
  const [summary, setSummary] = useState<CommunitySummary | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<AreaSafety | null>(null);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLocError(null);
    try {
      const s = await loadCommunitySummary();
      setSummary(s);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocError("Turn on location to see your area’s safety score.");
        setArea(null);
        setVerdict(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const name = await resolveArea(
        pos.coords.latitude,
        pos.coords.longitude
      );
      setArea(name);
      const v = await loadAreaVerdict(name);
      setVerdict(v);
    } catch (e) {
      setLocError(e instanceof Error ? e.message : "Couldn’t load right now");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const score =
    verdict != null
      ? communityScore(Number(verdict.pct_safe), verdict.avg_rating)
      : null;
  const level = score != null ? communityLevel(score) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#7C3AED" />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>SafeHer</Text>
        <Text style={styles.title}>Feel safer on every street</Text>
        <Text style={styles.subtitle}>
          Check your area in one tap. Report what you feel — it takes under a
          minute and stays anonymous.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Your area right now</Text>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#7C3AED" />
            <Text style={styles.muted}>Detecting location…</Text>
          </View>
        ) : locError ? (
          <>
            <Text style={styles.error}>{locError}</Text>
            <Pressable onPress={refresh} style={styles.miniBtn}>
              <Text style={styles.miniBtnText}>Retry</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.areaName}>{area ?? "Unknown"}</Text>
            {verdict && score != null && level ? (
              <View
                style={[
                  styles.pill,
                  { backgroundColor: `${LEVEL_COLOR[level]}18` },
                ]}
              >
                <View
                  style={[styles.dot, { backgroundColor: LEVEL_COLOR[level] }]}
                />
                <Text style={[styles.pillText, { color: LEVEL_COLOR[level] }]}>
                  {level} · {score.toFixed(1)}/10 · {verdict.report_count} reports
                </Text>
              </View>
            ) : (
              <Text style={styles.muted}>
                No community signal here yet — your report helps.
              </Text>
            )}
          </>
        )}

        <Link href="/report" asChild>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>Report how you feel</Text>
            <Text style={styles.ctaSub}>3 quick steps · anonymous</Text>
          </Pressable>
        </Link>
      </View>

      <Text style={styles.sectionTitle}>How it works</Text>
      {[
        {
          n: "1",
          t: "We find your area",
          d: "GPS names a Bengaluru locality automatically.",
        },
        {
          n: "2",
          t: "You tap Safe or Unsafe",
          d: "One choice is enough. Details are optional.",
        },
        {
          n: "3",
          t: "Others stay informed",
          d: "Community scores update on the map for everyone.",
        },
      ].map((item) => (
        <View key={item.n} style={styles.stepCard}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{item.n}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{item.t}</Text>
            <Text style={styles.stepDesc}>{item.d}</Text>
          </View>
        </View>
      ))}

      <Link href="/sos" asChild>
        <Pressable style={styles.sosHome}>
          <Text style={styles.sosHomeTitle}>Emergency SOS</Text>
          <Text style={styles.sosHomeSub}>
            Call helplines · Share live location with police
          </Text>
        </Pressable>
      </Link>

      <Link href="/map" asChild>
        <Pressable style={styles.secondary}>
          <Text style={styles.secondaryText}>Browse community map</Text>
        </Pressable>
      </Link>

      <View style={styles.kpiRow}>
        <View style={styles.kpi}>
          <Text style={styles.kpiValue}>
            {summary?.totalReports?.toLocaleString() ?? "0"}
          </Text>
          <Text style={styles.kpiLabel}>Reports</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiValue}>{summary?.pctSafe ?? 0}%</Text>
          <Text style={styles.kpiLabel}>Safe marks</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiValue}>{summary?.areasCovered ?? 0}</Text>
          <Text style={styles.kpiLabel}>Areas</Text>
        </View>
      </View>

      <Text style={styles.demoNote}>
        Includes demo data so the map isn’t empty — live reports join
        automatically.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8FF" },
  content: { paddingBottom: 40 },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  brand: {
    color: "#7C3AED",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  card: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  areaName: { marginTop: 8, fontSize: 24, fontWeight: "800", color: "#111827" },
  pill: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontSize: 13, fontWeight: "700" },
  muted: { marginTop: 10, fontSize: 14, color: "#9CA3AF", lineHeight: 20 },
  error: { marginTop: 10, color: "#E02424", fontSize: 14, lineHeight: 20 },
  miniBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  miniBtnText: { color: "#7C3AED", fontWeight: "700", fontSize: 13 },
  cta: {
    marginTop: 18,
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  ctaSub: { marginTop: 2, color: "#E9D5FF", fontSize: 12, fontWeight: "600" },
  sectionTitle: {
    marginTop: 28,
    marginHorizontal: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  stepCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { color: "#7C3AED", fontWeight: "800", fontSize: 13 },
  stepTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  stepDesc: { marginTop: 2, fontSize: 13, color: "#6B7280", lineHeight: 18 },
  secondary: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#fff",
  },
  secondaryText: { color: "#7C3AED", fontSize: 15, fontWeight: "700" },
  sosHome: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#E02424",
    alignItems: "center",
  },
  sosHomeTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  sosHomeSub: { marginTop: 2, color: "#FEE2E2", fontSize: 12, fontWeight: "600" },
  kpiRow: { flexDirection: "row", gap: 8, marginTop: 20, marginHorizontal: 16 },
  kpi: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
  },
  kpiValue: { fontSize: 17, fontWeight: "800", color: "#111827" },
  kpiLabel: { marginTop: 2, fontSize: 11, color: "#6B7280", fontWeight: "600" },
  demoNote: {
    marginTop: 16,
    marginHorizontal: 24,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
});
