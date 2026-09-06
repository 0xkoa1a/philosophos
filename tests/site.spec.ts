import { expect, test, type Page } from "@playwright/test"

const readingTitle = "阅读试排：概念、论证与问题，以及跨越多行的中文长标题"
const scenarios = [
  {url:"http://127.0.0.1:4180",base:"/",fixture:false},
  {url:"http://127.0.0.1:4181",base:"/philosophos/",fixture:false},
  {url:"http://127.0.0.1:4182",base:"/",fixture:true},
  {url:"http://127.0.0.1:4183",base:"/philosophos/",fixture:true},
  {url:"http://127.0.0.1:4180",base:"/",fixture:false,width:390},
  {url:"http://127.0.0.1:4183",base:"/philosophos/",fixture:true,width:390},
]
async function search(page: Page, query: string) {
  await page.getByRole("button", {name:"搜索",exact:true}).click()
  const input=page.getByRole("combobox")
  await expect(input).toBeFocused()
  await input.fill(query)
  await expect(page.getByRole("status")).not.toHaveText("正在搜索…")
  return input
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}
for(const scenario of scenarios) {
  test(`${scenario.base} ${scenario.fixture ? "fixtures" : "production"} ${scenario.width ?? 1280}px: static routes, navigation, search and focus`, async({page,request})=>{
    await page.setViewportSize({width:scenario.width ?? 1280,height:900})
    const origin=scenario.url+scenario.base
    const errors:string[]=[]
    page.on("pageerror",error=>errors.push(error.message))
    page.on("console",message=>{if(message.type()==="error") errors.push(message.text())})
    const article=scenario.fixture ? "reading.html" : "justice-as-fairness.html"
    const title=scenario.fixture ? readingTitle : "正义即公平"
    await page.goto(origin)
    await expect(page.locator("h1")).toHaveText("Philosophos")
    await expect(page.locator(".ph-header").getByRole("link",{name:"思想家索引",exact:true})).toHaveCount(0)
    await expect(page.getByRole("navigation",{name:"思想家",exact:true}).getByRole("link")).toHaveCount(scenario.fixture?2:1)
    await page.getByRole("link",{name:"约翰·罗尔斯",exact:true}).click()
    await expect(page).toHaveURL(origin+"rawls/")
    await expect(page.locator("h1")).toHaveText("约翰·罗尔斯")
    await expect(page.locator("#content")).toHaveCount(0)
    await expect(page.getByRole("navigation",{name:"篇目目录"}).getByRole("link")).toHaveCount(scenario.fixture?2:1)
    await page.getByRole("link",{name:title,exact:true}).click()
    await expect(page).toHaveURL(origin+"rawls/"+article)
    await expect(page.locator("h1")).toHaveText(title)
    await page.reload()
    await expect(page.locator("h1")).toHaveCount(1)
    if(scenario.fixture) {
      if(scenario.width === 390) await page.getByRole("button",{name:"本页目录",exact:true}).click()
      const toc=page.getByRole("navigation",{name:"文章章节"})
      await toc.getByRole("link",{name:"比较与对照",exact:true}).click()
      await expect(page.locator("#比较与对照")).toBeInViewport()
      await expect(page.locator('.ph-outline [aria-current="location"]')).toHaveText("比较与对照")
      expect(await page.locator("#比较与对照").evaluate(el=>el.getBoundingClientRect().top)).toBeGreaterThan(68)
    } else await expect(page.locator("#toc")).toHaveCount(0)
    const input=await search(page,scenario.fixture ? "纸页试排校验" : "正义")
    await expect(page.getByRole("option").first()).toContainText("约翰·罗尔斯")
    await expect(page.getByRole("option").first()).toContainText(title)
    // Native modal trap, one Esc, focus restored, and keyboard reopen/selection.
    await input.press("Tab")
    await expect(page.getByRole("button",{name:"关闭",exact:true})).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(input).toBeFocused()
    await input.press("Escape")
    await expect(page.getByRole("dialog")).not.toBeVisible()
    await expect(page.getByRole("button",{name:"搜索",exact:true})).toBeFocused()
    await page.keyboard.press("Control+k")
    await expect(input).toBeFocused()
    if(scenario.fixture) {
      await input.fill("纸页试排校验")
      await expect(page.getByRole("option").first()).toContainText(title)
      await input.press("Enter")
      await expect(page).toHaveURL(new RegExp("#"))
      await expect(page.locator("#阅读与问题")).toBeInViewport()
      await search(page,"同名笔记")
    } else await input.fill("正义")
    await expect(page.getByRole("option")).toHaveCount(scenario.fixture?2:1)
    if(scenario.fixture) {
      await expect(page.getByRole("listbox")).toContainText("伊曼努尔·康德")
      await input.press("ArrowDown")
      await expect(input).toHaveAttribute("aria-activedescendant","ph-result-1")
      await input.press("ArrowUp")
    }
    const destination=await page.getByRole("option").first().getByRole("link").getAttribute("href")
    await input.press("Enter")
    await expect(page).toHaveURL(scenario.url+destination)
    await expect(page.getByRole("dialog")).not.toBeVisible()
    await page.locator(".ph-reading-footer").getByRole("link").click()
    await expect(page.locator(".ph-entry-list")).toBeVisible()
    await page.goBack()
    await expect(page.locator(".ph-reading-footer")).toBeVisible()
    await page.goForward()
    await expect(page.locator(".ph-entry-list")).toBeVisible()
    await page.getByRole("link",{name:"Philosophos 首页"}).click()
    await expect(page).toHaveURL(origin)
    await noOverflow(page)
    // This server deliberately has no SPA fallback.
    expect((await request.get(origin+"missing-deep-path.html")).status()).toBe(404)
    if(!scenario.fixture) {
      expect((await request.get(origin+"rawls/reading.html")).status()).toBe(404)
      expect((await request.get(origin+"test/test.html")).status()).toBe(404)
      await search(page,"纸页试排校验")
      await expect(page.getByRole("status")).toHaveText("没有找到匹配内容")
    }
    expect(errors).toEqual([])
  })
}

for(const width of [1440,1280,1024,820,390]) {
  test(`reading at ${width}px: outline, overflow, modes and rendered Markdown`,async({page})=>{
    await page.setViewportSize({width,height:900})
    await page.goto("http://127.0.0.1:4182/rawls/reading.html")
    await expect(page.locator(".mermaid-content svg")).toBeVisible()
    await expect(page.locator(".katex-display")).toBeVisible()
    await expect(page.locator("#content img")).toBeVisible()
    expect(await page.locator("#content img").evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth>0)).toBe(true)
    await noOverflow(page)
    if(width === 390) {
      expect(await page.locator("#content table").nth(1).evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true)
      expect(await page.locator('#content div[class*="language-"] pre').first().evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true)
    }
    const panel=page.locator(".ph-outline-scroll")
    expect(await panel.evaluate(el=>getComputedStyle(el).scrollbarWidth)).toBe("none")
    if(width<960) {
      const toggle=page.getByRole("button",{name:"本页目录",exact:true})
      await expect(panel).not.toBeVisible()
      await toggle.click()
      await expect(panel).toBeVisible()
      await panel.getByRole("link").first().focus()
      await page.keyboard.press("Escape")
      await expect(toggle).toBeFocused()
      await expect(panel).not.toBeVisible()
      await toggle.click()
      await panel.getByRole("link",{name:"比较与对照",exact:true}).click()
      await expect(toggle).toHaveAttribute("aria-expanded","false")
      await expect(page.locator("#比较与对照")).toBeFocused()
    } else {
      await expect(panel).toBeVisible()
      const longLink=panel.getByRole("link",{name:/一个很长的三级标题/})
      expect(await longLink.evaluate(el=>getComputedStyle(el).whiteSpace)).not.toBe("nowrap")
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight))
      await expect(panel.getByRole("link",{name:"结束位置",exact:true})).toHaveAttribute("aria-current","location")
      expect(await panel.evaluate(el=>el.scrollTop)).toBeGreaterThan(0)
    }
    await page.emulateMedia({colorScheme:"dark"})
    await expect(page.locator("html")).toHaveAttribute("data-theme","dark")
    await noOverflow(page)
    await page.getByRole("button",{name:"切换明暗模式"}).click()
    await expect(page.locator("html")).toHaveAttribute("data-theme","light")
    await search(page,"阅读")
    await expect(page.getByRole("option").first()).toBeVisible()
    await noOverflow(page)
    await page.keyboard.press("Escape")
  })
}

test("outline remains mounted and active selection does not flicker during animated navigation",async({page})=>{
  await page.emulateMedia({reducedMotion:"no-preference"})
  await page.setViewportSize({width:1440,height:900})
  await page.goto("http://127.0.0.1:4182/rawls/reading.html")
  await expect(page.locator(".mermaid-content svg")).toBeVisible()
  await page.evaluate(()=>{
    const records:{active:string|null,width:number}[]=[]
    Object.assign(window,{outlineRecords:records})
    const sample=()=>{
      records.push({active:document.querySelector('.ph-outline [aria-current="location"]')?.textContent??null,width:document.querySelector('.ph-article')!.getBoundingClientRect().width})
      if(records.length<100) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  const link=page.locator(".ph-outline").getByRole("link",{name:"公式与逻辑符号",exact:true})
  await link.click()
  await expect(link).toHaveAttribute("aria-current","location")
  await page.waitForFunction(()=>((window as unknown as {outlineRecords:unknown[]}).outlineRecords.length>=100))
  const records=await page.evaluate(()=>(window as unknown as {outlineRecords:{active:string|null,width:number}[]}).outlineRecords)
  const start=records.findIndex(record=>record.active==="公式与逻辑符号")
  expect(start).toBeGreaterThanOrEqual(0)
  expect(new Set(records.slice(start).map(record=>record.active))).toEqual(new Set(["公式与逻辑符号"]))
  expect(new Set(records.map(record=>record.width)).size).toBe(1)
  // Scrolling updates the active item without rewriting the route/hash or remounting content.
  const url=page.url()
  await page.evaluate(()=>window.scrollTo({top:document.getElementById("连续阅读的节奏")!.offsetTop-100,behavior:"instant"}))
  await expect(page.locator('.ph-outline [aria-current="location"]')).toHaveText("连续阅读的节奏")
  expect(page.url()).toBe(url)
})
