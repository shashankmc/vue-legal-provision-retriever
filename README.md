# vue-legal-provision-retriever

Provision retriever: a method picker, a threshold slider, ranked
documents with score bars and an optional evaluation badge. Takes **`case@1`**
in, gives **`ranked-provisions@1`** out.

This package never calls an API. It builds a search and hands the results back
to you: the host makes the requests, so no credential reaches the browser.

```bash
npm install vue-legal-provision-retriever vue
```

```vue
<template>
  <ProvisionRetriever
    :case="case"
    :on-search="search"
    :on-list-methods="listMethods"
    :default-method="'bm25'"
    :default-threshold="0.2"
    @results="onResults"
    @provenance="onProvenance"
  />
</template>

<script setup lang="ts">
import { ProvisionRetriever } from 'vue-legal-provision-retriever'
import 'vue-legal-provision-retriever/style.css'

const listMethods = () => fetch('/api/methods').then((r) => r.json())
const search = (args: { query: string; method: string; case_id?: string }) =>
  fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  }).then((r) => r.json())
const onResults = (data: unknown) => console.log(data)
const onProvenance = (event: unknown) => console.log(event)
</script>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `case` | `CaseV1 \| null` | — | The case to search for. |
| `onSearch` | `(args) => Promise<RankedProvisionsV1>` | — | Runs the search. |
| `onListMethods` | `() => Promise<MethodOption[]>` | built-ins | Lists the methods the server offers. |
| `groundTruth` | `{ relevant_doc_ids: string[] } \| null` | — | For the evaluation badge. |
| `showEvaluation` | `boolean` | `false` | Whether research mode is on. |
| `defaultMethod` | `string` | `'bm25'` | Method selected on mount. |
| `defaultThreshold` | `number` | `0.2` | Threshold on mount. |
| `title` | `string` | — | Optional heading. |

## Events

| Event | Payload | Description |
|---|---|---|
| `@results` | `RankedProvisionsV1` | Emitted with every search result. |
| `@provenance` | `ProvenanceEventV1` | Emitted on load and on `change_method`. |

## Types

| Type | Shape |
|---|---|
| `CaseV1` (`case@1`) | from `legal-provision-types` |
| `RankedProvisionsV1` (`ranked-provisions@1`) | from `legal-provision-types` |
| `MethodOption` | `{ id, label }` |
| `GroundTruth` | `{ relevant_doc_ids: string[] }` |

Pure helpers are exported too: `normaliseThreshold`, `formatThreshold`,
`scoreColor`, `scoreWidth`, `formatScore`, `isBelowThreshold`,
`evaluateSelection`, `formatEvalBadge`.

## Development

```bash
npm install
npm test        # vitest component + helper tests
npm run build   # library build to dist/
```
