<script setup lang="ts">
import { computed } from "vue"
import { Content, RouteLink, usePageData } from "vuepress/client"
import type { ReadingPageData } from "../../../lib/catalog.js"
import { siteConfig } from "../../../site.config.js"
import ArticleToc from "./ArticleToc.vue"
const page = usePageData<{reading?: ReadingPageData}>()
const data = computed(() => page.value.reading)
const isPortableExport = import.meta.env.VITE_PORTABLE_EXPORT === "1"
const isHome = computed(() => data.value?.kind === "home")
</script>

<template>
  <main id="main" class="vp-page ph-page" tabindex="-1">
    <div class="ph-reading-layout" :class="{ 'has-outline': data?.hasOutline && data.kind === 'article' }">
      <article class="ph-article">
        <RouteLink v-if="data?.parent && !isPortableExport" :to="data.parent.path" class="ph-back">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H4m5-5-5 5 5 5" /></svg>
          {{ data.kind === 'thinker' ? '思想家索引' : data.parent.title }}
        </RouteLink>
        <header class="ph-heading">
          <h1 :id="data?.headingAnchor" class="ph-title" :class="{ 'ph-home-name': isHome }" tabindex="-1">{{ isHome ? siteConfig.title : page.title }}</h1>
          <p v-if="data?.summary" class="ph-summary">{{ data.summary }}</p>
          <p v-if="isHome && siteConfig.description" class="ph-summary">{{ siteConfig.description }}</p>
        </header>
        <div v-if="data?.kind !== 'thinker'" vp-content><Content id="content" /></div>
        <nav v-if="data?.entries" class="ph-entry-list" :aria-label="isHome ? '思想家' : '篇目目录'">
          <h2 v-if="!isHome" class="ph-list-title">篇目</h2>
          <ol>
            <li v-for="entry in data.entries" :key="entry.path">
              <RouteLink :to="entry.path"><span>{{ entry.title }}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" /></svg></RouteLink>
              <p v-if="entry.summary">{{ entry.summary }}</p>
            </li>
          </ol>
        </nav>
        <footer v-if="data?.parent && !isPortableExport && data.kind === 'article'" class="ph-reading-footer">
          <RouteLink :to="data.parent.path" class="ph-back"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H4m5-5-5 5 5 5" /></svg>返回{{ data.parent.title }}</RouteLink>
        </footer>
      </article>
      <ArticleToc v-if="!data || data.kind === 'article'" />
    </div>
  </main>
</template>
