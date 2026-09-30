// Pure helpers for the retriever. Kept free of Vue so they are easy to test.

import type { GroundTruth } from './types'

export const DEFAULT_THRESHOLD = 0.2
export const DEFAULT_METHOD = 'bm25'

/** Clamp a threshold to [0, 1], rounded to two decimals (D.2 #9). */
export function normaliseThreshold(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_THRESHOLD
  const clamped = Math.min(1, Math.max(0, value))
  return Math.round(clamped * 100) / 100
}

/** The threshold as the UI shows it: two decimals (D.2 #9). */
export function formatThreshold(value: number): string {
  return normaliseThreshold(value).toFixed(2)
}

/**
 * Score-bar colour (D.2 #13): > 0.5 green, > 0.3 ocean, otherwise amber.
 */
export function scoreColor(score: number): string {
  if (score > 0.5) return '#2e7d5b'
  if (score > 0.3) return '#1b6b93'
  return '#e8a838'
}

/** Score-bar width as a percentage, minimum 2% (D.2 #13). */
export function scoreWidth(score: number): number {
  return Math.max(score * 100, 2)
}

/** A score shown to three decimals (D.2 #14). */
export function formatScore(score: number): string {
  return score.toFixed(3)
}

/**
 * D.2 #15: a card is dimmed when it falls below the threshold and was not
 * manually added. The retriever does not know about manual additions, so a
 * document dims when its score is below the threshold.
 */
export function isBelowThreshold(score: number, threshold: number): boolean {
  return score < threshold
}

/** Precision, recall and F1 over the selected docs (D.5 #40). */
export function evaluateSelection(
  selectedDocIds: string[],
  groundTruth: GroundTruth | null | undefined,
): { precision: number; recall: number; f1: number; count: number; hasGroundTruth: boolean } {
  const gold = groundTruth?.relevant_doc_ids ?? []
  const selected = new Set(selectedDocIds)
  if (gold.length === 0) {
    return { precision: 0, recall: 0, f1: 0, count: selected.size, hasGroundTruth: false }
  }
  const goldSet = new Set(gold)
  const tp = [...selected].filter((d) => goldSet.has(d)).length
  const precision = selected.size > 0 ? tp / selected.size : 0
  const recall = goldSet.size > 0 ? tp / goldSet.size : 0
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
  return { precision, recall, f1, count: selected.size, hasGroundTruth: true }
}

/** Badge text `P= R= F1= (N selected)` (D.5 #40). */
export function formatEvalBadge(metrics: ReturnType<typeof evaluateSelection>): string {
  return `P=${metrics.precision.toFixed(2)} R=${metrics.recall.toFixed(2)} F1=${metrics.f1.toFixed(2)} (${metrics.count} selected)`
}
