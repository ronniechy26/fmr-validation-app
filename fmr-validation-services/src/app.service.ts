import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'fmr-validation-bff',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
