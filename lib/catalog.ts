/** Serializable content/navigation contract. No filesystem or UI dependencies. */
export interface CatalogEntry {
  title: string
  path: string
  source: string
  order?: number
  summary?: string
}
export interface Thinker extends CatalogEntry { notes: CatalogEntry[] }
export interface Catalog { home: CatalogEntry; thinkers: Thinker[] }
export interface ReadingPageData {
  kind: "home" | "thinker" | "article"
  hasOutline: boolean
  headingAnchor: string
  summary?: string
  parent?: CatalogEntry
  entries?: CatalogEntry[]
}

export function compareEntries(a: CatalogEntry, b: CatalogEntry): number {
  if (a.order === undefined && b.order !== undefined) return 1
  if (b.order === undefined && a.order !== undefined) return -1
  return (a.order ?? 0) - (b.order ?? 0) ||
    a.title.localeCompare(b.title, "zh-CN") || a.source.localeCompare(b.source, "en")
}

export function buildCatalog(entries: CatalogEntry[]): Catalog {
  const home = entries.find(entry => entry.source === "index.md")
  if (!home) throw new Error("index.md: missing required home entry")
  const thinkers = entries.filter(entry => /^[^/]+\/index\.md$/u.test(entry.source))
    .map(entry => ({ ...entry, notes: [] as CatalogEntry[] })).sort(compareEntries)
  const byDirectory = new Map(thinkers.map(thinker => [thinker.source.split("/")[0], thinker]))
  for (const entry of entries) {
    if (entry === home || /^[^/]+\/index\.md$/u.test(entry.source)) continue
    if (!/^[^/]+\/[^/]+\.md$/u.test(entry.source)) {
      throw new Error(`${entry.source}: path: notes must be directly inside a thinker directory`)
    }
    const thinker = byDirectory.get(entry.source.split("/")[0])
    if (!thinker) throw new Error(`${entry.source}: path: missing ${entry.source.split("/")[0]}/index.md thinker entry`)
    thinker.notes.push(entry)
  }
  thinkers.forEach(thinker => thinker.notes.sort(compareEntries))
  return {home, thinkers}
}
