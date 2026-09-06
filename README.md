# Philosophos

用于个人学习与复习的哲学、人文与社会科学笔记站。以思想家为入口，内容由本地 Markdown 维护，使用 VuePress 2、Vue 3、Vite 和 default theme 扩展构建静态页面。

基于 [vuepress-notes-template](https://github.com/0xkoa1a/vuepress-notes-template) 的 `main`，基准提交 `2fc150be8c06af4f82e3292d8a0f31bb4a39139c`。保留模板的 SlimSearch、KaTeX、Mermaid、ECharts 和单页 HTML 导出能力。正式仓库为 [0xkoa1a/philosophos](https://github.com/0xkoa1a/philosophos)，Pages 地址为 [Philosophos](https://0xkoa1a.github.io/philosophos/)。

## 本地运行

使用 `.node-version` 中的 Node **22.18.0** 和 `package.json` 指定的 pnpm **11.19.0**。依赖版本由 `pnpm-lock.yaml` 锁定，构建许可在 `pnpm-workspace.yaml`。

```bash
fnm use                   # 或自行切换到 .node-version 指定版本
corepack enable           # 使用已安装的 Corepack 时
pnpm install --frozen-lockfile
make preview              # 默认 http://127.0.0.1:8080/
```

没有 fnm 时直接用相同版本 Node/pnpm 即可，不要求安装 fnm。若使用已配置的 fnm，也可在每条命令前加 `fnm exec --using=22.18.0`。

| 命令 | 用途 |
| --- | --- |
| `make check` | 环境、元数据、文章标题和内容层级检查 |
| `pnpm run typecheck` | TypeScript 与 Vue 类型检查 |
| `pnpm test` | 内容发现、排序、字段异常、实际 VuePress 路由与导出策略测试 |
| `pnpm run docs:build` | 构建正式内容到 `_site/` |
| `pnpm run docs:serve` | 在 `http://127.0.0.1:4173/` 静态访问构建产物；没有 SPA 回退 |
| `pnpm run test:browser` | 构建四个隔离测试站，验证根路径/子路径与真实浏览器交互 |
| `pnpm run export:smoke` | 模板原有 Chromium `file://` 单页导出回归 |
| `make test` | 串行执行上述内容检查、类型、单元、构建、浏览器和导出检查 |
| `git diff --check` | 检查补丁空白错误 |
| `make clean` | 清理 `_site/`、`_qa/` 及正式站 VuePress 缓存；保留源文件和交付截图 |

浏览器测试使用已有 Playwright 依赖。首次需要本机 Chromium 时执行 `pnpm exec playwright install --no-shell chromium`；Linux CI 使用工作流中的 `--with-deps`。测试同时监听本机 4180–4183 端口，运行前确保空闲。

## 新增思想家

建立稳定的英文 slug 目录，例如 `notes/kant/index.md`：

```markdown
---
title: 伊曼努尔·康德
order: 2
summary: 待整理。
---

# 伊曼努尔·康德

待整理。
```

`index.md` 是人物入口，读取姓名、顺序和可选 summary。根据已确认的页面设计，人物页**只展示姓名、summary 与自动篇目列表**；一级标题后的导读正文保留在源文件中，但不展示，也不进入人物正文搜索。无需写导读；保留同名 H1 即可。summary 可以完全省略。

首页由 `notes/index.md` 承载，读取人物入口建立索引。页面的大标题使用 `site.config.ts` 的站名；左上角站名始终返回首页。只有一位思想家或一篇笔记时不填充占位条目、计数或进度信息。

## 新增笔记

在人物目录下建立文件，例如 `notes/kant/judgment.md`：

```markdown
---
title: 判断
order: 1
summary: 待整理。
---

# 判断

待整理。
```

然后按真实内容添加 `##`、`###` 标题。没有固定章节模板，标题不自动编号；达到两个二/三级标题才显示本页目录。每篇 Markdown 只有一个与 `title` 完全一致的 H1，布局把这个标题显示在标题区，正文不再重复显示。

新增目录或文章后重新构建，或重启 `make preview`，即可可靠发现；不需要更新 Vue 数组、人物数据库或导航清单。开发时已有文件的修改可热更新。人物名称、摘要、标题、顺序均以 Markdown 为源，用户正文只维护一处。

### 元数据与排序

| 字段 | 规则 |
| --- | --- |
| `title` | 必填、非空字符串；页面显示中文标题，H1 须一致 |
| `order` | 可选有限数字；已填写的先按数字升序，未填写的放最后 |
| `summary` | 可选字符串；用于小字简介、篇目说明及搜索，缺省时整个区域省略 |
| `group` | 已按用户决定取消；填写时检查报文件与字段错误，不静默忽略 |

`order` 相同（或都缺省）时按中文标题 `localeCompare("zh-CN")` 排序；同名再按源文件路径稳定排序。人物与文章使用同一规则。人物入口不重复列为文章。结构固定为“思想家 → 具体笔记”，不设人物内部的额外分组或子目录页面；图片等资源仍可放在 `images/` 子目录。

文件使用可读的英文 slug 和小写 `.md`，例如 `justice-as-fairness.md`。README、点文件和点目录不作为页面。若缺少人物 `index.md`、出现多层文章目录或元数据类型错误，检查给出对应文件和字段/路径信息。

页面暂不显示修订时间：构建时间不代表文章修改，初始未提交内容也没有可信 Git 修订记录。模板导出文件的生成时间仅用于导出溯源，不作为文章修订时间。

## Markdown 写法

普通段落、强调、列表、引用、表格、代码和图片沿用标准 Markdown。布局集中在共享样式与组件，普通笔记不需要 HTML 布局、内联样式或专用组件。

```markdown
返回[人物入口](./index.md)。查看[同一人物的另一篇](./justice-as-fairness.md)。
跨人物可写[康德](../kant/index.md)，章节使用 [章节名称](#章节名称)。

![图片的文字说明](./images/example.svg)

*图：图片说明与来源。*

> 引用文字及来源。

行内公式 $P \rightarrow Q$。

$$
\forall x\in X,\quad P(x)\Rightarrow Q(x)
$$
```

图片路径相对当前 Markdown，图注采用图片后独立一段强调文字。宽表格、代码块和块级公式在各自容器内滚动。Mermaid 使用 `mermaid` 围栏，ECharts 保留模板 `echarts` 能力；无需使用它们才能写普通笔记。

内部链接交给 VuePress 解析，组件使用 `RouteLink`，资源使用 VuePress 构建解析。默认实际路径为 `/`、`/rawls/`、`/rawls/justice-as-fairness.html`。内容索引读取 `app.pages` 的真实 `page.path`，不通过批量替换扩展名生成链接；部署 base 由 VuePress 加入。

## 配置与代码职责

- `site.config.ts`：站名、说明、语言、默认明暗模式、可选顶栏链接及目录标签。说明留空时不显示副标题；当前顶栏没有额外首页链接。
- `lib/content.ts`：文件扫描与 YAML 元数据校验。
- `lib/catalog.ts`：纯数据聚合与排序，区分首页、人物入口、文章。
- `plugins/catalog.ts`：连接 VuePress 实际页面路径，生成页面数据与搜索归属；用于首页、人物页、返回导航的共用数据源。
- `plugins/search.ts`、`notes/.vuepress/search-client.ts`、`SearchDialog.vue`：保留 SlimSearch 索引/worker，定制结果与弹层。支持中文标题、summary、正文，结果显示所属思想家；方向键、Enter、Esc、Tab 与 Ctrl/⌘ K 可用。
- `notes/.vuepress/components/VPPage.vue`、`SiteHeader.vue`、`ArticleToc.vue`：页面、轻量顶栏、目录。目录高亮由一个组件计算；滚动不改写路由 hash，点击保留正常历史。
- `notes/.vuepress/styles/tokens.scss`：共享颜色、字体、主要间距、宽度、字号及状态 tokens。`index.scss`：统一 Markdown、页面与响应式样式；不把视觉参数写进文章。
- `vuepress.config.ts`：构建、主题扩展、插件与部署 base；`client.ts`：公式/图示客户端配置和固定顶栏锚点偏移。

视觉采用浅暖纸色与灰橄榄色，暗色为深墨绿灰与暖灰文字；默认跟随系统，右上角可手动切换，手动选择由模板在浏览器中记住。中文优先已安装宋体（Songti SC/STSong、Noto/思源宋体、SimSun），英文 Georgia，导航用系统无衬线体。**不下载、不分发字体文件，也不请求远程字体 CDN**；使用设备已合法安装的字体及通用回退，跨系统字形会有差异。以后引入字体文件需要另行确认授权、体积与加载方案。

阅读参数参考本机 `investment-research` 的实际样式：正文 17px、1.85 行高，最大 920px；桌面目录 220px、间距 74px，较窄桌面适当收缩，960px 以下折叠目录。长目录隐藏滚动条但可独立滚动，长中文标题换行。减少动效偏好会关闭平滑滚动和过渡。

## 测试材料隔离

正式构建的 source 始终是 `notes/`，只有首页、罗尔斯人物入口和《正义即公平》起始笔记。测试正文放在 `tests/fixtures/site/`，包括多人物、同名篇目、长标题、中文检索词、长目录、表格、代码、图片、公式与图示；非法元数据/分组样例在单元测试临时目录生成。

```bash
pnpm run fixtures:build
node scripts/serve-static.mjs _qa/site 4174
# http://127.0.0.1:4174/rawls/reading.html
```

该命令使用独立 source、输出、temp 和 cache，测试材料不会进入 `_site/`、正式人物索引或正式搜索。`tests/fixtures/notes/` 保存模板导出回归素材，原 `notes/test/test.md` 已迁入其中。不是仅在导航中隐藏测试稿。

`pnpm run test:browser` 会分别静态构建正式/测试内容与根路径/子路径，并检查真实 HTTP 404，无开发服务器 fallback。`tests/unit/routes.test.ts` 使用实际 VuePress 初始化验证新增文件、路由和导航共享来源。

## 导出单篇 HTML

```bash
make export PAGE=rawls/justice-as-fairness.md
```

默认写入 `_exports/rawls/justice-as-fairness.html`。模板导出器内联 Vue、CSS、公式、所需图示运行时与本地资源；支持直接双击打开，保留正文和目录，不包含站点搜索/顶栏。严格模式使用静态审计、CSP 与网络守卫，外部动态依赖会报错；普通链接不会被抓取，离线跨页链接可能不可用。

只有明确需要外部联网组件时才使用 `ALLOW_EXTERNAL=1`。导出元数据记录源文件、Git commit、工作区状态及生成时间，不能把生成时间当作内容更新时间。`export:smoke` 在 Chromium `file://` 下验证网络隔离、公式、图示、交互、目录和手机布局。

## 部署配置

用户于 2026-09-06 确认创建公开仓库 `0xkoa1a/philosophos` 并发布 GitHub Pages。`origin` 指向该仓库；Pages 使用 GitHub Actions。`.github/workflows/deploy-pages.yml` 在推送 `main` 时执行完整检查，全部通过才部署到 `https://0xkoa1a.github.io/philosophos/`。部署结果以 [Actions](https://github.com/0xkoa1a/philosophos/actions/workflows/deploy-pages.yml) 中对应提交的运行状态为准。

GitHub Actions 根据 `GITHUB_REPOSITORY` 自动选择项目子路径，用户站点使用 `/`。也可显式指定：

```bash
PHILOSOPHOS_BASE=/philosophos/ pnpm run docs:build
node scripts/serve-static.mjs _site 4173 /philosophos/
```

base 必须以 `/` 开头并结尾。将来启用 Pages 时需在仓库 Settings → Pages 选择 GitHub Actions。工作流保留最小权限与固定 Actions SHA；依赖安全审计继续由独立工作流执行。

设计讨论、基线及截图见 [docs/design/README.md](docs/design/README.md)，本轮验证记录见 [docs/validation.md](docs/validation.md)。协作与正文保护规则见 [AGENTS.md](AGENTS.md)。
