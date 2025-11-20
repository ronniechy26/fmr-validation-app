import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';

@Module({
  imports: [SharedModule],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
