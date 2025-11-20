import { Injectable } from '@nestjs/common';
import { annexForms } from '../../data/annexes';

@Injectable()
export class AnnexesService {
  list() {
    return annexForms;
  }
}
