import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "#9CA3AF",
        headerStyle: { backgroundColor: "#7C3AED" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "SafeHer",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="home" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="exclamation-circle" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Safety Map",
          tabBarLabel: "Map",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="map" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: "Emergency SOS",
          tabBarLabel: "SOS",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="phone" color={String(color)} />
          ),
          headerStyle: { backgroundColor: "#E02424" },
          tabBarActiveTintColor: "#E02424",
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
