import { spawnSync } from "node:child_process"
import path from "node:path"
const root = process.cwd()
const result = spawnSync(path.join(root, "node_modules/.bin/vuepress"), ["build", "tests/fixtures/site", "--config", "vuepress.config.ts"], {
  stdio: "inherit",
  env: {...process.env, VUEPRESS_SOURCE_DIR: "tests/fixtures/site", PHILOSOPHOS_DEST: path.join(root, "_qa/site"), PHILOSOPHOS_TEMP: path.join(root, "_qa/temp"), PHILOSOPHOS_CACHE: path.join(root, "_qa/cache")},
})
process.exit(result.status ?? 1)
