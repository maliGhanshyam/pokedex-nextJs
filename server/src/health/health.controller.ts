import { Controller, Get, Head, HttpCode, HttpStatus } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return { status: 'ok' };
  }

  @Head()
  @HttpCode(HttpStatus.OK)
  healthCheckHead() {
    // HEAD request - no body, just status code
    return;
  }
}

