import { Injectable, Logger } from '@nestjs/common';

export enum Persona {
  GENERAL = 'GENERAL',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  FRONTEND = 'FRONTEND'
}

@Injectable()
export class IntentRouterAgent {
  private readonly logger = new Logger(IntentRouterAgent.name);

  /**
   * Evaluates the PR title and description to route the request to a specific AI Persona.
   * Uses heuristics to avoid an expensive LLM call for routing, keeping it efficient.
   */
  route(prTitle: string, prDescription: string): Persona {
    const text = (prTitle + ' ' + prDescription).toLowerCase();

    if (
      text.includes('security') || 
      text.includes('vulnerability') || 
      text.includes('auth') || 
      text.includes('cve') || 
      text.includes('injection') || 
      text.includes('xss') ||
      text.includes('bypass')
    ) {
      this.logger.log('Routing to SECURITY persona based on keywords.');
      return Persona.SECURITY;
    }

    if (
      text.includes('perf') || 
      text.includes('optimize') || 
      text.includes('latency') || 
      text.includes('speed') || 
      text.includes('memory') ||
      text.includes('cache')
    ) {
      this.logger.log('Routing to PERFORMANCE persona based on keywords.');
      return Persona.PERFORMANCE;
    }

    if (
      text.includes('ui ') || 
      text.includes('ui/') || 
      text.includes('frontend') || 
      text.includes('react') || 
      text.includes('css') || 
      text.includes('tailwind') || 
      text.includes('component')
    ) {
      this.logger.log('Routing to FRONTEND persona based on keywords.');
      return Persona.FRONTEND;
    }

    this.logger.log('Routing to GENERAL persona.');
    return Persona.GENERAL;
  }
}
