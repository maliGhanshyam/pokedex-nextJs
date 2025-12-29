import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KeepAliveService implements OnModuleInit {
  private readonly logger = new Logger(KeepAliveService.name);
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    // Get the app's own URL for keep-alive pings
    // Use 127.0.0.1 instead of localhost for better reliability
    const port = process.env.PORT || this.configService.get('PORT') || 3001;
    this.baseUrl = `http://127.0.0.1:${port}`;
  }

  onModuleInit() {
    // Start keep-alive after a short delay
    setTimeout(() => {
      this.logger.log('Keep-alive service initialized');
    }, 5000);
  }

  @Cron('*/5 * * * *') // Every 5 minutes
  async keepAlive() {
    // Only run keep-alive if explicitly enabled (to avoid unnecessary requests)
    const keepAliveEnabled = this.configService.get('KEEP_ALIVE_ENABLED', 'false') === 'true';
    
    if (!keepAliveEnabled) {
      return;
    }

    try {
      // Ping the health endpoint via localhost to prevent Render from sleeping
      // ✅ COST-FREE: Internal requests (localhost/127.0.0.1) do NOT count as outbound bandwidth
      // ✅ Render only charges for outbound traffic over the public Internet
      // ✅ This internal ping is completely free and won't use Render credits
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/`, { timeout: 5000 }),
      );
      this.logger.debug('Keep-alive ping successful (internal, no cost)');
    } catch (error) {
      // Silently fail - this is just a keep-alive, not critical
      this.logger.debug('Keep-alive ping failed (non-critical)');
    }
  }
}

