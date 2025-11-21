import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { useThemeMode } from '@/providers/ThemeProvider';
import { fonts, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { setOnboardingCompleted } from '@/storage/onboarding';
import { replaceSnapshot, setLastProjectsSyncTimestamp, setLastFormsSyncTimestamp } from '@/storage/offline-store';
import { OfflineSnapshot } from '@/types/offline';
import { fetchSnapshotWithProgress } from '@/lib/api';

type SyncStep = {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
};

export function OnboardingSyncScreen() {
  const { colors } = useThemeMode();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<SyncStep[]>([
    { id: '1', label: 'Preparing workspace', status: 'pending' },
    { id: '2', label: 'Downloading FMR data', status: 'pending' },
    { id: '3', label: 'Saving to local database', status: 'pending' },
    { id: '4', label: 'Configuring application', status: 'pending' },
    { id: '5', label: 'Finalizing setup', status: 'pending' },
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    performSync();
  }, []);

  const updateStep = (index: number, status: SyncStep['status']) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  const performSync = async () => {
    try {
      // Step 1: Preparing
      setCurrentStep(0);
      updateStep(0, 'loading');
      await new Promise((resolve) => setTimeout(resolve, 500));
      updateStep(0, 'complete');
      setProgress(20);

      // Step 2: Downloading data (Real sync)
      setCurrentStep(1);
      updateStep(1, 'loading');
      console.log('[Sync] Starting snapshot download...');

      const snapshot = await fetchSnapshotWithProgress((percent) => {
        // Map download progress to 20-60% of total progress
        setProgress(20 + Math.round(percent * 0.4));
      });

      console.log(`[Sync] Download complete. Size: ${JSON.stringify(snapshot).length} bytes`);

      updateStep(1, 'complete');
      setProgress(60);

      // Step 3: Saving to SQLite
      setCurrentStep(2);
      updateStep(2, 'loading');
      console.log('[Sync] Saving to SQLite database...');

      const startTime = Date.now();
      await replaceSnapshot(snapshot);
      const duration = Date.now() - startTime;
      console.log(`[Sync] SQLite write complete in ${duration}ms`);

      const now = Date.now();
      await setLastProjectsSyncTimestamp(now);
      await setLastFormsSyncTimestamp(now);

      updateStep(2, 'complete');
      setProgress(80);

      // Step 4: Configuring app
      setCurrentStep(3);
      updateStep(3, 'loading');
      await new Promise((resolve) => setTimeout(resolve, 500));
      updateStep(3, 'complete');
      setProgress(90);

      // Step 5: Finalizing
      setCurrentStep(4);
      updateStep(4, 'loading');
      await setOnboardingCompleted(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      updateStep(4, 'complete');
      setProgress(100);

      // Wait a moment then navigate
      setTimeout(() => {
        router.replace('/');
      }, 1000);
    } catch (err) {
      console.error('Sync error:', err);
      setError((err as Error).message || 'Failed to sync data. Please try again.');
      updateStep(currentStep, 'error');
    }
  };

  const getStepIcon = (status: SyncStep['status']) => {
    switch (status) {
      case 'complete':
        return <Ionicons name="checkmark-circle" size={24} color="#10b981" />;
      case 'loading':
        return <ActivityIndicator size="small" color={colors.primary} />;
      case 'error':
        return <Ionicons name="close-circle" size={24} color="#ef4444" />;
      default:
        return <View style={[styles.pendingDot, { backgroundColor: colors.border }]} />;
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="cloud-download" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {error ? 'Setup Failed' : progress === 100 ? 'All Set!' : 'Setting Up Your App'}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {error
            ? 'We encountered an issue during setup.'
            : progress === 100
              ? 'Your app is ready! You can now sign in.'
              : 'Preparing the app for first use...'}
        </Text>

        {!error && (
          <>
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Progress</Text>
                <Text style={[styles.progressPercent, { color: colors.primary }]}>{progress}%</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${progress}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.stepsContainer}>
              {steps.map((step, index) => (
                <View key={step.id} style={styles.stepRow}>
                  {getStepIcon(step.status)}
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color:
                          step.status === 'complete'
                            ? colors.textMuted
                            : step.status === 'loading'
                              ? colors.textPrimary
                              : colors.textMuted,
                        fontFamily: step.status === 'loading' ? fonts.semibold : fonts.regular,
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.surfaceMuted, borderColor: '#ef4444' }]}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error}</Text>
          </View>
        )}
      </View>

      {progress === 100 && (
        <View style={[styles.successBadge, { backgroundColor: '#10b981' }]}>
          <Ionicons name="checkmark" size={24} color="#fff" />
          <Text style={styles.successText}>Ready to go!</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  progressContainer: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  progressPercent: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  stepsContainer: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pendingDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  stepLabel: {
    fontSize: 15,
    flex: 1,
  },
  errorCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 16,
  },
  successText: {
    color: '#fff',
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
});
