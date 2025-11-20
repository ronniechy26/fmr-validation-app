import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { GeoTag, ProposalDocument } from '../../common/types/forms';
import { FormRecordEntity } from './form-record.entity';

@Entity('projects')
export class ProjectEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text', { unique: true })
  projectCode: string;

  @Column('text')
  title: string;

  @Column('text', { nullable: true })
  operatingUnit?: string | null;

  @Column('text', { nullable: true })
  bannerProgram?: string | null;

  @Column('int', { nullable: true })
  yearFunded?: number | null;

  @Column('text', { nullable: true })
  projectType?: string | null;

  @Column('text', { nullable: true })
  region?: string | null;

  @Column('text', { nullable: true })
  province?: string | null;

  @Column('text', { nullable: true })
  district?: string | null;

  @Column('text', { nullable: true })
  municipality?: string | null;

  @Column('text', { nullable: true })
  barangay?: string | null;

  @Column('text', { nullable: true })
  stage?: string | null;

  @Column('text', { nullable: true })
  status?: string | null;

  @Column('text', { nullable: true })
  author?: string | null;

  @Column('text', { nullable: true })
  quantity?: string | null;

  @Column('text', { nullable: true })
  quantityUnit?: string | null;

  @Column('numeric', { nullable: true, precision: 18, scale: 2 })
  allocatedAmount?: string | null;

  @Column('text', { nullable: true })
  beneficiary?: string | null;

  @Column('text', { nullable: true })
  prexcProgram?: string | null;

  @Column('text', { nullable: true })
  subProgram?: string | null;

  @Column('text', { nullable: true })
  indicatorLevel1?: string | null;

  @Column('text', { nullable: true })
  indicatorLevel3?: string | null;

  @Column('text', { nullable: true })
  recipientType?: string | null;

  @Column('text', { nullable: true })
  budgetProcess?: string | null;

  @Column('text', { nullable: true })
  abemisId?: string | null;

  @Column('text', { nullable: true })
  qrReference?: string | null;

  @Column('text', { nullable: true })
  zone?: string | null;

  @Column('jsonb', { default: () => "'[]'::jsonb" })
  geotags: GeoTag[];

  @Column('jsonb', { default: () => "'[]'::jsonb" })
  proposalDocuments: ProposalDocument[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => FormRecordEntity, (form) => form.project, { cascade: true })
  forms?: FormRecordEntity[];
}
