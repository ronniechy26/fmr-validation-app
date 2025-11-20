import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import type { ValidationForm } from '../../common/types/forms';
import { ProjectEntity } from './project.entity';

@Entity('form_records')
export class FormRecordEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  annexTitle: string;

  @Column('text')
  status: string;

  @Column('text', { nullable: true })
  abemisId?: string | null;

  @Column('text', { nullable: true })
  qrReference?: string | null;

  @ManyToOne(() => ProjectEntity, (project) => project.forms, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'project_id' })
  project?: ProjectEntity | null;

  @RelationId((form: FormRecordEntity) => form.project)
  projectId?: string | null;

  @Column('jsonb')
  data: ValidationForm;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
