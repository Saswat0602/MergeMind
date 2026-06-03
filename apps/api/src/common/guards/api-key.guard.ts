import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const expectedApiKey = this.configService.get<string>('DASHBOARD_API_KEY');
    if (!expectedApiKey) {
      // If no API key is configured, reject all requests for safety
      throw new UnauthorizedException('API authentication not configured');
    }

    // Expecting 'Bearer <API_KEY>' or just '<API_KEY>'
    const providedKey = authHeader.replace('Bearer ', '').trim();
    if (providedKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
