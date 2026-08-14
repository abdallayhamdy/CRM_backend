import { describe, it, expect } from 'vitest'
import { sanitizeRecord, sanitizeSearchQuery } from './sanitize'

describe('sanitizeSearchQuery', () => {
  it('escapes percent signs', () => {
    expect(sanitizeSearchQuery('100%')).toBe('100\\%')
  })

  it('escapes underscores', () => {
    expect(sanitizeSearchQuery('test_value')).toBe('test\\_value')
  })

  it('escapes both % and _', () => {
    expect(sanitizeSearchQuery('%test_value%')).toBe('\\%test\\_value\\%')
  })

  it('trims whitespace', () => {
    expect(sanitizeSearchQuery('  hello  ')).toBe('hello')
  })

  it('returns empty string as-is', () => {
    expect(sanitizeSearchQuery('')).toBe('')
  })

  it('leaves normal strings unchanged', () => {
    expect(sanitizeSearchQuery('john@example.com')).toBe('john@example.com')
  })

  it('escapes multiple special characters', () => {
    expect(sanitizeSearchQuery('a%b_c%d')).toBe('a\\%b\\_c\\%d')
  })
})

describe('sanitizeRecord', () => {
  it('converts undefined to null', () => {
    const result = sanitizeRecord({ name: undefined, age: 25 })
    expect(result).toEqual({ name: null, age: 25 })
  })

  it('converts "undefined" string to null', () => {
    const result = sanitizeRecord({ name: 'undefined' })
    expect(result).toEqual({ name: null })
  })

  it('converts "null" string to null', () => {
    const result = sanitizeRecord({ name: 'null' })
    expect(result).toEqual({ name: null })
  })

  it('converts empty _id fields to null', () => {
    const result = sanitizeRecord({ contact_id: '', name: 'test' })
    expect(result).toEqual({ contact_id: null, name: 'test' })
  })

  it('keeps empty non-id fields as empty string', () => {
    const result = sanitizeRecord({ name: '' })
    expect(result).toEqual({ name: '' })
  })

  it('preserves valid values', () => {
    const result = sanitizeRecord({ name: 'John', age: 30, active: true })
    expect(result).toEqual({ name: 'John', age: 30, active: true })
  })

  it('preserves null values', () => {
    const result = sanitizeRecord({ name: null })
    expect(result).toEqual({ name: null })
  })
})
