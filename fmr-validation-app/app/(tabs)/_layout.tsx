import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '@/theme';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { colors } = useThemeMode();
  const { isSignedIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom spacing for both iOS and Android
  const bottomInset = Platform.select({
    ios: insets.bottom > 0 ? insets.bottom : 12,
    android: insets.bottom > 0 ? insets.bottom + 8 : 12, // Add extra padding if nav buttons exist
    default: 12,
  });
  
  const tabBarHeight = 60 + bottomInset;
  
  const AddButton = () => (
    <TouchableOpacity
      style={styles.addButtonWrapper}
      onPress={() => router.push('/annex-select')}
      activeOpacity={0.9}
    >
      <View style={[styles.addButton, { backgroundColor: colors.primary }]}>
        <Ionicons name="add" size={24} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.replace('/login');
    }
  }, [authLoading, isSignedIn, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: bottomInset,
          paddingTop: 8,
          height: tabBarHeight,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 12,
          marginBottom: Platform.select({ ios: 0, android: 4 }),
        },
        tabBarIconStyle: {
          marginTop: Platform.select({ ios: 0, android: 4 }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Forms',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="locator"
        options={{
          title: 'Locator',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarLabel: '',
          tabBarButton: () => <AddButton />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonWrapper: {
    flex: 1,
    top: -28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
});