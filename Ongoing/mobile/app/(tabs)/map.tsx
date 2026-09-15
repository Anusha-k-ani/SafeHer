import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import {
  loadAreaSafety,
  loadReportsForMap,
  type AreaSafety,
  type MapReport,
} from "@/lib/reports";
import { buildMapHtml } from "@/lib/mapHtml";

type SourceFilter = "all" | "safe" | "unsafe" | "incident";

export default function MapScreen() {
  const router = useRouter();
  const webRef = useRef<WebView>(null);
  const [reports, setReports] = useState<MapReport[]>([]);
  const [areas, setAreas] = useState<AreaSafety[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [showAreas, setShowAreas] = useState(true);
  const [myLoc, setMyLoc] = useState<{ lat: number; lon: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMapReady(false);
    try {
      const [r, a] = await Promise.all([
        loadReportsForMap(400),
        loadAreaSafety(),
      ]);
      setReports(r);
      setAreas(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load map");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      void (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") return;
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setMyLoc({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        } catch {
          // Location optional for browsing the map
        }
      })();
    }, [load])
  );

  const html = useMemo(
    () =>
      buildMapHtml({
        reports,
        areas,
        filter,
        showAreas,
        myLoc,
      }),
    [reports, areas, filter, showAreas, myLoc]
  );

  const pinCount = useMemo(() => {
    if (filter === "safe")
      return reports.filter((r) => r.is_safe && r.report_kind !== "incident")
        .length;
    if (filter === "unsafe")
      return reports.filter((r) => !r.is_safe && r.report_kind !== "incident")
        .length;
    if (filter === "incident")
      return reports.filter((r) => r.report_kind === "incident").length;
    return reports.length;
  }, [reports, filter]);

  function goMyLocation() {
    webRef.current?.injectJavaScript(
      "window.SafeHerMap && window.SafeHerMap.goMe(); true;"
    );
  }

  function resetBengaluru() {
    webRef.current?.injectJavaScript(
      "window.SafeHerMap && window.SafeHerMap.goBlr(); true;"
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.muted}>Loading safety map…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={load} style={styles.retry}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        key={`${filter}-${showAreas}-${myLoc ? "loc" : "noloc"}-${reports.length}`}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.map}
        onLoadEnd={() => setMapReady(true)}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        mixedContentMode="always"
        allowsInlineMediaPlayback
      />

      {!mapReady && (
        <View style={styles.mapOverlay}>
          <ActivityIndicator color="#7C3AED" />
          <Text style={styles.muted}>Opening map tiles…</Text>
        </View>
      )}

      <View style={styles.topBar}>
        {(
          [
            ["all", "All"],
            ["safe", "Safe"],
            ["unsafe", "Unsafe"],
            ["incident", "Incidents"],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.chip, filter === key && styles.chipOn]}
          >
            <Text style={[styles.chipText, filter === key && styles.chipTextOn]}>
              {label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setShowAreas((v) => !v)}
          style={[styles.chip, showAreas && styles.chipOn]}
        >
          <Text style={[styles.chipText, showAreas && styles.chipTextOn]}>
            Areas
          </Text>
        </Pressable>
      </View>

      <View style={styles.fabCol}>
        <Pressable style={styles.fab} onPress={goMyLocation}>
          <Text style={styles.fabText}>◎</Text>
        </Pressable>
        <Pressable style={styles.fab} onPress={resetBengaluru}>
          <Text style={styles.fabText}>BLR</Text>
        </Pressable>
        <Pressable style={styles.fab} onPress={load}>
          <Text style={styles.fabText}>↻</Text>
        </Pressable>
        <Pressable
          style={[styles.fab, styles.fabSos]}
          onPress={() => router.push("/sos")}
        >
          <Text style={styles.fabSosText}>SOS</Text>
        </Pressable>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>
          {pinCount} pins · pinch to zoom · tap a pin for details
        </Text>
        <Text style={styles.legendRow}>
          Green = Safe · Red = Unsafe · Orange = Incident · OpenStreetMap
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  map: { flex: 1, backgroundColor: "#F3F4F6" },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    zIndex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
  },
  muted: { marginTop: 10, color: "#6B7280" },
  error: { color: "#E02424", textAlign: "center" },
  retry: {
    marginTop: 12,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  topBar: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    zIndex: 2,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipOn: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  chipTextOn: { color: "#fff" },
  fabCol: { position: "absolute", right: 12, top: 70, gap: 8, zIndex: 2 },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 3,
  },
  fabText: { fontWeight: "800", color: "#7C3AED", fontSize: 12 },
  fabSos: { backgroundColor: "#E02424", borderColor: "#E02424" },
  fabSosText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  legend: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 20,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 2,
  },
  legendTitle: { fontWeight: "700", color: "#111827", fontSize: 13 },
  legendRow: { marginTop: 4, fontSize: 12, color: "#6B7280" },
});
