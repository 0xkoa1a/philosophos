import { defineConfig, devices } from "@playwright/test"
export default defineConfig({
  testDir:"./tests", testMatch:"site.spec.ts", outputDir:"_qa/playwright", reporter:"line", forbidOnly:Boolean(process.env.CI),
  fullyParallel:true, workers:2, timeout:30_000,
  projects:[{name:"chromium",use:{...devices["Desktop Chrome"],channel:"chromium"}}],
  use:{headless:true,contextOptions:{reducedMotion:"reduce"},trace:"retain-on-failure"},
  webServer:{command:"node scripts/serve-test-sites.mjs",url:"http://127.0.0.1:4183/philosophos/",timeout:120_000,reuseExistingServer:false},
})
