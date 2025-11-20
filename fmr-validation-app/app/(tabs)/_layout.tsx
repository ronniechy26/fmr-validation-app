import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/theme';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { TouchableOpacity, View, StyleSheet } from 'react-native';

export default function TabsLayout() {
  const { colors } = useThemeMode();
  const { isSignedIn, loading: authLoading } = useAuth();
  const router = useRouter();
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
          paddingBottom: 10,
          paddingTop: 10,
          height: 70,
          position: 'absolute',
          left: spacing.lg,
          right: spacing.lg,
          bottom: 12,
          borderRadius: 28,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 12,
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
    top: -30,
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
