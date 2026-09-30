// Component tests, one per Appendix D.2 / D.5 item the retriever owns.
//
// D.2 #7  methods from the server; BM25 default
// D.2 #8  changing method refetches and logs change_method
// D.2 #9  threshold slider, value shown to two decimals
// D.2 #13 score bar colour and width
// D.2 #14 doc card: title, doc_id · N prov, score to 3 decimals, Top: prov
// D.2 #15 below-threshold cards dimmed
// D.5 #39 research-mode badges
// D.5 #40 P= R= F1= (N selected)

import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ProvisionRetriever from '../src/components/ProvisionRetriever.vue'

const CASE = {
  case_id: 'halden',
  title: 'Halden',
  fact_pattern: 'A Norwegian SME isolates an esterase.',
  facts: {},
  origin: 'scenario' as const,
}

function ranked(docScore: number) {
  return {
    case_id: 'halden',
    query: 'x',
    method: 'bm25',
    threshold: 0.2,
    corpus_version: '1.0',
    documents: [
      {
        doc_id: 'bbnj',
        title: 'BBNJ Agreement',
        score: docScore,
        top_provision: 'bbnj_art11_1',
        provisions: [{ prov_id: 'bbnj_art11_1', citation: 'BBNJ Art. 11(1)', article: 'Art. 11', score: docScore, text_preview: '…' }],
      },
    ],
  }
}

function mountRetriever(props: Record<string, unknown> = {}) {
  return mount(ProvisionRetriever, {
    props: {
      case: CASE,
      onSearch: vi.fn().mockResolvedValue(ranked(0.42)),
      onListMethods: vi.fn().mockResolvedValue([
        { id: 'tfidf', label: 'TF-IDF' },
        { id: 'bm25', label: 'BM25' },
        { id: 'sbert', label: 'SBERT' },
      ]),
      ...props,
    },
  })
}

describe('ProvisionRetriever', () => {
  it('D.2 #7 lists methods from the server with BM25 active by default', async () => {
    const wrapper = mountRetriever()
    await flushPromises()

    const buttons = wrapper.findAll('.method-btn')
    expect(buttons.map((b) => b.text())).toEqual(['TF-IDF', 'BM25', 'SBERT'])
    expect(wrapper.find('.method-btn.active').text()).toBe('BM25')
  })

  it('D.2 #8 changing method refetches and logs change_method', async () => {
    const onSearch = vi.fn().mockResolvedValue(ranked(0.42))
    const wrapper = mountRetriever({ onSearch })
    await flushPromises()
    expect(onSearch).toHaveBeenCalledTimes(1)

    await wrapper.findAll('.method-btn')[0].trigger('click')
    await flushPromises()

    expect(onSearch).toHaveBeenCalledTimes(2)
    expect(onSearch.mock.calls[1][0].method).toBe('tfidf')

    const events = wrapper.emitted('provenance')!.map((e) => (e[0] as { action: string }).action)
    expect(events).toContain('change_method')
  })

  it('D.2 #9 shows the threshold to two decimals and updates live', async () => {
    const wrapper = mountRetriever({ defaultThreshold: 0.2 })
    await flushPromises()

    expect(wrapper.find('.threshold-value').text()).toBe('0.20')

    const slider = wrapper.find('.threshold-slider')
    await slider.setValue('45')
    expect(wrapper.find('.threshold-value').text()).toBe('0.45')
  })

  it('D.2 #13/#14 renders a score bar and the doc card fields', async () => {
    const wrapper = mountRetriever({ onSearch: vi.fn().mockResolvedValue(ranked(0.42)) })
    await flushPromises()

    const bar = wrapper.find('.score-bar')
    expect(bar.attributes('style')).toContain('width: 42%')
    expect(bar.attributes('style')).toContain('#1b6b93')

    expect(wrapper.find('.doc-title').text()).toContain('BBNJ Agreement')
    expect(wrapper.find('.doc-meta').text()).toBe('bbnj · 1 prov')
    expect(wrapper.find('.score-num').text()).toBe('0.420')
    expect(wrapper.find('.top-prov').text()).toBe('Top: bbnj_art11_1')
  })

  it('D.2 #15 dims a card below the threshold', async () => {
    const wrapper = mountRetriever({
      onSearch: vi.fn().mockResolvedValue(ranked(0.1)),
      defaultThreshold: 0.2,
    })
    await flushPromises()

    expect(wrapper.find('.doc-card').classes()).toContain('below-threshold')
  })

  it('D.5 #39 shows relevant/distractor badges when research mode is on', async () => {
    const wrapper = mountRetriever({
      showEvaluation: true,
      groundTruth: { relevant_doc_ids: ['bbnj'] },
    })
    await flushPromises()

    const badge = wrapper.find('.gt-badge')
    expect(badge.text()).toBe('relevant')
    expect(badge.classes()).toContain('gt-relevant')
  })

  it('D.5 #40 shows the P/R/F1 badge over the selected docs', async () => {
    const wrapper = mountRetriever({
      showEvaluation: true,
      groundTruth: { relevant_doc_ids: ['bbnj'] },
    })
    await flushPromises()

    expect(wrapper.find('[data-test="eval-badge"]').text()).toBe('P=1.00 R=1.00 F1=1.00 (1 selected)')
  })

  it('hides the badge without ground truth', async () => {
    const wrapper = mountRetriever({ showEvaluation: true, groundTruth: { relevant_doc_ids: [] } })
    await flushPromises()
    expect(wrapper.find('[data-test="eval-badge"]').exists()).toBe(false)
  })

  it('reports a search failure', async () => {
    const wrapper = mountRetriever({ onSearch: vi.fn().mockRejectedValue(new Error('boom')) })
    await flushPromises()
    expect(wrapper.find('.error').text()).toContain('boom')
  })
})
