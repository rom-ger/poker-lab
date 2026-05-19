import { STORAGE_PEER_KEY } from './constants'
import { randomUUID } from './randomId'

export function getOrCreatePeerId(): string {
  const existing = localStorage.getItem(STORAGE_PEER_KEY)
  if (existing) return existing
  const id = randomUUID()
  localStorage.setItem(STORAGE_PEER_KEY, id)
  return id
}
