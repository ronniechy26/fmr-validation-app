import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { LabeledInput } from '@/components/LabeledInput';
import { LabeledTextArea } from '@/components/LabeledTextArea';
import { SectionDivider } from '@/components/SectionDivider';
import { ValidationForm } from '@/types/forms';
import { colors, fonts, spacing, typography } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';

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
  const params = useLocalSearchParams<{ form?: string }>();
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

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const handleChange = (key: keyof ValidationForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAlert = (label: string) => {
    Alert.alert(label, 'Feature not connected yet.', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <Screen scroll>
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
        <View style={styles.readonlyRow}>
          <Text style={typography.label}>Type of Project</Text>
          <Text style={styles.readonlyValue}>{form.typeOfProject}</Text>
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

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => handleAlert('Saved Draft')}
        >
          <Text style={[styles.buttonText, { color: colors.primary }]}>Save Draft (UI only)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => handleAlert('Submitted')}>
          <Text style={[styles.buttonText, { color: '#fff' }]}>Submit for Sync (UI only)</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  readonlyRow: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  readonlyValue: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontFamily: fonts.semibold,
    textAlign: 'center',
  },
});
