import type { CardValue, Player } from '../types'

const NUMERIC: CardValue[] = [
  1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233,
]

export function calculateAverage(players: Player[]): number | null {
  const votes = players
    .map((p) => p.vote)
    .filter((v): v is CardValue => v != null && NUMERIC.includes(v as CardValue))

  if (votes.length === 0) return null

  const nums = votes.map((v) => Number(v))
  const sum = nums.reduce((a, b) => a + b, 0)
  return Math.round((sum / nums.length) * 10) / 10
}
