import { SyncService } from './sync.service';
import { ProjectRecord } from '../../common/types/forms';
import { SchedulerRegistry } from '@nestjs/schedule';

describe('SyncService', () => {
  const scheduler = new SchedulerRegistry();
  const makeConfig = (options?: { seedMode?: string; intervalMs?: number }) =>
    ({
      get: (key: string, defaultValue?: unknown) => {
        if (key === 'ABEMIS_SEED_MODE') return options?.seedMode ?? 'seed';
        if (key === 'ABEMIS_SYNC_INTERVAL_MS') return options?.intervalMs ?? 0;
        return defaultValue;
      },
    } as any);

  it('upserts client forms via the repository', async () => {
    const upsertFormFromClient = jest.fn().mockResolvedValue({
      id: 'draft-1',
      annexTitle: 'Annex C – Validation Form',
      status: 'Draft',
      data: { id: 'draft-1' },
    });
    const service = new SyncService(
      {
        upsertFormFromClient,
      } as any,
      { fetchProjectsFromAbemis: jest.fn() } as any,
      scheduler,
      makeConfig({ seedMode: 'seed', intervalMs: 0 }),
    );

    await service.upsertForms([
      {
        id: 'draft-1',
        annexTitle: 'Annex C – Validation Form',
        status: 'Draft',
        data: { id: 'draft-1' } as any,
      },
    ]);

    expect(upsertFormFromClient).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'draft-1', annexTitle: 'Annex C – Validation Form' }),
    );
  });

  it('fetches and saves ABEMIS projects before returning snapshot', async () => {
    const projects: ProjectRecord[] = [
      { id: 'p1', projectCode: 'P-001', title: 'Test Project', forms: [] },
    ];
    const saveProjectsFromUpstream = jest.fn();
    const getSnapshot = jest.fn().mockResolvedValue({ projects, standaloneDrafts: [] });
    const fetchProjectsFromAbemis = jest.fn().mockResolvedValue(projects);

    const service = new SyncService(
      {
        saveProjectsFromUpstream,
        getSnapshot,
      } as any,
      { fetchProjectsFromAbemis } as any,
      scheduler,
      makeConfig({ seedMode: 'abemis', intervalMs: 0 }),
    );

    const snapshot = await service.getSnapshot();

    expect(fetchProjectsFromAbemis).toHaveBeenCalled();
    expect(saveProjectsFromUpstream).toHaveBeenCalledWith(projects);
    expect(snapshot.projects).toEqual(projects);
  });
});
