<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { RouteLink, useRouter } from "vuepress/client"
import { createSearchWorker, type SearchWorker } from "@vuepress/plugin-slimsearch/client"
import type { Word } from "@vuepress/plugin-slimsearch"
import { store } from "@temp/slimsearch/store.js"
import searchPages from "@temp/philosophos/search-pages.js"

interface Hit { path: string; title: string; parent?: string; words: Word[] }
const router = useRouter()
const dialog = ref<HTMLDialogElement>()
const input = ref<HTMLInputElement>()
const trigger = ref<HTMLButtonElement>()
const query = ref("")
const hits = ref<Hit[]>([])
const active = ref(0)
const searching = ref(false)
const error = ref("")
const isApple = ref(false)
const status = computed(() => error.value || (searching.value ? "正在搜索…" : !query.value.trim() ? "搜索人物、篇目或正文" : hits.value.length ? `找到 ${hits.value.length} 处匹配` : "没有找到匹配内容"))
let worker: SearchWorker | undefined
let previousFocus: HTMLElement | null = null
let previousOverflow = ""
let debounce: ReturnType<typeof setTimeout>
let timeout: ReturnType<typeof setTimeout>
let generation = 0

async function show() {
  if (dialog.value?.open) return
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger.value ?? null
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = "hidden"
  dialog.value?.showModal()
  await nextTick()
  input.value?.focus()
}
function close() {
  if (!dialog.value?.open) return
  generation++
  clearTimeout(debounce)
  clearTimeout(timeout)
  dialog.value.close()
  document.body.style.overflow = previousOverflow
  query.value = ""
  hits.value = []
  searching.value = false
  ;(previousFocus?.isConnected ? previousFocus : trigger.value)?.focus({preventScroll:true})
}
async function select(index: number) {
  const hit = hits.value[index]
  if (!hit) return
  close()
  await router.push(hit.path)
}
function move(step: number) {
  if (!hits.value.length) return
  active.value = (active.value + step + hits.value.length) % hits.value.length
  nextTick(() => document.getElementById(`ph-result-${active.value}`)?.scrollIntoView({block:"nearest"}))
}
function shortcut(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
    event.preventDefault()
    void show()
  }
}
function trapFocus(event: KeyboardEvent) {
  const controls = [input.value, dialog.value?.querySelector<HTMLButtonElement>(".ph-search-close")].filter((element): element is HTMLInputElement | HTMLButtonElement => Boolean(element))
  const index = controls.findIndex(element => element === document.activeElement)
  event.preventDefault()
  controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus()
}
function backdrop(event: MouseEvent) {
  if (event.target !== dialog.value) return
  const bounds = dialog.value.getBoundingClientRect()
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
}
watch(query, value => {
  const current = ++generation
  clearTimeout(debounce)
  clearTimeout(timeout)
  hits.value = []
  active.value = 0
  error.value = ""
  searching.value = Boolean(value.trim())
  if (!value.trim()) return
  debounce = setTimeout(async () => {
    try {
      worker ??= createSearchWorker()
      const terms = [...new Intl.Segmenter("zh-CN", {granularity:"word"}).segment(value)].map(item => item.segment).filter(term => term.trim()).join(" ")
      const results = await Promise.race([
        worker.search(terms, "/", {prefix:true, combineWith:"and"}),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error("search timeout")), 8000) }),
      ])
      if (current !== generation) return
      const unique = new Map<string, Hit>()
      for (const result of results) for (const match of result.contents) {
        const pagePath = store[match.id]
        const meta = searchPages[pagePath]
        if (!meta) continue
        const route = pagePath + ("anchor" in match && match.anchor ? `#${match.anchor}` : "")
        if (!unique.has(route)) unique.set(route, {path:route, title:meta.title, parent:meta.parent, words:match.type === "title" ? [] : match.display[0] ?? []})
      }
      hits.value = [...unique.values()].slice(0, 30)
    } catch {
      if (current === generation) error.value = "搜索暂时不可用，请重新输入或刷新页面。"
    } finally {
      if (current === generation) { searching.value = false; clearTimeout(timeout) }
    }
  }, 160)
})
onMounted(() => {
  isApple.value = /Mac|iPhone|iPad/u.test(navigator.platform)
  document.addEventListener("keydown", shortcut)
})
onBeforeUnmount(() => {
  close()
  clearTimeout(debounce)
  clearTimeout(timeout)
  worker?.terminate()
  document.removeEventListener("keydown", shortcut)
})
</script>

<template>
  <button ref="trigger" type="button" class="ph-search-trigger" aria-label="搜索" aria-haspopup="dialog" @click="show">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
    <span>搜索</span><kbd>{{ isApple ? '⌘' : 'Ctrl' }} K</kbd>
  </button>
  <dialog ref="dialog" class="ph-search-dialog" aria-label="站内搜索" @keydown.tab="trapFocus" @cancel.prevent="close" @keydown.esc.stop.prevent="close" @click="backdrop">
    <div class="ph-search-box">
      <label class="ph-sr-only" for="ph-search-input">搜索人物、篇目或正文</label>
      <input id="ph-search-input" ref="input" v-model="query" type="search" role="combobox" aria-autocomplete="list" :aria-expanded="Boolean(query.trim())" aria-controls="ph-search-results" :aria-activedescendant="hits.length ? `ph-result-${active}` : undefined" placeholder="搜索人物、篇目或正文" autocomplete="off" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="select(active)">
      <button type="button" class="ph-search-close" @click="close">关闭</button>
    </div>
    <p class="ph-search-status" role="status">{{ status }}</p>
    <ul id="ph-search-results" class="ph-search-results" role="listbox" aria-label="搜索结果">
      <li v-for="(hit,index) in hits" :id="`ph-result-${index}`" :key="hit.path" role="option" :aria-selected="active === index" :class="{active: active === index}">
        <RouteLink :to="hit.path" tabindex="-1" @click="close" @pointermove="active = index">
          <span v-if="hit.parent" class="ph-search-parent">{{ hit.parent }}</span>
          <span class="ph-search-title">{{ hit.title }}</span>
          <span class="ph-search-excerpt"><template v-for="(word,w) in hit.words" :key="w"><mark v-if="Array.isArray(word)">{{ word[1] }}</mark><template v-else>{{ word }}</template></template></span>
        </RouteLink>
      </li>
    </ul>
    <div class="ph-search-hints"><span><kbd>↑</kbd> <kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 打开</span><span><kbd>Esc</kbd> 关闭</span></div>
  </dialog>
</template>

<style lang="scss">
.ph-sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
.ph-search-trigger { display:flex; align-items:center; gap:7px; color:var(--ph-ink); border:0; background:transparent; padding:8px 0; min-height:44px; font:14px/1.5 var(--ph-sans); }
.ph-search-trigger svg { width:18px; height:18px; stroke:currentColor; stroke-width:1.4; fill:none; }
.ph-search-trigger kbd { margin-left:10px; color:var(--ph-muted); border:1px solid var(--ph-line); border-radius:3px; padding:1px 5px; background:transparent; font:11px/1.5 var(--ph-sans); }
.ph-search-dialog { position:fixed; inset:12vh 0 auto; width: min(700px, calc(100% - 40px)); max-height:76dvh; margin:0 auto; padding:0; border:1px solid var(--ph-line); border-radius:6px; background:var(--ph-paper); color:var(--ph-ink); font:15px/1.7 var(--ph-sans); box-shadow:0 18px 70px #0003; overflow:hidden; }
.ph-search-dialog[open] { display:flex; flex-direction:column; }
.ph-search-dialog::backdrop { background:#10180e80; }
.ph-search-box { display:flex; gap:16px; padding:20px 24px; border-bottom:1px solid var(--ph-line); align-items:center; }
.ph-search-box input { min-width:0; flex:1; font-size:17px; line-height:1.7; padding:8px 0; color:var(--ph-ink); background:transparent; border:0; border-radius:0; }
.ph-search-box input:focus-visible { outline-offset:5px; }
.ph-search-close { color:var(--ph-muted); background:transparent; border:0; padding:10px 4px; flex-shrink:0; font-size:14px; }
.ph-search-status { padding:12px 24px; margin:0; color:var(--ph-muted); font-size:13px; }
.ph-search-results { margin:0; padding:0 12px; list-style:none; overflow:auto; min-height:140px; overscroll-behavior:contain; }
.ph-search-results li { border-bottom:1px solid var(--ph-line); }
.ph-search-results a { display:block; padding:16px 12px; color:var(--ph-ink); text-decoration:none; }
.ph-search-results .active { background:var(--ph-selection); border-radius:var(--ph-radius); }
.ph-search-parent { display:block; color:var(--ph-accent); font-size:12px; margin-bottom:4px; }
.ph-search-title { display:block; font:21px/1.6 var(--ph-serif); }
.ph-search-excerpt { display:block; margin-top:5px; font-size:13px; font-weight:400; color:var(--ph-muted); overflow-wrap:anywhere; }
.ph-search-excerpt mark { color:var(--ph-ink); background:transparent; font-weight:600; text-decoration:underline; text-underline-offset:3px; }
.ph-search-hints { display:flex; flex-wrap:wrap; gap:20px; padding:12px 24px; border-top:1px solid var(--ph-line); color:var(--ph-muted); font-size:12px; }
.ph-search-hints kbd { font-family:var(--ph-sans); background:transparent; font-size:inherit; }
@media (max-width:600px) {
  .ph-search-trigger { font-size:13px; }
  .ph-search-trigger kbd { display:none; }
  .ph-search-dialog { inset:16px 0 auto; width:calc(100% - 24px); max-height:calc(100dvh - 32px); }
  .ph-search-box { padding:12px 18px; }
  .ph-search-box input { font-size:16px; }
}
</style>
