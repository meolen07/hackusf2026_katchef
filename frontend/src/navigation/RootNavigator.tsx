import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "../store/authStore";
import { colors, radii, shadows, typography } from "../theme/tokens";
import { AppStackParamList, AppTabParamList, RootStackParamList } from "../types/navigation";
import { AuthScreen } from "../screens/AuthScreen";
import { ChatbotScreen } from "../screens/ChatbotScreen";
import { EditIngredientScreen } from "../screens/EditIngredientScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MyFridgeScreen } from "../screens/MyFridgeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ScanResultsScreen } from "../screens/ScanResultsScreen";
import { ScanScreen } from "../screens/ScanScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.cream,
    card: colors.card,
    text: colors.ink,
    border: colors.border,
    primary: colors.coral,
  },
};

function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <LinearGradient
        colors={[colors.creamSoft, colors.cream, colors.creamDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.loadingBadge}>
        <Text style={styles.loadingBadgeText}>KatChef</Text>
      </View>
      <ActivityIndicator size="large" color={colors.coral} />
      <Text style={styles.loadingText}>Warming up your kitchen copilot...</Text>
    </View>
  );
}

function TabsNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            bottom: Math.max(insets.bottom, 10),
            height: 64 + Math.max(insets.bottom, 10),
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ color, size, focused }) => {
          const iconMap: Record<keyof AppTabParamList, IconName> = {
            Home: focused ? "home-variant" : "home-variant-outline",
            Scan: focused ? "camera" : "camera-outline",
            MyFridge: focused ? "fridge" : "fridge-outline",
            Chatbot: focused ? "chat" : "chat-outline",
            Profile: focused ? "account-circle" : "account-circle-outline",
          };
          return (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <MaterialCommunityIcons
                name={iconMap[route.name]}
                size={focused ? size + 1 : size}
                color={focused ? colors.coralDeep : color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen
        name="MyFridge"
        component={MyFridgeScreen}
        options={{ title: "Fridge" }}
      />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} options={{ title: "Chat" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: typography.heading,
        },
        contentStyle: {
          backgroundColor: colors.cream,
        },
      }}
    >
      <AppStack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
      <AppStack.Screen name="ScanResults" component={ScanResultsScreen} options={{ title: "Scan Results" }} />
      <AppStack.Screen name="EditIngredient" component={EditIngredientScreen} options={{ title: "Ingredient" }} />
      <AppStack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </AppStack.Navigator>
  );
}

export function RootNavigator() {
  const status = useAuthStore((state) => state.status);

  if (status === "booting") {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {status === "authenticated" ? (
          <RootStack.Screen name="App" component={AppNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
    gap: 16,
  },
  loadingBadge: {
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  loadingBadgeText: {
    fontFamily: typography.bodyBold,
    color: colors.coralDeep,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  loadingText: {
    fontFamily: typography.bodyBold,
    color: colors.muted,
  },
  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: radii.xl,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(240,227,211,0.92)",
    backgroundColor: "rgba(255,252,247,0.96)",
    paddingTop: 10,
    paddingHorizontal: 8,
    ...shadows.float,
  },
  tabItem: {
    borderRadius: radii.lg,
  },
  tabIconWrap: {
    minWidth: 38,
    height: 34,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrapActive: {
    backgroundColor: "rgba(255,107,87,0.14)",
  },
  tabLabel: {
    fontFamily: typography.bodyBold,
    fontSize: 11,
    paddingBottom: 4,
  },
});
