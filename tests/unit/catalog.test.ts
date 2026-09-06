import assert from "node:assert/strict"
import { mkdtemp, writeFile, rm } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import test from "node:test"
import { buildCatalog, type CatalogEntry } from "../../lib/catalog.js"
import { readNoteFile } from "../../lib/content.js"
const entry = (source: string, title: string, order?: number): CatalogEntry => ({source,title,order,path:`resolved:${source}`})
const home=entry("index.md", "思想家索引")

test("thinker entry metadata drives names/order; index is not an article", () => {
  const catalog=buildCatalog([home,entry("kant/index.md","康德",2),entry("rawls/index.md","罗尔斯",1),entry("rawls/a.md","文章",3)])
  assert.deepEqual(catalog.thinkers.map(t=>t.title),["罗尔斯","康德"])
  assert.deepEqual(catalog.thinkers[0].notes.map(n=>n.source),["rawls/a.md"])
  assert.equal(catalog.thinkers[0].path,"resolved:rawls/index.md")
  assert.deepEqual(catalog.thinkers[1].notes,[])
})
test("order omitted sorts last; ties use Chinese title then stable source path", () => {
  const catalog=buildCatalog([home,entry("a/index.md","人物"),entry("a/z.md","同名"),entry("a/a.md","同名"),entry("a/b.md","乙",2),entry("a/c.md","甲",2),entry("a/d.md","先读",-1)])
  const notes=catalog.thinkers[0].notes
  assert.equal(notes[0].title,"先读")
  assert.deepEqual(notes.slice(1,3).map(n=>n.title),["甲","乙"].sort((a,b)=>a.localeCompare(b,"zh-CN")))
  assert.deepEqual(notes.slice(3).map(n=>n.source),["a/a.md","a/z.md"])
})
test("same article names are distinct by thinker and page route", () => {
  const catalog=buildCatalog([home,entry("a/index.md","甲"),entry("b/index.md","乙"),entry("a/n.md","同名"),entry("b/n.md","同名")])
  assert.notEqual(catalog.thinkers[0].notes[0].path,catalog.thinkers[1].notes[0].path)
})
test("missing thinker entry and extra content levels give file-local errors", () => {
  assert.throws(()=>buildCatalog([home,entry("missing/n.md","文章")]),/missing\/n.md: path: missing missing\/index.md/)
  assert.throws(()=>buildCatalog([home,entry("a/index.md","人物"),entry("a/book/n.md","文章")]),/a\/book\/n.md: path:/)
  assert.throws(()=>buildCatalog([entry("root.md","文章")]),/index.md: missing/)
})
test("metadata diagnostics identify source and field; group is rejected after scope simplification", async context => {
  const dir=await mkdtemp(path.join(os.tmpdir(),"philosophos-meta-"))
  context.after(()=>rm(dir,{recursive:true,force:true}))
  for(const [yaml,field] of [["title: ''","title"],["title: X\norder: later","order"],["title: X\norder: .inf","order"],["title: X\nsummary: [x]","summary"],["title: X\ngroup: Work","group"]]) {
    await writeFile(path.join(dir,"note.md"),`---\n${yaml}\n---\n# X\n`)
    assert.throws(()=>readNoteFile(dir,"note.md"),new RegExp(`note.md: ${field}:`))
  }
  await writeFile(path.join(dir,"note.md"),"---\ntitle: X\n---\n# X\n")
  const valid=readNoteFile(dir,"note.md")
  assert.equal(valid.title,"X")
  assert.equal(valid.data.summary,undefined)
  assert.equal(valid.data.group,undefined)
})
