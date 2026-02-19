/**
 * Version Chain Example
 * Create a prompt, bump versions, view history, and show diffs.
 */

import { createMinion, generateId, now } from 'minions-sdk';
import {
  promptTemplateType,
  promptVersionType,
  PromptChain,
  PromptDiff,
  InMemoryStorage,
} from '../../packages/core/src/index.js';

async function main() {
  const storage = new InMemoryStorage();

  // Create original template
  const { minion: template } = createMinion(
    {
      title: 'Code Review Assistant',
      fields: {
        content: 'Review the following code and identify issues:\n\n{{code}}',
        variables: ['code'],
      },
    },
    promptTemplateType,
  );
  await storage.saveMinion(template);

  // Version 2: Add language context
  const { minion: v2 } = createMinion(
    {
      title: 'Code Review Assistant v2',
      fields: {
        content: `Review the following {{language}} code and identify:
1. Bugs and potential runtime errors
2. Security vulnerabilities
3. Performance issues
4. Style violations

Code:
\`\`\`{{language}}
{{code}}
\`\`\``,
        versionNumber: 2,
        changelog: 'Added language context and structured review categories',
        variables: ['language', 'code'],
      },
    },
    promptVersionType,
  );
  await storage.saveMinion(v2);
  await storage.saveRelation({
    id: generateId(),
    sourceId: v2.id,
    targetId: template.id,
    type: 'follows',
    createdAt: now(),
  });

  // Version 3: Add severity levels
  const { minion: v3 } = createMinion(
    {
      title: 'Code Review Assistant v3',
      fields: {
        content: `You are an expert {{language}} developer performing a thorough code review.

For each issue found, assign a severity: 🔴 Critical | 🟡 Warning | 🔵 Suggestion

Review focus areas:
- Correctness and logic errors
- Security vulnerabilities (injection, auth, data exposure)
- Performance bottlenecks
- Readability and maintainability
{{#if standards}}
- Compliance with: {{standards}}
{{/if}}

Code to review:
\`\`\`{{language}}
{{code}}
\`\`\`

Provide actionable recommendations for each issue found.`,
        versionNumber: 3,
        changelog: 'Added severity levels, security focus, and conditional standards check',
        variables: ['language', 'code', 'standards'],
      },
    },
    promptVersionType,
  );
  await storage.saveMinion(v3);
  await storage.saveRelation({
    id: generateId(),
    sourceId: v3.id,
    targetId: v2.id,
    type: 'follows',
    createdAt: now(),
  });

  // View version chain
  const chain = new PromptChain(storage);
  const versions = await chain.getVersionChain(template.id);
  const latest = await chain.getLatestVersion(template.id);

  console.log(`\n📜 Version chain (${versions.length} versions):`);
  for (const v of versions) {
    const isLatest = v.id === latest.id;
    console.log(`  ${isLatest ? '▶' : '◆'} ${v.title} (${v.id.slice(0, 8)}...)`);
  }

  // Show diff between v1 and v3
  const differ = new PromptDiff();
  const diff = differ.diff(template, v3);
  console.log('\n🔍 Diff between original and v3:\n');
  console.log(differ.format(diff, true));
}

main().catch(console.error);
