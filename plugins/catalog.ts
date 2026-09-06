import { preparePageChunk, type App, type Plugin } from "vuepress/core"
import { buildCatalog, type CatalogEntry, type ReadingPageData } from "../lib/catalog.js"
import { readNoteFile } from "../lib/content.js"

function assignCatalog(app: App, sourceDir: string) {
  const pages = app.pages.filter(page => page.filePathRelative)
  const entries = pages.map((page): CatalogEntry => {
    const note = readNoteFile(sourceDir, page.filePathRelative!)
    return { title: note.title!, source: note.relativePath, path: page.path,
      ...(typeof note.data.order === "number" ? {order: note.data.order} : {}),
      ...(typeof note.data.summary === "string" && note.data.summary.trim() ? {summary: note.data.summary.trim()} : {}),
    }
  })
  const catalog = buildCatalog(entries)
  for (const page of pages) {
    const source = page.filePathRelative!
    const data = page.data.reading as ReadingPageData
    if (source === catalog.home.source) {
      Object.assign(data, {kind: "home", entries: catalog.thinkers.map(({notes: _notes, ...entry}) => entry)})
    } else {
      const thinker = catalog.thinkers.find(item => item.source.split("/")[0] === source.split("/")[0])!
      const {notes, ...parent} = thinker
      Object.assign(data, source === thinker.source
        ? {kind: "thinker", parent: catalog.home, entries: notes}
        : {kind: "article", parent})
    }
  }
}
async function writeSearchPages(app: App) {
  const entries = Object.fromEntries(app.pages.filter(page => page.filePathRelative).map(page => {
    const data = page.data.reading as ReadingPageData
    return [page.path, {title: page.title, ...(data?.kind === "article" && data.parent ? {parent:data.parent.title} : {})}]
  }))
  await app.writeTemp("philosophos/search-pages.js", `export default ${JSON.stringify(entries)}`)
}

export const catalogPlugin = (sourceDir: string, portable = false): Plugin => ({
  name: "philosophos-content-catalog",
  extendsPage(page) {
    if (!page.filePathRelative) return
    const note = readNoteFile(sourceDir, page.filePathRelative)
    const heading = page.contentRendered.match(/<h1\b[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/h1>/u)
    page.data.reading = {
      hasOutline: (page.contentRendered.match(/<h[23]\b/gu) ?? []).length >= 2,
      kind: "article", summary: typeof note.data.summary === "string" ? note.data.summary : undefined,
      headingAnchor: heading?.[1] ?? "article-title",
    } satisfies ReadingPageData
    // Keep the Markdown H1 in source, but render it once in the layout title area.
    if (heading) {
      page.contentRendered = page.contentRendered.replace(heading[0], "")
      if (page.sfcBlocks.template) {
        page.sfcBlocks.template.contentStripped = page.sfcBlocks.template.contentStripped.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/u, "")
      }
    }
  },
  onInitialized(app) { if (!portable) assignCatalog(app, sourceDir) },
  onPrepared: writeSearchPages,
  async onPageUpdated(app, ..._changes) {
    if (portable) return
    assignCatalog(app, sourceDir)
    await Promise.all(app.pages.filter(page => page.filePathRelative).map(page => preparePageChunk(app, page)))
    await writeSearchPages(app)
  },
})
