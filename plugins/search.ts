import path from "node:path"
import { slimsearchPlugin } from "@vuepress/plugin-slimsearch"
import type { Plugin } from "vuepress/core"

/** Keep the template's index/worker, replace only its client dialog. */
export const searchPlugin = (rootDir: string): Plugin => app => ({
  ...slimsearchPlugin({
    indexContent: true,
    customFields: [{getter: page => typeof page.frontmatter.summary === "string" ? page.frontmatter.summary : undefined}],
    suggestion: false,
    queryHistoryCount: 0,
    resultHistoryCount: 0,
    filter(page) {
      if (!page.filePathRelative || !page.data.reading) return false
      const rendered = page.contentRendered
      page.contentRendered = /(?:^|\/)index\.md$/u.test(page.filePathRelative) ? "" : rendered.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/giu, "")
      queueMicrotask(() => { page.contentRendered = rendered })
      return true
    },
    locales: {"/": {placeholder: "搜索人物、篇目或正文"}},
  })(app),
  clientConfigFile: path.join(rootDir, "notes/.vuepress/search-client.ts"),
})
