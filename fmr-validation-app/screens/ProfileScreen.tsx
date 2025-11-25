import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { fonts, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';

export function ProfileScreen() {
  const { colors } = useThemeMode();
  const { user } = useAuth();

  if (!user) {
    return (
      <Screen>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No user information available
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
          <Ionicons name="person" size={48} color="#fff" />
        </View>
        <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
        <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user.email}</Text>
      </View>

      {/* Account Information */}
      <Section title="Account Information">
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Full Name</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.name}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Role</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.role}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Region</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.region}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="key-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>User ID</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user.id}</Text>
          </View>
        </View>
      </Section>

      {/* Access Level Badge */}
      <Section title="Access Level">
        <View style={[styles.accessBadge, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons
            name={user.role === 'Administrator' ? 'shield-checkmark' : 'shield-outline'}
            size={24}
            color={user.role === 'Administrator' ? colors.success : colors.primary}
          />
          <View style={styles.accessContent}>
            <Text style={[styles.accessTitle, { color: colors.textPrimary }]}>
              {user.role === 'Administrator' ? 'Full Access' : 'Regional Access'}
            </Text>
            <Text style={[styles.accessDescription, { color: colors.textMuted }]}>
              {user.role === 'Administrator'
                ? 'You can view and manage all regions'
                : `You can view and manage ${user.region} only`}
            </Text>
          </View>
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  userName: {
    fontFamily: fonts.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  userEmail: {
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  infoValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
  },
  accessContent: {
    flex: 1,
    gap: 2,
  },
  accessTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  accessDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 15,
  },
});
