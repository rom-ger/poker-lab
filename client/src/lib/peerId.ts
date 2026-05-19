import { STORAGE_PEER_KEY } from './constants'

export function getOrCreatePeerId(): string {
  const existing = localStorage.getItem(STORAGE_PEER_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(STORAGE_PEER_KEY, id)
  return id
}
