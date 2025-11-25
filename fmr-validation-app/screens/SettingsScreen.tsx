import { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { fonts, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { useOfflineData } from '@/providers/OfflineDataProvider';
import { formatDistanceToNow } from 'date-fns';

export function SettingsScreen() {
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const { mode, setMode, colors } = useThemeMode();
  const darkMode = mode === 'dark';
  const { signOut, user } = useAuth();
  const router = useRouter();
  const { refresh, lastSyncedAt } = useOfflineData();
  const [syncing, setSyncing] = useState(false);

  const lastSyncedLabel = useMemo(() => {
    if (!lastSyncedAt) return 'Not synced yet';
    return `${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}`;
  }, [lastSyncedAt]);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          Manage sync preferences, theme, and support options.
        </Text>
      </View>

      <Section title="Display">
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Dark mode</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
              Toggle between light and dark themes
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={(value) => setMode(value ? 'dark' : 'light')}
            trackColor={{ true: '#b3c6ec', false: '#d8dce8' }}
          />
        </View>
      </Section>

      <Section title="Sync Preferences">
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Auto-sync drafts</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
              Upload pending validations when online
            </Text>
          </View>
          <Switch value={autoSync} onValueChange={setAutoSync} trackColor={{ true: '#b3c6ec', false: '#d8dce8' }} />
        </View>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Offline mode</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
              Cache barangay data for field visits
            </Text>
          </View>
          <Switch value={offlineMode} onValueChange={setOfflineMode} trackColor={{ true: '#b3c6ec', false: '#d8dce8' }} />
        </View>
        <View style={[styles.row, { alignItems: 'flex-start' }]}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Manual sync</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
              Refresh the offline dataset on demand. Last synced {lastSyncedLabel}.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.syncButton,
              { backgroundColor: colors.primary, opacity: syncing ? 0.6 : 1 },
            ]}
            onPress={async () => {
              if (syncing) return;
              setSyncing(true);
              await refresh({ force: true });
              setSyncing(false);
            }}
            disabled={syncing}
          >
            <Text style={[styles.syncButtonText, { color: '#fff' }]}>
              {syncing ? 'Syncing…' : 'Sync now'}
            </Text>
          </TouchableOpacity>
        </View>
      </Section>

      <Section title="Account & Support">
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/profile')}
          activeOpacity={0.7}
        >
          <View style={[styles.linkIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="person-circle" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Profile</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
              {user?.name || 'View your profile'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/data-privacy')} activeOpacity={0.85}>
          <View style={[styles.linkIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Data privacy</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
              Understand how data is stored on device
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow}>
          <View style={[styles.linkIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="help-circle" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Request assistance</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
              Chat with FMR validation support team
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </Section>

      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.border }]}
        onPress={() => {
          signOut();
          router.replace('/login');
        }}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
      </TouchableOpacity>

    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowTitle: {
    fontFamily: fonts.semibold,
  },
  rowSubtitle: {
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  syncButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    minWidth: 96,
    alignItems: 'center',
  },
  syncButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
});
