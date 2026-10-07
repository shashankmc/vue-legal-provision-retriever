<template>
  <main class="page">
    <header class="hero">
      <h1>Provision Retriever Demo</h1>
      <p>Use this playground to test single-provider and multi-provider behavior.</p>
      <label class="mode-toggle">
        Provider mode
        <select v-model="providerMode">
          <option value="single">single</option>
          <option value="multi">multi</option>
        </select>
      </label>
    </header>

    <section class="panel">
      <ProvisionRetriever
        title="Retrieval Panel"
        :case="mockCase"
        :providers="providers"
        :provider-mode="providerMode"
        default-provider="case-law"
        :show-evaluation="true"
        :ground-truth="{ relevant_doc_ids: ['bbnj', 'eu511'] }"
        @results="onResults"
        @provenance="onProvenance"
      />
    </section>

    <section class="logs">
      <article class="log-card">
        <h2>Latest Results</h2>
        <pre>{{ lastResults }}</pre>
      </article>
      <article class="log-card">
        <h2>Provenance Events</h2>
        <pre>{{ provenanceLog }}</pre>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProvenanceEventV1, RankedProvisionsV1 } from 'legal-provision-types'
import { ProvisionRetriever, createHostProvider, type ProviderMode } from '../src'

const providerMode = ref<ProviderMode>('multi')

const mockCase = {
  case_id: 'halden',
  title: 'Halden Scenario',
  fact_pattern: 'A Norwegian SME isolates an esterase from deep-sea samples.',
  facts: {},
  origin: 'scenario' as const,
}

const providers = [
  createHostProvider({
    id: 'case-law',
    label: 'Case Law',
    capabilities: { supportsMethodListing: false, supportsThreshold: false },
    listMethods: async () => [],
    search: async ({ method, query, case_id }) => ({
      case_id: case_id ?? 'unknown',
      query,
      method,
      threshold: 0.2,
      corpus_version: 'demo-1',
      documents: [
        {
          doc_id: 'bbnj',
          title: 'BBNJ Agreement',
          score: method === 'bm25' ? 0.62 : 0.49,
          top_provision: 'bbnj_art11_1',
          provisions: [
            {
              prov_id: 'bbnj_art11_1',
              citation: 'BBNJ Art. 11(1)',
              article: 'Art. 11',
              score: 0.62,
              text_preview: 'Marine genetic resources access obligations...',
            },
          ],
        },
      ],
    }),
  }),
  createHostProvider({
    id: 'provisions',
    label: 'Provisions',
    listMethods: async () => [
      { id: 'sbert', label: 'SBERT' },
      { id: 'hybrid', label: 'Hybrid' },
    ],
    search: async ({ method, query, case_id }) => ({
      case_id: case_id ?? 'unknown',
      query,
      method,
      threshold: 0.2,
      corpus_version: 'demo-2',
      documents: [
        {
          doc_id: 'eu511',
          title: 'Directive 98/44/EC',
          score: method === 'sbert' ? 0.71 : 0.58,
          top_provision: 'eu511_art3',
          provisions: [
            {
              prov_id: 'eu511_art3',
              citation: 'Directive 98/44/EC Art. 3',
              article: 'Art. 3',
              score: 0.71,
              text_preview: 'Biotechnological inventions which are novel...',
            },
          ],
        },
        {
          doc_id: 'trips',
          title: 'TRIPS Agreement',
          score: 0.33,
          top_provision: 'trips_art27',
          provisions: [
            {
              prov_id: 'trips_art27',
              citation: 'TRIPS Art. 27',
              article: 'Art. 27',
              score: 0.33,
              text_preview: 'Patentable subject matter and exclusions...',
            },
          ],
        },
      ],
    }),
  }),
]

const results = ref<RankedProvisionsV1 | null>(null)
const provenanceEvents = ref<ProvenanceEventV1[]>([])

function onResults(payload: RankedProvisionsV1) {
  results.value = payload
}

function onProvenance(event: ProvenanceEventV1) {
  provenanceEvents.value = [event, ...provenanceEvents.value].slice(0, 20)
}

const lastResults = computed(() => JSON.stringify(results.value, null, 2))
const provenanceLog = computed(() => JSON.stringify(provenanceEvents.value, null, 2))
</script>

<style scoped>
.page {
  min-height: 100vh;
  margin: 0;
  padding: 32px;
  font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
  background: linear-gradient(180deg, #f6fafc 0%, #eef4f8 100%);
  color: #1f3447;
}
.hero {
  margin-bottom: 20px;
}
.hero h1 {
  margin: 0 0 8px;
  font-size: 28px;
}
.hero p {
  margin: 0 0 12px;
  color: #3d5b75;
}
.mode-toggle {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
}
.mode-toggle select {
  border: 1px solid #bdd3e3;
  border-radius: 8px;
  padding: 6px 10px;
  background: #fff;
}
.panel {
  border: 1px solid #d2e0eb;
  border-radius: 12px;
  background: #fff;
  padding: 18px;
  margin-bottom: 16px;
}
.logs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
.log-card {
  border: 1px solid #d2e0eb;
  border-radius: 12px;
  background: #fff;
  padding: 14px;
}
.log-card h2 {
  margin: 0 0 10px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #3d5b75;
}
.log-card pre {
  margin: 0;
  max-height: 260px;
  overflow: auto;
  background: #f6fafc;
  border-radius: 8px;
  padding: 10px;
  font-size: 12px;
}
</style>
