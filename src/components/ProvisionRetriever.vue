<template>
  <div class="provision-retriever">
    <h2 v-if="props.title" class="title">{{ props.title }}</h2>

    <div class="controls">
      <div class="control-group">
        <label>Method</label>
        <button
          v-for="m in methods"
          :key="m.id"
          type="button"
          class="method-btn"
          :class="{ active: m.id === method }"
          :data-method="m.id"
          @click="setMethod(m.id)"
        >
          {{ m.label }}
        </button>
      </div>

      <div class="control-group">
        <label>Threshold</label>
        <input
          class="threshold-slider"
          type="range"
          min="0"
          max="100"
          :value="Math.round(threshold * 100)"
          @input="onThresholdInput"
        />
        <span class="threshold-value">{{ formatThreshold(threshold) }}</span>
      </div>

      <div class="control-group">
        <span
          v-if="props.showEvaluation && evalMetrics.hasGroundTruth"
          class="eval-badge"
          data-test="eval-badge"
        >{{ formatEvalBadge(evalMetrics) }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading">Searching…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <ul v-else class="doc-list">
      <li
        v-for="doc in documents"
        :key="doc.doc_id"
        class="doc-card"
        :class="{ 'below-threshold': isBelowThreshold(doc.score, threshold) }"
        :data-doc-id="doc.doc_id"
      >
        <div class="doc-title">
          {{ doc.title }}
          <span
            v-if="props.showEvaluation && props.groundTruth"
            class="gt-badge"
            :class="isRelevant(doc.doc_id) ? 'gt-relevant' : 'gt-distractor'"
          >{{ isRelevant(doc.doc_id) ? 'relevant' : 'distractor' }}</span>
        </div>
        <div class="doc-meta">{{ doc.doc_id }} · {{ doc.provisions.length }} prov</div>
        <div class="score-row">
          <div class="score-bar-bg">
            <div
              class="score-bar"
              :style="{ width: scoreWidth(doc.score) + '%', background: scoreColor(doc.score) }"
            ></div>
          </div>
          <div class="score-num" :style="{ color: scoreColor(doc.score) }">
            {{ formatScore(doc.score) }}
          </div>
        </div>
        <div class="top-prov">Top: {{ doc.top_provision }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { RankedDocumentV1 } from 'legal-provision-types'
import {
  DEFAULT_METHOD,
  DEFAULT_THRESHOLD,
  evaluateSelection,
  formatEvalBadge,
  formatScore,
  formatThreshold,
  isBelowThreshold,
  normaliseThreshold,
  scoreColor,
  scoreWidth,
} from './retrieval'
import { provideHostCallbacks } from './hostCallbacks'
import type { MethodOption, ProvisionRetrieverProps } from './types'

const props = withDefaults(defineProps<ProvisionRetrieverProps>(), {
  defaultMethod: DEFAULT_METHOD,
  defaultThreshold: DEFAULT_THRESHOLD,
  showEvaluation: false,
})

const emit = defineEmits<{
  results: [data: import('legal-provision-types').RankedProvisionsV1]
  provenance: [event: import('legal-provision-types').ProvenanceEventV1]
}>()

const builtInMethods: MethodOption[] = [
  { id: 'tfidf', label: 'TF-IDF' },
  { id: 'bm25', label: 'BM25' },
  { id: 'sbert', label: 'SBERT' },
]

const methods = ref<MethodOption[]>(builtInMethods)
const method = ref(props.defaultMethod)
const threshold = ref(normaliseThreshold(props.defaultThreshold))
const documents = ref<RankedDocumentV1[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

provideHostCallbacks({
  search: (args) => props.onSearch?.(args) ?? Promise.reject(new Error('onSearch is not set')),
  listMethods: () => props.onListMethods?.() ?? Promise.resolve(builtInMethods),
})

const evalMetrics = computed(() =>
  evaluateSelection(
    documents.value.filter((d) => !isBelowThreshold(d.score, threshold.value)).map((d) => d.doc_id),
    props.groundTruth,
  ),
)

function isRelevant(docId: string): boolean {
  return props.groundTruth?.relevant_doc_ids?.includes(docId) ?? false
}

onMounted(async () => {
  try {
    methods.value = (await props.onListMethods?.()) ?? builtInMethods
    // BM25 stays the default when offered (D.2 #7).
    if (!methods.value.some((m) => m.id === method.value) && methods.value.length > 0) {
      method.value = methods.value.find((m) => m.id === DEFAULT_METHOD)?.id ?? methods.value[0].id
    }
  } catch {
    methods.value = builtInMethods
  }
  await runSearch('load')
})

function provenance(action: string, extra: Partial<import('legal-provision-types').ProvenanceEventV1> = {}) {
  emit('provenance', {
    timestamp: new Date().toISOString(),
    action,
    target_kind: 'retrieval',
    target_id: props.case?.case_id ?? null,
    method: method.value,
    threshold: threshold.value,
    ...extra,
  })
}

async function runSearch(action: string) {
  if (!props.case || !props.onSearch) {
    documents.value = []
    return
  }
  loading.value = true
  error.value = null
  try {
    const data = await props.onSearch({
      query: props.case.fact_pattern,
      method: method.value,
      case_id: props.case.case_id,
    })
    documents.value = data.documents ?? []
    emit('results', data)
    provenance(action)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Search failed'
    documents.value = []
  } finally {
    loading.value = false
  }
}

function setMethod(id: string) {
  if (id === method.value) return
  method.value = id
  runSearch('change_method')
}

function onThresholdInput(event: Event) {
  threshold.value = normaliseThreshold(Number((event.target as HTMLInputElement).value) / 100)
  // Re-evaluate selection live; the score data does not change with threshold.
}
</script>

<style scoped>
.provision-retriever {
  font-family: inherit;
}
.title {
  margin: 0 0 12px;
  font-size: 18px;
}
.controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.control-group > label {
  font-size: 11px;
  color: #5a6a7a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.method-btn {
  padding: 5px 14px;
  border: 1px solid #d8e3eb;
  border-radius: 6px;
  background: #fff;
  color: #5a6a7a;
  cursor: pointer;
}
.method-btn.active {
  background: #1b6b93;
  color: #fff;
  border-color: #1b6b93;
}
.threshold-slider {
  width: 160px;
  accent-color: #1b6b93;
}
.threshold-value {
  font-family: monospace;
  font-size: 13px;
  color: #1b6b93;
  font-weight: 600;
  min-width: 36px;
}
.eval-badge {
  font-size: 11px;
  font-family: monospace;
  padding: 3px 8px;
  border-radius: 4px;
  background: #edf5fa;
  color: #5a6a7a;
}
.doc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.doc-card {
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  margin-bottom: 4px;
  background: #fff;
}
.doc-card.below-threshold {
  opacity: 0.35;
}
.doc-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 3px;
}
.doc-meta {
  font-size: 11px;
  color: #9aacb8;
  font-family: monospace;
  margin-bottom: 5px;
}
.score-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.score-bar-bg {
  flex: 1;
  height: 5px;
  background: #edf5fa;
  border-radius: 3px;
  overflow: hidden;
}
.score-bar {
  height: 100%;
  border-radius: 3px;
}
.score-num {
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  min-width: 36px;
  text-align: right;
}
.top-prov {
  font-size: 10px;
  color: #9aacb8;
  margin-top: 3px;
}
.gt-badge {
  display: inline-block;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
  margin-left: 4px;
  vertical-align: 1px;
}
.gt-relevant {
  background: #e8f5e9;
  color: #2e7d5b;
}
.gt-distractor {
  background: #fff3e0;
  color: #e8a838;
}
.loading {
  color: #5a6a7a;
  font-size: 13px;
}
.error {
  color: #c0392b;
  font-size: 13px;
}
</style>
