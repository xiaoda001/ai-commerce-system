import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ReadinessResponse } from '@commerce/contracts';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('live')
  live(): { status: 'ok' } { return { status: 'ok' }; }

  @Get('ready')
  async ready(): Promise<ReadinessResponse> {
    const response = await this.health.checkReadiness();
    if (response.status === 'error') throw new HttpException(response, HttpStatus.SERVICE_UNAVAILABLE);
    return response;
  }
}
