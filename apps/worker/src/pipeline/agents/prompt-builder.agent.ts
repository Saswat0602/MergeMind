import { Injectable } from '@nestjs/common';
import { IntentRouterAgent, Persona } from './intent-router.agent';

@Injectable()
export class PromptBuilderAgent {
  constructor(private readonly intentRouter: IntentRouterAgent) {}

  build(params: {
    settings: any;
    prTitle: string;
    prDescription: string;
    cleanDiff: string;
    rules?: any[];
  }) {
    const { settings, prTitle, prDescription, cleanDiff, rules } = params;

    const jsonFormatInstructions = `

You MUST respond strictly in valid JSON format matching the following TypeScript interface:
{
  "summary": string,
  "severityScore": number,
  "comments": Array<{
    "filePath": string,
    "lineNumber": number,
    "content": string,
    "severity": "HIGH" | "MEDIUM" | "LOW",
    "type": "SECURITY" | "PERFORMANCE" | "STYLE",
    "suggestion"?: string
  }>
}

Crucial rules:
1. ONLY comment on lines that were actually added or modified in the diff (marked with +). Never comment on unmodified lines.
2. If there are no issues, keep the "comments" array empty.
3. STRICTLY AVOID styling nitpicks. ONLY comment on bugs, logic issues, security risks, execution latency, or rule violations.
4. Ensure the JSON is completely valid and escaped properly.`;

    let rulesPrompt = '';
    if (rules && rules.length > 0) {
      rulesPrompt =
        `\n\nYou MUST strictly validate the code changes against the following custom organizational rules:\n` +
        rules
          .map(
            (r, i) =>
              `${i + 1}. [Rule: ${r.name}] Type: ${r.type} - Description: ${r.description || ''}`,
          )
          .join('\n');
    }

    const persona = this.intentRouter.route(prTitle, prDescription);

    let systemPrompt = '';
    if (settings.systemPromptBase && settings.systemPromptBase.trim() !== '') {
      systemPrompt = settings.systemPromptBase.trim();
    } else {
      if (persona === Persona.SECURITY) {
        systemPrompt = `You are an elite Application Security Engineer.
Your job is to perform a rigorous security audit on a Git Pull Request diff and provide:
1. A concise summary of the security implications of this PR.
2. A severity score from 0 to 100 based strictly on security risks (e.g. Injection, XSS, Auth Bypass, Leakage).
3. A list of constructive review comments focused strictly on SECURITY vulnerabilities.`;
      } else if (persona === Persona.PERFORMANCE) {
        systemPrompt = `You are a Performance Optimization Expert.
Your job is to review a Git Pull Request diff for latency bottlenecks, memory leaks, and algorithmic inefficiencies. Provide:
1. A concise summary of the performance impact of this PR.
2. A severity score from 0 to 100 based strictly on performance degradations.
3. A list of constructive review comments focused on PERFORMANCE optimizations.`;
      } else if (persona === Persona.FRONTEND) {
        systemPrompt = `You are a Senior Frontend Architect.
Your job is to review a Git Pull Request diff focusing on UI/UX, accessibility (a11y), responsive design, and CSS/component structures. Provide:
1. A concise summary of the frontend changes in this PR.
2. A severity score from 0 to 100 based on UI regressions or accessibility violations.
3. A list of constructive review comments focused on FRONTEND (STYLE, accessibility, component architecture).`;
      } else {
        systemPrompt = `You are a professional, senior software engineer.
Your job is to review a Git Pull Request diff and provide:
1. A concise summary of what the PR accomplishes.
2. A severity score from 0 to 100.
3. A list of constructive review comments focused on SECURITY, PERFORMANCE, and logic bugs.`;
      }

      systemPrompt += `\n\nFor each issue, specify:
- "filePath": Exact file path.
- "lineNumber": The line number in the new file where the issue occurs (must be a modified/added line).
- "content": Clear description of the issue.
- "severity": "HIGH", "MEDIUM", or "LOW".
- "type": "SECURITY", "PERFORMANCE", or "STYLE".
- "suggestion": (Optional) A strict, direct drop-in code replacement snippet.`;
    }

    systemPrompt += `${rulesPrompt}${jsonFormatInstructions}`;

    const userPrompt = `PR Title: ${prTitle}
PR Description: ${prDescription || 'No description provided.'}

Raw Diff:
\`\`\`diff
${cleanDiff}
\`\`\`

Analyze the diff and return the JSON review report.`;

    return { systemPrompt, userPrompt };
  }
}
