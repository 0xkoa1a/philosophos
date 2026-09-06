import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { viteBundler } from "@vuepress/bundler-vite"
import { createBuildApp, createPage } from "vuepress/core"
import { catalogPlugin } from "../../plugins/catalog.js"
import { notePagePatterns } from "../../lib/content.js"
import type { ReadingPageData } from "../../lib/catalog.js"

test("real VuePress routes and shared navigation discover added Markdown on restart",async context=>{
  const root=await mkdtemp(path.join(os.tmpdir(),"philosophos-routes-"))
  context.after(()=>rm(root,{recursive:true,force:true}))
  const source=path.join(root,"notes")
  await mkdir(path.join(source,"rawls"),{recursive:true})
  const write=(file:string,title:string,body="",extra="")=>writeFile(path.join(source,file),`---\ntitle: ${title}\n${extra}---\n# ${title}\n\n${body}`)
  await write("index.md","思想家索引")
  await write("rawls/index.md","约翰·罗尔斯","不展示的导读")
  await write("rawls/justice.md","正义","[人物](./index.md)\n\n## 章节甲\n内容\n\n## 章节乙\n内容")
  const initialize=async()=>{
    const app=createBuildApp({theme:{name:"route-test"},source,base:"/philosophos/",temp:path.join(root,"temp"),cache:path.join(root,"cache"),dest:path.join(root,"site"),bundler:viteBundler(),pagePatterns:[...notePagePatterns],plugins:[catalogPlugin(source)]})
    await app.init()
    return app
  }
  let app=await initialize()
  const get=(file:string)=>app.pages.find(page=>page.filePathRelative===file)!
  const data=(file:string)=>get(file).data.reading as ReadingPageData
  assert.equal(get("index.md").path,"/")
  assert.equal(get("rawls/index.md").path,"/rawls/")
  assert.equal(get("rawls/justice.md").path,"/rawls/justice.html")
  assert.equal(data("index.md").entries?.[0].path,get("rawls/index.md").path)
  assert.equal(data("rawls/index.md").entries?.[0].path,get("rawls/justice.md").path)
  assert.equal(data("rawls/justice.md").parent?.path,get("rawls/index.md").path)
  assert.equal(data("rawls/justice.md").hasOutline,true)
  assert.doesNotMatch(get("rawls/justice.md").sfcBlocks.template!.contentStripped,/<h1\b/)
  assert.match(get("rawls/justice.md").contentRendered,/to="\/rawls\/"/)
  await write("rawls/added.md","新增篇目","待整理。","order: -1\npermalink: /reading/new/\n")
  await mkdir(path.join(source,"kant"))
  await write("kant/index.md","康德","","order: -2\n")
  app=await initialize()
  assert.equal(data("index.md").entries?.length,2)
  assert.equal(data("index.md").entries?.[0].title,"康德")
  assert.equal(data("rawls/index.md").entries?.length,2)
  assert.equal(data("rawls/index.md").entries?.[0].path,"/reading/new/")
  assert.equal(data("rawls/added.md").parent?.title,"约翰·罗尔斯")
  assert.equal(data("rawls/added.md").hasOutline,false)
  const oldPage=get("rawls/added.md")
  await write("rawls/added.md","修订标题","待整理。","order: -3\n")
  const updated=await createPage(app,{filePath:oldPage.filePath!})
  app.pages.splice(app.pages.indexOf(oldPage),1,updated)
  await app.pluginApi.hooks.onPageUpdated.process(app,"update",updated,oldPage)
  assert.equal(data("rawls/index.md").entries?.[0].title,"修订标题")
  assert.equal(data("rawls/added.md").parent?.title,"约翰·罗尔斯")
})
