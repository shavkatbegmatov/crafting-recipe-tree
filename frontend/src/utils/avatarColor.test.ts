import { describe, it, expect } from 'vitest'
import { avatarColor, initials } from './avatarColor'

describe('avatarColor', () => {
  it('deterministik — bir xil nom doimo bir xil rang', () => {
    expect(avatarColor('admin')).toBe(avatarColor('admin'))
  })

  it('to\'g\'ri hsl formatida qaytaradi', () => {
    expect(avatarColor('test')).toMatch(/^hsl\(\d{1,3}, 42%, 52%\)$/)
  })

  it('turli nomlar uchun ranglar tarqaladi', () => {
    const names = ['a', 'b', 'c', 'd', 'e', 'admin', 'user', 'test']
    const colors = new Set(names.map(avatarColor))
    expect(colors.size).toBeGreaterThan(1)
  })

  it('bo\'sh nom ham xatosiz ishlaydi', () => {
    expect(avatarColor('')).toMatch(/^hsl\(/)
  })
})

describe('initials', () => {
  it('bitta so\'z — bitta bosh harf', () => {
    expect(initials('admin')).toBe('A')
  })

  it('ikki so\'z — ikki bosh harf, katta', () => {
    expect(initials('john doe')).toBe('JD')
  })

  it('pastki chiziq ham ajratuvchi sifatida ishlaydi', () => {
    expect(initials('super_admin')).toBe('SA')
  })

  it('eng ko\'pi 2 harf qaytaradi', () => {
    expect(initials('a b c d')).toBe('AB')
  })
})
