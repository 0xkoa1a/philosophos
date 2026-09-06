import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { viteBundler } from "@vuepress/bundler-vite"
import { markdownChartPlugin } from "@vuepress/plugin-markdown-chart"
import { markdownExtPlugin } from "@vuepress/plugin-markdown-ext"
import { defaultTheme } from "@vuepress/theme-default"
import { defineUserConfig } from "vuepress"

import { notePagePatterns } from "./lib/content.js"
import { katexOnlyPlugin } from "./plugins/katex.js"
import { catalogPlugin } from "./plugins/catalog.js"
import { searchPlugin } from "./plugins/search.js"
import { portableFileRouterPlugin } from "./plugins/portableExport.js"
import { siteConfig } from "./site.config.js"

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.resolve(
  rootDir,
  process.env.VUEPRESS_SOURCE_DIR ?? "notes",
)
const isPortableExport = process.env.VUEPRESS_PORTABLE_EXPORT === "1"
const portablePage = process.env.VUEPRESS_EXPORT_PAGE
const portableClientConfig = path.join(
  rootDir,
  "notes/.vuepress/portable-client.ts",
)

if (isPortableExport && !portablePage) {
  throw new Error("VUEPRESS_EXPORT_PAGE is required for portable export")
}

const portableSource = isPortableExport
  ? await readFile(path.join(sourceDir, portablePage as string), "utf8")
  : ""
const usesECharts =
  !isPortableExport ||
  /(?:^|\n)[ \t]{0,3}(?:\x60{3}echarts\b|:::\s*echarts\b)|<ECharts\b/u.test(
    portableSource,
  )
const usesMermaid =
  !isPortableExport ||
  /(?:^|\n)[ \t]{0,3}\x60{3}(?:mermaid|architecture|block|c4c|class|er|gantt|git-graph|ishikawa|journey|kanban|mindmap|packet|pie|quadrant|radar|requirement|sankey|sequence|state|timeline|treeview|treemap|venn|wardley|xy)\b|<Mermaid\b/u.test(
    portableSource,
  )

const [repositoryOwner = "", repositoryName = ""] =
  process.env.GITHUB_REPOSITORY?.split("/") ?? []
const isUserSite =
  repositoryName.toLowerCase() === `${repositoryOwner.toLowerCase()}.github.io`
const base = (process.env.PHILOSOPHOS_BASE ?? (
  process.env.GITHUB_ACTIONS === "true" && repositoryName && !isUserSite
    ? `/${repositoryName}/`
    : "/"
)) as `/${string}/`
if (!base.startsWith("/") || !base.endsWith("/") || base.includes("..")) {
  throw new Error("PHILOSOPHOS_BASE: expected an absolute base with a trailing slash")
}

export default defineUserConfig({
  base: isPortableExport ? "/" : base,
  lang: siteConfig.lang,
  title: siteConfig.title,
  description: siteConfig.description,
  head: [
    [
      "link",
      {
        rel: "icon",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='12' y='6' width='40' height='52' rx='6' fill='%233b82f6'/%3E%3Cpath d='M22 22h20M22 32h20M22 42h14' stroke='white' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E",
      },
    ],
  ],
  dest: isPortableExport
    ? process.env.VUEPRESS_EXPORT_DEST
    : process.env.PHILOSOPHOS_DEST ?? path.join(rootDir, "_site"),
  temp: isPortableExport ? process.env.VUEPRESS_EXPORT_TEMP : process.env.PHILOSOPHOS_TEMP,
  cache: isPortableExport ? process.env.VUEPRESS_EXPORT_CACHE : process.env.PHILOSOPHOS_CACHE,
  userStyle: path.join(rootDir, "notes/.vuepress/styles/index.scss"),
  pagePatterns: isPortableExport
    ? [portablePage as string]
    : [...notePagePatterns],
  shouldPreload: isPortableExport ? false : undefined,
  shouldPrefetch: isPortableExport ? false : undefined,
  templateBuild: isPortableExport
    ? path.join(rootDir, "notes/.vuepress/templates/portable-build.html")
    : undefined,
  alias: {
    "@theme/VPNavbar.vue": path.join(rootDir, "notes/.vuepress/components/SiteHeader.vue"),
    "@theme/VPPage.vue": path.join(
      rootDir,
      "notes/.vuepress/components/VPPage.vue",
    ),
  },
  bundler: viteBundler(
    isPortableExport
      ? {
          viteOptions: {
            plugins: [portableFileRouterPlugin()],
            build: {
              assetsInlineLimit: () => true,
              cssCodeSplit: false,
              modulePreload: false,
              rolldownOptions: {
                output: { codeSplitting: false },
              },
            },
          },
        }
      : undefined,
  ),
  theme: defaultTheme({
    colorMode: isPortableExport ? "light" : siteConfig.colorMode,
    colorModeSwitch: !isPortableExport,
    navbar: isPortableExport ? false : siteConfig.navbar,
    sidebar: false,
    sidebarDepth: 0,
    contributors: false,
    lastUpdated: !isPortableExport,
    lastUpdatedText: isPortableExport ? undefined : "最近更新",
    editLink: false,
    toggleColorMode: "切换明暗模式",
    themePlugins: {
      activeHeaderLinks: false,
      backToTop: false,
      git: !isPortableExport,
      linksCheck: !isPortableExport,
      mediumZoom: true,
      nprogress: !isPortableExport,
    },
  }),
  plugins: [
    catalogPlugin(sourceDir, isPortableExport),
    ...(sourceDir !== path.join(rootDir, "notes")
      ? [{ name: "philosophos-shared-client", clientConfigFile: path.join(rootDir, "notes/.vuepress/client.ts") }]
      : []),
    ...(isPortableExport
      ? [
          {
            name: "portable-layout",
            clientConfigFile: portableClientConfig,
          },
        ]
      : []),
    katexOnlyPlugin(),
    markdownExtPlugin({ tasklist: true }),
    markdownChartPlugin({
      echarts: usesECharts,
      mermaid: usesMermaid,
    }),
    ...(isPortableExport
      ? []
      : [searchPlugin(rootDir)]),
  ],
})
