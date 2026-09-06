<script setup lang="ts">
import { useHeaders } from "@vuepress/helper/client"
import { ClientOnly, RouteLink, useRoute } from "vuepress/client"
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { siteConfig } from "../../../site.config.js"

const headers = useHeaders({ selector: "#content > :where(h2, h3)", levels: [2, 3] })
const entries = computed(() => headers.value.flatMap(h => [h, ...h.children]))
const route = useRoute()
const open = ref(false)
const panel = ref<HTMLElement>()
const toggle = ref<HTMLButtonElement>()
const active = ref("")
let frame = 0
let settled: ReturnType<typeof setTimeout>
let pendingTarget = ""
let observer: ResizeObserver | undefined

function syncActive() {
  frame = 0
  if (pendingTarget) return
  const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ph-header-height")) + 48
  const sections = entries.value.map(h => document.getElementById(h.slug)).filter((e): e is HTMLElement => Boolean(e))
  const previous = sections.filter(e => e.getBoundingClientRect().top <= offset)
  const atBottom = window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
  active.value = (atBottom ? sections.at(-1)?.id : previous.at(-1)?.id) ?? sections[0]?.id ?? ""
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(syncActive)
}
function onScroll() {
  schedule()
  clearTimeout(settled)
  // A clicked destination stays selected throughout the router's smooth scroll.
  settled = setTimeout(() => { pendingTarget = ""; schedule() }, 160)
}
function interruptNavigation() { pendingTarget = ""; schedule() }
async function keepActiveVisible() {
  await nextTick()
  const item = panel.value?.querySelector<HTMLElement>('[aria-current="location"]')
  if (!item || !panel.value || !panel.value.clientHeight) return
  const bounds = panel.value.getBoundingClientRect()
  const rect = item.getBoundingClientRect()
  if (rect.top < bounds.top) panel.value.scrollTop += rect.top - bounds.top
  else if (rect.bottom > bounds.bottom) panel.value.scrollTop += rect.bottom - bounds.bottom
}
watch(active, keepActiveVisible)
watch(open, value => { if (value) void keepActiveVisible() })
watch(() => route.path, () => { open.value = false; pendingTarget = "" })
watch(entries, async () => {
  await nextTick()
  observer?.disconnect()
  const content = document.getElementById("content")
  if (content) observer?.observe(content)
  schedule()
})
function navigate(slug: string) {
  open.value = false
  pendingTarget = slug
  active.value = slug
  clearTimeout(settled)
  settled = setTimeout(() => { pendingTarget = ""; schedule() }, 1000)
  requestAnimationFrame(() => document.getElementById(slug)?.focus({ preventScroll: true }))
}
function close() { open.value = false; toggle.value?.focus() }
onMounted(() => {
  observer = new ResizeObserver(schedule)
  const content = document.getElementById("content")
  if (content) observer.observe(content)
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addEventListener("resize", schedule)
  window.addEventListener("wheel", interruptNavigation, { passive: true })
  window.addEventListener("touchstart", interruptNavigation, { passive: true })
  schedule()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  clearTimeout(settled)
  observer?.disconnect()
  window.removeEventListener("scroll", onScroll)
  window.removeEventListener("resize", schedule)
  window.removeEventListener("wheel", interruptNavigation)
  window.removeEventListener("touchstart", interruptNavigation)
})
</script>

<template>
  <ClientOnly>
    <aside v-if="entries.length >= 2" id="toc" class="ph-outline" :class="{ 'is-open': open }" :aria-label="siteConfig.outline.ariaLabel" @keydown.esc.stop.prevent="close">
      <div class="ph-outline-title">{{ siteConfig.outline.title }}</div>
      <button ref="toggle" class="ph-outline-toggle" type="button" :aria-expanded="open" aria-controls="article-outline" @click="open = !open">
        {{ siteConfig.outline.title }}
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 8 5 5 5-5" /></svg>
      </button>
      <nav id="article-outline" ref="panel" class="ph-outline-scroll" aria-label="文章章节">
        <ul>
          <li v-for="entry in entries" :key="entry.slug" class="vp-toc-item" :class="{ active: active === entry.slug, 'is-child': entry.level === 3 }">
            <RouteLink :to="`#${entry.slug}`" class="vp-toc-link" :aria-current="active === entry.slug ? 'location' : undefined" @click="navigate(entry.slug)">{{ entry.title }}</RouteLink>
          </li>
        </ul>
      </nav>
    </aside>
  </ClientOnly>
</template>
