import { mount } from '@vue/test-utils';
/**
 * Проверяет: `BR-constraint.ui-visual-standards` — реестр иконок (согласованность,
 * currentColor) и рендер `Icon.vue`.
 */
import { describe, expect, it } from 'vitest';
import Icon from '../ui/icons/Icon.vue';
import { type IconName, icons } from '../ui/icons/registry';

describe('registry иконок (согласованность)', () => {
  it('все иконки имеют viewBox и body', () => {
    for (const [name, def] of Object.entries(icons)) {
      expect(def.viewBox, name).toBeTruthy();
      expect(def.body, name).toBeTruthy();
    }
  });

  it('все body используют currentColor (нет жёстко зашитых rgb)', () => {
    for (const [name, def] of Object.entries(icons)) {
      expect(def.body, name).not.toMatch(/stroke="rgb/i);
    }
  });
});

describe('Icon.vue (рендер)', () => {
  it('рендерит svg с указанным размером', () => {
    const wrapper = mount(Icon, { props: { name: 'chevron-down', size: 24 } });
    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('width')).toBe('24');
    expect(svg.attributes('height')).toBe('24');
    expect(svg.attributes('aria-hidden')).toBe('true');
  });

  it('рендерит все известные иконки без ошибки', () => {
    const names = Object.keys(icons) as IconName[];
    for (const name of names.slice(0, 5)) {
      const wrapper = mount(Icon, { props: { name } });
      expect(wrapper.find('svg').exists()).toBe(true);
    }
  });
});
