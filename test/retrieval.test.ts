import { describe, expect, it } from 'vitest'
import {
  evaluateSelection,
  formatEvalBadge,
  formatScore,
  formatThreshold,
  isBelowThreshold,
  normaliseThreshold,
  scoreColor,
  scoreWidth,
} from '../src/components/retrieval'

describe('retrieval helpers', () => {
  it('D.2 #9 normalises a threshold to [0,1] with two decimals', () => {
    expect(normaliseThreshold(0.2)).toBe(0.2)
    expect(normaliseThreshold(1.5)).toBe(1)
    expect(normaliseThreshold(-0.2)).toBe(0)
    expect(normaliseThreshold(0.235)).toBe(0.24)
    expect(formatThreshold(0.2)).toBe('0.20')
  })

  it('D.2 #13 colours score bars by band', () => {
    expect(scoreColor(0.51)).toBe('#2e7d5b')
    expect(scoreColor(0.31)).toBe('#1b6b93')
    expect(scoreColor(0.3)).toBe('#e8a838')
    expect(scoreColor(0.1)).toBe('#e8a838')
  })

  it('D.2 #13 bar width is score x 100 with a 2% minimum', () => {
    expect(scoreWidth(0.42)).toBeCloseTo(42)
    expect(scoreWidth(0)).toBe(2)
    expect(scoreWidth(0.001)).toBe(2)
  })

  it('D.2 #14 shows scores to three decimals', () => {
    expect(formatScore(0.12345)).toBe('0.123')
    expect(formatScore(1)).toBe('1.000')
  })

  it('D.2 #15 dims below-threshold cards', () => {
    expect(isBelowThreshold(0.19, 0.2)).toBe(true)
    expect(isBelowThreshold(0.2, 0.2)).toBe(false)
  })

  it('D.5 #40 computes precision, recall and F1 over the selection', () => {
    const m = evaluateSelection(['bbnj', 'eu511', 'trips'], { relevant_doc_ids: ['bbnj', 'eu511', 'nagoya'] })
    expect(m.precision).toBeCloseTo(2 / 3)
    expect(m.recall).toBeCloseTo(2 / 3)
    expect(m.f1).toBeCloseTo(2 / 3)
    expect(m.count).toBe(3)
    expect(m.hasGroundTruth).toBe(true)
  })

  it('D.5 #40 ignores the badge when there is no ground truth', () => {
    const m = evaluateSelection(['bbnj'], { relevant_doc_ids: [] })
    expect(m.hasGroundTruth).toBe(false)
  })

  it('D.5 #40 formats the badge', () => {
    const m = evaluateSelection(['bbnj', 'eu511'], { relevant_doc_ids: ['bbnj'] })
    expect(formatEvalBadge(m)).toBe('P=0.50 R=1.00 F1=0.67 (2 selected)')
  })
})
