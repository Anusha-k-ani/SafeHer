import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About SafeHer</Text>
      <Text style={styles.body}>
        SafeHer is a crowdsourced women&apos;s street safety app for Bengaluru.
        Reports are anonymous by default. Your device location is used only to
        match a BBMP area and is stored with your voluntary safety feedback.
      </Text>
      <Text style={styles.body}>
        Community scores blend the % of &quot;safe&quot; reports with optional 1–5
        ratings. Use the Report tab whenever you feel something worth sharing —
        good or bad.
      </Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
    marginBottom: 12,
  },
});
