import { beforeEach, describe, expect, it } from 'bun:test';
import { createTestElement, resetDom } from '../setup/mockDom.js';
import { getWindow } from '../setup/mockDom.js';

describe('i18n', () => {
  let importCounter = 0;

  async function loadI18n() {
    importCounter += 1;
    return import(`@client/i18n/index.ts?test=${importCounter}`);
  }

  beforeEach(() => {
    resetDom();
    const doc = (globalThis.document as any);
    doc.documentElement.setAttribute('lang', 'en');
    createTestElement('h1', { id: 'title', dataset: { i18n: 'app.title' } });
    createTestElement('div', { id: 'tooltip', dataset: { i18nTitle: 'controls.playTooltip' } });
    createTestElement('input', { id: 'input', dataset: { i18nPlaceholder: 'controls.playUrlPlaceholder' } });
  });

  it('detects stored language and applies translations', async () => {
    globalThis.localStorage.setItem('ytm-language', 'de');
    const navigator = getWindow().navigator;
    navigator.languages = ['es-ES'];

    const i18n = await loadI18n();
    expect(i18n.getCurrentLanguage()).toBe('de');
    expect((globalThis.document as any).documentElement.getAttribute('lang')).toBe('de');
    expect((globalThis.document as any).title).toBe('YTM Remote Control');
  });

  it('replaces placeholders and falls back to keys when missing', async () => {
    const i18n = await loadI18n();
    expect(i18n.t('playlists.songCount', { count: '5' })).toContain('5');
    expect(i18n.t('non.existent.key')).toBe('non.existent.key');
  });

  it('sets language and updates DOM attributes', async () => {
    const i18n = await loadI18n();
    i18n.setLanguage('es');

    expect(globalThis.localStorage.getItem('ytm-language')).toBe('es');
    expect((globalThis.document as any).documentElement.getAttribute('lang')).toBe('es');

    const tooltip = (globalThis.document as any).getElementById('tooltip');
    expect(tooltip.getAttribute('title')).not.toBe('');

    const input = (globalThis.document as any).getElementById('input');
    expect(input.placeholder).toBe(i18n.t('controls.playUrlPlaceholder'));
  });
});
