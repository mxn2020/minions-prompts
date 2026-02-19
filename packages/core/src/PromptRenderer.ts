/**
 * @module minions-prompts/PromptRenderer
 * Variable interpolation engine for prompt templates.
 * Supports {{variable}}, {{#if condition}}, and {{#each items}} syntax.
 */

/** Error thrown when rendering fails due to missing or invalid variables. */
export class RendererError extends Error {
  constructor(
    message: string,
    public readonly missingVariables?: string[],
  ) {
    super(message);
    this.name = 'RendererError';
  }
}

/** Options for the render method. */
export interface RenderOptions {
  /** If true, missing variables throw a RendererError. Default: true. */
  strict?: boolean;
  /** Variables declared as required; missing ones always throw regardless of strict mode. */
  requiredVariables?: string[];
}

/**
 * Renders prompt templates with variable substitution and block support.
 *
 * @example
 * ```typescript
 * const renderer = new PromptRenderer();
 * const result = renderer.render(
 *   'Hello, {{name}}! You are a {{role}}.',
 *   { name: 'Alice', role: 'developer' }
 * );
 * // → 'Hello, Alice! You are a developer.'
 * ```
 */
export class PromptRenderer {
  /**
   * Renders a prompt template with the given variables.
   *
   * Supports:
   * - `{{variable}}` — basic substitution
   * - `{{#if variable}}...{{/if}}` — conditional blocks
   * - `{{#each array}}...{{/each}}` — iteration blocks
   *
   * @param template - The prompt template string.
   * @param variables - Key/value pairs to substitute.
   * @param options - Rendering options.
   * @returns The rendered string.
   * @throws {RendererError} If required variables are missing.
   */
  render(
    template: string,
    variables: Record<string, unknown> = {},
    options: RenderOptions = {},
  ): string {
    const { strict = true, requiredVariables = [] } = options;

    // Check required variables
    const missing = requiredVariables.filter(
      (v) => variables[v] === undefined || variables[v] === null,
    );
    if (missing.length > 0) {
      throw new RendererError(
        `Missing required variables: ${missing.join(', ')}`,
        missing,
      );
    }

    let result = template;

    // Process #each blocks first
    result = this.processEachBlocks(result, variables, strict);

    // Process #if blocks
    result = this.processIfBlocks(result, variables, strict);

    // Process simple variable substitutions
    result = this.processVariables(result, variables, strict);

    // Unescape literal \{{ sequences
    result = result.replace(/\\{{/g, '{{');

    return result;
  }

  /**
   * Extracts all variable names referenced in a template.
   *
   * @param template - The prompt template string.
   * @returns Array of unique variable names.
   */
  extractVariables(template: string): string[] {
    const names = new Set<string>();

    // Match {{variable}} patterns (not # or / prefixed)
    const varPattern = /\{\{([^#/][^}]*?)\}\}/g;
    let match: RegExpExecArray | null;
    while ((match = varPattern.exec(template)) !== null) {
      names.add(match[1]!.trim());
    }

    // Match condition names in #if blocks
    const ifPattern = /\{\{#if\s+([^}]+)\}\}/g;
    while ((match = ifPattern.exec(template)) !== null) {
      names.add(match[1]!.trim());
    }

    // Match collection names in #each blocks
    const eachPattern = /\{\{#each\s+([^}]+)\}\}/g;
    while ((match = eachPattern.exec(template)) !== null) {
      names.add(match[1]!.trim());
    }

    return Array.from(names);
  }

  private processEachBlocks(
    template: string,
    variables: Record<string, unknown>,
    strict: boolean,
  ): string {
    const eachPattern = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    return template.replace(eachPattern, (_, name: string, body: string) => {
      const collection = variables[name];
      if (collection === undefined || collection === null) {
        if (strict) {
          // Not required, just return empty
        }
        return '';
      }
      if (!Array.isArray(collection)) {
        return '';
      }
      return collection
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            // Object iteration: expose item fields as variables
            return this.processVariables(body, item as Record<string, unknown>, false);
          }
          // Primitive iteration: expose as {{this}}
          return body.replace(/\{\{this\}\}/g, String(item));
        })
        .join('');
    });
  }

  private processIfBlocks(
    template: string,
    variables: Record<string, unknown>,
    _strict: boolean,
  ): string {
    const ifPattern = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    return template.replace(ifPattern, (_, name: string, body: string) => {
      const value = variables[name];
      if (this.isTruthy(value)) {
        return body;
      }
      return '';
    });
  }

  private processVariables(
    template: string,
    variables: Record<string, unknown>,
    strict: boolean,
  ): string {
    return template.replace(/(?<!\\)\{\{([^#/][^}]*?)\}\}/g, (match, name: string) => {
      const key = name.trim();
      if (key in variables) {
        const val = variables[key];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      }
      if (strict) {
        // Leave unknown vars as-is in non-strict mode
        return match;
      }
      return match;
    });
  }

  private isTruthy(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (value === false) return false;
    if (value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }
}
