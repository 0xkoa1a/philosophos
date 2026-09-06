# Repository instructions

## Preserve content semantics

- Treat notes as source-faithful documents. Preserve unrelated prose, formulas, images, examples, citations, and conclusions when changing presentation.
- Inspect the current file and dirty worktree before editing. Do not reset, overwrite, or mix unrelated user changes.
- Distinguish sourced facts, interpretation, and runtime validation explicitly.

## Choose the presentation layer

- Use Markdown for prose, definitions, lists, quotations, and precise comparison tables.
- Use Mermaid when nodes, arrows, sequences, state transitions, or simple topology carry the information.
- Use Vue components when grouping, semantic color, multi-region layout, interaction, or chart-library integration is part of the explanation.
- Do not add article-local `<style>` blocks or complex Raw HTML for layout. Put presentation code under `notes/.vuepress/components/` and keep Markdown invocation small.
- Keep `text` fences only when monospaced spatial layout is meaningful. Do not mechanically convert source code, pseudocode, or useful ASCII diagrams.
- Prefer shared `--diagram-*` semantic tokens over article-local decorative colors.

## Diagram components

- Put article-specific diagrams under `notes/.vuepress/components/diagrams/`.
- Register global components in `notes/.vuepress/client.ts`.
- Reuse shared tokens before creating generic primitives; add primitives only after repeated interfaces are demonstrated.
- Keep diagram markup semantic and accessible. Do not create headings that accidentally enter the article table of contents.
- Keep exact comparisons and citations in Markdown even when a component provides visual intuition.

## Validation

- Run `make check`, `pnpm run typecheck`, `pnpm test`, `pnpm run docs:build`, and `git diff --check` for site changes.
- For portable-export changes, run `pnpm run export:smoke`; it opens strict exports through `file://` in Chromium and verifies assets, formulas, charts, Vue interaction, Outline, network isolation, and responsive layout.
- Keep test-only notes and assets under `tests/fixtures/` so they do not enter the knowledge-base sidebar or production build.
- Inspect the rendered target page at desktop and mobile widths, including light and dark modes when semantic colors change.
- After validation, run `make clean` so generated output and VuePress caches are not left behind.

## Philosophos scope and confirmed decisions

- Content scope is philosophy, humanities and social sciences. Thinkers are the highest content level: `notes/<thinker>/index.md` plus direct Markdown articles. No groups or extra article nesting; `group` must produce a file/field diagnostic.
- Production starts with only `notes/index.md`, `notes/rawls/index.md`, and `notes/rawls/justice-as-fairness.md`. User prose stays `待整理。` until the user writes it. Do not author opinions, reading progress, completion records, or full study notes on their behalf.
- Thinker pages display name, optional `summary` and automatic entries. The user explicitly canceled display of the index.md guide body; preserve its source text and exclude that hidden prose from search.
- Use `title`, optional finite `order`, optional string `summary`. Specified order precedes missing order; numeric ascending, Chinese title for ties, source path for identical titles. Keep one matching H1 in each Markdown source and render it once.
- Discover content and actual VuePress page paths centrally. Home, thinker entries, article parent navigation and search ownership share catalog data. Never maintain a second hardcoded thinker array or guess all routes by replacing `.md`.
- Left Philosophos brand returns home; no separate top-bar thinker-index link, and no large “思想家索引” homepage heading. Article lists have separators only between entries. No persistent left sidebar.
- Confirmed visual direction: warm paper, Songti/system serif body, Georgia Latin, grey olive links, deep green-grey dark mode. Follow system initially with manual toggle. Use installed fonts and fallback; no remote Chinese font downloads.
- User requested investment-research-style reading proportions: 17px/1.85, up to 920px body, 220px outline and 74px desktop gap. Keep Philosophos palette. Shared tokens live in `notes/.vuepress/styles/tokens.scss`.
- Desktop right outline, folding outline below 960px; H2/H3 titles wrap. Hide scrollbar, retain scrolling. Only the outline's own rail and active mark, no extra divider alongside the article. Avoid active-state font metrics changes and multiple competing scroll/highlight owners.
- Retain SlimSearch engine with custom dialog: Chinese title/summary/body search, thinker ownership, arrows/Enter, one Escape, focus return and modal Tab cycle; no history or suggestions. Respect reduced motion.
- Do not display build time as revision time. No article revision timestamp is shown until a reliable source is explicitly incorporated.
- Do not add visible functionality, major dependencies, change theme, content hierarchy or deployment without discussion. Create/change remote repositories, push and publish only with explicit user approval. The user authorized the first commit, creation of public `0xkoa1a/philosophos`, pushing and GitHub Pages publication on 2026-09-06. Origin now points to that repository; Pages uses the Actions workflow.
- Visual direction, the above revisions and the rendered whole-site review were explicitly accepted on 2026-09-06 ("可以，按当前效果完成首版"). Future changes affecting usage still require discussion.

## Philosophos validation and handoff

- Add `pnpm run test:browser` to the existing validation requirements. It exercises production/fixture builds under root and Pages subpaths using static files without SPA fallback; cover Chinese search, focus, route history, anchored headings, outline stability, desktop/mobile and both modes.
- Keep layout fixtures in `tests/fixtures/site/`, export fixtures in `tests/fixtures/notes/`; separate source, output and VuePress cache/temp from production. Metadata-error fixtures may be created temporarily by tests.
- Regression test actual VuePress paths and new Markdown discovery, not only hand-constructed route expectations. A unit test pass does not establish browser correctness.
- Save requested delivery screenshots in `docs/screenshots/` and test evidence in `docs/validation.md`; label test material and concept art. After completed review and validation, stop task-owned preview servers and run `make clean`. Preserve screenshots, source files and user exports.
