import { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { colors, fonts, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export function SettingsScreen() {
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  return (
    <Screen scroll>
      <Section title="Sync Preferences">
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Auto-sync drafts</Text>
            <Text style={styles.rowSubtitle}>Upload pending validations when online</Text>
          </View>
          <Switch value={autoSync} onValueChange={setAutoSync} trackColor={{ true: '#b3c6ec', false: '#d8dce8' }} />
        </View>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Offline mode</Text>
            <Text style={styles.rowSubtitle}>Cache barangay data for field visits</Text>
          </View>
          <Switch value={offlineMode} onValueChange={setOfflineMode} trackColor={{ true: '#b3c6ec', false: '#d8dce8' }} />
        </View>
      </Section>

      <Section title="Account & Support">
        <TouchableOpacity style={styles.linkRow}>
          <View style={styles.linkIcon}>
            <Ionicons name="person-circle" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Profile</Text>
            <Text style={styles.rowSubtitle}>Engr. Mark Paul C. Baldeo</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow}>
          <View style={styles.linkIcon}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Data privacy</Text>
            <Text style={styles.rowSubtitle}>Understand how data is stored on device</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow}>
          <View style={styles.linkIcon}>
            <Ionicons name="help-circle" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Request assistance</Text>
            <Text style={styles.rowSubtitle}>Chat with FMR validation support team</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
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
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
