import { provide as le, defineComponent as de, computed as _, ref as y, onMounted as ce, openBlock as s, createElementBlock as i, toDisplayString as u, createCommentVNode as b, createElementVNode as c, Fragment as C, renderList as F, unref as m, normalizeClass as I, createTextVNode as j, normalizeStyle as A } from "vue";
import { withProviderTypeDefaults as ue, resolveQueryBuilderConfig as X, resolveQueryBuilderConfigFromManifest as Y, methodsWithDependencies as ve, unmetDependencies as he, buildDependencyScaffold as fe, dependencyHint as O } from "legal-retrieval-types";
import { resolveQueryBuilderConfig as it, resolveQueryBuilderConfigFromManifest as lt, validateQueryBuilderManifest as dt } from "legal-retrieval-types";
function pe(o) {
  return {
    id: o.id,
    label: o.label,
    capabilities: o.capabilities,
    search: o.search,
    listMethods: o.listMethods ?? (() => Promise.resolve([]))
  };
}
function _e(o) {
  const a = ue(o.config);
  return {
    id: a.id,
    label: a.label,
    capabilities: a.capabilities,
    listMethods: async (e) => {
      var d;
      return ((d = a.capabilities) == null ? void 0 : d.supportsMethodListing) === !1 || !a.transport.methodsEndpoint ? [] : (a.transport.methodsMethod ?? "GET") === "GET" ? o.execute({
        endpoint: a.transport.methodsEndpoint,
        method: "GET",
        query: { case_id: e.case_id }
      }) : o.execute({
        endpoint: a.transport.methodsEndpoint,
        method: "POST",
        body: { case_id: e.case_id }
      });
    },
    search: async (e) => (a.transport.searchMethod ?? "POST") === "GET" ? o.execute({
      endpoint: a.transport.searchEndpoint,
      method: "GET",
      query: {
        query: e.query,
        method: e.method,
        case_id: e.case_id
      }
    }) : o.execute({
      endpoint: a.transport.searchEndpoint,
      method: "POST",
      body: {
        query: e.query,
        method: e.method,
        case_id: e.case_id
      }
    })
  };
}
function Z(o) {
  return X(o.config).providers.map((e) => _e({ config: e, execute: o.execute }));
}
function ot(o) {
  const a = Y(o.manifest);
  return Z({ config: a, execute: o.execute });
}
function me(o) {
  var d, P;
  const a = X(o.config), e = Z({ config: a, execute: o.execute }), l = a.providers.find((v) => v.id === a.defaultProvider);
  return {
    providerMode: a.providerMode,
    defaultProvider: a.defaultProvider,
    providers: e,
    showEvaluation: a.features.showEvaluation,
    emitProvenance: a.features.emitProvenance,
    defaultMethod: (d = l == null ? void 0 : l.defaults) == null ? void 0 : d.method,
    defaultThreshold: (P = l == null ? void 0 : l.defaults) == null ? void 0 : P.threshold
  };
}
function rt(o) {
  const a = Y(o.manifest);
  return me({ config: a, execute: o.execute });
}
const ee = 0.2, W = "bm25";
function $(o) {
  if (Number.isNaN(o)) return ee;
  const a = Math.min(1, Math.max(0, o));
  return Math.round(a * 100) / 100;
}
function be(o) {
  return $(o).toFixed(2);
}
function J(o) {
  return o > 0.5 ? "#2e7d5b" : o > 0.3 ? "#1b6b93" : "#e8a838";
}
function ge(o) {
  return Math.max(o * 100, 2);
}
function ye(o) {
  return o.toFixed(3);
}
function K(o, a) {
  return o < a;
}
function Pe(o, a) {
  const e = (a == null ? void 0 : a.relevant_doc_ids) ?? [], l = new Set(o);
  if (e.length === 0)
    return { precision: 0, recall: 0, f1: 0, count: l.size, hasGroundTruth: !1 };
  const d = new Set(e), P = [...l].filter((R) => d.has(R)).length, v = l.size > 0 ? P / l.size : 0, f = d.size > 0 ? P / d.size : 0, M = v + f > 0 ? 2 * v * f / (v + f) : 0;
  return { precision: v, recall: f, f1: M, count: l.size, hasGroundTruth: !0 };
}
function Me(o) {
  return `P=${o.precision.toFixed(2)} R=${o.recall.toFixed(2)} F1=${o.f1.toFixed(2)} (${o.count} selected)`;
}
const ke = Symbol("legal-provision-retriever-host");
function Te(o) {
  le(ke, o);
}
const we = { class: "provision-retriever" }, Ee = {
  key: 0,
  class: "title"
}, Se = { class: "controls" }, xe = {
  key: 0,
  class: "control-group"
}, Ce = ["value"], Fe = ["value"], Re = {
  key: 1,
  class: "control-group"
}, Be = ["data-method", "disabled", "title", "onClick"], De = {
  key: 2,
  class: "control-group"
}, qe = ["value"], Le = { class: "threshold-value" }, Ie = { class: "control-group" }, Oe = {
  key: 0,
  class: "eval-badge",
  "data-test": "eval-badge"
}, $e = {
  key: 1,
  class: "dependency-notice",
  "data-test": "dependency-notice"
}, ze = {
  key: 0,
  class: "dependency-blocked"
}, Ge = ["data-blocked-method"], Ne = {
  key: 1,
  class: "dependency-scaffold",
  "data-test": "dependency-scaffold"
}, He = {
  key: 2,
  class: "loading"
}, Qe = {
  key: 3,
  class: "error"
}, Ve = {
  key: 4,
  class: "doc-list"
}, Ue = ["data-doc-id"], je = { class: "doc-title" }, Ae = { class: "doc-meta" }, We = { class: "score-row" }, Je = { class: "score-bar-bg" }, Ke = { class: "top-prov" }, Xe = /* @__PURE__ */ de({
  __name: "ProvisionRetriever",
  props: {
    title: {},
    case: {},
    onSearch: {},
    onListMethods: {},
    onProbeDependencies: {},
    groundTruth: {},
    providerMode: {},
    providers: {},
    defaultProvider: {},
    showEvaluation: { type: Boolean, default: !1 },
    emitProvenance: { type: Boolean, default: !0 },
    emitErrorProvenance: { type: Boolean, default: !1 },
    defaultMethod: { default: W },
    defaultThreshold: { default: ee }
  },
  emits: ["results", "provenance"],
  setup(o, { emit: a }) {
    const e = o, l = a, d = [
      { id: "tfidf", label: "TF-IDF" },
      { id: "bm25", label: "BM25" },
      { id: "sbert", label: "SBERT" }
    ], P = pe({
      id: "case-law",
      label: "Case Law",
      search: (r) => {
        var n;
        return ((n = e.onSearch) == null ? void 0 : n.call(e, r)) ?? Promise.reject(new Error("onSearch is not set"));
      },
      listMethods: () => {
        var r;
        return ((r = e.onListMethods) == null ? void 0 : r.call(e)) ?? Promise.resolve(d);
      }
    }), v = _(
      () => {
        var r;
        return (r = e.providers) != null && r.length ? e.providers : [P];
      }
    ), f = y(e.defaultProvider ?? v.value[0].id), M = _(() => v.value.find((r) => r.id === f.value) ?? v.value[0]), R = _(() => e.providerMode === "multi" && v.value.length > 1), z = _(() => {
      var r;
      return (((r = e.providers) == null ? void 0 : r.length) ?? 0) > 0;
    }), te = _(() => h.value.length > 0), B = _(() => {
      var r;
      return ((r = M.value.capabilities) == null ? void 0 : r.supportsThreshold) !== !1;
    }), h = y(d), k = y(e.defaultMethod), T = y($(e.defaultThreshold)), w = y([]), D = y(!1), E = y(null);
    let S = 0;
    const x = y(!1), oe = _(() => ve(h.value).length > 0), G = _(() => h.value.filter((r) => he(r).length > 0)), re = _(() => fe(h.value));
    async function ae(r) {
      if (!e.onProbeDependencies) return r;
      try {
        return await e.onProbeDependencies(r);
      } catch {
        return r;
      }
    }
    Te({
      search: (r) => {
        var n;
        return ((n = e.onSearch) == null ? void 0 : n.call(e, r)) ?? Promise.reject(new Error("onSearch is not set"));
      },
      listMethods: () => {
        var r;
        return ((r = e.onListMethods) == null ? void 0 : r.call(e)) ?? Promise.resolve(d);
      }
    });
    const N = _(
      () => Pe(
        w.value.filter((r) => !B.value || !K(r.score, T.value)).map((r) => r.doc_id),
        e.groundTruth
      )
    );
    function H(r) {
      var n, t;
      return ((t = (n = e.groundTruth) == null ? void 0 : n.relevant_doc_ids) == null ? void 0 : t.includes(r)) ?? !1;
    }
    ce(async () => {
      v.value.some((r) => r.id === f.value) || (f.value = v.value[0].id), await Q(), await q("load");
    });
    async function Q() {
      var t, g, L, U;
      if (((t = M.value.capabilities) == null ? void 0 : t.supportsMethodListing) === !1) {
        h.value = [];
        return;
      }
      let r;
      try {
        const p = await M.value.listMethods({
          case_id: (g = e.case) == null ? void 0 : g.case_id
        });
        r = p.length > 0 ? p : z.value ? [] : d;
      } catch {
        r = z.value ? [] : d;
      }
      h.value = await ae(r);
      const n = (p) => p.available !== !1;
      !h.value.some((p) => p.id === k.value && n(p)) && h.value.length > 0 && (k.value = ((L = h.value.find((p) => p.id === W && n(p))) == null ? void 0 : L.id) ?? ((U = h.value.find(n)) == null ? void 0 : U.id) ?? h.value[0].id);
    }
    function V(r, n = {}) {
      var t;
      e.emitProvenance && l("provenance", {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        action: r,
        target_kind: "retrieval",
        target_id: ((t = e.case) == null ? void 0 : t.case_id) ?? null,
        method: k.value,
        threshold: T.value,
        provider_id: M.value.id,
        ...n
      });
    }
    async function q(r) {
      if (!e.case) {
        w.value = [];
        return;
      }
      const n = ++S;
      D.value = !0, E.value = null;
      try {
        const t = await M.value.search({
          query: e.case.fact_pattern,
          method: k.value,
          case_id: e.case.case_id
        });
        if (n !== S) return;
        w.value = t.documents ?? [], l("results", t), V(r);
      } catch (t) {
        if (n !== S) return;
        const g = t instanceof Error ? t.message : "Search failed";
        E.value = g, w.value = [], e.emitErrorProvenance && V("search_error", {
          reason: g
        });
      } finally {
        if (n !== S) return;
        D.value = !1;
      }
    }
    function ne(r) {
      if (r === k.value) return;
      const n = h.value.find((t) => t.id === r);
      (n == null ? void 0 : n.available) !== !1 && (k.value = r, q("change_method"));
    }
    function se(r) {
      T.value = $(Number(r.target.value) / 100);
    }
    async function ie(r) {
      const n = r.target.value;
      n !== f.value && (f.value = n, w.value = [], await Q(), await q("change_provider"));
    }
    return (r, n) => (s(), i("div", we, [
      e.title ? (s(), i("h2", Ee, u(e.title), 1)) : b("", !0),
      c("div", Se, [
        R.value ? (s(), i("div", xe, [
          n[1] || (n[1] = c("label", null, "Provider", -1)),
          c("select", {
            class: "provider-select",
            value: f.value,
            onChange: ie
          }, [
            (s(!0), i(C, null, F(v.value, (t) => (s(), i("option", {
              key: t.id,
              value: t.id
            }, u(t.label), 9, Fe))), 128))
          ], 40, Ce)
        ])) : b("", !0),
        te.value ? (s(), i("div", Re, [
          n[2] || (n[2] = c("label", null, "Method", -1)),
          (s(!0), i(C, null, F(h.value, (t) => {
            var g;
            return s(), i("button", {
              key: t.id,
              type: "button",
              class: I(["method-btn", { active: t.id === k.value, unavailable: t.available === !1 }]),
              "data-method": t.id,
              disabled: t.available === !1,
              title: t.available === !1 ? t.unavailableReason || `Requires: ${m(O)(t)}` : (g = t.dependencies) != null && g.length ? `Requires: ${m(O)(t)}` : void 0,
              onClick: (L) => ne(t.id)
            }, u(t.label), 11, Be);
          }), 128))
        ])) : b("", !0),
        B.value ? (s(), i("div", De, [
          n[3] || (n[3] = c("label", null, "Threshold", -1)),
          c("input", {
            class: "threshold-slider",
            type: "range",
            min: "0",
            max: "100",
            value: Math.round(T.value * 100),
            onInput: se
          }, null, 40, qe),
          c("span", Le, u(m(be)(T.value)), 1)
        ])) : b("", !0),
        c("div", Ie, [
          e.showEvaluation && N.value.hasGroundTruth ? (s(), i("span", Oe, u(m(Me)(N.value)), 1)) : b("", !0)
        ])
      ]),
      oe.value ? (s(), i("div", $e, [
        c("button", {
          type: "button",
          class: "dependency-toggle",
          onClick: n[0] || (n[0] = (t) => x.value = !x.value)
        }, u(x.value ? "▾" : "▸") + " Backend dependencies ", 1),
        G.value.length ? (s(), i("ul", ze, [
          (s(!0), i(C, null, F(G.value, (t) => (s(), i("li", {
            key: t.id,
            "data-blocked-method": t.id
          }, [
            c("strong", null, u(t.label), 1),
            j(" unavailable — " + u(t.unavailableReason || `requires ${m(O)(t)}`), 1)
          ], 8, Ge))), 128))
        ])) : b("", !0),
        x.value ? (s(), i("pre", Ne, u(re.value), 1)) : b("", !0)
      ])) : b("", !0),
      D.value ? (s(), i("div", He, "Searching…")) : E.value ? (s(), i("div", Qe, u(E.value), 1)) : (s(), i("ul", Ve, [
        (s(!0), i(C, null, F(w.value, (t) => (s(), i("li", {
          key: t.doc_id,
          class: I(["doc-card", { "below-threshold": B.value && m(K)(t.score, T.value) }]),
          "data-doc-id": t.doc_id
        }, [
          c("div", je, [
            j(u(t.title) + " ", 1),
            e.showEvaluation && e.groundTruth ? (s(), i("span", {
              key: 0,
              class: I(["gt-badge", H(t.doc_id) ? "gt-relevant" : "gt-distractor"])
            }, u(H(t.doc_id) ? "relevant" : "distractor"), 3)) : b("", !0)
          ]),
          c("div", Ae, u(t.doc_id) + " · " + u(t.provisions.length) + " prov", 1),
          c("div", We, [
            c("div", Je, [
              c("div", {
                class: "score-bar",
                style: A({ width: m(ge)(t.score) + "%", background: m(J)(t.score) })
              }, null, 4)
            ]),
            c("div", {
              class: "score-num",
              style: A({ color: m(J)(t.score) })
            }, u(m(ye)(t.score)), 5)
          ]),
          c("div", Ke, "Top: " + u(t.top_provision), 1)
        ], 10, Ue))), 128))
      ]))
    ]));
  }
}), Ye = (o, a) => {
  const e = o.__vccOpts || o;
  for (const [l, d] of a)
    e[l] = d;
  return e;
}, Ze = /* @__PURE__ */ Ye(Xe, [["__scopeId", "data-v-0561961a"]]), at = {
  install(o) {
    o.component("ProvisionRetriever", Ze);
  }
};
export {
  W as DEFAULT_METHOD,
  ee as DEFAULT_THRESHOLD,
  Ze as ProvisionRetriever,
  at as VueLegalProvisionRetrieverPlugin,
  pe as createHostProvider,
  Z as createProvidersFromConfig,
  ot as createProvidersFromManifest,
  me as createProvisionRetrieverOptionsFromConfig,
  rt as createProvisionRetrieverOptionsFromManifest,
  _e as createTransportProvider,
  at as default,
  Pe as evaluateSelection,
  Me as formatEvalBadge,
  ye as formatScore,
  be as formatThreshold,
  K as isBelowThreshold,
  $ as normaliseThreshold,
  it as resolveQueryBuilderConfig,
  lt as resolveQueryBuilderConfigFromManifest,
  J as scoreColor,
  ge as scoreWidth,
  dt as validateQueryBuilderManifest
};
