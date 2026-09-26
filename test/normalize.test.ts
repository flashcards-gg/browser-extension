import { describe, expect, it } from 'vitest';
import { frontFrom, isLong, normalize, sameFront, MAX_FRONT_CHARS } from '../src/normalize';

describe('normalize', () => {
  it('trims and collapses whitespace, including newlines', () => {
    expect(normalize('  el \n pueblo\t\tse  asoma ')).toBe('el pueblo se asoma');
  });
  it('frontFrom caps at 500 without a trailing space', () => {
    const f = frontFrom(Array(200).fill('word').join(' '));
    expect(f.length).toBeLessThanOrEqual(MAX_FRONT_CHARS);
    expect(f.endsWith(' ')).toBe(false);
  });
  it('isLong: a word or short phrase is not long; two sentences or > 120 chars is', () => {
    expect(isLong('acantilado')).toBe(false);
    expect(isLong('Una frase con punto final.')).toBe(false);
    expect(isLong('El pueblo se asoma al mar. Sus casas resisten.')).toBe(true);
    expect(isLong('a'.repeat(121))).toBe(true);
  });
  it('sameFront: trim + lower-case, accents preserved', () => {
    expect(sameFront(' Hola ', 'hola')).toBe(true);
    expect(sameFront('café', 'cafe')).toBe(false);
  });
});
