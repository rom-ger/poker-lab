const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function generateRoomId(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export function isValidRoomId(id: string): boolean {
  return /^[a-z0-9]{6,12}$/.test(id)
}
