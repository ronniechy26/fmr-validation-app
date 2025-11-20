import { ValidationForm } from '../common/types/forms';

export function createValidationForm(
  overrides: Partial<ValidationForm> = {},
): ValidationForm {
  return {
    id: 'temp',
    validationDate: '',
    district: '',
    nameOfProject: '',
    typeOfProject: 'FMR',
    proponent: 'Department of Agriculture / LGU',
    locationBarangay: '',
    locationMunicipality: '',
    locationProvince: '',
    scopeOfWorks: '',
    estimatedCost: '',
    estimatedLengthLinear: '',
    estimatedLengthWidth: '',
    estimatedLengthThickness: '',
    projectLinkNarrative:
      'Located within the key production area and will serve as road linkage to existing public market. ' +
      'Approximately __ kms away from town proper.',
    publicMarketName: '',
    distanceKm: '',
    agriCommodities: '',
    areaHectares: '',
    numFarmers: '',
    roadRemarks: '',
    barangaysCovered: '',
    startLatDMS: '',
    startLonDMS: '',
    endLatDMS: '',
    endLonDMS: '',
    preparedByName: '',
    preparedByDesignation: '',
    recommendedByName: '',
    notedByName: '',
    status: 'Draft',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
