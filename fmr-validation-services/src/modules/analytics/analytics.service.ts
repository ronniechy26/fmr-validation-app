import { Injectable } from '@nestjs/common';
import { annexForms } from '../../data/annexes';
import { FmrRepository } from '../../shared/fmr.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly repository: FmrRepository) {}

  async getSummary() {
    const [forms, projects] = await Promise.all([
      this.repository.getAllForms(),
      this.repository.getProjects(),
    ]);
    const drafts = forms.filter((form) => form.status === 'Draft').length;
    const pending = forms.filter(
      (form) => form.status === 'Pending Sync',
    ).length;
    const synced = forms.filter((form) => form.status === 'Synced').length;
    const errors = forms.filter((form) => form.status === 'Error').length;

    const heroStats = [
      {
        label: 'Total Forms',
        value: forms.length,
        subLabel: '+2 created this week',
        background: '#ede9fe',
        accent: '#4338ca',
        progress: this.percentage(forms.length, forms.length + 5),
      },
      {
        label: 'Pending Sync',
        value: pending,
        subLabel: 'Requires upload',
        background: '#e0f2fe',
        accent: '#0369a1',
        progress: this.percentage(pending, Math.max(forms.length, 1)),
      },
      {
        label: 'Drafts',
        value: drafts,
        subLabel: 'Needs completion',
        background: '#fef3c7',
        accent: '#b45309',
        progress: this.percentage(drafts, Math.max(forms.length, 1)),
      },
      {
        label: 'Synced',
        value: synced,
        subLabel: 'Up to date',
        background: '#ecfdf5',
        accent: '#047857',
        progress: this.percentage(synced, Math.max(forms.length, 1)),
      },
    ];

    const annexDistribution = annexForms.map((annex) => ({
      id: annex.id,
      title: annex.title,
      count: forms.filter((form) => form.annexTitle === annex.title).length,
    }));

    const projectSummaries = projects.map((project) => {
      const formsForProject = project.forms ?? [];
      return {
        id: project.id,
        name: project.title,
        barangay: project.barangay,
        municipality: project.municipality,
        totalForms: formsForProject.length,
        pending: formsForProject.filter(
          (form) => form.status === 'Pending Sync',
        ).length,
      };
    });

    return {
      totals: {
        totalForms: forms.length,
        drafts,
        pending,
        synced,
        errors,
      },
      heroStats,
      annexDistribution,
      projectSummaries,
    };
  }

  private percentage(value: number, total: number) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }
}
