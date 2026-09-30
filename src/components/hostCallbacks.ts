// Same rule as the other BlueLab packages: this builds a request and never
// sends one. The host supplies onSearch / onListMethods and holds the
// credential.

import { inject, provide, type InjectionKey } from 'vue'
import type { RankedProvisionsV1 } from 'legal-provision-types'
import type { MethodOption } from './types'

export interface HostCallbacks {
  search?: (args: { query: string; method: string; case_id?: string }) => Promise<RankedProvisionsV1>
  listMethods?: () => Promise<MethodOption[]>
}

const key: InjectionKey<HostCallbacks> = Symbol('legal-provision-retriever-host')

export function provideHostCallbacks(callbacks: HostCallbacks): void {
  provide(key, callbacks)
}

export function useHostCallbacks(): HostCallbacks {
  return inject(key, {})
}
