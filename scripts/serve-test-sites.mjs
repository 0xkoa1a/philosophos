import { spawnSync } from "node:child_process"
import path from "node:path"
import { serveStatic } from "./serve-static.mjs"
const root=process.cwd()
const scenarios=[
  {name:"production-root",source:"notes",port:4180,base:"/"},
  {name:"production-base",source:"notes",port:4181,base:"/philosophos/"},
  {name:"fixtures-root",source:"tests/fixtures/site",port:4182,base:"/"},
  {name:"fixtures-base",source:"tests/fixtures/site",port:4183,base:"/philosophos/"},
]
const servers=[]
for(const scenario of scenarios) {
  const output=path.join(root,"_qa",scenario.name)
  const result=spawnSync(path.join(root,"node_modules/.bin/vuepress"),["build",scenario.source,"--config","vuepress.config.ts"],{
    env:{...process.env,VUEPRESS_SOURCE_DIR:scenario.source,PHILOSOPHOS_BASE:scenario.base,PHILOSOPHOS_DEST:path.join(output,"site"),PHILOSOPHOS_TEMP:path.join(output,"temp"),PHILOSOPHOS_CACHE:path.join(output,"cache")},
    encoding:"utf8",
  })
  if(result.status!==0) {console.error(result.stdout,result.stderr);process.exit(result.status??1)}
  servers.push(serveStatic({directory:path.join(output,"site"),port:scenario.port,base:scenario.base}))
  console.log(`${scenario.name}: http://127.0.0.1:${scenario.port}${scenario.base}`)
}
for(const signal of ["SIGTERM","SIGINT"]) process.on(signal,()=>{servers.forEach(server=>server.close());process.exit(0)})
