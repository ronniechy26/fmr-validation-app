export type AnnexForm = {
  id: 'annexC' | 'annexB' | 'annexA';
  title: string;
  description: string;
  status: 'available' | 'comingSoon';
};

export const annexForms: AnnexForm[] = [
  {
    id: 'annexC',
    title: 'Annex C – Validation Form',
    description: 'Full validation checklist covering project details, scope, and signatories.',
    status: 'available',
  },
  {
    id: 'annexB',
    title: 'Annex B – Technical Survey',
    description: 'Survey details for technical assessments (coming soon).',
    status: 'comingSoon',
  },
  {
    id: 'annexA',
    title: 'Annex A – Community Consultation',
    description: 'Consultation notes and meeting summaries (coming soon).',
    status: 'comingSoon',
  },
];
