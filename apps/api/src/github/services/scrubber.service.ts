import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ScrubberService {
  private readonly logger = new Logger(ScrubberService.name);

  // High-performance regex patterns for common credentials
  private readonly secretPatterns = [
    // OpenRouter / OpenAI API keys
    /sk-[a-zA-Z0-9]{48}/g,
    /sk-or-v1-[a-zA-Z0-9]{64}/g,
    // AWS Access Key ID & Secret Access Key
    /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASCA|ASIA)[A-Z0-9]{16}/g,
    /amzn\.mws\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,
    // Database Connection URLs
    /postgresql:\/\/[a-zA-Z0-9_:]+@[a-zA-Z0-9_.-]+:[0-9]+\/[a-zA-Z0-9_.-]+/g,
    /mongodb(?:\+srv)?:\/\/[a-zA-Z0-9_:]+@[a-zA-Z0-9_.-]+(?::[0-9]+)?(?:\/[a-zA-Z0-9_.-]+)?/g,
    /mysql:\/\/[a-zA-Z0-9_:]+@[a-zA-Z0-9_.-]+:[0-9]+\/[a-zA-Z0-9_.-]+/g,
    // Private SSH/PEM Keys
    /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+ PRIVATE KEY-----/g,
    // General token/password parameters
    /api_key\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}["']/gi,
    /password\s*[:=]\s*["'][a-zA-Z0-9_\-!@#$%^&*()]{8,}["']/gi,
  ];

  /**
   * Cleans Git Diff contents by locating credentials and swapping them with a safe placeholder mask.
   */
  scrub(content: string): string {
    if (!content) return '';
    let scrubbed = content;
    let matchCount = 0;

    for (const pattern of this.secretPatterns) {
      const matches = scrubbed.match(pattern);
      if (matches) {
        matchCount += matches.length;
        scrubbed = scrubbed.replace(pattern, '[SECRET_SHIELD_MASK]');
      }
    }

    if (matchCount > 0) {
      this.logger.warn(`LLM Security Shield: Scrubber intercepted and masked ${matchCount} sensitive credentials/keys!`);
    }

    return scrubbed;
  }
}
