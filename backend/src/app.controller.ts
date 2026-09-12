import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      service: 'commute-connect-api',
      message: 'CommuteConnect API is running. See /api/health for a status check.',
    };
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'commute-connect-api' };
  }
}
