import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
/**
 * Проверяет: `BR-constraint.ui-visual-standards` — дизайн-токены (акцент зелёный,
 * паритет тем, отсутствие голубого акцента макета).
 */
import { describe, expect, it } from 'vitest';

const tokensPath = resolve(process.cwd(), 'src/assets/styles/tokens.css');
const tokens = readFileSync(tokensPath, 'utf-8');

describe('дизайн-токены (BR-constraint.ui-visual-standards)', () => {
  it('тёмная тема: акцент зелёный #22C55E', () => {
    expect(tokens).toMatch(/--gr-accent:\s*#22c55e/i);
  });

  it('светлая тема: акцент тёмно-зелёный #15803D', () => {
    expect(tokens).toMatch(/--gr-accent:\s*#15803d/i);
  });

  it('нет голубого акцента макета', () => {
    expect(tokens).not.toMatch(/--gr-accent:\s*rgba?\(79/i);
    expect(tokens).not.toMatch(/#4f8cff/i);
  });

  it('паритет тем: одинаковый набор переменных в :root и [data-theme=light]', () => {
    const dark = tokens.match(/:root\s*\{([^}]*)\}/s)?.[1] ?? '';
    const light = tokens.match(/\[data-theme=["']light["']\]\s*\{([^}]*)\}/s)?.[1] ?? '';
    const vars = (block: string) =>
      [...block.matchAll(/--gr-[\w-]+/g)]
        .map((m) => m[0])
        .filter((name) => !name.startsWith('--gr-font-'))
        .sort();
    expect(vars(light)).toEqual(vars(dark));
  });
});
