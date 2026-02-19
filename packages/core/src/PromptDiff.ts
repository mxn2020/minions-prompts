/**
 * @module minions-prompts/PromptDiff
 * Field-level and content-level diff between two prompt versions.
 */

import type { Minion } from 'minions-sdk';
import type { DiffResult, DiffLine } from './types.js';

/**
 * Computes structured diffs between two prompt minions.
 *
 * @example
 * ```typescript
 * const differ = new PromptDiff();
 * const result = differ.diff(v1, v2);
 * console.log(differ.format(result));
 * ```
 */
export class PromptDiff {
  /**
   * Computes the difference between two prompt minions field by field.
   *
   * @param v1 - The older (baseline) minion.
   * @param v2 - The newer (comparison) minion.
   * @returns A structured DiffResult.
   */
  diff(v1: Minion, v2: Minion): DiffResult {
    const f1 = v1.fields as Record<string, unknown>;
    const f2 = v2.fields as Record<string, unknown>;

    const allKeys = new Set([...Object.keys(f1), ...Object.keys(f2)]);

    const added: DiffResult['added'] = [];
    const removed: DiffResult['removed'] = [];
    const changed: DiffResult['changed'] = [];

    for (const key of allKeys) {
      const hasV1 = key in f1;
      const hasV2 = key in f2;

      if (!hasV1 && hasV2) {
        added.push({ field: key, value: f2[key] });
      } else if (hasV1 && !hasV2) {
        removed.push({ field: key, value: f1[key] });
      } else if (hasV1 && hasV2) {
        if (!this.deepEqual(f1[key], f2[key])) {
          changed.push({ field: key, from: f1[key], to: f2[key] });
        }
      }
    }

    // Title comparison
    if (v1.title !== v2.title) {
      changed.push({ field: 'title', from: v1.title, to: v2.title });
    }

    // Content line-level diff
    const content1 = typeof f1['content'] === 'string' ? f1['content'] : '';
    const content2 = typeof f2['content'] === 'string' ? f2['content'] : '';
    const contentDiff = this.lineDiff(content1, content2);

    return { added, removed, changed, contentDiff };
  }

  /**
   * Formats a DiffResult as a human-readable string.
   *
   * @param result - The diff result to format.
   * @param colored - Whether to include ANSI color codes. Default: false.
   * @returns Formatted string.
   */
  format(result: DiffResult, colored = false): string {
    const lines: string[] = [];

    const green = colored ? '\x1b[32m' : '';
    const red = colored ? '\x1b[31m' : '';
    const yellow = colored ? '\x1b[33m' : '';
    const reset = colored ? '\x1b[0m' : '';

    for (const { field, value } of result.added) {
      lines.push(`${green}+ [${field}] ${JSON.stringify(value)}${reset}`);
    }
    for (const { field, value } of result.removed) {
      lines.push(`${red}- [${field}] ${JSON.stringify(value)}${reset}`);
    }
    for (const { field, from, to } of result.changed) {
      if (field === 'content') continue; // shown as line diff below
      lines.push(`${yellow}~ [${field}] ${JSON.stringify(from)} → ${JSON.stringify(to)}${reset}`);
    }

    if (result.contentDiff && result.contentDiff.length > 0) {
      lines.push('--- content ---');
      for (const line of result.contentDiff) {
        if (line.type === 'add') lines.push(`${green}+ ${line.text}${reset}`);
        else if (line.type === 'remove') lines.push(`${red}- ${line.text}${reset}`);
        else lines.push(`  ${line.text}`);
      }
    }

    return lines.join('\n');
  }

  /** Produces a line-level diff between two strings. */
  private lineDiff(text1: string, text2: string): DiffLine[] {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const result: DiffLine[] = [];

    // Simple LCS-based diff
    const lcs = this.computeLCS(lines1, lines2);
    let i = 0, j = 0, k = 0;

    while (i < lines1.length || j < lines2.length) {
      if (i < lines1.length && j < lines2.length && k < lcs.length && lines1[i] === lcs[k] && lines2[j] === lcs[k]) {
        result.push({ type: 'context', text: lines1[i]! });
        i++; j++; k++;
      } else if (j < lines2.length && (k >= lcs.length || lines2[j] !== lcs[k])) {
        result.push({ type: 'add', text: lines2[j]! });
        j++;
      } else if (i < lines1.length) {
        result.push({ type: 'remove', text: lines1[i]! });
        i++;
      }
    }

    return result;
  }

  private computeLCS(a: string[], b: string[]): string[] {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i]![j] = dp[i - 1]![j - 1]! + 1;
        } else {
          dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
        }
      }
    }

    // Backtrack
    const lcs: string[] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        lcs.unshift(a[i - 1]!);
        i--; j--;
      } else if (dp[i - 1]![j]! > dp[i]![j - 1]!) {
        i--;
      } else {
        j--;
      }
    }
    return lcs;
  }

  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((v, i) => this.deepEqual(v, b[i]));
    }
    if (typeof a === 'object' && typeof b === 'object') {
      const ka = Object.keys(a as object);
      const kb = Object.keys(b as object);
      if (ka.length !== kb.length) return false;
      return ka.every((k) => this.deepEqual((a as Record<string,unknown>)[k], (b as Record<string,unknown>)[k]));
    }
    return false;
  }
}
