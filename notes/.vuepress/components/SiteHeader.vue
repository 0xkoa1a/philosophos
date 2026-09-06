<script setup lang="ts">
import { resolveComponent } from "vue"
import { RouteLink } from "vuepress/client"
import VPToggleColorModeButton from "@vuepress/theme-default/components/VPToggleColorModeButton.vue"
import { siteConfig } from "../../../site.config.js"
const SearchBox = resolveComponent("SearchBox")
</script>

<template>
  <header class="vp-navbar ph-header">
    <a class="ph-skip" href="#main">跳到正文</a>
    <RouteLink to="/" class="ph-wordmark" :aria-label="`${siteConfig.title} 首页`">{{ siteConfig.title }}</RouteLink>
    <nav class="ph-header-actions" aria-label="全站导航">
      <RouteLink v-for="link in siteConfig.navbar" :key="link.link" :to="link.link" class="ph-index-link">{{ link.text }}</RouteLink>
      <component :is="SearchBox" />
      <VPToggleColorModeButton />
    </nav>
  </header>
</template>
