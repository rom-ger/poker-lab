import { STORAGE_NAME_KEY } from './constants'

export function getStoredName(): string {
  return localStorage.getItem(STORAGE_NAME_KEY) ?? ''
}

export function setStoredName(name: string): void {
  localStorage.setItem(STORAGE_NAME_KEY, name.trim())
}
