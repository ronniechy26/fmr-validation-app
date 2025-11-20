export interface FmrUser {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  password: string;
}

export const users: FmrUser[] = [
  {
    id: 'user-001',
    name: 'Engr. Mark Paul C. Baldeo',
    email: 'mark.baldeo@da.gov.ph',
    role: 'Project Assistant IV',
    region: 'DA Regional Field Office 02',
    password: 'validation123',
  },
  {
    id: 'user-002',
    name: 'Engr. Alyssa V. Cruz',
    email: 'alyssa.cruz@da.gov.ph',
    role: 'Regional Engineer',
    region: 'DA Regional Field Office 02',
    password: 'securepass456',
  },
];
