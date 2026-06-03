import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptBuilderAgent {
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

    let systemPrompt = `You are a professional, senior software engineer and security auditor.
Your job is to review a Git Pull Request diff and provide:
1. A concise summary of what the PR accomplishes.
2. A severity score from 0 to 100.
3. A list of constructive review comments focused on SECURITY, PERFORMANCE, and STYLE (violations).

For each issue, specify:
- "filePath": Exact file path.
- "lineNumber": The line number in the new file where the issue occurs (must be a modified/added line).
- "content": Clear description of the issue.
- "severity": "HIGH", "MEDIUM", or "LOW".
- "type": "SECURITY", "PERFORMANCE", or "STYLE".
- "suggestion": (Optional) A strict, direct drop-in code replacement snippet.`;

    if (settings.systemPromptBase && settings.systemPromptBase.trim() !== '') {
      systemPrompt = settings.systemPromptBase.trim();
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
