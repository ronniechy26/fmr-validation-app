import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { LabeledInput } from '@/components/LabeledInput';
import { LabeledTextArea } from '@/components/LabeledTextArea';
import { SectionDivider } from '@/components/SectionDivider';
import { ValidationForm } from '@/types/forms';
import { fonts, spacing, typography } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeMode } from '@/providers/ThemeProvider';

const roadRemarksSample =
  'The road length is situated in flat to undulating terrain.\nThe road length is not passable to all types of vehicle.\nThe proposed road length connects to the existing concrete road.';

const blankForm: ValidationForm = {
  id: 'temp',
  validationDate: '',
  district: '',
  nameOfProject: 'Concreting of FMR',
  typeOfProject: 'FMR',
  proponent: 'Department of Agriculture / LGU',
  locationBarangay: '',
  locationMunicipality: '',
  locationProvince: '',
  scopeOfWorks: 'Concreting',
  estimatedCost: '',
  estimatedLengthLinear: '',
  estimatedLengthWidth: '',
  estimatedLengthThickness: '',
  projectLinkNarrative:
    'Located within the key production area and will serve as road linkage to existing public market (______, Public Market) and approximately __ kms away from ______.',
  publicMarketName: '',
  distanceKm: '',
  agriCommodities: 'Rice, Corn, Vegetables…',
  areaHectares: '',
  numFarmers: '600',
  roadRemarks: roadRemarksSample,
  barangaysCovered: '',
  startLatDMS: "N 15° 7' 23.51\"",
  startLonDMS: "E 121° 6' 26.32\"",
  endLatDMS: "N 15° 6' 56.60\"",
  endLonDMS: "E 121° 7' 12.62\"",
  preparedByName: 'Engr. Mark Paul C. Baldeo',
  preparedByDesignation: 'Project Assistant IV',
  recommendedByName: '',
  notedByName: '',
  status: 'Draft',
  updatedAt: new Date().toISOString(),
};

export function FormEditorScreen() {
  const router = useRouter();
  const { colors } = useThemeMode();
  const params = useLocalSearchParams<{ form?: string }>();
  const annexName =
    typeof params.annex === 'string' && params.annex.trim().length > 0 ? params.annex : 'Annex C – Validation Form';
  const existingForm = useMemo(() => {
    if (!params.form) return undefined;
    try {
      return JSON.parse(params.form as string) as ValidationForm;
    } catch {
      return undefined;
    }
  }, [params.form]);

  const initialForm = useMemo(
    () =>
      existingForm
        ? { ...existingForm }
        : {
            ...blankForm,
            id: `new-${Date.now()}`,
            updatedAt: new Date().toISOString(),
          },
    [existingForm],
  );
  const [form, setForm] = useState<ValidationForm>(initialForm);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setForm(initialForm);
    setCurrentStep(0);
  }, [initialForm]);

  const handleChange = useCallback((key: keyof ValidationForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleAlert = (label: string) => {
    Alert.alert(label, 'Feature not connected yet.', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  const steps = useMemo(
    () => [
      {
        title: 'Project Profile',
        description: 'Summaries and location data for this FMR validation.',
        content: (
          <>
            <Section title="Header / Basic Info">
              <LabeledInput
                label="Validation Date"
                placeholder="YYYY-MM-DD"
                value={form.validationDate}
                onChangeText={(text) => handleChange('validationDate', text)}
              />
              <LabeledInput
                label="District"
                placeholder="e.g. 2nd District"
                value={form.district}
                onChangeText={(text) => handleChange('district', text)}
              />
              <LabeledInput
                label="Name of Project"
                value={form.nameOfProject}
                onChangeText={(text) => handleChange('nameOfProject', text)}
              />
              <View style={[styles.readonlyRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[typography.label, { color: colors.textMuted }]}>Type of Project</Text>
                <Text style={[styles.readonlyValue, { color: colors.textPrimary }]}>{form.typeOfProject}</Text>
              </View>
              <LabeledInput
                label="Proponent"
                placeholder="Department of Agriculture / LGU"
                value={form.proponent}
                onChangeText={(text) => handleChange('proponent', text)}
              />
            </Section>

            <Section title="Location">
              <LabeledInput
                label="Barangay"
                value={form.locationBarangay}
                onChangeText={(text) => handleChange('locationBarangay', text)}
              />
              <LabeledInput
                label="Municipality"
                value={form.locationMunicipality}
                onChangeText={(text) => handleChange('locationMunicipality', text)}
              />
              <LabeledInput
                label="Province"
                value={form.locationProvince}
                onChangeText={(text) => handleChange('locationProvince', text)}
              />
            </Section>
          </>
        ),
      },
      {
        title: 'Scope & Linkages',
        description: 'Scope, cost, project linkages, and agricultural impact.',
        content: (
          <>
            <Section title="Scope, Cost & Length">
              <LabeledInput
                label="Scope of Works"
                value={form.scopeOfWorks}
                onChangeText={(text) => handleChange('scopeOfWorks', text)}
              />
              <LabeledInput
                label="Estimated Cost (₱)"
                keyboardType="numeric"
                value={form.estimatedCost}
                onChangeText={(text) => handleChange('estimatedCost', text)}
              />
              <LabeledInput
                label="Estimated Length (Linear meters)"
                keyboardType="numeric"
                value={form.estimatedLengthLinear}
                onChangeText={(text) => handleChange('estimatedLengthLinear', text)}
              />
              <LabeledInput
                label="Width (m)"
                keyboardType="numeric"
                value={form.estimatedLengthWidth}
                onChangeText={(text) => handleChange('estimatedLengthWidth', text)}
              />
              <LabeledInput
                label="Thickness (m)"
                keyboardType="numeric"
                value={form.estimatedLengthThickness}
                onChangeText={(text) => handleChange('estimatedLengthThickness', text)}
              />
            </Section>

            <Section title="Project Link">
              <LabeledTextArea
                label="Narrative"
                value={form.projectLinkNarrative}
                onChangeText={(text) => handleChange('projectLinkNarrative', text)}
              />
              <LabeledInput
                label="Public Market Name"
                placeholder="e.g. Dupax Public Market"
                value={form.publicMarketName}
                onChangeText={(text) => handleChange('publicMarketName', text)}
              />
              <LabeledInput
                label="Distance (km)"
                keyboardType="numeric"
                value={form.distanceKm}
                onChangeText={(text) => handleChange('distanceKm', text)}
              />
            </Section>

            <Section title="Agricultural Commodities & Area">
              <LabeledTextArea
                label="Commodities"
                value={form.agriCommodities}
                onChangeText={(text) => handleChange('agriCommodities', text)}
              />
              <LabeledInput
                label="Area (Hectares)"
                keyboardType="numeric"
                value={form.areaHectares}
                onChangeText={(text) => handleChange('areaHectares', text)}
              />
            </Section>
          </>
        ),
      },
      {
        title: 'Impact & Signatories',
        description: 'Beneficiaries, coordinates, and sign-off details.',
        content: (
          <>
            <Section title="Beneficiaries & Road Condition">
              <LabeledInput
                label="No. of Farmers"
                keyboardType="numeric"
                value={form.numFarmers}
                onChangeText={(text) => handleChange('numFarmers', text)}
              />
              <LabeledTextArea
                label="Road Remarks"
                value={form.roadRemarks}
                onChangeText={(text) => handleChange('roadRemarks', text)}
              />
            </Section>

            <Section title="Barangays Covered & Coordinates">
              <LabeledInput
                label="Barangays Covered"
                value={form.barangaysCovered}
                onChangeText={(text) => handleChange('barangaysCovered', text)}
              />
              <SectionDivider label="Start Coordinates" />
              <LabeledInput
                label="Latitude (DMS)"
                value={form.startLatDMS}
                onChangeText={(text) => handleChange('startLatDMS', text)}
              />
              <LabeledInput
                label="Longitude (DMS)"
                value={form.startLonDMS}
                onChangeText={(text) => handleChange('startLonDMS', text)}
              />
              <SectionDivider label="End Coordinates" />
              <LabeledInput
                label="Latitude (DMS)"
                value={form.endLatDMS}
                onChangeText={(text) => handleChange('endLatDMS', text)}
              />
              <LabeledInput
                label="Longitude (DMS)"
                value={form.endLonDMS}
                onChangeText={(text) => handleChange('endLonDMS', text)}
              />
            </Section>

            <Section title="Signatories">
              <LabeledInput
                label="Prepared By (Name)"
                value={form.preparedByName}
                onChangeText={(text) => handleChange('preparedByName', text)}
              />
              <LabeledInput
                label="Prepared By (Designation)"
                value={form.preparedByDesignation}
                onChangeText={(text) => handleChange('preparedByDesignation', text)}
              />
              <LabeledInput
                label="Recommended By"
                value={form.recommendedByName}
                onChangeText={(text) => handleChange('recommendedByName', text)}
              />
              <LabeledInput
                label="Noted By"
                value={form.notedByName}
                onChangeText={(text) => handleChange('notedByName', text)}
              />
            </Section>
          </>
        ),
      },
    ],
    [colors, form, handleChange],
  );

  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Screen scroll applyTopInset={false}>
      <View style={styles.stepHeader}>
        <View style={styles.stepMeta}>
          <Text style={[styles.stepMetaText, { color: colors.textMuted }]}>
            {annexName} • Step {currentStep + 1} of {totalSteps}
          </Text>
          <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{steps[currentStep].title}</Text>
          <Text style={[styles.stepDescription, { color: colors.textMuted }]}>{steps[currentStep].description}</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${((currentStep + 1) / totalSteps) * 100}%` },
            ]}
          />
        </View>
      </View>

      {steps[currentStep].content}

      <View style={styles.actions}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
          >
            <Text style={[styles.buttonText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>
        )}

        {!isLastStep ? (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>Next</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: colors.primary }]}
              onPress={() => handleAlert('Saved Draft')}
            >
              <Text style={[styles.buttonText, { color: colors.primary }]}>Save Draft (UI only)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => handleAlert('Submitted')}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>Submit for Sync (UI only)</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepHeader: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stepMeta: {
    gap: spacing.xs,
  },
  stepMetaText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  stepTitle: {
    fontFamily: fonts.semibold,
    fontSize: 20,
  },
  stepDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  readonlyRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  readonlyValue: {
    fontSize: 16,
    fontFamily: fonts.semibold,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  button: {
    flexGrow: 1,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {
  },
  buttonText: {
    fontFamily: fonts.semibold,
    textAlign: 'center',
  },
});
